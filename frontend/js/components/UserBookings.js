import { api } from "../api.js";
import Navbar from "./Navbar.js";

export default {
    components: { Navbar },
    data() { return { bookings: [] }; },
    async mounted() { await this.load(); },
    methods: {
        async load() { this.bookings = await api.myBookings(); },
        async cancel(id) { await api.cancelBooking(id); await this.load(); },
    },
    template: `
    <div>
      <Navbar active="bookings" />
      <div class="container my-4">
        <h3 class="page-title mb-3">My Bookings</h3>
        <div class="panel p-2">
        <table class="table tk-table align-middle mb-0">
            <thead><tr><th>Trek Name</th><th>Booking Date</th><th>Trek Dates</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
            <tr v-for="b in bookings" :key="b.id">
                <td>{{ b.trek_name }}</td>
                <td>{{ b.booking_date }}</td>
                <td>{{ b.trek_start_date }} - {{ b.trek_end_date }}</td>
                <td><span class="tk-badge" :class="'tk-badge-' + b.status.toLowerCase()">{{ b.status }}</span></td>
                <td><button v-if="b.status==='Booked'" class="btn btn-sm btn-outline-danger" @click="cancel(b.id)">Cancel</button></td>
            </tr>
            <tr v-if="!bookings.length"><td colspan="5" class="text-muted text-center py-4">No bookings yet</td></tr>
            </tbody>
        </table>
        </div>
      </div>
    </div>
    `,
};
