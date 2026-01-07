// js/ui/NarrativesPage.js
import { store } from '../state/Store.js';
import { Navigation } from './Navigation.js';
import { SCORES, REPORT_ATTRIBUTES } from '../Config.js'; // Ensure SCORES is exported in Config.js
import { Sidebar } from './Sidebar.js';

export class NarrativesPage {

    static init() {        
        // 1. Navigation Listener
        const backBtn = document.getElementById('btn-back-to-reports');
        if (backBtn) {
            backBtn.addEventListener('click', () => Navigation.showReportsPage());
        }

        // 3. Dropdown Listener (Update: Trigger validation when report changes too)
        const selectEl = document.getElementById('narrative-report-select');
        if (selectEl) {
            selectEl.addEventListener('change', (e) => {
                this.handleSelection(e.target.value);
                this.handleValidation(); // Re-check if we are ready to generate
            });
        }

        // 3. Generate Button Listener
        const genBtn = document.getElementById('btn-generate-narrative');
        if (genBtn) genBtn.disabled = true;
        if (genBtn) {
            genBtn.addEventListener('click', () => this.handleGenerate());
        }


        // 2. Input Listener - Run validation on every keystroke
        const inputEl = document.getElementById('nar-user-input');
        if (inputEl) {
            inputEl.addEventListener('input', () => this.handleValidation());
        }

        


        // 4. save narrative
        const saveNarBtn = document.getElementById('btn-save-nar');
        if (saveNarBtn) {
            saveNarBtn.addEventListener('click', () => {
                console.log("Save Narrative clicked (Logic pending)");
                // We will implement the save logic next
            });
        }
    }

    /**
     * Checks all conditions required to enable the Generate button.
     */
    static handleValidation() {
        const inputEl = document.getElementById('nar-user-input');
        const genBtn = document.getElementById('btn-generate-narrative');
        const countEl = document.getElementById('nar-char-count');
        const selectEl = document.getElementById('narrative-report-select');

        if (!inputEl || !genBtn) return;

        // Condition A: Must have > 50 characters
        const currentLength = inputEl.value.trim().length;
        const isLengthValid = currentLength >= 50;

        // Condition B: Must have a Report selected (Optional, but recommended)
        const isReportSelected = selectEl && selectEl.value !== "";

        // UI Feedback: Update Counter
        if (countEl) {
            countEl.textContent = `${currentLength} / 50 characters required`;
            // Turn green if valid, red if not (optional polish)
            countEl.className = isLengthValid ? "text-success fw-bold" : "text-muted";
        }

        // Final Decision: Enable only if BOTH are true
        genBtn.disabled = !(isLengthValid && isReportSelected);
    }

    /**
     * Called whenever the user Navigates TO this page.
     * Refreshes the dropdown list.
     */
    static updateUI() {
        const selectEl = document.getElementById('narrative-report-select');
        const reports = store.getReports();
        const profile = store.getActiveProfile();

        if (!selectEl || !profile) return;

        // Clear and rebuild options
        selectEl.innerHTML = `<option value="" selected disabled>Choose a report...</option>`;

        reports.forEach((rpt, index) => {
            // We use the Index as the ID for now since IDs might be complex strings
            const option = document.createElement('option');
            option.value = index; 
            option.textContent = `${profile.rank} ${rpt.name} (Avg: ${rpt.average.toFixed(2)})`;
            selectEl.appendChild(option);
        });

        // Hide the dashboard until selection is made
        document.getElementById('narrative-stats-display').classList.add('d-none');
        document.getElementById('nar-output').value = "";

        // Force validation check (which will disable the button since length is 0)
        this.handleValidation();
    }

    static handleSelection(indexStr) {
        const index = parseInt(indexStr, 10);
        const report = store.getReports()[index];
        const dashboard = document.getElementById('narrative-stats-display');

        if (!report) return;

        // 1. Show Dashboard
        dashboard.classList.remove('d-none');

        // 2. Populate Numbers
        document.getElementById('nar-stat-avg').textContent = report.average.toFixed(2);
        document.getElementById('nar-stat-proc').textContent = report.rv_proc.toFixed(2);
        document.getElementById('nar-stat-cum').textContent = report.rv_cum.toFixed(2);
        const profile = store.getActiveProfile()
        Sidebar.updateActiveReport(report, profile.rank)

        // 3. Populate Attribute Badges
        this.renderAttributeBadges(report.scores);
    }


    static renderAttributeBadges(scores) {
        const grid = document.getElementById('nar-attributes-grid');
        grid.innerHTML = ""; 

        // USMC FitRep Groupings (Standard Indices)
        const groups = [
            { title: "Mission", range: [0, 2] },      // Indices 0, 1
            { title: "Character", range: [2, 5] },    // Indices 2, 3, 4
            { title: "Leadership", range: [5, 10] },  // Indices 5, 6, 7, 8, 9
            { title: "Intellect", range: [10, 14] }   // Indices 10, 11, 12, 13
        ];

        groups.forEach(group => {
            // 1. Create a Column for the Group
            const col = document.createElement('div');
            col.className = "d-flex flex-column align-items-center mx-2"; // Column layout
            
            // 2. Add Group Title
            const header = document.createElement('small');
            header.className = "text-muted fw-bold mb-1";
            header.style.fontSize = "0.7rem";
            header.textContent = group.title.toUpperCase();
            col.appendChild(header);

            // 3. Container for Badges
            const badgeContainer = document.createElement('div');
            badgeContainer.className = "d-flex gap-1"; // Horizontal badges within the group

            // 4. Generate Badges for this specific range
            for (let i = group.range[0]; i < group.range[1]; i++) {
                // Safety check (in case config is shorter than 14)
                if (i >= scores.length) continue;

                const scoreVal = scores[i];
                const attrName = REPORT_ATTRIBUTES[i]; // Get name for tooltip (e.g. "Courage")

                // Reverse Lookup (Value -> Label)
                const configObj = SCORES.find(s => s.val === scoreVal);
                const label = configObj ? configObj.label : "?";

                // Color Coding
                let badgeClass = "bg-secondary"; 
                if (label === "G") badgeClass = "bg-success";        
                if (label === "F") badgeClass = "bg-primary";        
                if (label === "E") badgeClass = "bg-info text-dark"; 
                if (["A","B","C","D"].includes(label)) badgeClass = "bg-danger"; 

                const badge = document.createElement('span');
                badge.className = `badge ${badgeClass} border`;
                badge.style.cursor = "help"; // Change mouse cursor to question mark
                badge.style.width = "25px";
                badge.textContent = label;
                
                // Add Tooltip (Browser default)
                badge.title = `${attrName}: ${label}`; // Hover shows "Courage: G"

                badgeContainer.appendChild(badge);
            }

            col.appendChild(badgeContainer);
            grid.appendChild(col);
        });
    }

    static handleGenerate() {
        const output = document.getElementById('nar-output');
        const userInput = document.getElementById('nar-user-input').value;
        const avg = document.getElementById('nar-stat-avg').textContent;

        // Placeholder "Template Engine"
        const result = `(DRAFT)\n\nReviewing Officer Comments:\n\nMRO is a solid performer with a ${avg} average. ${userInput}\n\nRecommended for promotion.`;
        
        output.value = result;
    }
}