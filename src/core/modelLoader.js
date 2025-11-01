const axios = require('axios');

async function checkOllamaService(ollamaApiUrl, modelName) {
    try {
        console.log(`\nAttempting to connect to Ollama service at ${ollamaApiUrl}...`);

        const healthCheckUrl = `${ollamaApiUrl}/`;

        // Setting a short timeout to prevent the CI from hanging
        await axios.get(healthCheckUrl, { timeout: 5000 });

        console.log(` Ollama service is reachable. Using model: ${modelName}`);
        return true;
    } catch (error) {
        // Checking for connection errors or explicit 404 (not found)
        if (error.code === 'ECONNREFUSED' || (error.response && error.response.status === 404)) {
            console.error(`ERROR: Could not connect to Ollama at ${ollamaApiUrl}.`);
            console.error("Please ensure Ollama is running and accessible on the network where the CI job executes.");
        } else {
            console.error(` An unexpected error occurred during Ollama health check:`, error.message);
        }
        return false;
    }
}

module.exports = { checkOllamaService };