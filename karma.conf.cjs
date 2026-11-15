const path = require("path");
const webpack = require("webpack");
const fs = require("fs");

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
if (!process.env.CHROME_BIN && fs.existsSync(EDGE)) process.env.CHROME_BIN = EDGE;

module.exports = function (config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "webpack"],
    files: [{ pattern: "spec/**/*.spec.js", watched: false }],
    preprocessors: { "spec/**/*.spec.js": ["webpack", "sourcemap"] },
    webpack: {
      mode: "development",
      devtool: "inline-source-map",
      resolve: { extensions: [".js", ".jsx"] },
      module: {
        rules: [{ test: /.jsx?$/, resolve: { fullySpecified: false } }, {
          test: /\.jsx?$/,
          exclude: /node_modules|spec/,
          use: { loader: "babel-loader", options: { envName: "test" } },
        }],
      },
      plugins: [new webpack.DefinePlugin({ "import.meta.env": JSON.stringify({}) })],
    },
    reporters: ["progress", "coverage"],
    coverageReporter: {
      dir: path.join(__dirname, "coverage-karma"),
      reporters: [{ type: "html" }, { type: "text-summary" }, { type: "lcovonly" }],
    },
    browsers: ["ChromeHeadlessSinSandbox"],
    customLaunchers: {
      ChromeHeadlessSinSandbox: { base: "ChromeHeadless", flags: ["--no-sandbox"] },
    },
    singleRun: true,
  });
};
