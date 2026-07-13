import { api } from "../api.js";
import { store } from "../store.js";

export default {
    data() {
        return { email: "", password: "", error: "" };
    },
    methods: {
        async submit() {
            this.error = "";
            try {
                const { user } = await api.login(this.email, this.password);
                store.setUser(user);
                if (user.role === "admin") this.$router.push("/admin/dashboard");
                else if (user.role === "staff") this.$router.push("/staff/dashboard");
                else this.$router.push("/user/dashboard");
            } catch (e) {
                this.error = e.message;
            }
        },
    },
    template: `
    <div class="auth-wrap">
      <div class="panel auth-card p-4 p-md-5">
        <div class="text-center mb-4">
            <div class="auth-icon"><i class="bi bi-tree"></i></div>
            <h4 class="page-title mb-0">Trekking Management</h4>
            <p class="text-muted small mb-0">Welcome back, adventurer</p>
        </div>

        <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

        <form @submit.prevent="submit">
            <div class="mb-3">
                <label>Email</label>
                <input type="email" v-model="email" class="form-control" placeholder="you@example.com" required>
            </div>
            <div class="mb-4">
                <label>Password</label>
                <input type="password" v-model="password" class="form-control" placeholder="********" required>
            </div>
            <button type="submit" class="btn btn-forest w-100 py-2 fw-semibold">
                <i class="bi bi-box-arrow-in-right"></i> Login
            </button>
        </form>

        <p class="text-center mt-4 mb-0 small">
            New trekker? <router-link to="/register" style="color: var(--forest); font-weight: 600;">Register here</router-link>
        </p>
      </div>
    </div>
    `,
};
