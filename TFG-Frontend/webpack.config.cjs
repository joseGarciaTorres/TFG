const path = require('path');

module.exports = {
  mode: 'production', // Cambiar a 'production' para optimizar el código
  entry: {
    content: './src/content/content.tsx', // Entrada para el content script
    popup: './src/popup/Popup.tsx', // Entrada para el popup
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js', // Genera un archivo por cada entrada (content.js, popup.js)
    devtoolModuleFilenameTemplate: '[resource-path]', // Para evitar eval()
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'], // Extensiones que Webpack resolverá
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'], // Soporte para React y ES6+
            },
          },
          'ts-loader', // Transpila TypeScript
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.jsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'], // Soporte para React y ES6+
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'], // Soporte para CSS
      },
    ],
  },
  devtool: 'source-map', // Usa source maps para depuración
};


// const path = require('path');

// module.exports = {
//   mode: 'production', // Cambiar a 'production' para evitar eval() y optimizar el código
//   entry: './src/content/content.tsx', // Cambia la ruta de entrada si es necesario
//   output: {
//     path: path.resolve(__dirname, 'dist'),
//     filename: 'bundle.js',
//     // Para evitar el uso de eval en el código
//     devtoolModuleFilenameTemplate: '[resource-path]',
//   },
//   resolve: {
//     extensions: ['.js', '.jsx', '.ts', '.tsx'],
//   },
//   module: {
//     rules: [
//       {
//         test: /\.tsx?$/,
//         use: [
//           {
//             loader: 'babel-loader',
//             options: {
//               presets: ['@babel/preset-env', '@babel/preset-react'],
//             },
//           },
//           'ts-loader',
//         ],
//         exclude: /node_modules/,
//       },
//       {
//         test: /\.css$/i,
//         use: ['style-loader', 'css-loader'],
//       },
//     ],
//   },
//   // Este es un ajuste importante para evitar el uso de eval
//   devtool: 'source-map', // Asegúrate de usar source maps, pero sin eval
// };
