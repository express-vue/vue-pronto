import { createApp } from "./app"
            const state = window.__INITIAL_STATE__;
            const { app } = createApp(state ? state : {});
            app.$mount("#app")