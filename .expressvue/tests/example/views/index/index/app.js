import Vue from "vue";
            import App from "/Users/danielcherubini/Coding/Express-Vue/vue-pronto/tests/example/views/index/index.vue";

            export function createApp (data) {
                const app = new Vue({
                    data,
                    render: h => h(App)
                })
                return { app }
            }