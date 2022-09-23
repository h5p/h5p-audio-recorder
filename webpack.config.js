const path = require('path');
const webpack = require('webpack');
const nodeEnv = process.env.NODE_ENV || 'development';
const { VueLoaderPlugin } = require('vue-loader');
const libraryName = process.env.npm_package_name;

const config = {
  mode: nodeEnv,
  context: path.resolve(__dirname, 'src'),
  entry: "./entries/dist.js",
  devtool: (nodeEnv === 'production') ? undefined : 'inline-source-map',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: `${libraryName}.js`,
    sourceMapFilename: '[file].map'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.vue'],
    alias: {
      'vue': '@vue/runtime-dom'
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
      'process.env': JSON.stringify(process.env)
    }),
  ]
};

module.exports = config;
