// js/state/Store.js
import { RankProfile } from '../models/Profile.js';

class AppStore {
    constructor() {
        this.originalProfile = null; // The snapshot (Immutable)
        this.activeProfile = null;   // The working copy (Mutable)
        this.reportsList = [];       // List of Report objects
    }

    // --- ACTIONS ---

    /**
     * Initializes the app with the user's baseline data
     * @param {RankProfile} profile 
     */
    initProfile(profile) {
        this.originalProfile = profile;
        // Clone it so activeProfile is a separate object in memory
        this.activeProfile = profile.clone(); 
        this.reportsList = [];
    }

    /**
     * Adds or Updates a report in the list
     * @param {Report} report 
     */
    upsertReport(report) {
        const index = this.reportsList.findIndex(r => r.id === report.id);
        if (index !== -1) {
            this.reportsList[index] = report; // Update
        } else {
            this.reportsList.push(report); // Insert
        }
    }

    /**
     * Updates the Active Profile (result of calculations)
     * @param {RankProfile} profile 
     */
    updateActiveProfile(profile) {
        this.activeProfile = profile;
    }

    reset() {
        this.originalProfile = null;
        this.activeProfile = null;
        this.reportsList = [];
    }

    // --- GETTERS ---
    
    getOriginalProfile() { return this.originalProfile; }
    getActiveProfile() { return this.activeProfile; }
    getReports() { return [...this.reportsList]; } // Return a copy for safety
}

// Export a single instance (Singleton Pattern)
export const store = new AppStore();