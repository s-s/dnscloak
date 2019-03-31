/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

var path = require('path');
var webpack = require('webpack');

var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var TerserPlugin = require('terser-webpack-plugin');
var OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

//var devMode = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: {
    main: './src/js/app.js'
  },
  output: {
    path: path.resolve(__dirname, '../www'),
    filename: 'app.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        //exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/env', {
                  targets: {
                    browsers: ['ios >= 10']
                  }
                }]
              ]
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          'sass-loader'
        ]
      },
      /*{
        test: /\.html$/,
        use: [{
          loader: 'html-loader',
          options: {
            interpolate: true,
            minimize: true,
            removeComments: false
          }
        }]
      },*/
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'file-loader',
        options: {
          name: 'images/[name].[ext]',
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]',
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'app.css',
    }),
    new HtmlWebpackPlugin({
      //minify: true, //process.env.NODE_ENV === 'production',
      inject: false,
      hash: true,
      template: './src/index.html',
      filename: 'index.html'
    }),
    new webpack.ProvidePlugin({
      '_extend': 'lodash/extend',
      '_has': 'lodash/has',
      '_each': 'lodash/each',
      '_map': 'lodash/map',
      '_filter': 'lodash/filter',
      '_isObject': 'lodash/isObject',
      '_isArray': 'lodash/isArray',
      '_omit': 'lodash/omit',
      '_includes': 'lodash/includes',
      //Framework7: ['framework7/framework7.esm.bundle.js', 'default'],
      //Template7: ['framework7/framework7.esm.bundle.js', 'Template7'],
      '$$': ['framework7/framework7.esm.bundle.js', 'Dom7'],
    })
  ],
  performance: {
    hints: false,
    maxEntrypointSize: 8 * 1024 * 1024,
    maxAssetSize: 8 * 1024 * 1024
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        sourceMap: false,
        parallel: true,
        //cache: './.build_cache/terser',
        exclude: /transpiledLibs/,
        terserOptions: {
          warnings: false,
          ie8: false
        },
        extractComments: {
          condition: 'some',
          filename: function (file) {
            return `${file}.LICENSE`;
          },
          banner: function (licenseFile) {
            return `License information can be found in ${licenseFile}`;
          },
        },
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          'preset': 'advanced',
          'safe': true,
          'map': false
          /*'map':
            'inline': false
          },*/
        },
      }),
    ]
  },
};
