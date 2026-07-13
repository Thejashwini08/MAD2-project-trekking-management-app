import { api } from "../api.js";
import { store } from "../store.js";

export default {
    props: ["active"],
    computed: {
        role() { return store.user ? store.user.role : null; },
    },
    methods: {
        async logout() {
            await api.logout();
            store.clear();
            this.$router.push("/login");
        },
    },
    template: `
    <nav class="app-nav" v-if="role">
      <div class="container d-flex align-items-center justify-content-between flex-wrap">
        <router-link class="brand" :to="role==='admin' ? '/admin/dashboard' : role==='staff' ? '/staff/dashboard' : '/user/dashboard'">
            <i class="bi bi-tree"></i> {{ role === 'admin' ? 'Trek Admin' : role === 'staff' ? 'Trek Staff' : 'Trekking' }}
        </router-link>
        <div class="d-flex flex-wrap gap-1 mt-2 mt-lg-0">
            <template v-if="role === 'admin'">
                <router-link class="nav-link" :class="{active: active==='dashboard'}" to="/admin/dashboard"><i class="bi bi-grid-1x2"></i> Dashboard</router-link>
                <router-link class="nav-link" :class="{active: active==='treks'}" to="/admin/treks"><i class="bi bi-signpost-split"></i> Treks</router-link>
                <router-link class="nav-link" :class="{active: active==='staff'}" to="/admin/staff"><i class="bi bi-person-badge"></i> Staff</router-link>
                <router-link class="nav-link" :class="{active: active==='users'}" to="/admin/users"><i class="bi bi-people"></i> Users</router-link>
                <router-link class="nav-link" :class="{active: active==='bookings'}" to="/admin/bookings"><i class="bi bi-journal-check"></i> Bookings</router-link>
                <router-link class="nav-link" :class="{active: active==='search'}" to="/admin/search"><i class="bi bi-search"></i> Search</router-link>
            </template>
            <template v-else-if="role === 'staff'">
                <router-link class="nav-link active" to="/staff/dashboard"><i class="bi bi-grid-1x2"></i> My Dashboard</router-link>
            </template>
            <template v-else-if="role === 'user'">
                <router-link class="nav-link" :class="{active: active==='dashboard'}" to="/user/dashboard"><i class="bi bi-grid-1x2"></i> Dashboard</router-link>
                <router-link class="nav-link" :class="{active: active==='treks'}" to="/user/treks"><i class="bi bi-signpost-split"></i> Browse Treks</router-link>
                <router-link class="nav-link" :class="{active: active==='bookings'}" to="/user/bookings"><i class="bi bi-journal-check"></i> My Bookings</router-link>
                <router-link class="nav-link" :class="{active: active==='history'}" to="/user/history"><i class="bi bi-clock-history"></i> History</router-link>
                <router-link class="nav-link" :class="{active: active==='profile'}" to="/user/profile"><i class="bi bi-person-circle"></i> Profile</router-link>
            </template>
            <a class="nav-link logout-link" @click="logout"><i class="bi bi-box-arrow-right"></i> Logout</a>
        </div>
      </div>
    </nav>
    `,
};
