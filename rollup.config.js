export default {
  entry: 'src/leaflet.hotline.js',
  plugins: [],
  format: 'umd',
  moduleName: 'L.hotline',
  external: ['leaflet'],
  globals: {
    leaflet: 'L'
  }
};