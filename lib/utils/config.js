const merge = require("webpack-merge");
const {VueLoaderPlugin} = require("vue-loader");

/**
 * @typedef BootstrapType
 * @prop {import("webpack").Configuration} server
 * @prop {import("webpack").Configuration} client
 */

/**
 *
 * @param {Object} serverConfig
 * @param {Object} clientConfig
 * @param {"development"|"production"} [mode]
 * @returns {BootstrapType}
 */
module.exports.bootstrap = function bootstrap(serverConfig, clientConfig, mode) {
    const server = merge.smart({
        entry: "./src/entry-server.js",
        mode: mode,
        target: "node",
        output: {
            filename: "server.js",
            libraryTarget: "commonjs2",
        },
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: "vue-loader",
                },
                {
                    test: /\.js$/,
                    loader: "babel-loader",
                },
                {
                    test: /\.css$/,
                    use: [
                        "vue-style-loader",
                        "css-loader",
                    ],
                },
            ],
        },
        resolve: {
            extensions: [
                ".js",
                ".vue",
            ],
        },
        plugins: [
            new VueLoaderPlugin(),
        ],
}, serverConfig);

    const client = merge.smart({
        entry: "./src/entry-client.js",
        output: {
            filename: "client.js",
        },
        mode: mode,
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: "vue-loader",
                },
                {
                    test: /\.js$/,
                    loader: "babel-loader",
                },
                {
                    test: /\.css$/,
                    use: [
                        "vue-style-loader",
                        "css-loader",
                    ],
                },
            ],
        },
        resolve: {
            extensions: [
                ".js",
                ".vue",
            ],
        },
        plugins: [
            new VueLoaderPlugin(),
        ],
}, clientConfig);

    return {
        server,
       client,
    };
};

/**
 * @param {String} filePath
 * @param {{app:string, client:string}} config
 * @returns {{app:string, server:string, client:string}}
 */
module.exports.appConfig = function appConfig(filePath, config) {
    if (config && config.app && config.client) {
        return {
            app: config.app,
            server: config.app,
            client: config.client,
        };
    }

    const app = `import Vue from "vue";
import App from ${JSON.stringify(filePath)};

export function createApp(data) {
    const mergedData = Object.assign(App.data ? App.data() : {}, data);
    App.data = () => (mergedData)
 
    const app = new Vue({
        data,
        render: h => h(App),
    });
    return { app };
}`;

    const server = `import { createApp } from "./app";
export default context => {
    return new Promise((resolve, reject) => {
        const { app } = createApp(context);
        resolve(app);
    });
};`;


    const client = `import { createApp } from "./app";
const store = window.__INITIAL_STATE__;
const { app } = createApp(store ? store : {});
app.$mount("#app");
`;

    return {
        app,
        server,
        client,
    }
};

