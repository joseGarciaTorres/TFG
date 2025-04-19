const path = require('path');

module.exports = {
  mode: 'production', // Cambiar a 'production' para evitar eval() y optimizar el código
  entry: './src/content/content.tsx', // Cambia la ruta de entrada si es necesario
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    // Para evitar el uso de eval en el código
    devtoolModuleFilenameTemplate: '[resource-path]',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
          'ts-loader',
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  // Este es un ajuste importante para evitar el uso de eval
  devtool: 'source-map', // Asegúrate de usar source maps, pero sin eval
};
