export default {
  entry: 'src/leaflet.hotline.js',
  plugins: [],
  targets: [
    {
      dest: 'dist/leaflet.hotline.js',
      format: 'umd',
      moduleName: 'L.hotline',
      external: ['leaflet'],
      globals: {
        leaflet: 'L'
      },
      sourceMap: false
    }
  ]
};