const BASE = "/api";

async function request(path, options = {}) {
    const res = await fetch(BASE + path, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || "Request failed");
    }
    return data;
}

export const api = {
    // Auth
    login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request("/auth/me"),

    // Admin
    adminDashboard: () => request("/admin/dashboard"),
    adminTreks: () => request("/admin/treks"),
    adminAddTrek: (payload) => request("/admin/treks", { method: "POST", body: JSON.stringify(payload) }),
    adminUpdateTrek: (id, payload) => request(`/admin/treks/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    adminDeleteTrek: (id) => request(`/admin/treks/${id}`, { method: "DELETE" }),
    adminStaffList: () => request("/admin/staff"),
    adminAddStaff: (payload) => request("/admin/staff", { method: "POST", body: JSON.stringify(payload) }),
    adminBlacklistStaff: (id) => request(`/admin/staff/${id}/blacklist`, { method: "PUT" }),
    adminUnblacklistStaff: (id) => request(`/admin/staff/${id}/unblacklist`, { method: "PUT" }),
    adminUsersList: () => request("/admin/users"),
    adminBlacklistUser: (id) => request(`/admin/users/${id}/blacklist`, { method: "PUT" }),
    adminUnblacklistUser: (id) => request(`/admin/users/${id}/unblacklist`, { method: "PUT" }),
    adminBookings: () => request("/admin/bookings"),
    adminSearch: (type, q) => request(`/admin/search?type=${type}&q=${encodeURIComponent(q)}`),

    // Staff
    staffDashboard: () => request("/staff/dashboard"),
    staffTrekDetail: (id) => request(`/staff/treks/${id}`),
    staffUpdateTrek: (id, payload) => request(`/staff/treks/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

    // Public trek browsing (logged-in users)
    treksList: (params = {}) => {
        const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
        const qs = new URLSearchParams(clean).toString();
        return request(`/treks${qs ? "?" + qs : ""}`);
    },
    trekDetail: (id) => request(`/treks/${id}`),

    // Bookings
    bookTrek: (trekId) => request("/bookings", { method: "POST", body: JSON.stringify({ trek_id: trekId }) }),
    myBookings: () => request("/bookings"),
    cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: "PUT" }),
    bookingHistory: () => request("/bookings/history"),

    // User
    userDashboard: () => request("/user/dashboard"),
    userProfile: () => request("/user/profile"),
    updateProfile: (payload) => request("/user/profile", { method: "PUT", body: JSON.stringify(payload) }),
    triggerExport: () => request("/user/export", { method: "POST" }),
    exportStatus: (taskId) => request(`/user/export/status/${taskId}`),
};
