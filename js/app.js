// js/app.js
import { UserProfile } from './models/Profile.js';
import { ProfileValidator } from './services/Validation.js';

// --- CONSTANTS ---
const RANKS = [
    "Sgt", "SSgt", "GySgt", "MSgt", "1stSgt", "MGySgt", "SgtMaj",
    "2ndLt", "1stLt", "Capt", "Maj", "LtCol", "Col"
];

// --- GLOBAL STATE ---
let originalProfile = null;
let activeProfile = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initRankDropdown();
    updateSidebar(null);

    // Attach Event Listener to the Save Button
    // We assume your button in HTML has onclick="saveProfileData()" removed!
    // We attach it via JS now (cleaner separation).
    document.getElementById('btn-save-profile').addEventListener('click', handleSaveProfile);
});

function initRankDropdown() {
    const rankSelect = document.getElementById('profile-rank');
    if (rankSelect) {
        rankSelect.innerHTML = RANKS.map(r => `<option value="${r}">${r}</option>`).join('');
    }
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

    // update reports list

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