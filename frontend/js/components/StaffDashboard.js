import { api } from "../api.js";
import Navbar from "./Navbar.js";

export default {
    components: { Navbar },
    data() { return { treks: [], total_participants: 0, open_treks: 0 }; },
    async mounted() {
        const data = await api.staffDashboard();
        this.treks = data.treks;
        this.total_participants = data.total_participants;
        this.open_treks = data.open_treks;
    },
    template: `
    <div>
      <Navbar />
      <div class="container my-4">
        <h3 class="page-title mb-4">My Dashboard</h3>
        <div class="row g-3">
            <div class="col-md-4">
                <div class="stat-tile">
                    <div class="stat-icon" style="background:#e3f3ea;"><i class="bi bi-signpost-split text-success"></i></div>
                    <div class="stat-value">{{ treks.length }}</div>
                    <div class="stat-label">Assigned Treks</div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-tile">
                    <div class="stat-icon" style="background:#e0f2fa;"><i class="bi bi-people" style="color:#1971a3;"></i></div>
                    <div class="stat-value">{{ total_participants }}</div>
                    <div class="stat-label">Total Participants</div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-tile">
                    <div class="stat-icon" style="background:#fdf1de;"><i class="bi bi-door-open" style="color:#b5762b;"></i></div>
                    <div class="stat-value">{{ open_treks }}</div>
                    <div class="stat-label">Open Treks</div>
                </div>
            </div>
        </div>

        <h5 class="mt-4 mb-3 page-title">My Assigned Treks</h5>
        <div class="panel p-2">
        <table class="table tk-table align-middle mb-0">
            <thead><tr><th>Trek Name</th><th>Location</th><th>Slots</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
            <tr v-for="t in treks" :key="t.id">
                <td>{{ t.name }}</td>
                <td>{{ t.location }}</td>
                <td>{{ t.available_slots }}</td>
                <td><span class="tk-badge" :class="'tk-badge-' + t.status.toLowerCase()">{{ t.status }}</span></td>
                <td><router-link :to="'/staff/treks/' + t.id" class="btn btn-sm btn-forest">Manage</router-link></td>
            </tr>
            <tr v-if="!treks.length"><td colspan="5" class="text-muted text-center py-4">No treks assigned yet</td></tr>
            </tbody>
        </table>
        </div>
      </div>
    </div>
    `,
};
