var path = require('path');

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
          preserveWhitespace: false,
          loaders: {
            scss: 'vue-style-loader!css-loader!sass-loader'
          }
        },
      },
      {
        test: /\.js$/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        loader: "css-loader"
      },
      {
        test: /\.(svg)$/,
        include: path.join(__dirname, 'src/images'),
        loader: 'url-loader?limit=10000'
      } // inline base64 URLs for <=10k images, direct URLs for the rest
    ]
  }
};

module.exports = config;
