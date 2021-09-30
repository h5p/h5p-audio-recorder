const path = require('path');
const webpack = require('webpack');
const nodeEnv = process.env.NODE_ENV || 'development';
const { VueLoaderPlugin } = require('vue-loader');

const config = {
  mode: nodeEnv,
  entry: "./src/entries/dist.js",
  devtool: (nodeEnv === 'production') ? undefined : 'inline-source-map',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: "h5p-audio-recorder.js",
    sourceMapFilename: '[file].map'
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
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
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.(s[ac]ss|css)$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(svg)$/,
        include: path.join(__dirname, 'src/images'),
        type: 'asset/inline'
      }
    ]
  },
  plugins: [
    // make sure to include the plugin for the magic
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(nodeEnv)
      }
    }),
  ]
};

module.exports = config;
