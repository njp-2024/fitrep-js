// js/models/Profile.js

export class RankProfile {
    constructor(rank, high, low, avg, reportCount) {
        this.rank = rank;
        // Convert strings to floats/ints immediately upon creation
        this.high = high  // parseFloat(high);
        this.avg = avg    // parseFloat(avg);
        this.low = low    // parseFloat(low);
        this.reports = reportCount  // parseInt(reportCount, 10);
    }

    clone() {
        return new RankProfile(
            this.rank,
            this.high,
            this.avg,
            this.low,
            this.reports
        );
    }
}