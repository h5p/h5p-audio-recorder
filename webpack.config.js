var path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractSass = new ExtractTextPlugin({
  filename: "dist.css"
});


const config = {
  entry: "./src/entries/dist.js",
  devtool: 'inline-source-map',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: "dist.js",
    sourceMapFilename: '[file].map'
  },
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js'
    },
    modules: [
      path.resolve('./src'),
      path.resolve('./node_modules')
    ]
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          preserveWhitespace: false
        }
      },
      {
        test: /\.js$/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: extractSass.extract({
          use: [{
            loader: "css-loader"
          }],
          fallback: "style-loader"
        })
      }
    ]
  },
  plugins: [
    extractSass
  ]
};

module.exports = config;
