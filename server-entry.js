import Vue from "vue";
import App from "/Users/danielcherubini/Coding/Express-Vue/vue-pronto/tests/example/views/index/index.vue";

export function createApp() {
    const app = new Vue({
        render: h => h(App),
    });
    return { app };
}
