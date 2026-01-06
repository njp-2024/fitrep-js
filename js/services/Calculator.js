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
        let totalScore = baseProfile.baseAvg * baseProfile.baseReportsCount;
        let totalCount = baseProfile.baseReportsCount;

        // 2. Add the "Mass" of the new reports
        reportsList.forEach(rpt => {
            totalScore += rpt.average;
            totalCount++;
        });

        // 3. Create a fresh profile object for the result
        // We start with a clone to preserve the Name/Rank
        const resultProfile = baseProfile.clone();

        // 4. Update the Calculated Average
        resultProfile.reports = totalCount;
        resultProfile.avg = totalCount > 0 ? (totalScore / totalCount) : 0;

        // 5. Update High/Low
        // Logic: Start with the base High/Low, then check if any new report beats them.
        let newHigh = baseProfile.high;
        let newLow = baseProfile.low;

        reportsList.forEach(rpt => {
            if (rpt.average > newHigh) newHigh = rpt.average;
            if (rpt.average < newLow) newLow = rpt.average;
        });

        resultProfile.high = newHigh;
        resultProfile.low = newLow;

        return resultProfile;
    }
}