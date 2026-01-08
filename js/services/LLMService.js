// js/services/LLMService.js

export default class LLMService {
    
    /**
     * Sends a prompt to the Netlify backend function.
     * @param {string} promptText - The prompt to send to the AI.
     * @returns {Promise<string>} - The generated text.
     */
    static async generateNarrative(promptText) {
        try {
            // We talk to our own backend, NOT OpenAI directly.
            const response = await fetch('/.netlify/functions/generate-narrative', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptText })
            });

            // Handle HTTP errors (like 400 Bad Request or 500 Server Error)
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server Error: ${response.status}`);
            }

            const data = await response.json();
            return data.text;

        } catch (error) {
            console.error("LLM Generation Failed:", error);
            throw error; // Re-throw so the UI knows it failed
        }
    }
}