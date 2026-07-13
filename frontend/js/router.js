import Login from "./components/Login.js";
import Register from "./components/Register.js";
import AdminDashboard from "./components/AdminDashboard.js";
import AdminTreks from "./components/AdminTreks.js";
import AdminStaff from "./components/AdminStaff.js";
import AdminUsers from "./components/AdminUsers.js";
import AdminBookings from "./components/AdminBookings.js";
import AdminSearch from "./components/AdminSearch.js";
import StaffDashboard from "./components/StaffDashboard.js";
import StaffTrekDetail from "./components/StaffTrekDetail.js";
import UserDashboard from "./components/UserDashboard.js";
import UserTreks from "./components/UserTreks.js";
import UserTrekDetail from "./components/UserTrekDetail.js";
import UserBookings from "./components/UserBookings.js";
import UserHistory from "./components/UserHistory.js";
import UserProfile from "./components/UserProfile.js";
import NotFound from "./components/NotFound.js";
import { store } from "./store.js";

const routes = [
    { path: "/", redirect: "/login" },
    { path: "/login", component: Login, meta: { guest: true } },
    { path: "/register", component: Register, meta: { guest: true } },

    { path: "/admin/dashboard", component: AdminDashboard, meta: { role: "admin" } },
    { path: "/admin/treks", component: AdminTreks, meta: { role: "admin" } },
    { path: "/admin/staff", component: AdminStaff, meta: { role: "admin" } },
    { path: "/admin/users", component: AdminUsers, meta: { role: "admin" } },
    { path: "/admin/bookings", component: AdminBookings, meta: { role: "admin" } },
    { path: "/admin/search", component: AdminSearch, meta: { role: "admin" } },

    { path: "/staff/dashboard", component: StaffDashboard, meta: { role: "staff" } },
    { path: "/staff/treks/:id", component: StaffTrekDetail, meta: { role: "staff" } },

    { path: "/user/dashboard", component: UserDashboard, meta: { role: "user" } },
    { path: "/user/treks", component: UserTreks, meta: { role: "user" } },
    { path: "/user/treks/:id", component: UserTrekDetail, meta: { role: "user" } },
    { path: "/user/bookings", component: UserBookings, meta: { role: "user" } },
    { path: "/user/history", component: UserHistory, meta: { role: "user" } },
    { path: "/user/profile", component: UserProfile, meta: { role: "user" } },

    { path: "/:pathMatch(.*)*", component: NotFound },
];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHistory(),
    routes,
});

const roleHome = (role) => role === "admin" ? "/admin/dashboard" : role === "staff" ? "/staff/dashboard" : "/user/dashboard";

router.beforeEach((to) => {
    const role = store.isLoggedIn ? store.user.role : null;

    if (to.meta.guest && role) {
        return roleHome(role);
    }
    if (to.meta.role && !role) {
        return "/login";
    }
    if (to.meta.role && role !== to.meta.role) {
        return roleHome(role);
    }
    return true;
});

export default router;
