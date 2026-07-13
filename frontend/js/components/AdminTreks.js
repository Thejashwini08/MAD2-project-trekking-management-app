import { api } from "../api.js";
import Navbar from "./Navbar.js";

export default {
    components: { Navbar },
    data() {
        return {
            treks: [],
            staffList: [],
            showForm: false,
            editing: null,
            form: { name: "", location: "", difficulty: "Easy", duration: "", available_slots: "",
                     staff_id: "", status: "Pending", start_date: "", end_date: "", description: "" },
        };
    },
    async mounted() {
        await this.load();
    },
    methods: {
        async load() {
            this.treks = await api.adminTreks();
            this.staffList = await api.adminStaffList();
        },
        openAdd() {
            this.editing = null;
            this.form = { name: "", location: "", difficulty: "Easy", duration: "", available_slots: "",
                          staff_id: "", status: "Pending", start_date: "", end_date: "", description: "" };
            this.showForm = true;
        },
        openEdit(trek) {
            this.editing = trek.id;
            this.form = { ...trek, staff_id: trek.staff_id || "" };
            this.showForm = true;
        },
        async save() {
            if (this.editing) {
                await api.adminUpdateTrek(this.editing, this.form);
            } else {
                await api.adminAddTrek(this.form);
            }
            this.showForm = false;
            await this.load();
        },
        async remove(id) {
            await api.adminDeleteTrek(id);
            await this.load();
        },
    },
    template: `
    <div>
      <Navbar active="treks" />
      <div class="container my-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="page-title mb-0">Manage Treks</h3>
            <button class="btn btn-clay" @click="openAdd"><i class="bi bi-plus-lg"></i> Add New Trek</button>
        </div>

        <div class="panel p-4 mb-4" v-if="showForm">
            <h5 class="page-title mb-3">{{ editing ? 'Edit Trek' : 'Add New Trek' }}</h5>
            <form @submit.prevent="save">
                <div class="row">
                    <div class="col-md-6 mb-3"><label>Trek Name</label><input v-model="form.name" class="form-control" required></div>
                    <div class="col-md-6 mb-3"><label>Location</label><input v-model="form.location" class="form-control" required></div>
                </div>
                <div class="row">
                    <div class="col-md-4 mb-3"><label>Difficulty</label>
                        <select v-model="form.difficulty" class="form-select">
                            <option>Easy</option><option>Moderate</option><option>Hard</option>
                        </select>
                    </div>
                    <div class="col-md-4 mb-3"><label>Duration (Days)</label><input type="number" v-model="form.duration" class="form-control" required></div>
                    <div class="col-md-4 mb-3"><label>Available Slots</label><input type="number" v-model="form.available_slots" class="form-control" required></div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3"><label>Assign Staff</label>
                        <select v-model="form.staff_id" class="form-select">
                            <option value="">-- None --</option>
                            <option v-for="s in staffList" :key="s.id" :value="s.id">{{ s.name }} (ID: {{ s.id }})</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3"><label>Status</label>
                        <select v-model="form.status" class="form-select">
                            <option v-for="st in ['Pending','Open','Closed','Completed']" :key="st">{{ st }}</option>
                        </select>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3"><label>Start Date</label><input type="date" v-model="form.start_date" class="form-control" required></div>
                    <div class="col-md-6 mb-3"><label>End Date</label><input type="date" v-model="form.end_date" class="form-control" required></div>
                </div>
                <div class="mb-3"><label>Description</label><textarea v-model="form.description" class="form-control" rows="3"></textarea></div>
                <button type="submit" class="btn btn-forest px-4">Save Trek</button>
                <button type="button" class="btn btn-outline-secondary ms-2" @click="showForm=false">Cancel</button>
            </form>
        </div>

        <div class="panel p-2">
        <table class="table tk-table align-middle mb-0">
            <thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Difficulty</th><th>Slots</th><th>Status</th><th>Staff ID</th><th>Actions</th></tr></thead>
            <tbody>
            <tr v-for="t in treks" :key="t.id">
                <td>#{{ t.id }}</td>
                <td>{{ t.name }}</td>
                <td>{{ t.location }}</td>
                <td>{{ t.difficulty }}</td>
                <td>{{ t.available_slots }}</td>
                <td><span class="tk-badge" :class="'tk-badge-' + t.status.toLowerCase()">{{ t.status }}</span></td>
                <td>{{ t.staff_id || '-' }}</td>
                <td>
                    <button class="btn btn-sm btn-outline-forest" @click="openEdit(t)"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" @click="remove(t.id)"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
            <tr v-if="!treks.length"><td colspan="8" class="text-muted text-center py-4">No treks added yet</td></tr>
            </tbody>
        </table>
        </div>
      </div>
    </div>
    `,
};
