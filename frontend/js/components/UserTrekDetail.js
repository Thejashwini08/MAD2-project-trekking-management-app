import { api } from "../api.js";
import Navbar from "./Navbar.js";

export default {
    components: { Navbar },
    data() { return { trek: null, error: "" }; },
    async mounted() { this.trek = await api.trekDetail(this.$route.params.id); },
    methods: {
        async book() {
            this.error = "";
            try {
                await api.bookTrek(this.trek.id);
                this.$router.push("/user/bookings");
            } catch (e) { this.error = e.message; }
        },
    },
    template: `
    <div>
      <Navbar active="treks" />
      <div class="container my-4" v-if="trek">
        <router-link to="/user/treks" class="text-decoration-none" style="color: var(--forest);"><i class="bi bi-arrow-left"></i> Back to Treks</router-link>

        <div class="panel p-4 mt-2" style="max-width: 600px;">
            <h3 class="page-title mb-3">{{ trek.name }}</h3>
            <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

            <p class="mb-2"><i class="bi bi-geo-alt" style="color: var(--forest);"></i> <b>Location:</b> {{ trek.location }}</p>
            <p class="mb-2"><i class="bi bi-bar-chart" style="color: var(--forest);"></i> <b>Difficulty:</b> {{ trek.difficulty }}</p>
            <p class="mb-2"><i class="bi bi-calendar-range" style="color: var(--forest);"></i> <b>Duration:</b> {{ trek.duration }} Days</p>
            <p class="mb-2"><i class="bi bi-calendar-check" style="color: var(--forest);"></i> <b>Start Date:</b> {{ trek.start_date }}</p>
            <p class="mb-2"><i class="bi bi-calendar-x" style="color: var(--forest);"></i> <b>End Date:</b> {{ trek.end_date }}</p>
            <p class="mb-2"><i class="bi bi-ticket-perforated" style="color: var(--forest);"></i> <b>Available Slots:</b> {{ trek.available_slots }}</p>
            <p class="mb-2"><i class="bi bi-info-circle" style="color: var(--forest);"></i> <b>Status:</b> {{ trek.status }}</p>
            <p class="mb-3"><b>Description:</b> {{ trek.description }}</p>

            <button class="btn btn-forest px-4" @click="book">Book Now</button>
        </div>
      </div>
    </div>
    `,
};
