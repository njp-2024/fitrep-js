// js/Validation.js

export class ProfileValidator {
    
    static validate(profile) {
        const errors = [];

        // 1. Rank Check
        if (!profile.rank || profile.rank === "") {
            errors.push("Rank is required.");
        }

        // 2. Numeric Range Checks (0.00 - 7.00)
        // Helper function to check ranges
        const isValidScore = (num) => !isNaN(num) && num >= 0 && num <= 7;

        if (!isValidScore(profile.high)) errors.push("RS High must be between 0.00 and 7.00");
        if (!isValidScore(profile.avg)) errors.push("RS Avg must be between 0.00 and 7.00");
        if (!isValidScore(profile.low)) errors.push("RS Low must be between 0.00 and 7.00");

        // 3. Report Count Check (Integer 0-500)
        if (isNaN(profile.reports) || profile.reports < 0 || profile.reports > 500) {
            errors.push("Total Reports must be a number between 0 and 500");
        }

        return errors; // Returns empty array if valid, list of strings if invalid
    }
}