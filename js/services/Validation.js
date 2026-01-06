// js/services/Validation.js

export class ProfileValidator {
    
    static validate(rank, avg, reports, high, low) {
        const errors = [];

        // 1. Rank Check
        if (!rank || rank === "") {
            errors.push("Rank is required.");
        }

        // 2. Numeric Range Checks (0.00 - 7.00)
        // Helper function to check ranges
        const isValidScore = (num) => !isNaN(num) && num >= 0 && num <= 7;

        if (!isValidScore(high)) errors.push("RS High must be between 0.00 and 7.00");
        if (!isValidScore(avg)) errors.push("RS Avg must be between 0.00 and 7.00");
        if (!isValidScore(low)) errors.push("RS Low must be between 0.00 and 7.00");

        // 3. Report Count Check (Integer 0-500)
        if (isNaN(reports) || reports < 0 || reports > 500) {
            errors.push("Total Reports must be a number between 0 and 500");
        }

        return errors; // Returns empty array if valid, list of strings if invalid
    }
}

export class ReportValidator {
    /**
     * Checks if the name exists and is within limits
     */
    static isValidName(name) {
        if (!name || name.trim() === "") return false;
        if (name.length > 30) return false;
        return true;
    }

    /**
     * Checks if the scores are complete and meaningful
     * @param {Array} scores - Array of integers
     * @param {Number} totalAttributes - How many attributes expected (14)
     */
    static areScoresValid(scores, totalAttributes) {
        // Rule 1: Must have a score for every attribute
        if (!scores || scores.length !== totalAttributes) return false;

        // Rule 2: Cannot be ALL "Not Observed" (0)
        // returns true if EVERY score is 0
        const allH = scores.every(score => score === 0);
        if (allH) return false;

        return true;
    }
}