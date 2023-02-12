import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Configuration } from 'webpack';
import path from 'node:path';

// Config
const commonConfig: Configuration = {
  devtool: 'source-map',
  target: 'node',
  entry: {
    index: './src/index'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'commonjs2'
    },
    clean: true,
  },
  optimization: {
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    splitChunks: {
      chunks: 'all'
    }
  },
  experiments: {
    topLevelAwait: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /[\\/]node_modules[\\/]/,
        use: 'swc-loader',
      },
      {
        test: /\.json$/,
        type: 'json'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx'],
  },
  externals: [
    '@jujulego/jill',
    '@swc/core',
    'react-devtools-core',
    'typescript',
    'ws', // used only by ink for devtools
  ],
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
  ]
};

export default commonConfig;
