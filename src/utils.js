const axios = require('axios');
const { exec } = require('child_process/promises');

const MOCK_OWNER = 'repo-owner';
const MOCK_REPO = 'ai-code-reviewer';

function getLanguageFromFilename(filename) {
    if (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.ts') || filename.endsWith('.tsx')) {
        return 'javascript';
    }
    if (filename.endsWith('.py')) {
        return 'python';
    }
    // Add more languages as we expand
    return null;
}


async function getRawDiff() {
    try {
        const { stdout } = await exec('git diff --no-color HEAD^1 HEAD');
        console.log("Git diff executed successfully.");
        return stdout;
    } catch (error) {
        console.error("Failed to execute git diff command:", error.message);
        throw new Error("Could not retrieve code diff. Ensure fetch-depth: 0 is used in actions/checkout@v4.");
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

    console.log(`Found ${filesToReview.length} file(s) to review after filtering.`);
    return filesToReview;
}

async function getDiff(prNumber) {
    const rawDiffText = await getRawDiff();
    return parseDiff(rawDiffText);
}

async function postComment(prNumber, token, body) {
    const githubRepository = process.env.GITHUB_REPOSITORY;
    if (!githubRepository) {
        console.error("CRITICAL: GITHUB_REPOSITORY environment variable is missing.");
        throw new Error("Cannot post comment without repository context.");
    }

    const [owner, repo] = githubRepository.split('/');
    const commentUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;

    const maxRetries = 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`Attempting to post comment to PR #${prNumber} (Attempt ${i + 1}/${maxRetries})...`);

            const response = await axios.post(commentUrl, { body }, {
                headers: {
                    // Token authentication
                    'Authorization': `token ${token}`,
                    // Required for GitHub API V3
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                }
            });

            console.log(`GitHub comment posted successfully! Status: ${response.status}`);
            return response.data;

        } catch (error) {
            lastError = error;
            const status = error.response ? error.response.status : 'Network Error';
            console.warn(`Failed to post comment (Status: ${status}). Retrying in ${2 ** i}s...`);

            if (i < maxRetries - 1) {
                // Exponential backoff: 1s, 2s, 4s, ...
                await new Promise(resolve => setTimeout(resolve, (2 ** i) * 1000));
            }
        }
    }

    // If all retries fail
    console.error("All retries failed. Could not post comment to GitHub.");
    throw lastError;
}

module.exports = { getDiff, postComment };