const webpack = require('webpack');
const path = require('path');
const HtmlPlugin = require('html-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const UglifyJSPlugin = webpack.optimize.UglifyJsPlugin;

const isDev = (process.env.WEBPACK_ENV === 'dev');

function getConfig() {
    if (isDev) {
        return {
            devtool: '#inline-source-map',
            devServer: {
                port: '3000',
                host: 'localhost',
                disableHostCheck: true,
                stats: 'errors-only'
            },
            entry: {
                index: path.resolve(__dirname, 'src/demo.js')
            },
            output: {
                filename: '[name].js',
                chunkFilename: '[id].[chunkhash].js'
            },
            plugins: [
                new HtmlPlugin({
                    title: 'Leaflet Hotline',
                    chunks: ['index']
                }),
                new webpack.NoEmitOnErrorsPlugin(),
                new LiveReloadPlugin()
            ],
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        use: [{
                            loader: 'babel-loader',
                            options: {
                                presets: ['es2015']
                            }
                        }]
                    },
                    {
                        test: /\.css$/,
                        use: ['raw-loader']
                    }

                ]
            }
        }
    } else {
        return {
            entry: {
                'leaflet.hotline': path.resolve(__dirname, 'src/Hotline.js'),
                'leaflet.hotline.min': path.resolve(__dirname, 'src/Hotline.js')
            },
            output: {
                path: path.resolve(__dirname, 'dist'),
                filename: '[name].js',
                libraryTarget: 'umd'
            },
            plugins: [
                new UglifyJSPlugin({
                    include: /\.min\.js$/
                })
            ],
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        use: [{
                            loader: 'babel-loader',
                            options: {
                                presets: ['es2015']
                            }
                        }]
                    }
                ]
            }
        }
    }
}

module.exports = getConfig();
