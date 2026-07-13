import { api } from "../api.js";

export default {
    data() {
        return { name: "", email: "", contact: "", password: "", error: "", success: "" };
    },
    methods: {
        async submit() {
            this.error = "";
            this.success = "";
            try {
                await api.register({
                    name: this.name, email: this.email, contact: this.contact, password: this.password,
                });
                this.success = "Registration successful. Redirecting to login...";
                setTimeout(() => this.$router.push("/login"), 1200);
            } catch (e) {
                this.error = e.message;
            }
        },
    },
    template: `
    <div class="auth-wrap">
      <div class="panel auth-card p-4 p-md-5">
        <div class="text-center mb-4">
            <div class="auth-icon"><i class="bi bi-person-plus"></i></div>
            <h4 class="page-title mb-0">Create Account</h4>
            <p class="text-muted small mb-0">Join as a Trekker</p>
        </div>

        <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
        <div v-if="success" class="alert alert-success py-2 small">{{ success }}</div>

        <form @submit.prevent="submit">
            <div class="mb-3">
                <label>Full Name</label>
                <input type="text" v-model="name" class="form-control" required>
            </div>
            <div class="mb-3">
                <label>Email</label>
                <input type="email" v-model="email" class="form-control" required>
            </div>
            <div class="mb-3">
                <label>Contact</label>
                <input type="text" v-model="contact" class="form-control">
            </div>
            <div class="mb-4">
                <label>Password</label>
                <input type="password" v-model="password" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-forest w-100 py-2 fw-semibold">
                <i class="bi bi-check-circle"></i> Register
            </button>
        </form>

        <p class="text-center mt-4 mb-0 small">
            Already have an account? <router-link to="/login" style="color: var(--forest); font-weight: 600;">Login here</router-link>
        </p>
        <p class="text-center small text-muted mt-2 mb-0">Trek Staff accounts are created by Admin.</p>
      </div>
    </div>
    `,
};
