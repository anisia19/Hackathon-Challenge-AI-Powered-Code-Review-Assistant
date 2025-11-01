// reviewCoordinator.js (Versiune Finală & Corectată)

//  SCHIMBARE AICI: Importăm runOllamaReview din modelLoader
const { getDiff, postComment } = require('../utils');
const { checkOllamaService, runOllamaReview } = require('./modelLoader');
const lintingPlugin = require('../plugins/linting/index.js');

const DEFAULT_OLLAMA_API_URL = 'http://ollama:11434';
const DEFAULT_OLLAMA_MODEL = 'codellama:7b';

async function runReview(githubToken, prNumber, srcRoot) {
    try {
        if (!prNumber || !githubToken) {
            console.error("CRITICAL ERROR: githubToken or prNumber are missing.");
            console.error("Please ensure these are passed to runReview.");
            return;
        }

        console.log(`Starting AI Code Review for PR #${prNumber} (SRC_ROOT: ${srcRoot})...`);
        const ollamaApiUrl = process.env.OLLAMA_API_URL || DEFAULT_OLLAMA_API_URL;
        const ollamaModel = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

        // 1. Verificare Ollama
        const isOllamaReady = await checkOllamaService(ollamaApiUrl, ollamaModel);

        if (!isOllamaReady) {
            console.error(`\nReview aborted because the Ollama service check failed.`);
            await postComment(
                prNumber,
                githubToken,
                "##  Automated Review Failed: LLM Connection\n\n" +
                "The code review bot could not connect to the local LLM service " +
                "(`Ollama`). Please check the service status."
            );
            return;
        }

        // 2. Extragere Diff
        console.log("1. Fetching raw diff content and parsing files...");
        // Presupunând că getDiff are nevoie de githubToken
        const filesToReview = await getDiff(prNumber, githubToken);

        if (filesToReview.length === 0) {
            console.log("No relevant files found in the diff. Finishing review.");
            await postComment(
                prNumber,
                githubToken,
                "## Automated Review Complete\n\n" +
                "No code changes in tracked file types (.js, .py, etc.) were found in this PR, " +
                "or all changes were minor and filtered out. Review skipped."
            );
            return;
        }

        console.log(`Found ${filesToReview.length} file(s) to process.`);

        // 3. Rulare Plugin Static
        console.log("2. Running linting plugin...");
        const lintingOutput = await lintingPlugin.run(filesToReview);

        // 4. RULAREA LLM PENTRU RECENZIE (APEL NOU)
        console.log("3. Calling Ollama for AI Code Review...");
        const aiReviewOutput = await runOllamaReview(
            filesToReview,
            ollamaApiUrl,
            ollamaModel
        );

        // 5. Combinarea și Postarea Comentariului
        const combinedCommentBody = `## 🤖 AI Code Review (Model: ${ollamaModel}) 🚀\n\n` +
            `${aiReviewOutput}\n\n` +
            `---\n` +
            `### 🔍 Rezultate Analiză Statică (Linting)\n` +
            `${lintingOutput}`;

        console.log("4. Posting combined review comment to GitHub...");
        await postComment(prNumber, githubToken, combinedCommentBody);
        console.log("Review complete. Comment posted to the Pull Request.");

    } catch (error) {
        // Logica de eroare pentru cazurile neprevăzute
        console.error("An unhandled error occurred during the review process:", error);

        try {
            if (prNumber && githubToken) {
                await postComment(
                    prNumber,
                    githubToken,
                    "## Automated Review Bot Crash\n\n" +
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

module.exports = { runReview };