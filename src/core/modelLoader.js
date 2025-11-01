const axios = require('axios');
async function checkOllamaService(ollamaApiUrl, modelName) {
    try {
        console.log(`\nAttempting to connect to Ollama service at ${ollamaApiUrl}...`);
        const healthCheckUrl = `${ollamaApiUrl}/`;
        // Notă: API-ul Ollama returnează un răspuns gol cu status 200 la health check
        await axios.get(healthCheckUrl, { timeout: 5000 });

        console.log(` Ollama service is reachable. Using model: ${modelName}`);
        return true;
    } catch (error) {
        if (error.code === 'ECONNREFUSED' || (error.response && error.response.status === 404)) {
            console.error(`ERROR: Could not connect to Ollama at ${ollamaApiUrl}.`);
            console.error("Please ensure Ollama is running and accessible on the network where the CI job executes.");
        } else {
            console.error(` An unexpected error occurred during Ollama health check:`, error.message);
        }
        return false;
    }
}

function buildReviewPrompt(filesToReview) {
    const context = filesToReview.map(file => {
        return `
--- File: ${file.filename} (Status: ${file.status}) ---
${file.patch || 'No code changes found in patch.'}
---
`;
    }).join('\n');
    return `You are a Senior Software Engineer specializing in automated code review. 
Your goal is to provide concise, actionable, and constructive feedback on the code changes provided below.

INSTRUCTIONS:
1. Focus on bugs, security vulnerabilities, performance issues, and adherence to best practices.
2. DO NOT comment on minor formatting or style if the code linter has covered it.
3. If no significant issues are found, state "No major issues found. Good work!"
4. Structure your response using Markdown headings and bullet points.

CODE DIFFS TO REVIEW:
${context}`;
}

async function runOllamaReview(filesToReview, ollamaApiUrl, ollamaModel) {
    const prompt = buildReviewPrompt(filesToReview);
    const generateUrl = `${ollamaApiUrl}/api/generate`;

    try {
        console.log(` Sending prompt to Ollama model: ${ollamaModel}`);

        const response = await axios.post(generateUrl, {
            model: ollamaModel,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.2,
                num_ctx: 4096
            }
        }, { timeout: 60000 });
        const reviewText = response.data.response || 'Ollama returned an empty response.';
        return reviewText;
    } catch (error) {
        console.error("ERROR: Failed to generate review from Ollama API.");
        throw new Error(`Ollama API call failed: ${error.message}. Check CI logs for full details.`);
    }
}
module.exports = {
    checkOllamaService,
    runOllamaReview
};