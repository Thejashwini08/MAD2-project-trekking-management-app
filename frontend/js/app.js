import router from "./router.js";
import { api } from "./api.js";
import { store } from "./store.js";

const { createApp } = Vue;

async function bootstrap() {
    try {
        const { user } = await api.me();
        if (user) store.setUser(user);
    } catch (e) {
        // not logged in - fine, router guards handle redirect to /login
    }

    const app = createApp({
        template: `<router-view />`,
    });
    app.use(router);
    app.mount("#app");
}

bootstrap();
