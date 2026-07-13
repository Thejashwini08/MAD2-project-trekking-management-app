import { api } from "../api.js";
import Navbar from "./Navbar.js";

export default {
    components: { Navbar },
    data() { return { users: [] }; },
    async mounted() { await this.load(); },
    methods: {
        async load() { this.users = await api.adminUsersList(); },
        async blacklist(id) { await api.adminBlacklistUser(id); await this.load(); },
        async unblacklist(id) { await api.adminUnblacklistUser(id); await this.load(); },
    },
    template: `
    <div>
      <Navbar active="users" />
      <div class="container my-4">
        <h3 class="page-title mb-3">Users</h3>
        <div class="panel p-2">
        <table class="table tk-table align-middle mb-0">
            <thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Contact</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
            <tr v-for="u in users" :key="u.id">
                <td>#{{ u.id }}</td>
                <td>{{ u.name }}</td>
                <td>{{ u.email }}</td>
                <td>{{ u.contact }}</td>
                <td><span class="tk-badge" :class="'tk-badge-' + u.status.toLowerCase()">{{ u.status }}</span></td>
                <td>
                    <button v-if="u.status==='Blacklisted'" class="btn btn-sm btn-outline-secondary" @click="unblacklist(u.id)">Unblacklist</button>
                    <button v-else class="btn btn-sm btn-outline-danger" @click="blacklist(u.id)">Blacklist</button>
                </td>
            </tr>
            <tr v-if="!users.length"><td colspan="6" class="text-muted text-center py-4">No users yet</td></tr>
            </tbody>
        </table>
        </div>
      </div>
    </div>
    `,
};
