const { runReview } = require('./src/core/reviewCoordinator');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PR_NUMBER = process.env.PR_NUMBER;
const SRC_ROOT = process.env.SRC_ROOT; // 'src'

if (!GITHUB_TOKEN || !PR_NUMBER) {
    console.error("CRITICAL ERROR: GITHUB_TOKEN or PR_NUMBER environment variables are missing.");
    process.exit(1);
}

console.log(`Starting AI Code Review for PR #${PR_NUMBER}...`);

runReview(GITHUB_TOKEN, PR_NUMBER, SRC_ROOT)
    .then(() => {
        console.log("Review complete. Comment posted to the Pull Request.");
    })
    .catch(error => {
        console.error("An error occurred during the review process:", error);
        process.exit(1);
    });