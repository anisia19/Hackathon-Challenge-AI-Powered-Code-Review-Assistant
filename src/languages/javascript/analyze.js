const { generateReview } = require('../../core/promptEngine');

async function analyzeJsDiff(file) {
    console.log(`  -> Running specialized JS analysis for ${file.filename}`);

    const systemInstruction = `You are a Senior JavaScript Architect focused on code quality, performance, and modern language standards (ES2023+). Analyze the provided diff exclusively for potential bugs, poor patterns, immutability violations, and efficiency issues. Respond ONLY with a markdown summary of the most critical issue and a concise recommendation, or respond with a single word "CLEAN" if no issues are found.`;

    const userQuery = `Review the following code diff for potential issues in ${file.filename}:\n\n${file.diff}`;

    const reviewResult = await generateReview(systemInstruction, userQuery);

    if (reviewResult.trim().toUpperCase() === "CLEAN") {
        return null;
    }

    const fileSummary = `## Review for \`${file.filename}\` (JavaScript)\n\n${reviewResult}\n\n---\n`;
    return fileSummary;
}

module.exports = { analyzeJsDiff };