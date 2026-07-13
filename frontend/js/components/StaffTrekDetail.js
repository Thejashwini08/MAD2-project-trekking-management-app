import { api } from "../api.js";
import Navbar from "./Navbar.js";

export default {
    components: { Navbar },
    data() { return { trek: null, participants: [], form: { available_slots: 0, status: "" } }; },
    async mounted() { await this.load(); },
    methods: {
        async load() {
            const data = await api.staffTrekDetail(this.$route.params.id);
            this.trek = data.trek;
            this.participants = data.participants;
            this.form.available_slots = this.trek.available_slots;
            this.form.status = this.trek.status;
        },
        async update() {
            await api.staffUpdateTrek(this.trek.id, this.form);
            await this.load();
        },
    },
    template: `
    <div>
      <Navbar />
      <div class="container my-4" v-if="trek">
        <router-link to="/staff/dashboard" class="text-decoration-none" style="color: var(--forest);"><i class="bi bi-arrow-left"></i> Back to Dashboard</router-link>
        <h3 class="page-title mt-2 mb-3">{{ trek.name }}</h3>

        <div class="row g-3">
            <div class="col-md-6">
                <div class="panel p-3 h-100">
                    <p class="mb-2"><i class="bi bi-geo-alt" style="color: var(--forest);"></i> <b>Location:</b> {{ trek.location }}</p>
                    <p class="mb-2"><i class="bi bi-calendar-range" style="color: var(--forest);"></i> <b>Duration:</b> {{ trek.duration }} Days</p>
                    <p class="mb-2"><i class="bi bi-calendar-check" style="color: var(--forest);"></i> <b>Start Date:</b> {{ trek.start_date }}</p>
                    <p class="mb-0"><i class="bi bi-calendar-x" style="color: var(--forest);"></i> <b>End Date:</b> {{ trek.end_date }}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="panel p-3">
                <form @submit.prevent="update">
                    <div class="mb-3"><label>Available Slots</label><input type="number" v-model="form.available_slots" class="form-control"></div>
                    <div class="mb-3"><label>Status</label>
                        <select v-model="form.status" class="form-select">
                            <option v-for="st in ['Pending','Open','Closed','Completed']" :key="st">{{ st }}</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-forest px-4">Update Trek</button>
                </form>
                </div>
            </div>
        </div>

        <h5 class="mt-4 mb-3 page-title">Participants</h5>
        <div class="panel p-2">
        <table class="table tk-table align-middle mb-0">
            <thead><tr><th>Name</th><th>Email</th><th>Booking Date</th><th>Status</th></tr></thead>
            <tbody>
            <tr v-for="p in participants" :key="p.id">
                <td>{{ p.name }}</td>
                <td>{{ p.email }}</td>
                <td>{{ p.booking_date }}</td>
                <td><span class="tk-badge" :class="'tk-badge-' + p.status.toLowerCase()">{{ p.status }}</span></td>
            </tr>
            <tr v-if="!participants.length"><td colspan="4" class="text-muted text-center py-4">No participants yet</td></tr>
            </tbody>
        </table>
        </div>
      </div>
    </div>
    `,
};
