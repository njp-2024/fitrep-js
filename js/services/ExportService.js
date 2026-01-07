// js/services/ExportService.js
import { store } from '../state/Store.js';

export class ExportService {

    /**
     * Generates the full session summary string.
     */
    static generateSessionSummary() {
        const activeProfile = store.getActiveProfile();
        // Fallback if originalProfile isn't set yet (handles fresh loads)
        const startProfile = store.getOriginalProfile(); 
        const reports = store.getReports() || [];
        const dateStr = new Date().toLocaleString('en-US', { hour12: false }).replace(',', '');

        if (!activeProfile || !startProfile) return "No data to display...";

        // 1. HEADER
        let output = `FITREP SESSION SUMMARY\n`;
        output += `Generated: ${dateStr}\n`;
        output += `==================================================\n\n`;

        // 2. RS PROFILE DATA TABLE
        output += `[ RS PROFILE DATA ]\n`;
        output += `--------------------------------------------------\n\n`;
        
        // Column Headers (Aligned with tabs/spaces)
        output += `\t\tHIGH\tLOW\tAVG\tNUM RPTS\n`;
        output += `---------\t-----\t-----\t-----\t--------\n`;

        // Row 1: STARTING
        // Note: If your Profile object doesn't track High/Low, we use placeholders or 0.00
        output += `STARTING\t${(startProfile.high || 0).toFixed(2)}\t${(startProfile.low || 0).toFixed(2)}\t${startProfile.avg.toFixed(2)}\t${startProfile.reports}\n`;
        
        // Row 2: WORKING (Active)
        output += `WORKING \t${(activeProfile.high || 0).toFixed(2)}\t${(activeProfile.low || 0).toFixed(2)}\t${activeProfile.avg.toFixed(2)}\t${activeProfile.reports}\n\n`;

        output += `==================================================\n\n`;

        // 3. PROCESSED REPORTS
        output += `[ PROCESSED REPORTS (${reports.length}) ]\n`;
        output += `==================================================\n\n`;

        reports.forEach((rpt, index) => {
            output += `${index + 1}. ${rpt.rank.toUpperCase()} ${rpt.name.toUpperCase()}\n`;
            output += `   -----------------------------------------------\n`;
            
            // Stats Line
            output += `   STATS:  Avg: ${rpt.average.toFixed(2)}  |  RV (Proc): ${rpt.rv_proc.toFixed(2)}  |  RV (Cum): ${rpt.rv_cum.toFixed(2)}\n`;
            
            // Scores Line (Convert numbers to letters)
            const letterScores = this.convertScoresToLetters(rpt.scores);
            output += `   SCORES: ${letterScores}\n`;
            
            // Status
            const savedTime = rpt.lastSavedTime || "Unsaved";
            output += `   STATUS: Saved (${savedTime})\n   \n`;

            // Inputs
            const bullets = rpt.accomplishments ? rpt.accomplishments.trim().split('\n') : [];
            output += `   > INPUTS (ACCOMPLISHMENTS):\n`;
            if (bullets.length > 0) {
                bullets.forEach(b => output += `     - ${b}\n`);
            } else {
                output += `     (None provided)\n`;
            }
            output += `\n`;

            output += `   > INPUTS (CONTEXT):\n`;
            output += `     ${rpt.context ? rpt.context.trim() : "(None provided)"}\n\n`;

            // Narrative
            output += `   > NARRATIVE DRAFT:\n`;
            // Indent the narrative text for readability
            const narLines = (rpt.generatedNarrative || "").split('\n');
            narLines.forEach(line => {
                output += `     ${line}\n`;
            });

            output += `\n   -----------------------------------------------\n\n`;
        });

        return output;
    }

    /**
     * Converts numeric array [5, 5, 4...] to string "EE D..."
     * Mapping: 1=A, 2=B, 3=C, 4=D, 5=E, 6=F, 7=G
     */
    static convertScoresToLetters(scores) {
        if (!scores || scores.length === 0 || scores.length != 14) return "N/A";
        const map = ["H", "A", "B", "C", "D", "E", "F", "G"];

        const missionAcc = scores.slice(0, 2).map(s => map[s] || "?").join("");
        const character  = scores.slice(2, 5).map(s => map[s] || "?").join("");
        const leadership = scores.slice(5, 10).map(s => map[s] || "?").join("");
        const intellect  = scores.slice(10, 13).map(s => map[s] || "?").join("");
        const reports    = map[scores[13]] || "?"; 

        return [missionAcc, character, leadership, intellect, reports].join(" ");
    }

    /**
     * Trigger browser download of text file
     */
    static downloadTextFile(filename, content) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}