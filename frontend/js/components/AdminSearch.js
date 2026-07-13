import { api } from "../api.js";
import Navbar from "./Navbar.js";

export default {
    components: { Navbar },
    data() { return { searchType: "treks", query: "", results: [] }; },
    methods: {
        async search() {
            this.results = await api.adminSearch(this.searchType, this.query);
        },
    },
    template: `
    <div>
      <Navbar active="search" />
      <div class="container my-4">
        <h3 class="page-title mb-3">Search</h3>
        <div class="panel p-3 mb-3">
        <form @submit.prevent="search" class="row g-2 align-items-end">
            <div class="col-auto">
                <label>Search In</label>
                <select v-model="searchType" class="form-select">
                    <option value="treks">Treks</option>
                    <option value="staff">Staff</option>
                    <option value="users">Users</option>
                </select>
            </div>
            <div class="col-auto">
                <label>Keyword</label>
                <input v-model="query" class="form-control" placeholder="Name or ID">
            </div>
            <div class="col-auto">
                <button type="submit" class="btn btn-forest"><i class="bi bi-search"></i> Search</button>
            </div>
        </form>
        </div>

        <div class="panel p-2">
        <table class="table tk-table align-middle mb-0" v-if="searchType==='treks'">
            <thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Difficulty</th><th>Status</th></tr></thead>
            <tbody>
            <tr v-for="r in results" :key="r.id"><td>#{{ r.id }}</td><td>{{ r.name }}</td><td>{{ r.location }}</td><td>{{ r.difficulty }}</td><td>{{ r.status }}</td></tr>
            <tr v-if="!results.length"><td colspan="5" class="text-muted text-center py-4">No results found</td></tr>
            </tbody>
        </table>
        <table class="table tk-table align-middle mb-0" v-else>
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th></tr></thead>
            <tbody>
            <tr v-for="r in results" :key="r.id"><td>#{{ r.id }}</td><td>{{ r.name }}</td><td>{{ r.email }}</td><td>{{ r.status }}</td></tr>
            <tr v-if="!results.length"><td colspan="4" class="text-muted text-center py-4">No results found</td></tr>
            </tbody>
        </table>
        </div>
      </div>
    </div>
    `,
};
