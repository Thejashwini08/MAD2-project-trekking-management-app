import { api } from "../api.js";
import Navbar from "./Navbar.js";

export default {
    components: { Navbar },
    data() {
        return {
            staff: [],
            showForm: false,
            form: { name: "", email: "", contact: "", password: "" },
            error: "",
        };
    },
    async mounted() { await this.load(); },
    methods: {
        async load() { this.staff = await api.adminStaffList(); },
        async addStaff() {
            this.error = "";
            try {
                await api.adminAddStaff(this.form);
                this.form = { name: "", email: "", contact: "", password: "" };
                this.showForm = false;
                await this.load();
            } catch (e) { this.error = e.message; }
        },
        async blacklist(id) { await api.adminBlacklistStaff(id); await this.load(); },
        async unblacklist(id) { await api.adminUnblacklistStaff(id); await this.load(); },
    },
    template: `
    <div>
      <Navbar active="staff" />
      <div class="container my-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="page-title mb-0">Trek Staff</h3>
            <button class="btn btn-clay" @click="showForm = !showForm"><i class="bi bi-plus-lg"></i> Add Staff</button>
        </div>

        <div class="panel p-4 mb-4" v-if="showForm">
            <h5 class="page-title mb-3">Create Staff Account</h5>
            <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
            <form @submit.prevent="addStaff">
                <div class="row">
                    <div class="col-md-6 mb-3"><label>Name</label><input v-model="form.name" class="form-control" required></div>
                    <div class="col-md-6 mb-3"><label>Email</label><input type="email" v-model="form.email" class="form-control" required></div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3"><label>Contact</label><input v-model="form.contact" class="form-control"></div>
                    <div class="col-md-6 mb-3"><label>Password</label><input type="password" v-model="form.password" class="form-control" required></div>
                </div>
                <button type="submit" class="btn btn-forest px-4">Create</button>
                <button type="button" class="btn btn-outline-secondary ms-2" @click="showForm=false">Cancel</button>
            </form>
        </div>

        <div class="panel p-2">
        <table class="table tk-table align-middle mb-0">
            <thead><tr><th>Staff ID</th><th>Name</th><th>Email</th><th>Contact</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
            <tr v-for="s in staff" :key="s.id">
                <td>#{{ s.id }}</td>
                <td>{{ s.name }}</td>
                <td>{{ s.email }}</td>
                <td>{{ s.contact }}</td>
                <td><span class="tk-badge" :class="'tk-badge-' + s.status.toLowerCase()">{{ s.status }}</span></td>
                <td>
                    <button v-if="s.status==='Blacklisted'" class="btn btn-sm btn-outline-secondary" @click="unblacklist(s.id)">Unblacklist</button>
                    <button v-else class="btn btn-sm btn-outline-danger" @click="blacklist(s.id)">Blacklist</button>
                </td>
            </tr>
            <tr v-if="!staff.length"><td colspan="6" class="text-muted text-center py-4">No staff yet</td></tr>
            </tbody>
        </table>
        </div>
      </div>
    </div>
    `,
};
