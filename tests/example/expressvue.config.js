const path = require("path");

const basicWebpackConfig = {
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

module.exports = {
    pagesPath: path.normalize(path.join(__dirname, "views")),
    webpack: {
        server: basicWebpackConfig,
        client: basicWebpackConfig,
    },
    data: {
        foo: true,
        globalData: true,
    },
    head: {
        title: "Test",
    },
};
