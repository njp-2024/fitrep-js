// js/app.js
import { UserProfile } from './models/Profile.js';
import { ProfileValidator } from './services/Validation.js';
import { ReportValidator } from './services/Validation.js';
import { Report } from './models/Report.js';

// --- CONSTANTS ---
const RANKS = [
    "Sgt", "SSgt", "GySgt", "MSgt", "1stSgt", "MGySgt", "SgtMaj",
    "2ndLt", "1stLt", "Capt", "Maj", "LtCol", "Col"
];

const REPORT_ATTRIBUTES = [
    "Performance", "Proficiency", "Courage",
    "Effectiveness Under Stress", "Initiative", "Leading Subordinates",
    "Developing Subordinates", "Setting the Example", "Ensuring Well-being",
    "Communication Skills", "PME", "Decision Making",
    "Judgment", "Reports"
];

const SCORES = [
    { label: "A", val: 1 },
    { label: "B", val: 2 },
    { label: "C", val: 3 },
    { label: "D", val: 4 },
    { label: "E", val: 5 },
    { label: "F", val: 6 },
    { label: "G", val: 7 },
    { label: "H", val: 0 } // "Not Observed"
];

// --- GLOBAL STATE ---
let originalProfile = null;
let activeProfile = null;
let reportsList = []

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initRankDropdown();
    initReportForm()
    updateSidebar(null);

    // Attach Event Listener to the Save Button
    // We assume your button in HTML has onclick="saveProfileData()" removed!
    // We attach it via JS now (cleaner separation).
    document.getElementById('btn-save-profile').addEventListener('click', handleSaveProfile);


    // report form listeners
    // 1. Setup the Add Button (Start disabled)
    const addRptBtn = document.getElementById('btn-add-report');
    if (addRptBtn) {
        addRptBtn.disabled = true; // Force lock on load
        addRptBtn.addEventListener('click', handleAddReport);
    }

    // 2. Name Input Listener (Smart Population)
    const rptNameInput = document.getElementById('rpt-name');
    if (rptNameInput) {
        rptNameInput.addEventListener('input', (e) => {
            const currentName = e.target.value.trim();
            const allRadios = document.querySelectorAll('#report-attributes-container input[type="radio"]');

            // A. handle Empty State (Lock & Clear)
            if (currentName === "") {
                allRadios.forEach(r => {
                    r.disabled = true;
                    r.checked = false; // Clear selections
                });
                updateAddButtonState(); // Lock the "Add" button
                return;
            }

            // B. Unlock Buttons (Since we have a name)
            allRadios.forEach(r => r.disabled = false);

            // C. Check for Existing Report
            const existingReport = reportsList.find(r => r.name.toLowerCase() === currentName.toLowerCase());

            if (existingReport) {
                // CASE 1: Existing Report -> Load its scores
                setFormScores(existingReport.scores);
            } else {
                // CASE 2: New Report -> Set defaults (only if form is empty)
                setDefaultScores();
            }

            // D. Check Validity
            updateAddButtonState();
        });
    }

    // 3. Radio Button Listeners (Delegation)
    // Instead of adding 112 listeners, we listen to the container "change" event
    const container = document.getElementById('report-attributes-container');
    if (container) {
        container.addEventListener('change', () => {
            updateAddButtonState();
        });
    }

});

function initRankDropdown() {
    const rankSelect = document.getElementById('profile-rank');
    if (rankSelect) {
        rankSelect.innerHTML = RANKS.map(r => `<option value="${r}">${r}</option>`).join('');
    }
}


