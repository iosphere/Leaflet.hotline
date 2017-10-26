require('2gis-maps');
require('2gis-maps/dist/css/styles.full.dark.css');
require('./Hotline');

var styles = document.createElement('style');
styles.innerText = 'html,body, #map { height: 100%; margin: 0; padding: 0; }';
document.body.appendChild(styles);

var mapContaner = document.createElement('div');
mapContaner.setAttribute('id', 'map');
document.body.appendChild(mapContaner);


var map = DG.map('map', {
    center: [55.76, 37.59],
    zoom: 13,
    geoclicker: true,
    worldCopyJump: true,
    zoomControl: false,
    fullscreenControl: false
});

var coords = [
    [55.76, 37.59],
    [55.76, 37.60],
    [55.76, 37.60, 0],
    [55.75, 37.60, 0],
    [55.75, 37.60, 10],
    [55.75, 37.61, 10],
    [55.75, 37.61, 0],
    [55.74, 37.61, 0],
    [55.74, 37.61, 5],
    [55.74, 37.62, 5],
    [55.74, 37.62, 10],
    [55.75, 37.62, 10],
    [55.76, 37.63, 10]
];

var hotlineLayer = DG.hotline(coords, {
    min: 0,
    max: 10
});
hotlineLayer.on('mouseover', function() {
    hotlineLayer.setOpacity(0.5);
});
hotlineLayer.on('mouseout', function() {
    hotlineLayer.setOpacity(1);
});
hotlineLayer.addTo(map);


var bounds = hotlineLayer.getBounds();
map.fitBounds(bounds, {padding: [16, 16]});
