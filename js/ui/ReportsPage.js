// js/ui/ReportsPage.js
import { store } from '../state/Store.js';
import { Report } from '../models/Report.js';
import { ReportValidator } from '../services/Validation.js';
import { CalculatorService } from '../services/Calculator.js';
import { Sidebar } from './Sidebar.js';
import { Navigation } from './Navigation.js';
import { REPORT_ATTRIBUTES, SCORES } from '../Config.js'; // <--- Import Config

export class ReportsPage {

    static init() {
        // 1. Build the Form HTML immediately
        this.initReportForm();
        this.updateUI()

        // 2. Attach Listeners
        const nameInput = document.getElementById('rpt-name');
        if (nameInput) {
            //nameInput.addEventListener('input', (e) => this.handleInput(e));
            nameInput.addEventListener('blur', (e) => this.handleNameBlur(e))
        }

        const container = document.getElementById('report-attributes-container');
        if (container) {
            container.addEventListener('change', () => this.handleInput());
        }

        const addBtn = document.getElementById('btn-add-report');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.handleAddReport());
        }

        const finishBtn = document.getElementById('btn-finish-reports');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => Navigation.showNarrativesPage());
        }

        // --- RESET PROFILE BUTTON ---
        const resetBtn = document.getElementById('btn-reset-profile');
        if (resetBtn) {
            // Remove old listeners to prevent double-firing if init is called multiple times
            const newBtn = resetBtn.cloneNode(true);
            resetBtn.parentNode.replaceChild(newBtn, resetBtn);

            newBtn.addEventListener('click', () => {
                this.handleResetApp();
            });
        }
    }

    static initReportForm() {
        const container = document.getElementById('report-attributes-container');
        if (!container) return; 

        container.innerHTML = ""; 

        REPORT_ATTRIBUTES.forEach((attr, index) => {
            const groupName = `attr-score-${index}`;
            
            // Note: Added SCORES from Config.js here
            const radiosHtml = SCORES.map(score => `
                <input type="radio" class="btn-check" name="${groupName}" id="${groupName}-${score.label}" value="${score.val}" autocomplete="off" disabled>
                <label class="btn btn-outline-secondary btn-sm" for="${groupName}-${score.label}" style="width: 40px;">${score.label}</label>
            `).join('');

            const rowHtml = `
                <tr>
                    <td class="fw-bold text-secondary text-start pe-4 text-nowrap">${attr}</td>
                    <td class="text-start"> 
                        <div class="btn-group" role="group">
                            ${radiosHtml}
                        </div>
                    </td>
                </tr>
            `;
            container.innerHTML += rowHtml;
        });
    }

    //////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////// Handlers //////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////
    
    static handleInput(e) {
        // A. Scrape the form
        const formReport = this.getFormReport();
        const nameInput = document.getElementById('rpt-name');
        const currentName = nameInput.value.trim();

        // B. Handle Auto-population (Only on name input events)
        //if (e && e.target.id === 'rpt-name') {
        //    this.handleAutoPopulation(currentName);
        //}

        // C. Update Button State (Lock/Unlock)
        this.updateAddButtonState(currentName);

        // D. PROJECTION ENGINE
        // If form is empty/invalid, revert sidebar to "Saved State"
        if (!formReport) {
            const projectedProfile = CalculatorService.calculateStats(store.getOriginalProfile(), store.getReports());
            Sidebar.updateProfileStats(store.getOriginalProfile(), store.getActiveProfile());
            Sidebar.updateActiveReport(null);
            Sidebar.updateHistory(store.getReports())
            return;
        }

        // If form has data, calculate "Projected State"
        // 1. Get current saved reports
        let projectedList = store.getReports(); 
        
        // 2. Inject form data (Edit vs New logic)
        const existingIndex = projectedList.findIndex(r => r.name.toLowerCase() === formReport.name.toLowerCase());
        if (existingIndex !== -1) {
            projectedList[existingIndex] = formReport; // Simulate Edit
        } else {
            projectedList.push(formReport); // Simulate Add
        }

        // 3. Run Math on Projected List
        const projectedProfile = CalculatorService.calculateStats(store.getOriginalProfile(), projectedList);
        
        // 4. Update Sidebar with Projection (Visual Only - No Save)
        Sidebar.updateProfileStats(store.getOriginalProfile(), projectedProfile);
        Sidebar.updateActiveReport(formReport, store.getActiveProfile().rank);
        Sidebar.updateHistory(projectedList)

        // update narratives button
        this.updateFinishBtn() 

    }

    static handleNameBlur(e) {
        const currentName = e.target.value.trim();
        console.log(`Blur detected. Finalizing name: '${currentName}'`);

        // Run the Auto-Populate Logic now
        this.handleAutoPopulation(currentName);

        // Re-check the button state (in case defaults were just loaded)
        //this.updateAddButtonState(currentName);
        
        // Optional: Re-run projection to ensure stats are perfectly synced
        this.handleInput(); 
    }


    static handleAddReport() {
        const formReport = this.getFormReport();
        if (!formReport) return;

        // 1. Save to Store (Upsert)
        store.upsertReport(formReport);

        // 2. Calculate Final Real Stats
        const finalProfile = CalculatorService.calculateStats(store.getOriginalProfile(), store.getReports());
        
        // 3. Update Store with new Stats
        store.updateActiveProfile(finalProfile);

        // 4. Refresh All UI Components (Sidebar + Main Ledger)
        Sidebar.refreshAll(
            finalProfile, 
            null, // Clear active report card
            store.getReports(), 
            store.getOriginalProfile()
        );

        this.updateFinishBtn() 
        // 5. Reset Form
        this.resetForm();
    }

    static handleAutoPopulation(name) {
        if (!name) {
            // Disable all radios if name is empty
            document.querySelectorAll('input[type="radio"]').forEach(r => {
                r.disabled = true;
                r.checked = false;
            });
            return;
        }

        // Unlock radios
        document.querySelectorAll('input[type="radio"]').forEach(r => r.disabled = false);

        // Check Store for existing name
        const existingReport = store.getReports().find(r => r.name.toLowerCase() === name.toLowerCase());
        
        if (existingReport) {
            // Load Scores
            this.setFormScores(existingReport.scores)
        } else {
            this.setFormScores([3,3,3,3,3,3,3,3,3,3,3,3,3,3])
            // Set Defaults (Only if form is clean)
            //const isDirty = document.querySelector('#report-attributes-container input[type="radio"]:checked');
            //if (!isDirty) {
            //    this.setFormScores([3,3,3,3,3,3,3,3,3,3,3,3,3,3])
            //}
        }
    }

    static handleResetApp() {
        // 1. ASK FOR CONFIRMATION
        const choice = confirm("WARNING: This will delete your RS Profile and ALL generated reports.\n\nAre you sure you want to start over?");
        
        if (!choice) {
            return; // 3a. User Cancelled
        }

        // 3b. USER CONFIRMED -> WIPE DATA
        store.reset();

        // Clear local inputs on this page immediately so they don't linger
        this.resetPage(); 

        // 4b. NAVIGATE TO PROFILE PAGE
        // We trigger a click on the Profile Navigation Tab to switch views
        Navigation.showProfilePage();
    }


    //////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////// Helpers //////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////

    static updateFinishBtn() {
        const finishBtn = document.getElementById('btn-finish-reports');
        finishBtn.disabled = false
        if (store.getReports().length === 0) finishBtn.disabled = true
    }


    /**
     * Called when the user navigates to this page.
     * Updates static fields like Rank.
     */
    static updateUI() {
        const profile = store.getActiveProfile();
        if (profile) {
            const rankInput = document.getElementById('rpt-rank-display');
            if (rankInput) rankInput.value = profile.rank;
        }
    }

    static getFormReport() {
        const nameInput = document.getElementById('rpt-name');
        const name = nameInput.value.trim();
        
        // Return null if name invalid (prevents projection on empty forms)
        if (!ReportValidator.isValidName(name)) return null;

        const checkedRadios = document.querySelectorAll('#report-attributes-container input[type="radio"]:checked');
        const scores = Array.from(checkedRadios).map(r => parseInt(r.value, 10));

        // Note: We return the report even if scores are incomplete 
        // to allow the calculator to show "partial" averages while typing
        return new Report(name, store.getActiveProfile().rank, scores);
    }

    // Sets all radio buttons to a specific array of values
    static setFormScores(scoresArray) {
        if (!scoresArray || scoresArray.length !== REPORT_ATTRIBUTES.length) return;

        scoresArray.forEach((val, index) => {
            // Find the radio button with this value for this row
            const radio = document.querySelector(`input[name="attr-score-${index}"][value="${val}"]`);
            if (radio) radio.checked = true;
        });
    }

    static updateAddButtonState(name) {
        const btn = document.getElementById('btn-add-report');
        
        // Scrape Scores
        const checkedRadios = document.querySelectorAll('#report-attributes-container input[type="radio"]:checked');
        const scores = Array.from(checkedRadios).map(r => parseInt(r.value, 10));

        const isNameValid = ReportValidator.isValidName(name);
        const isScoresValid = ReportValidator.areScoresValid(scores, REPORT_ATTRIBUTES.length);

        if (isNameValid && isScoresValid) {
            btn.disabled = false;
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
        } else {
            btn.disabled = true;
            btn.classList.add('btn-secondary');
            btn.classList.remove('btn-primary');
        }
    }

    
    static resetForm() {
        const nameInput = document.getElementById('rpt-name');
        nameInput.value = "";
        nameInput.dispatchEvent(new Event('input')); // Trigger locks
        
        document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    }

    static resetPage() {
        console.log("Resetting Reports Page...");

        // 1. Clear Text Inputs
        const rankDisplay = document.getElementById("rpt-rank-display");
        if (rankDisplay) rankDisplay.value = store.getActiveProfile()?.rank || "";

        const name = document.getElementById("rpt-name");
        if (name) name.value = "";

        // clears the buttons
        this.handleAutoPopulation("");

        // update the add button state
        this.updateAddButtonState("")

        // reset RV's to be safe
        // need to reset RV's - to be sure cum RV's are reset
        CalculatorService.calculateStats(store.getOriginalProfile(), store.getReports());

        // reset sidebar to whatever is saved
        Sidebar.refreshAll(store.getActiveProfile(), null, store.getReports(), store.getOriginalProfile());

    }

}