// js/services/PromptBuilder.js
import { AI_CONFIG } from '../config/AIConfig.js';

export class PromptBuilder {

    /**
     * Constructs the full prompt payload.
     * @param {Report} report - The active report object.
     * @returns {string} - A human-readable representation of the prompt.
     */
    static build(report) {
        // 1. Determine Tier (Reuse the logic from ManualGenerator or simplified here)
        const tier = this.getTier(report);

        // 2. Select the Dynamic Example
        const exampleData = AI_CONFIG.EXAMPLES[tier];
        const commonInput = AI_CONFIG.EXAMPLES.COMMON_INPUT;

        // 3. Build the "Few-Shot" Block
        // We show the AI: "Here is what this tier looks like."
        let exampleBlock = `\n--- TRAINING EXAMPLE (Targeting ${tier} Performance) ---\n`;
        exampleBlock += `INPUT BULLETS: ${commonInput}\n`;
        exampleBlock += `CONTEXT: ${exampleData.mock_context}\n`;
        exampleBlock += `IDEAL OUTPUT: ${exampleData.output}\n`;

        // 4. Build System Instructions
        let systemPrompt = `--- SYSTEM INSTRUCTIONS ---\n`;
        systemPrompt += `${AI_CONFIG.SYSTEM_ROLE}\n\n`;
        systemPrompt += `STYLE GUIDE:\n${AI_CONFIG.STYLE_GUIDE}\n\n`;
        systemPrompt += `STRUCTURE:\n${AI_CONFIG.STRUCTURE_INSTRUCTIONS}\n`;

        // 5. Build Target Data
        let dataContext = `\n--- TARGET DATA (The Actual Report) ---\n`;
        dataContext += `RANK/NAME: ${report.rank} ${report.name}\n`;
        dataContext += `CALCULATED AVERAGE: ${report.average.toFixed(2)}\n`;
        if (report.rv_cum > 0) {
            dataContext += `RELATIVE VALUE: ${report.rv_cum.toFixed(2)}\n`;
        }

        // 6. Build User Inputs
        let userContent = `\n--- USER INPUTS ---\n`;
        const bullets = report.accomplishments.trim();
        userContent += bullets.length > 0 
            ? `ACCOMPLISHMENTS / BULLETS:\n${bullets}\n`
            : `ACCOMPLISHMENTS: [None Provided - Generate generic summary based on score]\n`;
            
        const context = report.context.trim();
        if (context.length > 0) {
            userContent += `\nADDITIONAL CONTEXT:\n${context}\n`;
        }

        const trigger = `\n--- TASK ---\nUsing the training example as a guide for tone and length, generate the Section I Narrative for ${report.rank} ${report.name} now.`;

        return systemPrompt + exampleBlock + dataContext + userContent + trigger;
    }

    /**
     * Helper to map a report to a configuration Tier
     */
    static getTier(report) {
        // High Tier
        if (report.rv_cum >= 93.3) return 'TIER_1';
        // Mid Tier
        if (report.rv_cum >= 86.6) return 'TIER_2';
        // Standard Tier
        return 'TIER_3';
    }
}