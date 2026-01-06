// js/services/PrecisionService.js

export class PrecisionService {
    static preciseMap = new Map();
    static isInitialized = false;

    /**
     * Generates the Lookup Table.
     * Maps "4.07" (string) -> 4.071428... (float)
     */
    static init() {
        if (this.isInitialized) return;

        // Standard denominators in USMC FitReps
        // 14 is standard. 13 is common (one attribute N/O).
        // We process 13 first, then 14, so that if there is a collision (rare),
        // the 14-attribute version (standard) takes precedence.
        const denominators = [13, 14];

        denominators.forEach(denom => {
            // Scores range from 1 to 7 per attribute.
            const minTotal = 1 * denom;
            const maxTotal = 7 * denom;

            for (let sum = minTotal; sum <= maxTotal; sum++) {
                const preciseVal = sum / denom;
                
                // Simulate the rounding seen on the MBS (2 decimals)
                const roundedStr = preciseVal.toFixed(2); // "4.07"

                // Store in Map
                this.preciseMap.set(roundedStr, preciseVal);
            }
        });

        this.isInitialized = true;
        console.log(`PrecisionService: Generated ${this.preciseMap.size} precision mappings.`);
    }

    /**
     * Attempts to un-round a value.
     * @param {string|number} value - The rounded value (e.g., 4.07 or "4.07")
     * @returns {number} The full precision float if found, otherwise the original value.
     */
    static getPrecise(value) {
        if (!this.isInitialized) this.init();

        // Ensure we look up the string "4.50", not the number 4.5
        const lookupKey = typeof value === 'number' ? value.toFixed(2) : value;

        if (this.preciseMap.has(lookupKey)) {
            return this.preciseMap.get(lookupKey);
        }

        // Fallback: If not found (e.g. user entered weird data), return original
        return parseFloat(value);
    }
}