// js/ui/NarrativesPage.js
import { store } from '../state/Store.js';
import { Navigation } from './Navigation.js';
import { SCORES, REPORT_ATTRIBUTES } from '../config/Config.js';
import { Sidebar } from './Sidebar.js';
import { ManualGenerator } from '../services/ManualGenerator.js';
import { PromptBuilder } from '../services/PromptBuilder.js';
import { ExportService } from '../services/ExportService.js';
import { AI_CONFIG } from '../config/AIConfig.js';
import { CalculatorService } from '../services/Calculator.js';

export class NarrativesPage {

    // ============ PRIVATE HELPERS ============

    static #bindClick(id, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', handler);
        return el;
    }

    static #bindEvent(id, event, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
        return el;
    }

    static #getSelectedReport() {
        const selectEl = document.getElementById('narrative-report-select');
        if (!selectEl || selectEl.value === "") return null;
        const index = parseInt(selectEl.value, 10);
        return store.getReports()[index];
    }

    static #getSelectedIndex() {
        const selectEl = document.getElementById('narrative-report-select');
        if (!selectEl || selectEl.value === "") return -1;
        return parseInt(selectEl.value, 10);
    }

    static #updateTimestamp(report, label = 'Last saved') {
        const now = new Date();
        report.lastSavedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeLabel = document.getElementById('nar-last-saved');
        if (timeLabel) timeLabel.textContent = `${label}: ${report.lastSavedTime}`;
    }

    static #flashButton(btn, originalClass) {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<i class="bi bi-check-lg"></i> Saved!`;
        btn.classList.remove('btn-outline-secondary', 'btn-outline-dark');
        btn.classList.add('btn-success', 'text-white');

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('btn-success', 'text-white');
            btn.classList.add(originalClass);
        }, 2000);
    }

    // ============ INITIALIZATION ============

    static init() {
        this.#initNavigationListeners();
        this.#initFormListeners();
        this.#initActionListeners();
        this.#initExportListeners();
        this.#initInitialState();
    }

    static #initNavigationListeners() {
        this.#bindClick('btn-back-to-reports', () => Navigation.showReportsPage());
    }

    static #initFormListeners() {
        // Dropdown selection
        this.#bindEvent('narrative-report-select', 'change', (e) => {
            this.handleSelection(e.target.value);
            this.handleValidation();
        });

        // User input validation on keystroke
        this.#bindEvent('nar-user-input', 'input', () => this.handleValidation());
    }

    static #initActionListeners() {
        // Generate narrative
        this.#bindClick('btn-generate-narrative', () => this.handleGenerate());

        // Save buttons
        this.#bindClick('btn-save-inputs', () => {
            const btn = document.getElementById('btn-save-inputs');
            this.saveCurrentInputs(btn);
        });
        this.#bindClick('btn-save-nar', () => {
            const btn = document.getElementById('btn-save-nar');
            this.saveCurrentInputs(btn);
        });

        // Revert and clear
        this.#bindClick('btn-revert-inputs', () => this.handleRevert());
        this.#bindClick('btn-clear-nar', () => this.handleClearToSaved());
    }

    static #initExportListeners() {
        this.#bindClick('nav-btn-export', () => this.handleExport());
        this.#bindClick('btn-copy-clipboard', () => this.handleCopyToClipboard());
        this.#bindClick('btn-download-txt', () => this.handleDownload());
    }

    static #initInitialState() {
        const genBtn = document.getElementById('btn-generate-narrative');
        if (genBtn) genBtn.disabled = true;
    }

    // ============ EXPORT HANDLERS ============

    static handleExport() {
        const summaryText = ExportService.generateSessionSummary();

        const previewBox = document.getElementById('export-preview');
        if (previewBox) previewBox.value = summaryText;

        const modalEl = document.getElementById('exportModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    static handleCopyToClipboard() {
        const text = document.getElementById('export-preview').value;
        const copyBtn = document.getElementById('btn-copy-clipboard');

        navigator.clipboard.writeText(text).then(() => {
            const original = copyBtn.innerHTML;
            copyBtn.innerHTML = `<i class="bi bi-check"></i> Copied!`;
            setTimeout(() => copyBtn.innerHTML = original, 2000);
        });
    }

    static handleDownload() {
        const text = document.getElementById('export-preview').value;
        const filename = `FitRep_Session_${new Date().toISOString().slice(0, 10)}.txt`;
        ExportService.downloadTextFile(filename, text);
    }

    // ============ FORM HANDLERS ============

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

        // Hide dashboard and clear all inputs
        document.getElementById('narrative-stats-display').classList.add('d-none');
        document.getElementById('nar-user-input').value = "";
        document.getElementById('nar-context-input').value = "";
        document.getElementById('nar-output').value = "";

        // Force "Manual" to be selected
        const manualRadio = document.getElementById('method-manual');
        if (manualRadio) {
            manualRadio.checked = true;
        }

        // Reset usage counter (no report selected)
        this.updateUsageLabel(null);

        // Force validation check (will disable button since length is 0)
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
        const report = this.#getSelectedReport();
        if (!report) return;

        // Update report object
        report.accomplishments = document.getElementById('nar-user-input').value;
        report.context = document.getElementById('nar-context-input').value;
        report.generatedNarrative = document.getElementById('nar-output').value;

        // Update timestamp
        this.#updateTimestamp(report);
        console.log(`Saved inputs for report: ${report.name}`);

        // Flash button feedback
        if (btn) {
            const originalClass = btn.id === 'btn-save-inputs'
                ? 'btn-outline-secondary'
                : 'btn-outline-dark';
            this.#flashButton(btn, originalClass);
        }
    }

    /**
     * Discards current text in the boxes and reloads from the saved Report object.
     */
    static handleRevert() {
        const index = this.#getSelectedIndex();
        if (index === -1) return;

        if (!confirm("Discard unsaved changes and reload the last saved version?")) {
            return;
        }

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
                if (["B","C","D"].includes(label)) badgeClass = "bg-success";        
                if (["G"].includes(label)) badgeClass = "bg-primary";        
                if (["E","F"].includes(label)) badgeClass = "bg-info text-dark"; 
                if (["A"].includes(label)) badgeClass = "bg-danger"; 

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
        const report = this.#getSelectedReport();
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
                return;
            }
            finalText = PromptBuilder.build(report);
            report.narrativeAICount++;
            console.log(`AI Gen Count for ${report.name}: ${report.narrativeAICount}/${max}`);
        }

        // Output and auto-save
        document.getElementById('nar-output').value = finalText;
        report.generatedNarrative = finalText;
        this.#updateTimestamp(report);
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
        const report = this.#getSelectedReport();
        if (!report) return;

        const savedText = report.generatedNarrative || "";
        const currentText = document.getElementById('nar-output').value;

        // Confirm if there are unsaved changes
        if (currentText !== savedText && currentText.trim() !== "") {
            if (!confirm("Discard unsaved changes and revert to the last saved version?")) {
                return;
            }
        }

        // Revert UI
        const outputBox = document.getElementById('nar-output');
        if (outputBox) {
            outputBox.value = savedText;

            // Visual feedback
            outputBox.classList.add('bg-success', 'bg-opacity-10');
            setTimeout(() => outputBox.classList.remove('bg-success', 'bg-opacity-10'), 500);
        }

        // Update status label
        const timeLabel = document.getElementById('nar-last-saved');
        if (timeLabel) timeLabel.textContent = `Reverted to: ${report.lastSavedTime || "Original"}`;
    }
}