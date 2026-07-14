import { api } from "../api.js";
import Navbar from "./Navbar.js";

export default {
    components: { Navbar },
    data() {
        return { history: [], exporting: false, exportMsg: "", pollTimer: null, downloadUrl: null };
    },
    async mounted() { this.history = await api.bookingHistory(); },
    beforeUnmount() {
        // Prevent the polling interval from running forever in the background
        // if the user navigates away before the export finishes.
        if (this.pollTimer) clearInterval(this.pollTimer);
    },
    methods: {
        async exportCsv() {
            this.exporting = true;
            this.exportMsg = "Export job queued...";
            this.downloadUrl = null;
            try {
                const { task_id } = await api.triggerExport();
                this.pollStatus(task_id);
            } catch (e) {
                this.exporting = false;
                this.exportMsg = e.message;
            }
        },
        pollStatus(taskId) {
            const maxAttempts = 40; // ~60 seconds at 1.5s intervals
            let attempts = 0;

            this.pollTimer = setInterval(async () => {
                attempts++;

                if (attempts > maxAttempts) {
                    clearInterval(this.pollTimer);
                    this.pollTimer = null;
                    this.exporting = false;
                    this.exportMsg = "Export is taking longer than expected. Is the Celery worker running?";
                    return;
                }

                let result;
                try {
                    result = await api.exportStatus(taskId);
                } catch (e) {
                    clearInterval(this.pollTimer);
                    this.pollTimer = null;
                    this.exporting = false;
                    this.exportMsg = "Export failed: " + e.message;
                    return;
                }

                if (result.state === "SUCCESS") {
                    clearInterval(this.pollTimer);
                    this.pollTimer = null;
                    this.exporting = false;
                    this.exportMsg = "";
                    // NOTE: we deliberately do NOT call window.open() here. Browsers treat
                    // window.open() calls made from an async callback (like this setInterval
                    // poll) as a popup, not a direct result of the user's click, and silently
                    // block it - the task succeeds on the backend but nothing visibly happens.
                    // Showing a real link/button for the user to click instead always works,
                    // since that click is a genuine user gesture.
                    this.downloadUrl = `/api/user/export/download/${result.filename}`;
                    window.alert("Your booking history CSV is ready! Click the download button below.");
                } else if (result.state === "FAILURE") {
                    clearInterval(this.pollTimer);
                    this.pollTimer = null;
                    this.exporting = false;
                    this.exportMsg = "Export failed: " + (result.error || "unknown error");
                } else {
                    this.exportMsg = "Processing export...";
                }
            }, 1500);
        },
    },
    template: `
    <div>
      <Navbar active="history" />
      <div class="container my-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="page-title mb-0">Trekking History</h3>
            <button class="btn btn-clay" @click="exportCsv" :disabled="exporting">
                <i class="bi bi-download"></i> {{ exporting ? 'Exporting...' : 'Export as CSV' }}
            </button>
        </div>
        <p v-if="exportMsg" class="small text-muted">{{ exportMsg }}</p>
        <div v-if="downloadUrl" class="alert alert-success d-flex justify-content-between align-items-center">
            <span><i class="bi bi-check-circle"></i> Your CSV export is ready.</span>
            <a :href="downloadUrl" target="_blank" class="btn btn-sm btn-forest"><i class="bi bi-download"></i> Download CSV</a>
        </div>
        <p class="small text-muted">Export runs as a background job via Celery; requires Redis + a Celery worker running.</p>

        <div class="panel p-2">
        <table class="table tk-table align-middle mb-0">
            <thead><tr><th>Trek Name</th><th>Trek Dates</th><th>Status</th></tr></thead>
            <tbody>
            <tr v-for="h in history" :key="h.id">
                <td>{{ h.trek_name }}</td>
                <td>{{ h.trek_start_date }} - {{ h.trek_end_date }}</td>
                <td><span class="tk-badge tk-badge-completed">{{ h.status }}</span></td>
            </tr>
            <tr v-if="!history.length"><td colspan="3" class="text-muted text-center py-4">No completed treks yet</td></tr>
            </tbody>
        </table>
        </div>
      </div>
    </div>
    `,
};
