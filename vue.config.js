
const webpack = require('webpack')
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
function resolve(dir) {
  return path.join(__dirname, dir);
}

const cesiumSource = './node_modules/cesium/Source'
const cesiumWorkers = '../Build/Cesium/Workers'
const IS_DEV = process.env.NODE_ENV === "development"
module.exports = {
  publicPath:  IS_DEV? "/" : "./",
  outputDir: "dist",
  assetsDir: "static",
  lintOnSave: false,
  // webpack-dev-server 相关配置
  devServer: {
    port: 1024
  },
  productionSourceMap: true,
  
  configureWebpack: {
    output: {
      sourcePrefix: ' '
    },
    amd: {
      toUrlUndefined: true
    },
    node: {
      // Resolve node module use of fs
      fs: 'empty'
    },
    resolve: {
      
      alias: {
        'vue$': 'vue/dist/vue.esm.js',
        "static": path.resolve("static"),
        '@': path.resolve('src'),
        'cesium': path.resolve(__dirname, cesiumSource)
      }
    },
    plugins: [
      new CopyWebpackPlugin([{ from: path.join(cesiumSource, cesiumWorkers), to: 'Workers' }]),
      new CopyWebpackPlugin([{ from: path.join(cesiumSource, 'Assets'), to: 'Assets' }]),
      new CopyWebpackPlugin([{ from: path.join(cesiumSource, 'Widgets'), to: 'Widgets' }]),
      new CopyWebpackPlugin([{ from: path.join(cesiumSource, 'ThirdParty/Workers'), to: 'ThirdParty/Workers' }]),
      new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify('')
      })
    ],
    module: {
      unknownContextCritical: false
    }
  }
};