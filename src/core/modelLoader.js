const axios = require('axios'); // Used for a more realistic mock of API calls

// Mocking the environment
const MOCK_OWNER = 'repo-owner';
const MOCK_REPO = 'ai-code-reviewer';

/**
 * Mocks fetching the raw diff content for a PR.
 * In a real scenario, this would use the GitHub API to get the diff.
 * @param {string} prNumber - Pull Request number.
 * @returns {string} A mock JS diff.
 */
function getDiff(prNumber) {
    console.log(`Mocking GitHub API call to fetch diff for PR #${prNumber}`);

    // Mock diff for a file named 'app/utils.js'
    const mockDiff = `
diff --git a/app/utils.js b/app/utils.js
index 9b71e1d..6c0245a 100644
--- a/app/utils.js
+++ b/app/utils.js
@@ -1,5 +1,8 @@
 function calculateSum(a, b) {
     return a + b;
 }
-function processData(data, newItem) {
-    data.push(newItem);
-    return data;
+function processData(data, newItem, factor) {
+    // Intentional mutation to test LLM mock analysis
+    if (factor > 10) {
+        data.push(newItem);
+    }
+    return data;
 }
 module.exports = { calculateSum, processData };
`;
    return mockDiff;
}

async function postComment(prNumber, token, body) {
    // In a real app, this would be an API call:
    const commentUrl = `https://api.github.com/repos/${MOCK_OWNER}/${MOCK_REPO}/issues/${prNumber}/comments`;

    // We will just log the successful mock call and the content.
    console.log(`\n--- MOCK GITHUB COMMENT POSTED ---\n`);
    console.log(`API URL: ${commentUrl}`);
    console.log(`Comment Body Preview (first 300 chars):`);
    console.log("---------------------------------------");
    console.log(body.substring(0, 300) + '...');
    console.log("---------------------------------------");

    // Simulate API success (using axios for a realistic feel, even if not executed)
    // try {
    //     await axios.post(commentUrl, { body }, {
    //         headers: {
    //             'Authorization': \`token \${token}\`,
    //             'Accept': 'application/vnd.github.v3+json'
    //         }
    //     });
    //     console.log(\`Successfully posted comment to PR #${prNumber}.\`);
    // } catch (error) {
    //     console.error("Failed to post comment:", error.message);
    //     throw new Error("GitHub API failure during comment posting.");
    // }
}

module.exports = { getDiff, postComment };