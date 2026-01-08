// js/ui/NarrativesPage.js
import { store } from '../state/Store.js';
import { Navigation } from './Navigation.js';
import { SCORES, REPORT_ATTRIBUTES } from '../Config.js'; // Ensure SCORES is exported in Config.js
import { Sidebar } from './Sidebar.js';
import { ManualGenerator } from '../services/ManualGenerator.js';
import { PromptBuilder } from '../services/PromptBuilder.js';
import { ExportService } from '../services/ExportService.js';
import { AI_CONFIG } from '../config/AIConfig.js';
import { CalculatorService } from '../services/Calculator.js';

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

        
        // --- NEW: Save Inputs Button ---
        const saveInputsBtn = document.getElementById('btn-save-inputs');
        if (saveInputsBtn) {
            saveInputsBtn.addEventListener('click', () => this.saveCurrentInputs(saveInputsBtn));
        }


        // 4. save narrative
        const saveNarBtn = document.getElementById('btn-save-nar');
        if (saveNarBtn) {
            saveNarBtn.addEventListener('click', () => this.saveCurrentInputs(saveNarBtn));
        }

        // NEW: Revert Button
        const revertBtn = document.getElementById('btn-revert-inputs');
        if (revertBtn) {
            revertBtn.addEventListener('click', () => this.handleRevert());
        }

        // --- EXPORT BUTTON ---
        const exportBtn = document.getElementById('nav-btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                // 1. Generate Text
                const summaryText = ExportService.generateSessionSummary();
                
                // 2. Put it in the Modal
                const previewBox = document.getElementById('export-preview');
                if (previewBox) previewBox.value = summaryText;

                // 3. Show Modal (using Bootstrap API)
                const modalEl = document.getElementById('exportModal');
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            });
        }

        // --- MODAL ACTION BUTTONS ---
        const copyBtn = document.getElementById('btn-copy-clipboard');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const text = document.getElementById('export-preview').value;
                navigator.clipboard.writeText(text).then(() => {
                    // Quick Feedback
                    const original = copyBtn.innerHTML;
                    copyBtn.innerHTML = `<i class="bi bi-check"></i> Copied!`;
                    setTimeout(() => copyBtn.innerHTML = original, 2000);
                });
            });
        }

        const downloadBtn = document.getElementById('btn-download-txt');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const text = document.getElementById('export-preview').value;
                const filename = `FitRep_Session_${new Date().toISOString().slice(0,10)}.txt`;
                ExportService.downloadTextFile(filename, text);
            });
        }

        const clearBtn = document.getElementById('btn-clear-nar'); 
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.handleClearToSaved();
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

        // 3. WIPE ALL INPUTS (The Fix)
        document.getElementById('nar-user-input').value = "";
        document.getElementById('nar-context-input').value = "";
        document.getElementById('nar-output').value = "";

        // 1. Force "Manual" to be selected
        const manualRadio = document.getElementById('method-manual');
        if (manualRadio) {
            manualRadio.checked = true;
        }

        // NEW: Update the counter for the currently selected report
        if (selectEl && selectEl.value !== "") {
            const index = parseInt(selectEl.value, 10);
            const report = store.getReports()[index];
            this.updateUsageLabel(report); // Call the helper
        } else {
            this.updateUsageLabel(null); // Reset to 0/3
        }


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

        // 2. NEW: LOAD SAVED INPUTS
        // If the report has data, put it in the box. If not, use empty string.
        document.getElementById('nar-user-input').value = report.accomplishments || "";
        document.getElementById('nar-context-input').value = report.context || "";
        
        // 3. NEW: LOAD SAVED NARRATIVE (Result)
        document.getElementById('nar-output').value = report.generatedNarrative || "";

        this.updateUsageLabel(report)

        // NEW: Load Timestamp
        const timeLabel = document.getElementById('nar-last-saved');
        if (report.lastSavedTime) {
            timeLabel.textContent = `Last saved: ${report.lastSavedTime}`;
        } else {
            timeLabel.textContent = "Not saved yet";
        }
    }

    /**
     * Writes the current UI values back to the Report object and localStorage.
     * @param {HTMLElement} btn - Optional button to flash "Saved!" text on.
     */
    static saveCurrentInputs(btn = null) {
        const selectEl = document.getElementById('narrative-report-select');
        if (!selectEl || selectEl.value === "") return; // No report selected

        const index = parseInt(selectEl.value, 10);
        const report = store.getReports()[index];

        if (report) {
            // 1. Update the Object
            report.accomplishments = document.getElementById('nar-user-input').value;
            report.context = document.getElementById('nar-context-input').value;
            report.generatedNarrative = document.getElementById('nar-output').value;


            // NEW: Set Timestamp
            const now = new Date();
            report.lastSavedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


            // 2. Persist to Browser Memory - not implemented, can add this to save data in browsers local memory
            //store.saveToLocalStorage();
            console.log(`Saved inputs for report: ${report.name}`);

            // 3. UI Feedback (Flash the button)
            // Update the text label immediately
            const timeLabel = document.getElementById('nar-last-saved');
            if (timeLabel) timeLabel.textContent = `Last saved: ${report.lastSavedTime}`;

            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = `<i class="bi bi-check-lg"></i> Saved!`;
                btn.classList.remove('btn-outline-secondary', 'btn-outline-dark');
                btn.classList.add('btn-success', 'text-white');

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('btn-success', 'text-white');
                    // Restore original class based on which button it was
                    if (btn.id === 'btn-save-inputs') btn.classList.add('btn-outline-secondary');
                    if (btn.id === 'btn-save-nar') btn.classList.add('btn-outline-dark');
                }, 2000);
            }
        }
    }

    /**
     * Discards current text in the boxes and reloads from the saved Report object.
     */
    static handleRevert() {
        const selectEl = document.getElementById('narrative-report-select');
        if (!selectEl || selectEl.value === "") return;

        // confirm before destroying work
        if (!confirm("Discard unsaved changes and reload the last saved version?")) {
            return;
        }

        const index = parseInt(selectEl.value, 10);
        // Reuse handleSelection to reload the data!
        this.handleSelection(index);
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
        const selectEl = document.getElementById('narrative-report-select');
        if (!selectEl || selectEl.value === "") return;

        const index = parseInt(selectEl.value, 10);
        const report = store.getReports()[index];
        if (!report) return;

        const modeEl = document.querySelector('input[name="nar-method"]:checked');
        const mode = modeEl ? modeEl.value : 'manual';
        
        let finalText = "";

        if (mode === 'manual') {
            finalText = ManualGenerator.generate(report);
        } else if (mode === 'ai') {
            const max = AI_CONFIG.MAX_GENERATIONS_PER_REPORT;
            if (report.narrativeAICount >= max) {
                alert(`AI Generation Limit Reached.\n\nYou have used ${report.narrativeAICount}/${max} AI attempts for this specific report.\n\nPlease edit the text manually or reset the report to try again.`);
                return; // STOP HERE
            }

            // This puts the raw prompt in the box so you can verify the "Dynamic Few-Shot" logic
            finalText = PromptBuilder.build(report);
            report.narrativeAICount ++
            console.log(`AI Gen Count for ${report.name}: ${report.narrativeAICount}/${max}`);
            //store.upsertReport(report)
            
        }

        // 2. Output to UI
        const outputBox = document.getElementById('nar-output');
        outputBox.value = finalText;

        // 3. Auto-Save Logic (Existing)
        report.generatedNarrative = finalText;
        const now = new Date();
        report.lastSavedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeLabel = document.getElementById('nar-last-saved');
        if (timeLabel) timeLabel.textContent = `Last saved: ${report.lastSavedTime}`;
        // You might want to update a label showing "Uses: 1/3"
        this.updateUsageLabel(report);
    }

    // Helper to show the count on screen
    static updateUsageLabel(report) {
        const label = document.getElementById('ai-usage-counter');
        // Check if report exists and has a count, otherwise 0
        const count = report ? (report.narrativeAICount || 0) : 0;
        const max = AI_CONFIG.MAX_GENERATIONS_PER_REPORT;
        
        if (label) {
            label.textContent = `AI Uses: ${count} / ${max}`;
            // Visual cue: Turn red if maxed out
            label.style.color = count >= max ? 'red' : 'inherit';
        }
    }

    static resetPage() {
        console.log("Resetting Narratives Page...");

        // 1. Clear Text Inputs
        // all other inputs are cleared in update UI based on clearing this one
        const reportSelect = document.getElementById("narrative-report-select");
        if (reportSelect) reportSelect.value = "";

        // need to reset RV's - to be sure cum RV's are reset
        CalculatorService.calculateStats(store.getOriginalProfile(), store.getReports());

        // reset sidebar to whatever is saved
        Sidebar.refreshAll(store.getActiveProfile(), null, store.getReports(), store.getOriginalProfile());

    }

    static handleClearToSaved() {
        // 1. IDENTIFY REPORT
        const selectEl = document.getElementById('narrative-report-select');
        if (!selectEl || selectEl.value === "") return;

        const index = parseInt(selectEl.value, 10);
        const report = store.getReports()[index];
        if (!report) return;

        // 2. CHECK: Is there actually a saved version?
        // If report.generatedNarrative is undefined, we revert to ""
        const savedText = report.generatedNarrative || "";
        
        // 3. CONFIRMATION (Optional but polite)
        // If the box is empty, no need to confirm. 
        // If the box matches the save, no need to confirm.
        const currentText = document.getElementById('nar-output').value;
        
        if (currentText !== savedText && currentText.trim() !== "") {
            if (!confirm("Discard unsaved changes and revert to the last saved version?")) {
                return;
            }
        }

        // 4. OVERWRITE UI WITH STORE DATA
        const outputBox = document.getElementById('nar-output');
        if (outputBox) {
            outputBox.value = savedText;
            
            // Visual Feedback (Flash the box green briefly)
            outputBox.classList.add('bg-success', 'bg-opacity-10');
            setTimeout(() => outputBox.classList.remove('bg-success', 'bg-opacity-10'), 500);
        }

        // 5. UPDATE STATUS LABEL
        const timeLabel = document.getElementById('nar-last-saved');
        if (timeLabel) timeLabel.textContent = `Reverted to: ${report.lastSavedTime || "Original"}`;
    }
}