// js/services/ManualGenerator.js
import { NARRATIVE_TEMPLATES } from '../config/ManualNarrativeConfig.js';

export class ManualGenerator {

    /**
     * Main entry point. Takes a Report object and returns a formatted string.
     */
    static generate(report) {
        // 1. Determine the "Tier" (Logic can be adjusted later)
        // Priority: Use Cumulative RV if available, otherwise Average.
        const tier = this.determineTier(report);

        // 2. Select Templates based on Tier
        const openingTemplate = NARRATIVE_TEMPLATES.OPENINGS[tier];
        const closingTemplate = NARRATIVE_TEMPLATES.CLOSINGS[tier];

        // 3. Inject Data (Search and Replace)
        const opening = this.injectVariables(openingTemplate, report);
        
        // 4. Format User Inputs
        // We use the raw text if provided, or a placeholder if empty
        const accomplishments = report.accomplishments.trim() || "[No accomplishments provided]";
        const context = report.context.trim(); // Context is optional

        // 5. Assemble the Final Draft
        let finalDraft = `${opening}\n\n`;
        
        finalDraft += `${NARRATIVE_TEMPLATES.BODY_HEADER}\n`;
        finalDraft += `${accomplishments}\n\n`;

        if (context.length > 0) {
            finalDraft += `RS COMMENTS / CONTEXT:\n${context}\n\n`;
        }

        finalDraft += `${closingTemplate}`;

        return finalDraft;
    }

    /**
     * Helper: Decides which Tier (1, 2, or 3) matches the report.
     */
    static determineTier(report) {
        // Logic: Try RV first (most accurate), fallback to Average.
        
        // If we have a valid RV (not 0)
        if (report.rv_cum > 0) {
            if (report.rv_cum >= 93.3) return 'TIER_1'; // Top 7% roughly
            if (report.rv_cum >= 86.6) return 'TIER_2'; // Top 1/3 roughly
            return 'TIER_3';
        }

        // Fallback: Use Average Score
        if (report.average >= 4.8) return 'TIER_1';
        if (report.average >= 4.5) return 'TIER_2';
        return 'TIER_3';
    }

    /**
     * Helper: Replaces [BRACKETED] placeholders with real data.
     */
    static injectVariables(template, report) {
        return template
            .replace('[RANK]', report.rank)
            .replace('[NAME]', report.name)
            .replace('[AVG]', report.average.toFixed(2));
    }
}