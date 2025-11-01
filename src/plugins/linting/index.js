const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

const MOCK_DIFF_CONTENT = `diff --git a/src/core/reviewCoordinator.js b/src/core/reviewCoordinator.js
index 4b87e2f..7d3c01c 100644
--- a/src/core/reviewCoordinator.js
+++ b/src/core/reviewCoordinator.js
@@ -1,6 +1,6 @@
 const { getDiff, postComment } = require('../utils');
 const { checkOllamaService } = require('./modelLoader');
-const lintingPlugin = require('../plugins/linting'); // Calea veche
+const lintingPlugin = require('../plugins/linting/index.js'); // Calea corectată
 
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

async function getRawDiff() {
    if (process.env.MOCK_DIFF === 'true') {
        console.log("MOCK: Se returnează conținutul diff mockat.");
        return MOCK_DIFF_CONTENT;
    }

    try {
        const { stdout } = await execPromise('git diff --no-color HEAD^1 HEAD');
        console.log("Git diff executat cu succes.");
        return stdout;
    } catch (error) {
        console.warn("Eșec la executarea 'git diff'. Se folosește mock diff pentru testare.");
        console.error("Eroare originală:", error.message);
        return MOCK_DIFF_CONTENT;
    }
}

function parseDiff(rawDiff) {

    const fileChunks = rawDiff.split(/(?=^diff --git)/m);
    const filesToReview = [];

    for (const chunk of fileChunks) {
        if (!chunk.trim()) continue;
        const filenameMatch = chunk.match(/\+\+\+ b\/(.+)\n/);
        if (!filenameMatch) continue;

        const filename = filenameMatch[1].trim();
        const language = getLanguageFromFilename(filename);
        if (language && !filename.startsWith('package-lock.json') && !filename.startsWith('yarn.lock')) {
            filesToReview.push({
                filename: filename,
                diff: chunk,
                language: language
            });
        }
    }

    console.log(`S-au găsit ${filesToReview.length} fișier(e) de revizuit după filtrare.`);
    return filesToReview;
}

async function getDiff(prNumber) {
    const rawDiffText = await getRawDiff();
    return parseDiff(rawDiffText);
}

async function postComment(prNumber, token, body) {
    const githubRepository = process.env.GITHUB_REPOSITORY;
    if (!githubRepository) {
        console.error("CRITICAL: Variabila de mediu GITHUB_REPOSITORY lipsește.");
        if (process.env.MOCK_POST === 'true' || !token) {
            console.log("MOCK: Se sare peste POST-ul real. Corpul comentariului:");
            console.log("-----------------------------------------");
            console.log(body);
            console.log("-----------------------------------------");
            return { id: 'mock-id', status: 201, mock: true };
        }
        throw new Error("Nu se poate posta comentariul fără contextul depozitului.");
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
    throw lastError;
}

module.exports = { getDiff, postComment };