// js/app.js
import { ProfilePage } from './ui/ProfilePage.js';
import { ReportsPage } from './ui/ReportsPage.js';

// Constant needed for UI generation (if you generate the radios dynamically)
// If your HTML already has the radios hardcoded, you don't need this here.
// But if you generate them via JS, keep your "initReportForm" logic here or move it to ReportsPage.
// Assuming your HTML handles the radio structure:

document.addEventListener('DOMContentLoaded', () => {
    console.log("App Initializing...");
    
    // Initialize Page Controllers
    ProfilePage.init();
    ReportsPage.init();

    // Check if we need to generate the radio button grid?
    // If you were generating the HTML for the 14 attributes via JS,
    // paste that "initReportForm()" function here and call it.
});