// Call this inside your DOMContentLoaded event listener!
function initReportForm() {
    const container = document.getElementById('report-attributes-container');
    if (!container) return; // Guard clause

    container.innerHTML = ""; // Clear existing

    REPORT_ATTRIBUTES.forEach((attr, index) => {
        // Create a unique name for the radio group (e.g., "score-0", "score-1")
        const groupName = `attr-score-${index}`;
        
        // Generate the Radio Buttons
        // We use Bootstrap's "btn-group" to make them look like buttons, not tiny circles
        //const radiosHtml = SCORES.map(score => `
        //    <input type="radio" class="btn-check" name="${groupName}" id="${groupName}-${score.label}" value="${score.val}" autocomplete="off">
        //    <label class="btn btn-outline-secondary btn-sm" for="${groupName}-${score.label}" style="width: 40px;">${score.label}</label>
        //`).join('');
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



// --- MAIN HANDLER ---
function handleSaveProfile() {
    // 1. Gather Inputs
    const rank = document.getElementById('profile-rank').value;
    const high = document.getElementById('profile-high').value;
    const avg = document.getElementById('profile-avg').value;
    const low = document.getElementById('profile-low').value;
    const reports = document.getElementById('profile-reports').value;

    // 2. Create Model Instance
    const tempProfile = new UserProfile(rank, high, avg, low, reports);

    // 3. Validate
    const errors = ProfileValidator.validate(tempProfile);

    if (errors.length > 0) {
        // Validation Failed
        alert("Please fix the following errors:\n\n" + errors.join("\n"));
        return;
    }

    // 4. Success: Save to State
    originalProfile = tempProfile;
    activeProfile = tempProfile.clone();
    console.log("Profile Saved:", originalProfile);
    console.log("Active (Copy):", activeProfile);
    
    // 5. Update UI (Sidebar)
    updateSidebar(originalProfile, activeProfile);
    updateReportForm()
    
    // A. Unlock the "Reports" button in the sidebar
    // (We need to give that button an ID in HTML first - see Step 3 below)
    const reportsBtn = document.getElementById('nav-reports');
    if (reportsBtn) {
        reportsBtn.disabled = false;
        reportsBtn.classList.remove('btn-secondary'); // Optional: change color
        reportsBtn.classList.add('btn-primary');
    }

    // B. Navigate to the next page
    alert("Profile saved! Moving to Reports...");
    navigateTo('page-reports');
}

function updateSidebar(originalProfile, activeProfile) {
    const sidebarTitle = document.getElementById('sb_title');

    // update title
    if (sidebarTitle) {
        if (activeProfile && activeProfile.rank) {
            // Use backticks (`) for cleaner variable insertion
            sidebarTitle.textContent = `${activeProfile.rank} Profile Data`;
        } else {
            sidebarTitle.textContent = "No Profile Data";
        }
    }

    // update profile data table
    if (activeProfile && originalProfile) {
        document.getElementById('op-title').textContent = "Original";
        document.getElementById('op-high').textContent = originalProfile.high.toFixed(2);
        document.getElementById('op-low').textContent = originalProfile.low.toFixed(2);
        document.getElementById('op-avg').textContent = originalProfile.avg.toFixed(2);
        document.getElementById('op-reports').textContent = originalProfile.reports;

        document.getElementById('ap-title').textContent = "Active";
        document.getElementById('ap-high').textContent = activeProfile.high.toFixed(2);
        document.getElementById('ap-low').textContent = activeProfile.low.toFixed(2);
        document.getElementById('ap-avg').textContent = activeProfile.avg.toFixed(2);
        document.getElementById('ap-reports').textContent = activeProfile.reports;

    }
    

    // update active report card
    updateActiveReportCard()

    // update reports list

}


function updateActiveReportCard() {
    // 1. Target Elements
    const nameSpan = document.getElementById('sb-rpt-header-name'); // The header text
    const avgEl = document.getElementById('sb-rpt-avg');
    const rvProcEl = document.getElementById('sb-rpt-rv-proc');
    const rvCumEl = document.getElementById('sb-rpt-rv-cum');
    const nameInput = document.getElementById('rpt-name');

    if (!nameInput) return;

    const currentName = nameInput.value.trim();

    // 2. Handle Empty State
    if (!currentName) {
        if (nameSpan) nameSpan.textContent = ""; // Clear header name
        if (avgEl) avgEl.textContent = "0.00";
        if (rvProcEl) rvProcEl.textContent = "-";
        if (rvCumEl) rvCumEl.textContent = "-";
        return;
    }

    // 3. Update Header Name (Rank + Name)
    const rank = activeProfile ? activeProfile.rank : "";
    if (nameSpan) nameSpan.textContent = `${rank} ${currentName}`;

    // 4. Calculate Real-Time Average
    const checkedRadios = document.querySelectorAll('#report-attributes-container input[type="radio"]:checked');
    const scores = Array.from(checkedRadios).map(r => parseInt(r.value, 10));

    const observedScores = scores.filter(s => s > 0);
    
    let currentAvg = 0;
    if (observedScores.length > 0) {
        const sum = observedScores.reduce((a, b) => a + b, 0);
        currentAvg = sum / observedScores.length;
    }

    // 5. Update Metrics
    if (avgEl) avgEl.textContent = currentAvg.toFixed(2);
    
    // (RV Logic TBD - keeping them as dashes for now)
    if (rvProcEl) rvProcEl.textContent = "-";
    if (rvCumEl) rvCumEl.textContent = "-";
}

function updateReportForm() {
    const rptRankDisplay = document.getElementById('rpt-rank-display');

    if (rptRankDisplay) {
        rptRankDisplay.value = (activeProfile && activeProfile.rank) ? activeProfile.rank : "";
    }
}


// --- NAVIGATION HELPER ---
function navigateTo(pageId) {
    // 1. List of all page IDs
    const pages = ['page-profile', 'page-reports', 'page-narratives'];

    // 2. Hide them all
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // 3. Show the target
    const target = document.getElementById(pageId);
    if (target) {
        target.style.display = 'block';
        window.scrollTo(0, 0); // Scroll to top for better UX
    }
}

// --- UI HELPER: BUTTON STATE ---
function updateAddButtonState() {
    const btn = document.getElementById('btn-add-report');
    const nameInput = document.getElementById('rpt-name');
    if (!btn || !nameInput) return;

    // 1. Scrape Name
    const name = nameInput.value;

    // 2. Scrape Scores (Just the values)
    const checkedRadios = document.querySelectorAll('#report-attributes-container input[type="radio"]:checked');
    const scores = Array.from(checkedRadios).map(r => parseInt(r.value, 10));

    // 3. Validate using the Service
    const isNameValid = ReportValidator.isValidName(name);
    const isScoresValid = ReportValidator.areScoresValid(scores, REPORT_ATTRIBUTES.length);

    // 4. Toggle Button
    if (isNameValid && isScoresValid) {
        btn.disabled = false;
        btn.classList.remove('btn-secondary'); // Optional visual cue
        btn.classList.add('btn-primary');
    } else {
        btn.disabled = true;
        btn.classList.add('btn-secondary');
        btn.classList.remove('btn-primary');
    }
}

function handleAddReport() {
    // 1. Scrape Data
    const nameInput = document.getElementById('rpt-name');
    const name = nameInput.value.trim();
    
    const checkedRadios = document.querySelectorAll('#report-attributes-container input[type="radio"]:checked');
    const collectedScores = Array.from(checkedRadios).map(r => parseInt(r.value, 10));

    // 2. Validate (Double Check)
    if (!ReportValidator.isValidName(name)) {
        alert("Invalid Name");
        return;
    }
    if (!ReportValidator.areScoresValid(collectedScores, REPORT_ATTRIBUTES.length)) {
        alert("Invalid Scores (Ensure all are selected and not all are 'H')");
        return;
    }

    // 3. Create & Save
    const newReport = new Report(name, activeProfile.rank, collectedScores);
    
    // 4. CHECK: Does this report already exist?
    // We compare names case-insensitively to prevent duplicates like "Annual" vs "annual"
    const existingIndex = reportsList.findIndex(r => r.name.toLowerCase() === name.toLowerCase());

    if (existingIndex !== -1) {
        // --- CASE A: EDIT EXISTING ---
        // Preserve the original ID so we don't break any potential links
        newReport.id = reportsList[existingIndex].id;
        
        // Swap the old report with the new one
        reportsList[existingIndex] = newReport;
        
        alert(`Report "${name}" updated successfully!`);
    } else {
        // --- CASE B: CREATE NEW ---
        reportsList.push(newReport);
        
        alert(`Report "${name}" added successfully!`);
    }

    // 5. recals stats and refresh UI
    recalculateProfileStats();

    // 6. Reset UI
    nameInput.value = "";
    // Manually trigger the input event to reset the locks/button state
    nameInput.dispatchEvent(new Event('input')); 
    
    // Clear radios
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    
    // alert(`Report "${name}" Added!`);
}


// --- LOGIC: RECALCULATE STATS ---
function recalculateProfileStats() {
    // Safety check: ensure we have data to work with
    if (!originalProfile || !activeProfile) return;

    // 1. Reset to the "Base" mass (Original Profile data)
    // We treat the Original Profile like a giant aggregate report
    let totalScore = originalProfile.avg * originalProfile.reports;
    let totalCount = originalProfile.reports;
    activeProfile.high = originalProfile.high
    activeProfile.low = originalProfile.low

    // 2. Add the "Mass" of every new report in the list
    reportsList.forEach(rpt => {
        totalScore += rpt.average;
        totalCount++;

        if (rpt.average > activeProfile.high) activeProfile.high = rpt.average;
        if (rpt.average < activeProfile.low) activeProfile.low = rpt.average; 
    });

    // 3. Update the Active Profile (The Display Model)
    // Avoid division by zero if somehow totalCount is 0
    activeProfile.reports = totalCount;
    activeProfile.avg = totalCount > 0 ? (totalScore / totalCount) : 0;


    // 5. Trigger UI Updates
    updateSidebar(originalProfile, activeProfile);
    
    // NOTE: We haven't written this function below yet! 
    // This is the next step.
    updateReportsLedger(); 
}


// --- UI UPDATER: REPORTS LEDGER ---
function updateReportsLedger() {
    const tbody = document.getElementById('main-reports-list');
    const finishBtn = document.getElementById('btn-finish-reports');
    
    if (!tbody) return;

    // 1. Reset Table
    tbody.innerHTML = ""; 

    // 2. Handle Empty State
    if (reportsList.length === 0) {
        // Note: colspan is 4 now, since we removed the delete column
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-muted fst-italic py-3">No reports added to this profile yet.</td>
            </tr>`;
        if (finishBtn) finishBtn.disabled = true; // Lock "Next" button
        return;
    }

    // 3. Unlock "Next" Button
    if (finishBtn) finishBtn.disabled = false;

    // 5. Generate Rows
    reportsList.forEach(report => {   

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-start ps-3 fw-bold">${report.name}</td>
            <td class="text-primary">${report.average.toFixed(2)}</td>
            <td class="text-muted">-</td> <td class="fw-bold">"5"</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- UI HELPER: SCORE POPULATION ---

// Sets all radio buttons to a specific array of values
function setFormScores(scoresArray) {
    if (!scoresArray || scoresArray.length !== REPORT_ATTRIBUTES.length) return;

    scoresArray.forEach((val, index) => {
        // Find the radio button with this value for this row
        const radio = document.querySelector(`input[name="attr-score-${index}"][value="${val}"]`);
        if (radio) radio.checked = true;
    });
}

// Sets all radio buttons to the default 'C' (Value 3)
function setDefaultScores() {
    // Check if the form is already "dirty" (user has clicked something)
    // We don't want to overwrite their work if they are just fixing a typo in the name
    const anyChecked = document.querySelector('#report-attributes-container input[type="radio"]:checked');
    if (anyChecked) return; 

    // If clean, set everything to 'C' (Value 3)
    // Note: We assume 'C' is value 3 based on your SCORES constant
    const defaultVal = 3; 
    
    REPORT_ATTRIBUTES.forEach((_, index) => {
        const radio = document.querySelector(`input[name="attr-score-${index}"][value="${defaultVal}"]`);
        if (radio) radio.checked = true;
    });
}