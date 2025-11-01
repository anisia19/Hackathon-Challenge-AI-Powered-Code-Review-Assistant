const axios = require('axios');

/**
 * Verifică starea serviciului Ollama.
 * (Funcția ta existentă, neschimbată)
 */
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

/**
 * 💡 Construiește un prompt eficient pentru LLM pe baza modificărilor din fișiere.
 * @param {Array<Object>} filesToReview - Lista de fișiere modificate (presupunând că fiecare are proprietatea 'patch').
 * @returns {string} Promptul final pentru LLM.
 */
function buildReviewPrompt(filesToReview) {
    const context = filesToReview.map(file => {
        // Combinăm numele fișierului cu conținutul diff-ului său (patch)
        return `
--- File: ${file.filename} (Status: ${file.status}) ---
${file.patch || 'No code changes found in patch.'}
---
`;
    }).join('\n');

    // Promptul strategic: stabilește rolul, sarcina, și formatul așteptat
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


/**
 * 🤖 Apelează API-ul Ollama pentru a genera recenzia de cod.
 * @param {Array<Object>} filesToReview - Lista de fișiere modificate.
 * @param {string} ollamaApiUrl - URL-ul API al serviciului Ollama.
 * @param {string} ollamaModel - Numele modelului de folosit (ex: 'codellama:7b').
 * @returns {Promise<string>} Răspunsul LLM (textul recenziei).
 */
async function runOllamaReview(filesToReview, ollamaApiUrl, ollamaModel) {
    const prompt = buildReviewPrompt(filesToReview);
    const generateUrl = `${ollamaApiUrl}/api/generate`;

    try {
        console.log(` Sending prompt to Ollama model: ${ollamaModel}`);

        const response = await axios.post(generateUrl, {
            model: ollamaModel,
            prompt: prompt,
            stream: false, // Obținem răspunsul complet dintr-o dată
            options: {
                temperature: 0.2, // Păstrăm temperatura scăzută pentru feedback tehnic
                num_ctx: 4096 // Setăm fereastra de context
            }
        }, { timeout: 60000 }); // Timp de așteptare mai mare (60s) pentru generarea LLM

        // Răspunsul Ollama este în proprietatea 'response'
        const reviewText = response.data.response || 'Ollama returned an empty response.';

        return reviewText;

    } catch (error) {
        console.error("ERROR: Failed to generate review from Ollama API.");
        // Aruncăm o eroare personalizată pe care reviewCoordinator o poate gestiona
        throw new Error(`Ollama API call failed: ${error.message}. Check CI logs for full details.`);
    }
}


module.exports = {
    checkOllamaService,
    runOllamaReview
};