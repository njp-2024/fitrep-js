// js/ui/ProfilePage.js
import { store } from '../state/Store.js';
import { RankProfile } from '../models/Profile.js';
import { ProfileValidator } from '../services/Validation.js';
import { Sidebar } from './Sidebar.js';
import { Navigation } from './Navigation.js';
import { RANKS } from '../Config.js'; // <--- Import Ranks

export class ProfilePage {
    
    static init() {
        // 1. Populate the Dropdown immediately
        this.initRankDropdown(); 

        // 2. Listener
        const nextBtn = document.getElementById('btn-save-profile');
        if (nextBtn) {
            nextBtn.addEventListener('click', this.handleSaveProfile.bind(this));
        }
    }

    // --- YOUR INIT FUNCTION ---
    static initRankDropdown() {
        const rankSelect = document.getElementById('profile-rank');
        if (rankSelect) {
            // Add a default "Select Rank" option first
            const defaultOption = `<option value="" disabled selected>Select Rank...</option>`;
            rankSelect.innerHTML = defaultOption + RANKS.map(r => `<option value="${r}">${r}</option>`).join('');
        }
    }

    static handleSaveProfile() {
        // Updated ID to match your snippet: 'profile-rank'
        const rank = document.getElementById('profile-rank').value; 
        const avg = document.getElementById('profile-avg').value;
        const reports = document.getElementById('profile-reports').value;
        const high = document.getElementById('profile-high').value;
        const low = document.getElementById('profile-low').value;

        console.log(rank, avg, reports, high, low)

        const errors = ProfileValidator.validate(rank, avg, reports, high, low);
        if (errors.length > 0) {
            alert(errors.join('\n'));
            return;
        }

        const profile = new RankProfile(rank, high, low, avg, reports);
        store.initProfile(profile);
        Sidebar.updateProfileStats(store.getOriginalProfile(), store.getActiveProfile());
        Sidebar.updateHistory([], store.getOriginalProfile());
        Navigation.showReportsPage();
    }

}