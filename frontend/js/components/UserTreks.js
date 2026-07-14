import { api } from "../api.js";
import Navbar from "./Navbar.js";

export default {
    components: { Navbar },
    data() { return { treks: [], difficulty: "", location: "", duration: "" }; },
    async mounted() { await this.load(); },
    methods: {
        async load() {
            this.treks = await api.treksList({ difficulty: this.difficulty, location: this.location, duration: this.duration });
        },
    },
    template: `
    <div>
      <Navbar active="treks" />
      <div class="container my-4">
        <h3 class="page-title mb-3">Browse Treks</h3>

        <div class="panel p-3 mb-3">
        <form @submit.prevent="load" class="row g-2 align-items-end">
            <div class="col-auto">
                <label>Difficulty</label>
                <select v-model="difficulty" class="form-select">
                    <option value="">All Difficulty</option>
                    <option>Easy</option><option>Moderate</option><option>Hard</option>
                </select>
            </div>
            <div class="col-auto"><label>Location</label><input v-model="location" class="form-control" placeholder="Location"></div>
            <div class="col-auto"><label>Duration (days)</label><input v-model="duration" type="number" class="form-control" placeholder="Days"></div>
            <div class="col-auto"><button type="submit" class="btn btn-forest"><i class="bi bi-funnel"></i> Filter</button></div>
        </form>
        </div>

        <div class="panel p-2">
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
            <tr v-if="!treks.length"><td colspan="6" class="text-muted text-center py-4">No treks match your filters</td></tr>
            </tbody>
        </table>
        </div>
      </div>
    </div>
    `,
};
