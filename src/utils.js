const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// --- Constante Mock (pentru testarea locală) ---
const MOCK_OWNER = 'repo-owner';
const MOCK_REPO = 'ai-code-reviewer';
const MOCK_DIFF_CONTENT = `diff --git a/src/core/reviewCoordinator.js b/src/core/reviewCoordinator.js
index 4b87e2f..7d3c01c 100644
--- a/src/core/reviewCoordinator.js
+++ b/src/core/reviewCoordinator.js
@@ -1,6 +1,6 @@
 const { getDiff, postComment } = require('../utils');
 const { checkOllamaService } = require('./modelLoader');
-const lintingPlugin = require('../plugins/linting');
+const lintingPlugin = require('../plugins/linting/index.js');
 
 // Constants for LLM setup
 const DEFAULT_OLLAMA_API_URL = 'http://localhost:11434';
diff --git a/app/utils.js b/app/utils.js
index a1b2c3d..e4f5g6h 100644
--- a/app/utils.js
+++ b/app/utils.js
@@ -1,3 +1,4 @@
+// Aceasta este o schimbare mock pentru a simula adăugarea unei funcții.
 function calculateSum(a, b) {
   return a + b;
 }
`;

function getLanguageFromFilename(filename) {
    if (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.ts') || filename.endsWith('.tsx')) {
        return 'javascript';
    }
    if (filename.endsWith('.py')) {
        return 'python';
    }
    return null;
}

async function getDiffFromApi(prNumber, token) {
    const githubRepository = process.env.GITHUB_REPOSITORY || `${MOCK_OWNER}/${MOCK_REPO}`;
    const [owner, repo] = githubRepository.split('/');
    const diffUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;

    try {
        console.log(`Se încearcă obținerea diff-ului PR #${prNumber} de la GitHub API...`);

        const response = await axios.get(diffUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3.diff',
                'Authorization': `token ${token}`,
            },
            timeout: 10000
        });

        const rawDiffText = response.data;
        console.log("Diff raw obținut cu succes de la GitHub API.");
        return rawDiffText;

    } catch (error) {
        console.error("Eroare la obținerea diff-ului PR de la GitHub API:", error.message);
        console.warn("Eroare API. Se folosește conținutul diff mockat.");
        return MOCK_DIFF_CONTENT;
    }
}


async function getRawDiff() {
    if (process.env.MOCK_DIFF === 'true') {
        return MOCK_DIFF_CONTENT;
    }
    try {
        const { stdout } = await execPromise('git diff --no-color HEAD^1 HEAD');
        return stdout;
    } catch (error) {
        return MOCK_DIFF_CONTENT;
    }
}

function parseDiff(rawDiff) {
    const fileChunks = rawDiff.split(/(?=^diff --git)/m);
    const filesToReview = [];

    for (const chunk of fileChunks) {
        if (!chunk.trim()) continue;

        // Extrage numele fișierului după '+++ b/'
        const filenameMatch = chunk.match(/\+\+\+ b\/(.+)\n/);
        if (!filenameMatch) continue;
        const filename = filenameMatch[1].trim();
        const language = getLanguageFromFilename(filename);
        if (language && !filename.includes('package-lock.json') && !filename.includes('yarn.lock')) {
            filesToReview.push({
                filename: filename,
                patch: chunk,
                language: language
            });
        }
    }

    console.log(`S-au găsit ${filesToReview.length} fișier(e) de revizuit după filtrare.`);
    return filesToReview;
}

async function getDiff(prNumber, token) {
    let rawDiffText;

    if (process.env.MOCK_DIFF === 'true') {
        rawDiffText = await getRawDiff();
    } else {
        rawDiffText = await getDiffFromApi(prNumber, token);
    }

    return parseDiff(rawDiffText);
}

/**
 * Postează un comentariu pe un Pull Request folosind GitHub API.
 * Include logica de retry cu backoff exponențial.
 */
async function postComment(prNumber, token, body) {
    const githubRepository = process.env.GITHUB_REPOSITORY;
    const isMockToken = token === 'MOCK_TOKEN_FOR_TESTS';
    if (isMockToken || !githubRepository || process.env.MOCK_POST === 'true') {
        if (isMockToken) console.error("CRITICAL: Token MOCK detectat. Se sare peste POST-ul real (evitare 401).");
        console.log("-----------------------------------------");
        console.log(`MOCK: Previzualizarea comentariului pentru PR #${prNumber}:`);
        console.log(body);
        console.log("-----------------------------------------");
        return { id: 'mock-id', status: 201, mock: true };
    }

    const [owner, repo] = githubRepository.split('/');
    const commentUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;

    const maxRetries = 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`Se încearcă postarea comentariului la PR #${prNumber} (Încercarea ${i + 1}/${maxRetries})...`);

            const response = await axios.post(commentUrl, { body }, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                }
            });

            console.log(`Comentariu GitHub postat cu succes! Status: ${response.status}`);
            return response.data;

        } catch (error) {
            lastError = error;
            const status = error.response ? error.response.status : 'Network Error';
            console.warn(`Eșec la postarea comentariului (Status: ${status}). Se reîncearcă în ${2 ** i}s...`);

            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, (2 ** i) * 1000));
            }
        }
    }

    console.error("Toate reîncercările au eșuat. Nu s-a putut posta comentariul pe GitHub.");
}

module.exports = { getDiff, postComment };