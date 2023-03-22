import { default as nodeExternals } from 'webpack-node-externals';
import { default as MiniCssExtractPlugin} from 'mini-css-extract-plugin';
import path from 'path';

const __dirname = process.platform === 'win32' ?
  new URL('.', import.meta.url).pathname.substr(1) :
  new URL('.', import.meta.url).pathname;

export default (env, argv) => {
  return [{
    entry: ["regenerator-runtime/runtime.js", "./src/client.js"],
    mode: 'production',
    output: {
        path: path.join(__dirname, "dist"),
        filename: "client.js",
//        publicPath: '/static/'
    },
    plugins: [new MiniCssExtractPlugin({
        filename: "[name].css",
    })],

    devtool: (argv.mode === 'production') ? undefined : 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/i,
                loader: "babel-loader",
            },
            {
              test: /\.css$/,
              use: [
                MiniCssExtractPlugin.loader,
                {
                  loader: "css-loader",
                  options: {
                    importLoaders: 1,
                    modules: false,
                    url: true,
                    sourceMap: true,
                  },
                },
              ],
            },
        ]
    },
    "resolve": {
        "alias": {
            "react": "preact/compat",
            "react-dom": "preact/compat"
        }
    }
},
{
    target: 'node14.16',
    mode: 'development',
    externals: [nodeExternals({
      allowlist: ['pullstate', 'react-dropzone', '@dracula/dracula-ui', 'lodash-es/mapValues', 'lodash-es/omit', 'lodash-es/first', 'lodash-es/last', 'p-limit', 'yocto-queue', 'preact-iso', 'downshift'],
    })],
    // https://www.npmjs.com/package/node-loader  requires not mocking __dirname
    node: {
      __dirname: false,
    },
    plugins: [new MiniCssExtractPlugin({ runtime: false })],
    entry: ["regenerator-runtime/runtime.js", "./src/server.js"],
    output: {
        path: path.join(__dirname, "dist-server"),
        filename: "server.js",
        libraryTarget: 'commonjs2'
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/i,
                loader: "babel-loader",
                exclude: /node_modules/,
            },
            {
              test: /\.css$/,
              use: [
                MiniCssExtractPlugin.loader,
                {
                  loader: "css-loader",
                  options: {
                    importLoaders: 1,
                    modules: false,
                    url: true,
                    sourceMap: true,
                  },
                },
              ],
            },
            {
              test: /\.node$/,
              loader: "node-loader",
            }
        ]
    },
    "resolve": {
        "alias": {
            "react": "preact/compat",
            "react-dom": "preact/compat",
        }
    }
  }
  ];
}
