import L from 'leaflet';
import { Renderer, renderer } from './renderer.js';
import Util from './util.js';


export var Plugin = L.Polyline.extend({
	statics: {
		Renderer: Renderer,
		renderer: renderer
	},

	options: {
		renderer: renderer(),
		min: 0,
		max: 1,
		palette: {
			0.0: 'green',
			0.5: 'yellow',
			1.0: 'red'
		},
		weight: 5,
		outlineColor: 'black',
		outlineWidth: 1
	},

	getRGBForValue: function (value) {
		return this._renderer._hotline.getRGBForValue(value);
	},

	/**
	 * Just like the Leaflet version, but with support for a z coordinate.
	 */
	_projectLatlngs: function (latlngs, result, projectedBounds) {
		var flat = latlngs[0] instanceof L.LatLng,
				len = latlngs.length,
				i, ring;

		if (flat) {
			ring = [];
			for (i = 0; i < len; i++) {
				ring[i] = this._map.latLngToLayerPoint(latlngs[i]);
				// Add the altitude of the latLng as the z coordinate to the point
				ring[i].z = latlngs[i].alt;
				projectedBounds.extend(ring[i]);
			}
			result.push(ring);
		} else {
			for (i = 0; i < len; i++) {
				this._projectLatlngs(latlngs[i], result, projectedBounds);
			}
		}
	},

	/**
	 * Just like the Leaflet version, but uses `Util.clipSegment()`.
	 */
	_clipPoints: function () {
		if (this.options.noClip) {
			this._parts = this._rings;
			return;
		}

		this._parts = [];

		var parts = this._parts,
				bounds = this._renderer._bounds,
				i, j, k, len, len2, segment, points;

		for (i = 0, k = 0, len = this._rings.length; i < len; i++) {
			points = this._rings[i];

			for (j = 0, len2 = points.length; j < len2 - 1; j++) {
				segment = Util.clipSegment(points[j], points[j + 1], bounds, j, true);

				if (!segment) { continue; }

				parts[k] = parts[k] || [];
				parts[k].push(segment[0]);

				// if segment goes out of screen, or it's the last one, it's the end of the line part
				if ((segment[1] !== points[j + 1]) || (j === len2 - 2)) {
					parts[k].push(segment[1]);
					k++;
				}
			}
		}
	},

	_clickTolerance: function () {
		return this.options.weight / 2 + this.options.outlineWidth + (L.Browser.touch ? 10 : 0);
	}
});

export var plugin = function (latlngs, options) {
	return new Plugin(latlngs, options);
};

