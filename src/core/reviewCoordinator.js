const { getDiff, postComment } = require('./utils');

const { lintingPlugin } = require('../plugins/linting/index');
async function runReview(githubToken, prNumber, srcRoot) {
    console.log("1. Fetching raw diff content...");
    const rawDiff = getDiff(prNumber);
    const changedFiles = [
        { filename: 'app/utils.js', language: 'javascript', diff: rawDiff }
    ];

    let fullReviewText = `# Automated AI Code Review (Draft)\n\n`;
    let issuesDetected = 0;

    for (const file of changedFiles) {
        console.log(`2. Running linting plugin for ${file.filename} (${file.language})...`);

        const fileReview = await lintingPlugin.run(file);

        if (fileReview) {
            fullReviewText += fileReview;
            issuesDetected++;
        }
    }

    if (issuesDetected === 0) {
        fullReviewText += "### Code Quality Status: Excellent\n\nNo significant architectural or stylistic issues were detected in the changes. Looks great! (Powered by LLM mock.)";
    }

    console.log("3. Posting review comment to GitHub...");
    await postComment(prNumber, githubToken, fullReviewText);
}

module.exports = { runReview };