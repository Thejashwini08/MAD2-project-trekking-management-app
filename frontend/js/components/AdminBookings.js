import { api } from "../api.js";
import Navbar from "./Navbar.js";

export default {
    components: { Navbar },
    data() { return { bookings: [] }; },
    async mounted() { this.bookings = await api.adminBookings(); },
    template: `
    <div>
      <Navbar active="bookings" />
      <div class="container my-4">
        <h3 class="page-title mb-3">All Bookings</h3>
        <div class="panel p-2">
        <table class="table tk-table align-middle mb-0">
            <thead><tr><th>Booking ID</th><th>User</th><th>Trek</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
            <tr v-for="b in bookings" :key="b.id">
                <td>#{{ b.id }}</td>
                <td>{{ b.user_name }}</td>
                <td>{{ b.trek_name }}</td>
                <td>{{ b.booking_date }}</td>
                <td><span class="tk-badge" :class="'tk-badge-' + b.status.toLowerCase()">{{ b.status }}</span></td>
            </tr>
            <tr v-if="!bookings.length"><td colspan="5" class="text-muted text-center py-4">No bookings yet</td></tr>
            </tbody>
        </table>
        </div>
      </div>
    </div>
    `,
};
