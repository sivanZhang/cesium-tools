
const webpack = require('webpack')
const path = require('path')
function resolve(dir) {
  return path.join(__dirname, dir);
}

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
        '@': path.resolve('src'),
        "static": resolve("static")
      }
    }
  }
};