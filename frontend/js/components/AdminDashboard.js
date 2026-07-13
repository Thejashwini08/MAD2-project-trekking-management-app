import { api } from "../api.js";
import Navbar from "./Navbar.js";

export default {
    components: { Navbar },
    data() {
        return { stats: null };
    },
    async mounted() {
        this.stats = await api.adminDashboard();
    },
    template: `
    <div>
      <Navbar active="dashboard" />
      <div class="container my-4" v-if="stats">
        <h3 class="page-title mb-4">Dashboard</h3>
        <div class="row g-3">
            <div class="col-md-3">
                <div class="stat-tile">
                    <div class="stat-icon" style="background:#e3f3ea;"><i class="bi bi-signpost-split text-success"></i></div>
                    <div class="stat-value">{{ stats.total_treks }}</div>
                    <div class="stat-label">Total Treks</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-tile">
                    <div class="stat-icon" style="background:#e0f2fa;"><i class="bi bi-people" style="color:#1971a3;"></i></div>
                    <div class="stat-value">{{ stats.total_users }}</div>
                    <div class="stat-label">Total Users</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-tile">
                    <div class="stat-icon" style="background:#fdf1de;"><i class="bi bi-person-badge" style="color:#b5762b;"></i></div>
                    <div class="stat-value">{{ stats.total_staff }}</div>
                    <div class="stat-label">Total Staff</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-tile">
                    <div class="stat-icon" style="background:#e4e9ff;"><i class="bi bi-journal-check" style="color:#3949ab;"></i></div>
                    <div class="stat-value">{{ stats.total_bookings }}</div>
                    <div class="stat-label">Total Bookings</div>
                </div>
            </div>
        </div>

        <h5 class="mt-4 mb-3 page-title">Recent Bookings</h5>
        <div class="panel p-2">
        <table class="table tk-table mb-0">
            <thead><tr><th>ID</th><th>User</th><th>Trek</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
            <tr v-for="b in stats.recent_bookings" :key="b.id">
                <td>#{{ b.id }}</td>
                <td>{{ b.user_name }}</td>
                <td>{{ b.trek_name }}</td>
                <td>{{ b.booking_date }}</td>
                <td><span class="tk-badge" :class="'tk-badge-' + b.status.toLowerCase()">{{ b.status }}</span></td>
            </tr>
            <tr v-if="!stats.recent_bookings.length"><td colspan="5" class="text-muted text-center py-4">No bookings yet</td></tr>
            </tbody>
        </table>
        </div>
      </div>
    </div>
    `,
};
