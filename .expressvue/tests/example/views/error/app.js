import Vue from "vue";
            import App from "/Users/danielcherubini/Coding/Express-Vue/vue-pronto/tests/example/views/error.vue";
            export function createApp (state) {
                const app = new Vue({
                    render: h => h(App, {props: state})
                })
                return { app }
            }