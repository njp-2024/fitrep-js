// js/models/Report.js

export class Report {
    /**
     * @param {string} name - The MRO
     * @param {string} rank - MRO's rank
     * @param {number[]} scores - Array of 14 integers (0-7)
     */
    constructor(name, rank, scores) {
        this.name = name;
        this.rank = rank;
        this.scores = scores; 

        this.rv_proc = 0.00;
        this.rv_cum = 0.00;

        this.accomplishments = ""
        this.context = ""
        this.generatedNarrative = ""
        this.narrativeCount = 0
    }

    /**
     * Calculates the average of this specific report.
     * Logic: Sum of observed scores / Count of observed scores.
     * Ignores any score of 0 (Not Observed/H).
     */
    get average() {
        // 1. Filter out "0" values (Not Observed)
        const observedScores = this.scores.filter(score => score > 0);
        
        // 2. Prevent division by zero if all are "Not Observed"
        if (observedScores.length === 0) return 0.00;

        // 3. Calculate Sum
        const sum = observedScores.reduce((total, num) => total + num, 0);

        // 4. Return Average
        return sum / observedScores.length;
    }
}