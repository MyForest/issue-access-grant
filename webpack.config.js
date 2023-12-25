const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: '[name].[contenthash].js',
    asyncChunks: true,
    chunkFilename: '[chunkhash].js',
    clean: true,
  },
  plugins: [new HtmlWebpackPlugin(),
  new MiniCssExtractPlugin({
    chunkFilename: '[chunkhash].css',
    filename: 'style.[contenthash].css',
    runtime: false
  }),
  new CopyPlugin({
    patterns: [
      { context: "src/", from: "*.html" },
      { context: "src/", from: "logo.png" },
      { context: "src/", from: "client-identifier.json" },
    ],
    options: {
      concurrency: 100,
    },
  }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      }
    ],
  },
  devServer: {
    static: "./dist",
  },
  optimization: {
    runtimeChunk: 'single',

    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};