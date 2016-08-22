var pkg = require('./package.json');

var copyright = '/* ' + pkg.name + ' - v' + pkg.version + ' - ' + new Date().toString() + '\n' +
                ' * Copyright (c) ' + new Date().getFullYear() + ' iosphere GmbH\n' +
                ' * ' + pkg.license + ' */';

export default {
  entry: 'src/leaflet.hotline.js',
  plugins: [],
  format: 'umd',
  moduleName: 'L.hotline',
  external: ['leaflet'],
  globals: {
    leaflet: 'L'
  },
  banner: copyright
};