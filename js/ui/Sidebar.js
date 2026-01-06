// js/ui/Sidebar.js

import { RankProfile } from "../models/Profile.js";

export class Sidebar {
    
    /**
     * Updates the Top Card (Profile Stats)
     * @param {RankProfile} profile - The profile object (Real or Projected)
     */
    static updateProfileStats(originalProfile, activeProfile) {
        if (!originalProfile || !activeProfile) return;

        // Target Elements
        const avgEl = document.getElementById('op-avg');
        const countEl = document.getElementById('op-reports');
        const highEl = document.getElementById('op-high');
        const lowEl = document.getElementById('op-low');
        const titleEl = document.getElementById('op-title');

        const avgE2 = document.getElementById('ap-avg');
        const countE2 = document.getElementById('ap-reports');
        const highE2 = document.getElementById('ap-high');
        const lowE2 = document.getElementById('ap-low');
        const titleE2 = document.getElementById('ap-title');
        
        // Update Values
        if (avgEl) avgEl.textContent = originalProfile.avg.toFixed(2);
        if (countEl) countEl.textContent = originalProfile.reports;
        if (highEl) highEl.textContent = originalProfile.high.toFixed(2);
        if (lowEl) lowEl.textContent = originalProfile.low.toFixed(2);
        if (titleEl) titleEl.textContent = "Original";   // `${profile.rank} Profile`;

        if (avgE2) avgE2.textContent = activeProfile.avg.toFixed(2);
        if (countE2) countE2.textContent = activeProfile.reports;
        if (highE2) highE2.textContent = activeProfile.high.toFixed(2);
        if (lowE2) lowE2.textContent = activeProfile.low.toFixed(2);
        if (titleE2) titleE2.textContent = "Active";   // `${profile.rank} Profile`;
        
    }

    /**
     * Updates the Middle Card (Active Report being typed)
     * @param {Report} report - The current report from the form (or null)
     * @param {string} rank - The user's rank (for the header)
     */
    static updateActiveReport(report, rank) {
        // Target Elements
        const nameSpan = document.getElementById('sb-rpt-header-name');
        const avgEl = document.getElementById('sb-rpt-avg');
        const rvProcEl = document.getElementById('sb-rpt-rv-proc');
        const rvCumEl = document.getElementById('sb-rpt-rv-cum');

        // Case 1: No Report (Form is empty or invalid)
        if (!report || !report.name) {
            if (nameSpan) nameSpan.textContent = "";
            if (avgEl) avgEl.textContent = "0.00";
            if (rvProcEl) rvProcEl.textContent = "-";
            if (rvCumEl) rvCumEl.textContent = "-";
            return;
        }

        // Case 2: Active Data
        if (nameSpan) nameSpan.textContent = `${rank} ${report.name}`;
        if (avgEl) avgEl.textContent = report.average.toFixed(2);
        
        // Placeholders for RV (Future Logic)
        if (rvProcEl) rvProcEl.textContent = "-";
        if (rvCumEl) rvCumEl.textContent = "-";
    }

    /**
     * Updates the Bottom Card (History List)
     * @param {Report[]} reportsList - The list of saved reports
     * @param {RankProfile} baseProfile - Needed to calculate the running cumulative avg
     */
    static updateHistory(reportsList) {
        const tbody = document.getElementById('sb-reports-body');
        if (!tbody) return;

        tbody.innerHTML = ""; // Clear list

        if (reportsList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-muted fst-italic py-2">No reports yet.</td></tr>`;
            return;
        }

        reportsList.forEach(rpt => {
            const row = `
                <tr>
                    <td class="text-start ps-3 fw-bold text-nowrap" style="max-width: 100px; overflow: hidden; text-overflow: ellipsis;">
                        ${rpt.name}
                    </td>
                    <td class="text-primary">${rpt.average.toFixed(2)}</td>
                    <td class="fw-bold">5</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }

    /**
     * Convenience method to update all three sections at once
     */
    static refreshAll(activeProfile, formReport, reportsList, baseProfile) {
        this.updateProfileStats(baseProfile, activeProfile);
        this.updateActiveReport(formReport, activeProfile ? activeProfile.rank : "");
        // Note: We usually only update history with the SAVED list, not projected
        this.updateHistory(reportsList);
    }
}