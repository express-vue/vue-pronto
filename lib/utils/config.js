const merge = require("webpack-merge");
const {VueLoaderPlugin} = require("vue-loader");

/**
 *
 * @param {Object} serverConfig
 * @param {Object} clientConfig
 * @param {"development"|"production"} [mode]
 * @returns {{server: import("webpack").Configuration, client: import("webpack").Configuration}}
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
 * @param {String} config
 * @returns {String}
 */
module.exports.appConfig = function appConfig(filePath, config) {
    if (config) {
        return config;
    }
    return `import Vue from "vue";
import App from "${filePath}";

export function createApp(data) {
    const app = new Vue({
        data,
        render: h => h(App),
    });
    return { app };
}
`;
};

/**
 * @param {String} config
 * @returns {String}
 */
module.exports.serverConfig = function serverConfig(config) {
    if (config) {
        return config;
    }
    return `import { createApp } from "./app";
export default context => {
    return new Promise((resolve, reject) => {
        const { app } = createApp(context);

        resolve(app);
    });
};
`;
};

/**
 * @param {String} config
 * @returns {String}
 */
module.exports.clientConfig = function clientConfig(config) {
    if (config) {
        return config;
    }
    return `import { createApp } from "./app";
const store = window.__INITIAL_STATE__;
const { app } = createApp(store ? store : {});
app.$mount("#app", true);
`;
};
