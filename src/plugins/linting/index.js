const { getDiff, postComment } = require('../utils');
const { checkOllamaService } = require('./modelLoader');
const lintingPlugin = require('../plugins/linting/index.js'); // <-- FIX: Cale corectată

// Constants for LLM setup
const DEFAULT_OLLAMA_API_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'codellama:7b';
const PR_NUMBER = process.env.PR_NUMBER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * The main execution flow for the automated code review system.
 */
async function run() {
    try {
        if (!PR_NUMBER || !GITHUB_TOKEN) {
            console.error("CRITICAL ERROR: PR_NUMBER or GITHUB_TOKEN environment variables are missing.");
            console.error("Please ensure these are set in your GitHub Actions workflow or local environment.");
            return;
        }

        console.log(`Starting AI Code Review for PR #${PR_NUMBER}...`);

        // --- 1. LLM Health Check ---
        const ollamaApiUrl = process.env.OLLAMA_API_URL || DEFAULT_OLLAMA_API_URL;
        const ollamaModel = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

        const isOllamaReady = await checkOllamaService(ollamaApiUrl, ollamaModel);

        if (!isOllamaReady) {
            console.error(`\nReview aborted because the Ollama service check failed.`);
            // Post a generic error comment to the PR to notify the developer
            await postComment(PR_NUMBER, GITHUB_TOKEN,
                "## ❌ Automated Review Failed: LLM Connection\n\n" +
                "The code review bot could not connect to the local LLM service " +
                "(`Ollama`). Please check the service status."
            );
            return; // Exit cleanly
        }

        // --- 2. Diff Generation (now handles mock internally) ---
        console.log("1. Fetching raw diff content and parsing files...");
        // getDiff now returns the parsed files array (needs await)
        const filesToReview = await getDiff(PR_NUMBER);

        // Ensure there are files to review
        if (filesToReview.length === 0) {
            console.log("No relevant files found in the diff. Finishing review.");
            await postComment(PR_NUMBER, GITHUB_TOKEN,
                "## ✅ Automated Review Complete\n\n" +
                "No code changes in tracked file types (.js, .py, etc.) were found in this PR, " +
                "or all changes were minor and filtered out. Review skipped."
            );
            return;
        }

        console.log(`Found ${filesToReview.length} file(s) to process.`);


        // --- 3. Run Plugins (LLM Analysis) ---
        console.log("2. Running linting plugin...");
        // We run the LLM analysis via the linting plugin
        const reviewCommentBody = await lintingPlugin.run(filesToReview);

        // --- 4. Posting Feedback (currently mocked) ---
        console.log("3. Posting review comment to GitHub...");
        await postComment(PR_NUMBER, GITHUB_TOKEN, reviewCommentBody);

        console.log("Review complete. Comment posted to the Pull Request.");

    } catch (error) {
        console.error("An unhandled error occurred during the review process:", error);
        // Post a final, unhandled error message to the PR if possible
        try {
            const prNumber = process.env.PR_NUMBER;
            const githubToken = process.env.GITHUB_TOKEN;
            if (prNumber && githubToken) {
                await postComment(prNumber, githubToken,
                    "## 💥 Automated Review Bot Crash\n\n" +
                    "An unexpected error caused the review process to crash. " +
                    "Please check the CI logs for details.\n\n" +
                    `Error details: \`\`\`\n${error.message}\n\`\`\``
                );
            }
        } catch (e) {
            console.error("Failed to post crash comment:", e.message);
        }
    }
}

// Ensure the module is directly runnable
if (require.main === module) {
    run();
}

module.exports = { run };