const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const path = require('path')
function resolve(dir) {
  return path.join(__dirname, dir);
}
let cesiumSource = './node_modules/cesium/Source'
let cesiumWorkers = '../Build/Cesium/Workers'
const IS_DEV = process.env.NODE_ENV === "development"
module.exports = {
  publicPath:  IS_DEV? "/" : "./",
  outputDir: "dist",
  assetsDir: "static",
  // eslint-loader 是否在保存的时候检查
  lintOnSave: false,
  // webpack-dev-server 相关配置
  devServer: {
    open: process.platform === "darwin",
    port: 1024,
    https: false,
    hotOnly: false
  },
  configureWebpack: {
    output: {
      sourcePrefix: ' '
    },
    amd: {
      toUrlUndefined: true
    },
    resolve: {
      alias: {
        'vue$': 'vue/dist/vue.esm.js',
        '@': path.resolve('src'),
        'cesium': path.resolve(__dirname, cesiumSource),
        "static": resolve("static")
      }
    },
    plugins: [
      new CopyWebpackPlugin([{ from: path.join(cesiumSource, cesiumWorkers), to: 'Workers' }]),
      new CopyWebpackPlugin([{ from: path.join(cesiumSource, 'Assets'), to: 'Assets' }]),
      new CopyWebpackPlugin([{ from: path.join(cesiumSource, 'Widgets'), to: 'Widgets' }]),
      new CopyWebpackPlugin([{ from: path.join(cesiumSource, 'ThirdParty/Workers'), to: 'ThirdParty/Workers' }]),
      new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify('/')
      })
    ],
    module: {
      unknownContextCritical: false
    }
  }
};