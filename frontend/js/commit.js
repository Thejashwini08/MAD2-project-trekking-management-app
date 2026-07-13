const { reactive } = Vue;

export const store = reactive({
    user: null,
    isLoggedIn: false,
    setUser(user) {
        this.user = user;
        this.isLoggedIn = !!user;
    },
    clear() {
        this.user = null;
        this.isLoggedIn = false;
    },
});
