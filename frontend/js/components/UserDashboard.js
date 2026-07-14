import { api } from "../api.js";
import Navbar from "./Navbar.js";
import { store } from "../store.js";

export default {
    components: { Navbar },
    data() { return { treks: [], bookings: [] }; },
    computed: { name() { return store.user ? store.user.name : ""; } },
    async mounted() {
        const data = await api.userDashboard();
        this.treks = data.treks;
        this.bookings = data.bookings;
    },
    template: `
    <div>
      <Navbar active="dashboard" />
      <div class="container my-4">
        <h3 class="page-title mb-4">Welcome, {{ name }}!</h3>

        <h5 class="mb-3 page-title">Available Treks</h5>
        <div class="panel p-2 mb-4">
        <table class="table tk-table align-middle mb-0">
            <thead><tr><th>Name</th><th>Location</th><th>Difficulty</th><th>Duration</th><th>Slots</th><th>Action</th></tr></thead>
            <tbody>
            <tr v-for="t in treks" :key="t.id">
                <td>{{ t.name }}</td>
                <td>{{ t.location }}</td>
                <td>{{ t.difficulty }}</td>
                <td>{{ t.duration }} Days</td>
                <td>{{ t.available_slots }}</td>
                <td><router-link :to="'/user/treks/' + t.id" class="btn btn-sm btn-forest">Book Now</router-link></td>
            </tr>
            <tr v-if="!treks.length"><td colspan="6" class="text-muted text-center py-4">No treks available right now</td></tr>
            </tbody>
        </table>
        </div>

        <h5 class="mb-3 page-title">My Bookings</h5>
        <div class="panel p-2">
        <table class="table tk-table align-middle mb-0">
            <thead><tr><th>Trek</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
            <tr v-for="b in bookings" :key="b.id">
                <td>{{ b.trek_name }}</td>
                <td>{{ b.booking_date }}</td>
                <td><span class="tk-badge" :class="'tk-badge-' + b.status.toLowerCase()">{{ b.status }}</span></td>
            </tr>
            <tr v-if="!bookings.length"><td colspan="3" class="text-muted text-center py-4">No bookings yet</td></tr>
            </tbody>
        </table>
        </div>
      </div>
    </div>
    `,
};
