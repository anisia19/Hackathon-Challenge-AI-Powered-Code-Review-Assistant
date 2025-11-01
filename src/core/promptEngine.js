async function generateReview(systemInstruction, userQuery) {
    console.log(`\n--- MOCK LLM CALL ---\nInstruction: ${systemInstruction}\nQuery Snippet: ${userQuery.substring(0, 100)}...\n---------------------\n`);

    await new Promise(resolve => setTimeout(resolve, 800));

    const mockReview = `
###  Critical Issue Detected: Improper State Mutation

The function \`processData\` is directly mutating the input array \`data\` using \`Array.prototype.push\`. While this works, it violates the principle of immutability, which can lead to unexpected side effects in large applications (especially when dealing with modern frameworks like React or Vue).

**Recommendation:**
Refactor the function to return a *new* array, utilizing the spread operator for cleaner, immutable state management.

\`\`\`javascript
// Before (Mutable)
function processData(data, newItem) {
    // ...
    data.push(newItem);
    return data;
}

// After (Immutable - Recommended)
function processData(data, newItem) {
    // ...
    return [...data, newItem];
}
\`\`\`

**LLM Confidence Score:** 0.95 (High confidence in immutability violation.)
`;
    return mockReview;
}

module.exports = { generateReview };