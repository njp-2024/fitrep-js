// js/ui/NarrativesPage.js
import { Navigation } from './Navigation.js';

export class NarrativesPage {

    static init() {
        console.log("NarrativesPage: Initializing...");
        
        const backBtn = document.getElementById('btn-back-to-reports');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                Navigation.showReportsPage();
            });
        }
    }
}