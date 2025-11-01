const axios = require('axios');

const MOCK_OWNER = 'repo-owner';
const MOCK_REPO = 'ai-code-reviewer';

function getDiff(prNumber) {
    console.log(`Mocking GitHub API call to fetch diff for PR #${prNumber}.`);
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
+        data.push(newItem); // This line is the issue the LLM will find
+    }
+    return data;
}
 module.exports = { calculateSum, processData };
`;
    return mockDiff.trim();
}

async function postComment(prNumber, token, body) {
    const commentUrl = `https://api.github.com/repos/${MOCK_OWNER}/${MOCK_REPO}/issues/${prNumber}/comments`;

    console.log(`\n--- MOCK GITHUB COMMENT POSTED ---\n`);
    console.log(`Target URL: ${commentUrl}`);
    console.log(`Comment Body Preview (first 300 chars):`);
    console.log("---------------------------------------");
    console.log(body.substring(0, 300) + '...');
    console.log("---------------------------------------");

    return Promise.resolve({ status: 201, message: "Mock comment created" });
}

module.exports = { getDiff, postComment };