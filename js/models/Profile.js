// js/Profile.js

export class UserProfile {
    constructor(rank, high, avg, low, reportCount) {
        this.rank = rank;
        // Convert strings to floats/ints immediately upon creation
        this.high = parseFloat(high);
        this.avg = parseFloat(avg);
        this.low = parseFloat(low);
        this.reports = parseInt(reportCount, 10);
    }

    clone() {
        return new UserProfile(
            this.rank,
            this.high,
            this.avg,
            this.low,
            this.reports
        );
    }
}