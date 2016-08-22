import uglify from 'rollup-plugin-uglify';
import config from './rollup.config.js';

config.dest = 'dist/leaflet.hotline.js';
config.sourceMap = 'dist/leaflet.hotline.js.map';
config.plugins.push(uglify({ output: { comments: /iosphere/ } }));

export default config;