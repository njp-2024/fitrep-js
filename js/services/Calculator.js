import { RankProfile } from '../models/Profile.js';

export class CalculatorService {
    /**
     * Calculates the new profile stats based on a base profile and a list of new reports.
     * Returns a NEW RankProfile object (does not mutate inputs).
     * * @param {RankProfile} baseProfile - The original starting stats
     * @param {Report[]} reportsList - The list of reports to add
     * @returns {RankProfile}
     */
    static calculateStats(baseProfile, reportsList) {
        if (!baseProfile) return null;

        // 1. Calculate the "Mass" of the base profile
        let totalScore = baseProfile.avg * baseProfile.reports;
        let totalCount = baseProfile.reports;
        // Logic: Start with the base High/Low, then check if any new report beats them.
        let newHigh = baseProfile.high;
        let newLow = baseProfile.low;


        // 2. Add the "Mass" of the new reports
        reportsList.forEach(rpt => {
            totalScore += rpt.average;
            totalCount++;
            if (rpt.average > newHigh) newHigh = rpt.average
            if (rpt.average < newLow) newLow = rpt.average
            
            rpt.rv_proc = this.calculateRV(rpt.average, totalCount, newHigh, totalScore/ totalCount)
        });

        // 3. Create a fresh profile object for the result
        // We start with a clone to preserve the Name/Rank
        const resultProfile = baseProfile.clone();

        // 4. Update the Calculated Average
        resultProfile.reports = totalCount;
        resultProfile.avg = totalCount > 0 ? (totalScore / totalCount) : 0;
        resultProfile.high = newHigh;
        resultProfile.low = newLow;

        reportsList.forEach(rpt => {
            rpt.rv_cum = this.calculateRV(rpt.average, resultProfile.reports, resultProfile.high, resultProfile.avg)
        })

        return resultProfile;
    }

    /**
     * Calculates Relative Value (RV) using the standard linear interpolation formula.
     * * @param {number} rptAvg - The average of the specific report
     * @param {number} numRpts - Total reports in profile (at time of processing)
     * @param {number} high - Profile High (at time of processing)
     * @param {number} avg - Profile Average (at time of processing)
     * @returns {number} The calculated RV (floored at 80.00, or 0 if small profile)
     */
    static calculateRV(rptAvg, numRpts, high, avg) {
        // Constraint 1: Small Profile Rule (< 3 reports)
        if (numRpts < 3) return 0.0;

        const denominator = high - avg;

        // Constraint 2: Divide by Zero Protection (High == Avg)
        // Using a small epsilon for float comparison safety
        if (Math.abs(denominator) < 0.0001) {
            return 90.0;
        }

        // Standard Formula
        const val = 90.0 + 10.0 * ((rptAvg - avg) / denominator);

        // Constraint 3: Floor at 80.00
        return Math.max(80.0, val);
    }
}