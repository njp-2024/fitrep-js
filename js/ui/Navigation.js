// js/ui/Navigation.js

import { ReportsPage } from './ReportsPage.js';

export class Navigation {
    
    static showReportsPage() {
        // Hide Setup
        document.getElementById('page-profile').classList.add('d-none');
        
        // Show Reports
        document.getElementById('page-reports').classList.add('d-none');

        const reportsSection = document.getElementById('page-reports'); // Matches your new HTML ID
        if (reportsSection) {
            reportsSection.classList.remove('d-none');
            
            // Trigger the UI update so Rank appears
            ReportsPage.updateUI(); 
        }
        
        // Optional: Scroll to top
        window.scrollTo(0, 0);
    }

    static showResultsPage() {
        // Hide Reports
        document.getElementById('page-reports').classList.add('d-none');

        // Show Results (We will build this view later)
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) resultsSection.classList.remove('d-none');
    }
}