const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    main: ['./autocomplete.js', './coordinateConverter.js'],
  },
  
  output: {
    filename: 'js/bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'index.html', to: 'index.html', noErrorOnMissing: true },
        { from: '*.css', to: '[name][ext]', noErrorOnMissing: true },
        { from: '*.csv', to: '[name][ext]', noErrorOnMissing: true },
        { from: '*.db', to: '[name][ext]', noErrorOnMissing: true },
      ],
    }),
  ],
};