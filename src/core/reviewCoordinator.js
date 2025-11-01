const { getDiff, postComment } = require('../utils');
const { checkOllamaService } = require('./modelLoader');
const lintingPlugin = require('../plugins/linting');

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

        // --- 2. Diff Generation (currently mocked) ---
        console.log("1. Fetching raw diff content...");
        const rawDiff = getDiff(PR_NUMBER);

        // --- 3. Run Plugins (LLM Analysis) ---
        console.log("2. Running linting plugin...");
        // In the future, this will be an array of parsed changes
        const filesToReview = [{ filename: 'app/utils.js', diff: rawDiff, language: 'javascript' }];

        // We run the LLM analysis via the linting plugin
        const reviewCommentBody = await lintingPlugin.run(filesToReview);

        // --- 4. Posting Feedback (currently mocked) ---
        console.log("3. Posting review comment to GitHub...");
        await postComment(PR_NUMBER, GITHUB_TOKEN, reviewCommentBody);

        console.log("Review complete. Comment posted to the Pull Request.");

    } catch (error) {
        console.error("An unhandled error occurred during the review process:", error);
    }
}

// Ensure the module is directly runnable
run();

module.exports = { run };