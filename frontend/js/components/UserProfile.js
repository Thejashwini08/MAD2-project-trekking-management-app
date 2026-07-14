import { api } from "../api.js";
import Navbar from "./Navbar.js";
import { store } from "../store.js";

export default {
    components: { Navbar },
    data() { return { user: null, saved: false }; },
    async mounted() { this.user = await api.userProfile(); },
    methods: {
        async save() {
            const updated = await api.updateProfile({ name: this.user.name, contact: this.user.contact });
            store.setUser(updated);
            this.saved = true;
            setTimeout(() => this.saved = false, 2000);
        },
    },
    template: `
    <div>
      <Navbar active="profile" />
      <div class="container my-4" v-if="user">
        <h3 class="page-title mb-3">My Profile</h3>
        <div class="panel p-4" style="max-width: 460px;">
        <div v-if="saved" class="alert alert-success py-2 small">Profile updated!</div>
        <form @submit.prevent="save">
            <div class="mb-3"><label>Name</label><input v-model="user.name" class="form-control"></div>
            <div class="mb-3"><label>Email</label><input :value="user.email" class="form-control" disabled></div>
            <div class="mb-3"><label>Contact</label><input v-model="user.contact" class="form-control"></div>
            <button type="submit" class="btn btn-forest px-4">Save Changes</button>
        </form>
        </div>
      </div>
    </div>
    `,
};
