const test = require("ava");
const {Config} = require("../../lib/utils");
const {VueLoaderPlugin} = require("vue-loader");
const merge = require("webpack-merge");

const defaultServer = {
    entry: "./src/entry-server.js",
    mode: undefined,
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
};

const defaultClient = {
    entry: "./src/entry-client.js",
    output: {
        filename: "client.js",
    },
    mode: undefined,
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
};

test("Default Server Config", t => {
    const result = Config.Bootstrap({}, {});
    t.deepEqual(result.server, defaultServer);
});

test("Default Client Config", t => {
    const result = Config.Bootstrap({}, {});
    t.deepEqual(result.client, defaultClient);
});

test("Merges Module Server Config", t => {
    const extraOptions = {
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: "babel-loader",
                    options: {
                        babelrc: false,
                        presets: ["@babel/preset-env"],
                      },
                },
            ],
        },
    };
    const result = Config.Bootstrap(extraOptions, {});
    const expected = merge.smart(defaultServer, extraOptions);
    t.deepEqual(result.server, expected);
});

test("Merges Module Client Config", t => {
    const extraOptions = {
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: "babel-loader",
                    options: {
                        babelrc: false,
                        presets: ["@babel/preset-env"],
                      },
                },
            ],
        },
    };
    const result = Config.Bootstrap({}, extraOptions);
    const expected = merge.smart(defaultClient, extraOptions);
    t.deepEqual(result.client, expected);
});

test("Gets Default App", t => {
    const result = Config.AppConfig("foo");
    const expected = `import Vue from "vue";
import App from "foo";

export function createApp(data) {
    const app = new Vue({
        data,
        render: h => h(App),
    });
    return { app };
}
`;
    t.is(result, expected);
});

test("Gets Default Client", t => {
    const result = Config.ClientConfig();
    const expected = `import { createApp } from "./app";
const store = window.__INITIAL_STATE__;
const { app } = createApp(store ? store : {});
app.$mount("#app");
`;
    t.is(result, expected);
});

test("Gets Default Server", t => {
    const result = Config.ServerConfig();
    const expected = `import { createApp } from "./app";
export default context => {
    return new Promise((resolve, reject) => {
        const { app } = createApp(context);

        resolve(app);
    });
};
`;
    t.is(result, expected);
});


test("Gets Modified App", t => {
    const result = Config.AppConfig("foo", "bar");
    const expected = `bar`;
    t.is(result, expected);
});

test("Gets Modified Client", t => {
    const result = Config.ClientConfig("bar");
    const expected = `bar`;
    t.is(result, expected);
});

test("Gets Modified Server", t => {
    const result = Config.ServerConfig("qux");
    const expected = `qux`;
    t.is(result, expected);
});
