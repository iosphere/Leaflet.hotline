(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('leaflet')) :
	typeof define === 'function' && define.amd ? define(['exports', 'leaflet'], factory) :
	(factory((global.L = global.L || {}, global.L.hotline = global.L.hotline || {}),global.L));
}(this, (function (exports,L) { 'use strict';

L = 'default' in L ? L['default'] : L;

/**
 * Core renderer.
 * @constructor
 * @param {HTMLElement | string} canvas - &lt;canvas> element or its id
 * to initialize the instance on.
 */
var Hotline = function (canvas) {
	if (!(this instanceof Hotline)) { return new Hotline(canvas); }

	var defaultPalette = {
		0.0: 'green',
		0.5: 'yellow',
		1.0: 'red'
	};

	this._canvas = canvas =
		typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

	this._ctx = canvas.getContext('2d');
	this._width = canvas.width;
	this._height = canvas.height;

	this._weight = 5;
	this._outlineWidth = 1;
	this._outlineColor = 'black';

	this._min = 0;
	this._max = 1;

	this._data = [];

	this.palette(defaultPalette);
};

Hotline.prototype = {
	/**
	 * Sets the width of the canvas. Used when clearing the canvas.
	 * @param {number} width - Width of the canvas.
	 */
	width: function (width) {
		this._width = width;
		return this;
	},

	/**
	 * Sets the height of the canvas. Used when clearing the canvas.
	 * @param {number} height - Height of the canvas.
	 */
	height: function (height) {
		this._height = height;
		return this;
	},

	/**
	 * Sets the weight of the path.
	 * @param {number} weight - Weight of the path in px.
	 */
	weight: function (weight) {
		this._weight = weight;
		return this;
	},

	/**
	 * Sets the width of the outline around the path.
	 * @param {number} outlineWidth - Width of the outline in px.
	 */
	outlineWidth: function (outlineWidth) {
		this._outlineWidth = outlineWidth;
		return this;
	},

	/**
	 * Sets the color of the outline around the path.
	 * @param {string} outlineColor - A CSS color value.
	 */
	outlineColor: function (outlineColor) {
		this._outlineColor = outlineColor;
		return this;
	},

	/**
	 * Sets the palette gradient.
	 * @param {Object.<number, string>} palette  - Gradient definition.
	 * e.g. { 0.0: 'white', 1.0: 'black' }
	 */
	palette: function (palette) {
		var canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d'),
		gradient = ctx.createLinearGradient(0, 0, 0, 256);

		canvas.width = 1;
		canvas.height = 256;

		for (var i in palette) {
			gradient.addColorStop(i, palette[i]);
		}

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, 1, 256);

		this._palette = ctx.getImageData(0, 0, 1, 256).data;

		return this;
	},

	/**
	 * Sets the value used at the start of the palette gradient.
	 * @param {number} min
	 */
	min: function (min) {
		this._min = min;
		return this;
	},

	/**
	 * Sets the value used at the end of the palette gradient.
	 * @param {number} max
	 */
	max: function (max) {
		this._max = max;
		return this;
	},

	/**
	 * A path to rander as a hotline.
	 * @typedef Array.<{x:number, y:number, z:number}> Path - Array of x, y and z coordinates.
	 */

	/**
	 * Sets the data that gets drawn on the canvas.
	 * @param {(Path|Path[])} data - A single path or an array of paths.
	 */
	data: function (data) {
		this._data = data;
		return this;
	},

	/**
	 * Adds a path to the list of paths.
	 * @param {Path} path
	 */
	add: function (path) {
		this._data.push(path);
		return this;
	},

	/**
	 * Clears the canvas and optionally resets the data.
	 * @param {boolean} clearData - Also clear the data.
	 */
	clear: function (clearData) {
		if (clearData) {
			this._data = [];
		}
		this._ctx.clearRect(0, 0, this._width, this._height);
		return this;
	},

	/**
	 * Draws the currently set paths.
	 * @param {boolean} clear - Don't draw as a hotline but remove the currently
	 * set paths without clearing the complete canvas.
	 */
	draw: function (clear) {
		var ctx = this._ctx;

		ctx.globalCompositeOperation = clear ? 'destination-out' : 'source-over';
		ctx.lineCap = 'round';

		this._drawOutline(ctx, clear);

		// No need to draw expensive gradients when clearing
		if (clear) { return this; }

		this._drawHotline(ctx);

		return this;
	},

	/**
	 * Gets the RGB values of a given z value of the current palette.
	 * @param {number} value - Value to get the color for, should be between min and max.
	 * @returns {Array.<number>} The RGB values as an array [r, g, b]
	 */
	getRGBForValue: function (value) {
		var valueRelative = Math.min(Math.max((value - this._min) / (this._max - this._min), 0), 0.999);
		var paletteIndex = Math.floor(valueRelative * 256) * 4;

		return [
			this._palette[paletteIndex],
			this._palette[paletteIndex + 1],
			this._palette[paletteIndex + 2]
		];
	},

	/**
	 * Draws the outline of the graphs.
	 * @private
	 */
	_drawOutline: function (ctx, clear) {
		var i, j, dataLength, path, lineWidth, pathLength, pointStart, pointEnd;

		if (clear || this._outlineWidth) {
			for (i = 0, dataLength = this._data.length; i < dataLength; i++) {
				path = this._data[i];
				lineWidth = this._weight + 2 * this._outlineWidth;

				// If clearing a path, do it with its previous line width and a little bit extra
				path._prevWidth = ctx.lineWidth = clear ? (path._prevWidth || lineWidth) + 1 : lineWidth;

				for (j = 1, pathLength = path.length; j < pathLength; j++) {
					pointStart = path[j - 1];
					pointEnd = path[j];

					ctx.strokeStyle = this._outlineColor;
					ctx.beginPath();
					ctx.moveTo(pointStart.x, pointStart.y);
					ctx.lineTo(pointEnd.x, pointEnd.y);
					ctx.stroke();
				}
			}
		}
	},

	/**
	 * Draws the color encoded hotline of the graphs.
	 * @private
	 */
	_drawHotline: function (ctx) {
		var i, j, dataLength, path, pathLength, pointStart, pointEnd,
		gradient, gradientStartRGB, gradientEndRGB;

		ctx.lineWidth = this._weight;

		for (i = 0, dataLength = this._data.length; i < dataLength; i++) {
			path = this._data[i];

			for (j = 1, pathLength = path.length; j < pathLength; j++) {
				pointStart = path[j - 1];
				pointEnd = path[j];

				// Create a gradient for each segment, pick start end end colors from palette gradient
				gradient = ctx.createLinearGradient(pointStart.x, pointStart.y, pointEnd.x, pointEnd.y);
				gradientStartRGB = this.getRGBForValue(pointStart.z);
				gradientEndRGB = this.getRGBForValue(pointEnd.z);
				gradient.addColorStop(0, 'rgb(' + gradientStartRGB.join(',') + ')');
				gradient.addColorStop(1, 'rgb(' + gradientEndRGB.join(',') + ')');

				ctx.strokeStyle = gradient;
				ctx.beginPath();
				ctx.moveTo(pointStart.x, pointStart.y);
				ctx.lineTo(pointEnd.x, pointEnd.y);
				ctx.stroke();
			}
		}
	}
};

var Renderer = L.Canvas.extend({
	_initContainer: function () {
		L.Canvas.prototype._initContainer.call(this);
		this._hotline = new Hotline(this._container);
	},

	_update: function () {
		L.Canvas.prototype._update.call(this);
		this._hotline.width(this._container.width);
		this._hotline.height(this._container.height);
	},

	_updatePoly: function (layer) {
		var parts = layer._parts;

		if (!parts.length) { return; }

		this._updateOptions(layer);

		this._hotline
			.data(parts)
			.draw(this._clear);
	},

	_updateOptions: function (layer) {
		if (layer.options.min !== null) {
			this._hotline.min(layer.options.min);
		}
		if (layer.options.max !== null) {
			this._hotline.max(layer.options.max);
		}
		if (layer.options.weight !== null) {
			this._hotline.weight(layer.options.weight);
		}
		if (layer.options.outlineWidth !== null) {
			this._hotline.outlineWidth(layer.options.outlineWidth);
		}
		if (layer.options.outlineColor !== null) {
			this._hotline.outlineColor(layer.options.outlineColor);
		}
		if (layer.options.palette) {
			this._hotline.palette(layer.options.palette);
		}
	}
});

var renderer = function (options) {
	return L.Browser.canvas ? new Renderer(options) : null;
};

function clipSegment(a, b, bounds, useLastCode, round) {
	var codeA = useLastCode ? this._lastCode : L.LineUtil._getBitCode(a, bounds),
	codeB = L.LineUtil._getBitCode(b, bounds),
	codeOut, p, newCode;

	// save 2nd code to avoid calculating it on the next segment
	this._lastCode = codeB;

	while (true) {
		// if a,b is inside the clip window (trivial accept)
		if (!(codeA | codeB)) {
			return [a, b];
		// if a,b is outside the clip window (trivial reject)
		} else if (codeA & codeB) {
			return false;
		// other cases
		} else {
			codeOut = codeA || codeB;
			p = L.LineUtil._getEdgeIntersection(a, b, codeOut, bounds, round);
			newCode = L.LineUtil._getBitCode(p, bounds);

			if (codeOut === codeA) {
				p.z = a.z;
				a = p;
				codeA = newCode;
			} else {
				p.z = b.z;
				b = p;
				codeB = newCode;
			}
		}
	}
}


var Util = {
	clipSegment: clipSegment
};

var Plugin = L.Polyline.extend({
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

var plugin = function (latlngs, options) {
	return new Plugin(latlngs, options);
};

/*
 (c) 2015, iosphere GmbH
 Leaflet.hotline, a Leaflet plugin for drawing gradients along polylines.
 https://github.com/iosphere/Leaflet.hotline/
*/

L.Hotline = Plugin;

L.hotline = plugin;

exports.L = L;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhZmxldC5ob3RsaW5lLmRlYnVnLmpzIiwic291cmNlcyI6WyIuLi9zcmMvaG90bGluZS5qcyIsIi4uL3NyYy9yZW5kZXJlci5qcyIsIi4uL3NyYy91dGlsLmpzIiwiLi4vc3JjL3BsdWdpbi5qcyIsIi4uL3NyYy9sZWFmbGV0LmhvdGxpbmUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3JlIHJlbmRlcmVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50IHwgc3RyaW5nfSBjYW52YXMgLSAmbHQ7Y2FudmFzPiBlbGVtZW50IG9yIGl0cyBpZFxuICogdG8gaW5pdGlhbGl6ZSB0aGUgaW5zdGFuY2Ugb24uXG4gKi9cbmV4cG9ydCB2YXIgSG90bGluZSA9IGZ1bmN0aW9uIChjYW52YXMpIHtcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIEhvdGxpbmUpKSB7IHJldHVybiBuZXcgSG90bGluZShjYW52YXMpOyB9XG5cblx0dmFyIGRlZmF1bHRQYWxldHRlID0ge1xuXHRcdDAuMDogJ2dyZWVuJyxcblx0XHQwLjU6ICd5ZWxsb3cnLFxuXHRcdDEuMDogJ3JlZCdcblx0fTtcblxuXHR0aGlzLl9jYW52YXMgPSBjYW52YXMgPVxuXHRcdHR5cGVvZiBjYW52YXMgPT09ICdzdHJpbmcnID8gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2FudmFzKSA6IGNhbnZhcztcblxuXHR0aGlzLl9jdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0dGhpcy5fd2lkdGggPSBjYW52YXMud2lkdGg7XG5cdHRoaXMuX2hlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG5cblx0dGhpcy5fd2VpZ2h0ID0gNTtcblx0dGhpcy5fb3V0bGluZVdpZHRoID0gMTtcblx0dGhpcy5fb3V0bGluZUNvbG9yID0gJ2JsYWNrJztcblxuXHR0aGlzLl9taW4gPSAwO1xuXHR0aGlzLl9tYXggPSAxO1xuXG5cdHRoaXMuX2RhdGEgPSBbXTtcblxuXHR0aGlzLnBhbGV0dGUoZGVmYXVsdFBhbGV0dGUpO1xufTtcblxuSG90bGluZS5wcm90b3R5cGUgPSB7XG5cdC8qKlxuXHQgKiBTZXRzIHRoZSB3aWR0aCBvZiB0aGUgY2FudmFzLiBVc2VkIHdoZW4gY2xlYXJpbmcgdGhlIGNhbnZhcy5cblx0ICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0gV2lkdGggb2YgdGhlIGNhbnZhcy5cblx0ICovXG5cdHdpZHRoOiBmdW5jdGlvbiAod2lkdGgpIHtcblx0XHR0aGlzLl93aWR0aCA9IHdpZHRoO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSBoZWlnaHQgb2YgdGhlIGNhbnZhcy4gVXNlZCB3aGVuIGNsZWFyaW5nIHRoZSBjYW52YXMuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBIZWlnaHQgb2YgdGhlIGNhbnZhcy5cblx0ICovXG5cdGhlaWdodDogZnVuY3Rpb24gKGhlaWdodCkge1xuXHRcdHRoaXMuX2hlaWdodCA9IGhlaWdodDtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogU2V0cyB0aGUgd2VpZ2h0IG9mIHRoZSBwYXRoLlxuXHQgKiBAcGFyYW0ge251bWJlcn0gd2VpZ2h0IC0gV2VpZ2h0IG9mIHRoZSBwYXRoIGluIHB4LlxuXHQgKi9cblx0d2VpZ2h0OiBmdW5jdGlvbiAod2VpZ2h0KSB7XG5cdFx0dGhpcy5fd2VpZ2h0ID0gd2VpZ2h0O1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSB3aWR0aCBvZiB0aGUgb3V0bGluZSBhcm91bmQgdGhlIHBhdGguXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBvdXRsaW5lV2lkdGggLSBXaWR0aCBvZiB0aGUgb3V0bGluZSBpbiBweC5cblx0ICovXG5cdG91dGxpbmVXaWR0aDogZnVuY3Rpb24gKG91dGxpbmVXaWR0aCkge1xuXHRcdHRoaXMuX291dGxpbmVXaWR0aCA9IG91dGxpbmVXaWR0aDtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogU2V0cyB0aGUgY29sb3Igb2YgdGhlIG91dGxpbmUgYXJvdW5kIHRoZSBwYXRoLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gb3V0bGluZUNvbG9yIC0gQSBDU1MgY29sb3IgdmFsdWUuXG5cdCAqL1xuXHRvdXRsaW5lQ29sb3I6IGZ1bmN0aW9uIChvdXRsaW5lQ29sb3IpIHtcblx0XHR0aGlzLl9vdXRsaW5lQ29sb3IgPSBvdXRsaW5lQ29sb3I7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIHBhbGV0dGUgZ3JhZGllbnQuXG5cdCAqIEBwYXJhbSB7T2JqZWN0LjxudW1iZXIsIHN0cmluZz59IHBhbGV0dGUgIC0gR3JhZGllbnQgZGVmaW5pdGlvbi5cblx0ICogZS5nLiB7IDAuMDogJ3doaXRlJywgMS4wOiAnYmxhY2snIH1cblx0ICovXG5cdHBhbGV0dGU6IGZ1bmN0aW9uIChwYWxldHRlKSB7XG5cdFx0dmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLFxuXHRcdGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLFxuXHRcdGdyYWRpZW50ID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIDAsIDI1Nik7XG5cblx0XHRjYW52YXMud2lkdGggPSAxO1xuXHRcdGNhbnZhcy5oZWlnaHQgPSAyNTY7XG5cblx0XHRmb3IgKHZhciBpIGluIHBhbGV0dGUpIHtcblx0XHRcdGdyYWRpZW50LmFkZENvbG9yU3RvcChpLCBwYWxldHRlW2ldKTtcblx0XHR9XG5cblx0XHRjdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG5cdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIDEsIDI1Nik7XG5cblx0XHR0aGlzLl9wYWxldHRlID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCAxLCAyNTYpLmRhdGE7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogU2V0cyB0aGUgdmFsdWUgdXNlZCBhdCB0aGUgc3RhcnQgb2YgdGhlIHBhbGV0dGUgZ3JhZGllbnQuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBtaW5cblx0ICovXG5cdG1pbjogZnVuY3Rpb24gKG1pbikge1xuXHRcdHRoaXMuX21pbiA9IG1pbjtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogU2V0cyB0aGUgdmFsdWUgdXNlZCBhdCB0aGUgZW5kIG9mIHRoZSBwYWxldHRlIGdyYWRpZW50LlxuXHQgKiBAcGFyYW0ge251bWJlcn0gbWF4XG5cdCAqL1xuXHRtYXg6IGZ1bmN0aW9uIChtYXgpIHtcblx0XHR0aGlzLl9tYXggPSBtYXg7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEEgcGF0aCB0byByYW5kZXIgYXMgYSBob3RsaW5lLlxuXHQgKiBAdHlwZWRlZiBBcnJheS48e3g6bnVtYmVyLCB5Om51bWJlciwgejpudW1iZXJ9PiBQYXRoIC0gQXJyYXkgb2YgeCwgeSBhbmQgeiBjb29yZGluYXRlcy5cblx0ICovXG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIGRhdGEgdGhhdCBnZXRzIGRyYXduIG9uIHRoZSBjYW52YXMuXG5cdCAqIEBwYXJhbSB7KFBhdGh8UGF0aFtdKX0gZGF0YSAtIEEgc2luZ2xlIHBhdGggb3IgYW4gYXJyYXkgb2YgcGF0aHMuXG5cdCAqL1xuXHRkYXRhOiBmdW5jdGlvbiAoZGF0YSkge1xuXHRcdHRoaXMuX2RhdGEgPSBkYXRhO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGRzIGEgcGF0aCB0byB0aGUgbGlzdCBvZiBwYXRocy5cblx0ICogQHBhcmFtIHtQYXRofSBwYXRoXG5cdCAqL1xuXHRhZGQ6IGZ1bmN0aW9uIChwYXRoKSB7XG5cdFx0dGhpcy5fZGF0YS5wdXNoKHBhdGgpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDbGVhcnMgdGhlIGNhbnZhcyBhbmQgb3B0aW9uYWxseSByZXNldHMgdGhlIGRhdGEuXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gY2xlYXJEYXRhIC0gQWxzbyBjbGVhciB0aGUgZGF0YS5cblx0ICovXG5cdGNsZWFyOiBmdW5jdGlvbiAoY2xlYXJEYXRhKSB7XG5cdFx0aWYgKGNsZWFyRGF0YSkge1xuXHRcdFx0dGhpcy5fZGF0YSA9IFtdO1xuXHRcdH1cblx0XHR0aGlzLl9jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuX3dpZHRoLCB0aGlzLl9oZWlnaHQpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBEcmF3cyB0aGUgY3VycmVudGx5IHNldCBwYXRocy5cblx0ICogQHBhcmFtIHtib29sZWFufSBjbGVhciAtIERvbid0IGRyYXcgYXMgYSBob3RsaW5lIGJ1dCByZW1vdmUgdGhlIGN1cnJlbnRseVxuXHQgKiBzZXQgcGF0aHMgd2l0aG91dCBjbGVhcmluZyB0aGUgY29tcGxldGUgY2FudmFzLlxuXHQgKi9cblx0ZHJhdzogZnVuY3Rpb24gKGNsZWFyKSB7XG5cdFx0dmFyIGN0eCA9IHRoaXMuX2N0eDtcblxuXHRcdGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBjbGVhciA/ICdkZXN0aW5hdGlvbi1vdXQnIDogJ3NvdXJjZS1vdmVyJztcblx0XHRjdHgubGluZUNhcCA9ICdyb3VuZCc7XG5cblx0XHR0aGlzLl9kcmF3T3V0bGluZShjdHgsIGNsZWFyKTtcblxuXHRcdC8vIE5vIG5lZWQgdG8gZHJhdyBleHBlbnNpdmUgZ3JhZGllbnRzIHdoZW4gY2xlYXJpbmdcblx0XHRpZiAoY2xlYXIpIHsgcmV0dXJuIHRoaXM7IH1cblxuXHRcdHRoaXMuX2RyYXdIb3RsaW5lKGN0eCk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogR2V0cyB0aGUgUkdCIHZhbHVlcyBvZiBhIGdpdmVuIHogdmFsdWUgb2YgdGhlIGN1cnJlbnQgcGFsZXR0ZS5cblx0ICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gVmFsdWUgdG8gZ2V0IHRoZSBjb2xvciBmb3IsIHNob3VsZCBiZSBiZXR3ZWVuIG1pbiBhbmQgbWF4LlxuXHQgKiBAcmV0dXJucyB7QXJyYXkuPG51bWJlcj59IFRoZSBSR0IgdmFsdWVzIGFzIGFuIGFycmF5IFtyLCBnLCBiXVxuXHQgKi9cblx0Z2V0UkdCRm9yVmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdHZhciB2YWx1ZVJlbGF0aXZlID0gTWF0aC5taW4oTWF0aC5tYXgoKHZhbHVlIC0gdGhpcy5fbWluKSAvICh0aGlzLl9tYXggLSB0aGlzLl9taW4pLCAwKSwgMC45OTkpO1xuXHRcdHZhciBwYWxldHRlSW5kZXggPSBNYXRoLmZsb29yKHZhbHVlUmVsYXRpdmUgKiAyNTYpICogNDtcblxuXHRcdHJldHVybiBbXG5cdFx0XHR0aGlzLl9wYWxldHRlW3BhbGV0dGVJbmRleF0sXG5cdFx0XHR0aGlzLl9wYWxldHRlW3BhbGV0dGVJbmRleCArIDFdLFxuXHRcdFx0dGhpcy5fcGFsZXR0ZVtwYWxldHRlSW5kZXggKyAyXVxuXHRcdF07XG5cdH0sXG5cblx0LyoqXG5cdCAqIERyYXdzIHRoZSBvdXRsaW5lIG9mIHRoZSBncmFwaHMuXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfZHJhd091dGxpbmU6IGZ1bmN0aW9uIChjdHgsIGNsZWFyKSB7XG5cdFx0dmFyIGksIGosIGRhdGFMZW5ndGgsIHBhdGgsIGxpbmVXaWR0aCwgcGF0aExlbmd0aCwgcG9pbnRTdGFydCwgcG9pbnRFbmQ7XG5cblx0XHRpZiAoY2xlYXIgfHwgdGhpcy5fb3V0bGluZVdpZHRoKSB7XG5cdFx0XHRmb3IgKGkgPSAwLCBkYXRhTGVuZ3RoID0gdGhpcy5fZGF0YS5sZW5ndGg7IGkgPCBkYXRhTGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0cGF0aCA9IHRoaXMuX2RhdGFbaV07XG5cdFx0XHRcdGxpbmVXaWR0aCA9IHRoaXMuX3dlaWdodCArIDIgKiB0aGlzLl9vdXRsaW5lV2lkdGg7XG5cblx0XHRcdFx0Ly8gSWYgY2xlYXJpbmcgYSBwYXRoLCBkbyBpdCB3aXRoIGl0cyBwcmV2aW91cyBsaW5lIHdpZHRoIGFuZCBhIGxpdHRsZSBiaXQgZXh0cmFcblx0XHRcdFx0cGF0aC5fcHJldldpZHRoID0gY3R4LmxpbmVXaWR0aCA9IGNsZWFyID8gKHBhdGguX3ByZXZXaWR0aCB8fCBsaW5lV2lkdGgpICsgMSA6IGxpbmVXaWR0aDtcblxuXHRcdFx0XHRmb3IgKGogPSAxLCBwYXRoTGVuZ3RoID0gcGF0aC5sZW5ndGg7IGogPCBwYXRoTGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRwb2ludFN0YXJ0ID0gcGF0aFtqIC0gMV07XG5cdFx0XHRcdFx0cG9pbnRFbmQgPSBwYXRoW2pdO1xuXG5cdFx0XHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gdGhpcy5fb3V0bGluZUNvbG9yO1xuXHRcdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0XHRjdHgubW92ZVRvKHBvaW50U3RhcnQueCwgcG9pbnRTdGFydC55KTtcblx0XHRcdFx0XHRjdHgubGluZVRvKHBvaW50RW5kLngsIHBvaW50RW5kLnkpO1xuXHRcdFx0XHRcdGN0eC5zdHJva2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogRHJhd3MgdGhlIGNvbG9yIGVuY29kZWQgaG90bGluZSBvZiB0aGUgZ3JhcGhzLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2RyYXdIb3RsaW5lOiBmdW5jdGlvbiAoY3R4KSB7XG5cdFx0dmFyIGksIGosIGRhdGFMZW5ndGgsIHBhdGgsIHBhdGhMZW5ndGgsIHBvaW50U3RhcnQsIHBvaW50RW5kLFxuXHRcdGdyYWRpZW50LCBncmFkaWVudFN0YXJ0UkdCLCBncmFkaWVudEVuZFJHQjtcblxuXHRcdGN0eC5saW5lV2lkdGggPSB0aGlzLl93ZWlnaHQ7XG5cblx0XHRmb3IgKGkgPSAwLCBkYXRhTGVuZ3RoID0gdGhpcy5fZGF0YS5sZW5ndGg7IGkgPCBkYXRhTGVuZ3RoOyBpKyspIHtcblx0XHRcdHBhdGggPSB0aGlzLl9kYXRhW2ldO1xuXG5cdFx0XHRmb3IgKGogPSAxLCBwYXRoTGVuZ3RoID0gcGF0aC5sZW5ndGg7IGogPCBwYXRoTGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0cG9pbnRTdGFydCA9IHBhdGhbaiAtIDFdO1xuXHRcdFx0XHRwb2ludEVuZCA9IHBhdGhbal07XG5cblx0XHRcdFx0Ly8gQ3JlYXRlIGEgZ3JhZGllbnQgZm9yIGVhY2ggc2VnbWVudCwgcGljayBzdGFydCBlbmQgZW5kIGNvbG9ycyBmcm9tIHBhbGV0dGUgZ3JhZGllbnRcblx0XHRcdFx0Z3JhZGllbnQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQocG9pbnRTdGFydC54LCBwb2ludFN0YXJ0LnksIHBvaW50RW5kLngsIHBvaW50RW5kLnkpO1xuXHRcdFx0XHRncmFkaWVudFN0YXJ0UkdCID0gdGhpcy5nZXRSR0JGb3JWYWx1ZShwb2ludFN0YXJ0LnopO1xuXHRcdFx0XHRncmFkaWVudEVuZFJHQiA9IHRoaXMuZ2V0UkdCRm9yVmFsdWUocG9pbnRFbmQueik7XG5cdFx0XHRcdGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiKCcgKyBncmFkaWVudFN0YXJ0UkdCLmpvaW4oJywnKSArICcpJyk7XG5cdFx0XHRcdGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiKCcgKyBncmFkaWVudEVuZFJHQi5qb2luKCcsJykgKyAnKScpO1xuXG5cdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9IGdyYWRpZW50O1xuXHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHRcdGN0eC5tb3ZlVG8ocG9pbnRTdGFydC54LCBwb2ludFN0YXJ0LnkpO1xuXHRcdFx0XHRjdHgubGluZVRvKHBvaW50RW5kLngsIHBvaW50RW5kLnkpO1xuXHRcdFx0XHRjdHguc3Ryb2tlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuIiwiaW1wb3J0IEwgZnJvbSAnbGVhZmxldCc7XG5pbXBvcnQge0hvdGxpbmV9IGZyb20gJy4vaG90bGluZS5qcyc7XG5cblxuZXhwb3J0IHZhciBSZW5kZXJlciA9IEwuQ2FudmFzLmV4dGVuZCh7XG5cdF9pbml0Q29udGFpbmVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0TC5DYW52YXMucHJvdG90eXBlLl9pbml0Q29udGFpbmVyLmNhbGwodGhpcyk7XG5cdFx0dGhpcy5faG90bGluZSA9IG5ldyBIb3RsaW5lKHRoaXMuX2NvbnRhaW5lcik7XG5cdH0sXG5cblx0X3VwZGF0ZTogZnVuY3Rpb24gKCkge1xuXHRcdEwuQ2FudmFzLnByb3RvdHlwZS5fdXBkYXRlLmNhbGwodGhpcyk7XG5cdFx0dGhpcy5faG90bGluZS53aWR0aCh0aGlzLl9jb250YWluZXIud2lkdGgpO1xuXHRcdHRoaXMuX2hvdGxpbmUuaGVpZ2h0KHRoaXMuX2NvbnRhaW5lci5oZWlnaHQpO1xuXHR9LFxuXG5cdF91cGRhdGVQb2x5OiBmdW5jdGlvbiAobGF5ZXIpIHtcblx0XHR2YXIgcGFydHMgPSBsYXllci5fcGFydHM7XG5cblx0XHRpZiAoIXBhcnRzLmxlbmd0aCkgeyByZXR1cm47IH1cblxuXHRcdHRoaXMuX3VwZGF0ZU9wdGlvbnMobGF5ZXIpO1xuXG5cdFx0dGhpcy5faG90bGluZVxuXHRcdFx0LmRhdGEocGFydHMpXG5cdFx0XHQuZHJhdyh0aGlzLl9jbGVhcik7XG5cdH0sXG5cblx0X3VwZGF0ZU9wdGlvbnM6IGZ1bmN0aW9uIChsYXllcikge1xuXHRcdGlmIChsYXllci5vcHRpb25zLm1pbiAhPT0gbnVsbCkge1xuXHRcdFx0dGhpcy5faG90bGluZS5taW4obGF5ZXIub3B0aW9ucy5taW4pO1xuXHRcdH1cblx0XHRpZiAobGF5ZXIub3B0aW9ucy5tYXggIT09IG51bGwpIHtcblx0XHRcdHRoaXMuX2hvdGxpbmUubWF4KGxheWVyLm9wdGlvbnMubWF4KTtcblx0XHR9XG5cdFx0aWYgKGxheWVyLm9wdGlvbnMud2VpZ2h0ICE9PSBudWxsKSB7XG5cdFx0XHR0aGlzLl9ob3RsaW5lLndlaWdodChsYXllci5vcHRpb25zLndlaWdodCk7XG5cdFx0fVxuXHRcdGlmIChsYXllci5vcHRpb25zLm91dGxpbmVXaWR0aCAhPT0gbnVsbCkge1xuXHRcdFx0dGhpcy5faG90bGluZS5vdXRsaW5lV2lkdGgobGF5ZXIub3B0aW9ucy5vdXRsaW5lV2lkdGgpO1xuXHRcdH1cblx0XHRpZiAobGF5ZXIub3B0aW9ucy5vdXRsaW5lQ29sb3IgIT09IG51bGwpIHtcblx0XHRcdHRoaXMuX2hvdGxpbmUub3V0bGluZUNvbG9yKGxheWVyLm9wdGlvbnMub3V0bGluZUNvbG9yKTtcblx0XHR9XG5cdFx0aWYgKGxheWVyLm9wdGlvbnMucGFsZXR0ZSkge1xuXHRcdFx0dGhpcy5faG90bGluZS5wYWxldHRlKGxheWVyLm9wdGlvbnMucGFsZXR0ZSk7XG5cdFx0fVxuXHR9XG59KTtcblxuZXhwb3J0IHZhciByZW5kZXJlciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cdHJldHVybiBMLkJyb3dzZXIuY2FudmFzID8gbmV3IFJlbmRlcmVyKG9wdGlvbnMpIDogbnVsbDtcbn07XG4iLCJpbXBvcnQgTCBmcm9tICdsZWFmbGV0JztcblxuXG5mdW5jdGlvbiBjbGlwU2VnbWVudChhLCBiLCBib3VuZHMsIHVzZUxhc3RDb2RlLCByb3VuZCkge1xuXHR2YXIgY29kZUEgPSB1c2VMYXN0Q29kZSA/IHRoaXMuX2xhc3RDb2RlIDogTC5MaW5lVXRpbC5fZ2V0Qml0Q29kZShhLCBib3VuZHMpLFxuXHRjb2RlQiA9IEwuTGluZVV0aWwuX2dldEJpdENvZGUoYiwgYm91bmRzKSxcblx0Y29kZU91dCwgcCwgbmV3Q29kZTtcblxuXHQvLyBzYXZlIDJuZCBjb2RlIHRvIGF2b2lkIGNhbGN1bGF0aW5nIGl0IG9uIHRoZSBuZXh0IHNlZ21lbnRcblx0dGhpcy5fbGFzdENvZGUgPSBjb2RlQjtcblxuXHR3aGlsZSAodHJ1ZSkge1xuXHRcdC8vIGlmIGEsYiBpcyBpbnNpZGUgdGhlIGNsaXAgd2luZG93ICh0cml2aWFsIGFjY2VwdClcblx0XHRpZiAoIShjb2RlQSB8IGNvZGVCKSkge1xuXHRcdFx0cmV0dXJuIFthLCBiXTtcblx0XHQvLyBpZiBhLGIgaXMgb3V0c2lkZSB0aGUgY2xpcCB3aW5kb3cgKHRyaXZpYWwgcmVqZWN0KVxuXHRcdH0gZWxzZSBpZiAoY29kZUEgJiBjb2RlQikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdC8vIG90aGVyIGNhc2VzXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvZGVPdXQgPSBjb2RlQSB8fCBjb2RlQjtcblx0XHRcdHAgPSBMLkxpbmVVdGlsLl9nZXRFZGdlSW50ZXJzZWN0aW9uKGEsIGIsIGNvZGVPdXQsIGJvdW5kcywgcm91bmQpO1xuXHRcdFx0bmV3Q29kZSA9IEwuTGluZVV0aWwuX2dldEJpdENvZGUocCwgYm91bmRzKTtcblxuXHRcdFx0aWYgKGNvZGVPdXQgPT09IGNvZGVBKSB7XG5cdFx0XHRcdHAueiA9IGEuejtcblx0XHRcdFx0YSA9IHA7XG5cdFx0XHRcdGNvZGVBID0gbmV3Q29kZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHAueiA9IGIuejtcblx0XHRcdFx0YiA9IHA7XG5cdFx0XHRcdGNvZGVCID0gbmV3Q29kZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCB7XG5cdGNsaXBTZWdtZW50OiBjbGlwU2VnbWVudFxufTtcbiIsImltcG9ydCBMIGZyb20gJ2xlYWZsZXQnO1xuaW1wb3J0IHtSZW5kZXJlciwgcmVuZGVyZXJ9IGZyb20gJy4vcmVuZGVyZXIuanMnO1xuaW1wb3J0IFV0aWwgZnJvbSAnLi91dGlsLmpzJztcblxuXG5leHBvcnQgdmFyIFBsdWdpbiA9IEwuUG9seWxpbmUuZXh0ZW5kKHtcblx0c3RhdGljczoge1xuXHRcdFJlbmRlcmVyOiBSZW5kZXJlcixcblx0XHRyZW5kZXJlcjogcmVuZGVyZXJcblx0fSxcblxuXHRvcHRpb25zOiB7XG5cdFx0cmVuZGVyZXI6IHJlbmRlcmVyKCksXG5cdFx0bWluOiAwLFxuXHRcdG1heDogMSxcblx0XHRwYWxldHRlOiB7XG5cdFx0XHQwLjA6ICdncmVlbicsXG5cdFx0XHQwLjU6ICd5ZWxsb3cnLFxuXHRcdFx0MS4wOiAncmVkJ1xuXHRcdH0sXG5cdFx0d2VpZ2h0OiA1LFxuXHRcdG91dGxpbmVDb2xvcjogJ2JsYWNrJyxcblx0XHRvdXRsaW5lV2lkdGg6IDFcblx0fSxcblxuXHRnZXRSR0JGb3JWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3JlbmRlcmVyLl9ob3RsaW5lLmdldFJHQkZvclZhbHVlKHZhbHVlKTtcblx0fSxcblxuXHQvKipcblx0ICogSnVzdCBsaWtlIHRoZSBMZWFmbGV0IHZlcnNpb24sIGJ1dCB3aXRoIHN1cHBvcnQgZm9yIGEgeiBjb29yZGluYXRlLlxuXHQgKi9cblx0X3Byb2plY3RMYXRsbmdzOiBmdW5jdGlvbiAobGF0bG5ncywgcmVzdWx0LCBwcm9qZWN0ZWRCb3VuZHMpIHtcblx0XHR2YXIgZmxhdCA9IGxhdGxuZ3NbMF0gaW5zdGFuY2VvZiBMLkxhdExuZyxcblx0XHRsZW4gPSBsYXRsbmdzLmxlbmd0aCxcblx0XHRpLCByaW5nO1xuXG5cdFx0aWYgKGZsYXQpIHtcblx0XHRcdHJpbmcgPSBbXTtcblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRyaW5nW2ldID0gdGhpcy5fbWFwLmxhdExuZ1RvTGF5ZXJQb2ludChsYXRsbmdzW2ldKTtcblx0XHRcdFx0Ly8gQWRkIHRoZSBhbHRpdHVkZSBvZiB0aGUgbGF0TG5nIGFzIHRoZSB6IGNvb3JkaW5hdGUgdG8gdGhlIHBvaW50XG5cdFx0XHRcdHJpbmdbaV0ueiA9IGxhdGxuZ3NbaV0uYWx0O1xuXHRcdFx0XHRwcm9qZWN0ZWRCb3VuZHMuZXh0ZW5kKHJpbmdbaV0pO1xuXHRcdFx0fVxuXHRcdFx0cmVzdWx0LnB1c2gocmluZyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHR0aGlzLl9wcm9qZWN0TGF0bG5ncyhsYXRsbmdzW2ldLCByZXN1bHQsIHByb2plY3RlZEJvdW5kcyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBKdXN0IGxpa2UgdGhlIExlYWZsZXQgdmVyc2lvbiwgYnV0IHVzZXMgYFV0aWwuY2xpcFNlZ21lbnQoKWAuXG5cdCAqL1xuXHRfY2xpcFBvaW50czogZnVuY3Rpb24gKCkge1xuXHRcdGlmICh0aGlzLm9wdGlvbnMubm9DbGlwKSB7XG5cdFx0XHR0aGlzLl9wYXJ0cyA9IHRoaXMuX3JpbmdzO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuX3BhcnRzID0gW107XG5cblx0XHR2YXIgcGFydHMgPSB0aGlzLl9wYXJ0cyxcblx0XHRib3VuZHMgPSB0aGlzLl9yZW5kZXJlci5fYm91bmRzLFxuXHRcdGksIGosIGssIGxlbiwgbGVuMiwgc2VnbWVudCwgcG9pbnRzO1xuXG5cdFx0Zm9yIChpID0gMCwgayA9IDAsIGxlbiA9IHRoaXMuX3JpbmdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRwb2ludHMgPSB0aGlzLl9yaW5nc1tpXTtcblxuXHRcdFx0Zm9yIChqID0gMCwgbGVuMiA9IHBvaW50cy5sZW5ndGg7IGogPCBsZW4yIC0gMTsgaisrKSB7XG5cdFx0XHRcdHNlZ21lbnQgPSBVdGlsLmNsaXBTZWdtZW50KHBvaW50c1tqXSwgcG9pbnRzW2ogKyAxXSwgYm91bmRzLCBqLCB0cnVlKTtcblxuXHRcdFx0XHRpZiAoIXNlZ21lbnQpIHsgY29udGludWU7IH1cblxuXHRcdFx0XHRwYXJ0c1trXSA9IHBhcnRzW2tdIHx8IFtdO1xuXHRcdFx0XHRwYXJ0c1trXS5wdXNoKHNlZ21lbnRbMF0pO1xuXG5cdFx0XHRcdC8vIGlmIHNlZ21lbnQgZ29lcyBvdXQgb2Ygc2NyZWVuLCBvciBpdCdzIHRoZSBsYXN0IG9uZSwgaXQncyB0aGUgZW5kIG9mIHRoZSBsaW5lIHBhcnRcblx0XHRcdFx0aWYgKChzZWdtZW50WzFdICE9PSBwb2ludHNbaiArIDFdKSB8fCAoaiA9PT0gbGVuMiAtIDIpKSB7XG5cdFx0XHRcdFx0cGFydHNba10ucHVzaChzZWdtZW50WzFdKTtcblx0XHRcdFx0XHRrKys7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0X2NsaWNrVG9sZXJhbmNlOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMub3B0aW9ucy53ZWlnaHQgLyAyICsgdGhpcy5vcHRpb25zLm91dGxpbmVXaWR0aCArIChMLkJyb3dzZXIudG91Y2ggPyAxMCA6IDApO1xuXHR9XG59KTtcblxuZXhwb3J0IHZhciBwbHVnaW4gPSBmdW5jdGlvbiAobGF0bG5ncywgb3B0aW9ucykge1xuXHRyZXR1cm4gbmV3IFBsdWdpbihsYXRsbmdzLCBvcHRpb25zKTtcbn07XG5cbiIsIi8qXG4gKGMpIDIwMTUsIGlvc3BoZXJlIEdtYkhcbiBMZWFmbGV0LmhvdGxpbmUsIGEgTGVhZmxldCBwbHVnaW4gZm9yIGRyYXdpbmcgZ3JhZGllbnRzIGFsb25nIHBvbHlsaW5lcy5cbiBodHRwczovL2dpdGh1Yi5jb20vaW9zcGhlcmUvTGVhZmxldC5ob3RsaW5lL1xuKi9cblxuaW1wb3J0IEwgZnJvbSAnbGVhZmxldCc7XG5pbXBvcnQge1BsdWdpbiwgcGx1Z2lufSBmcm9tICcuL3BsdWdpbi5qcyc7XG5cbmV4cG9ydCB7TH07XG5cbkwuSG90bGluZSA9IFBsdWdpbjtcblxuTC5ob3RsaW5lID0gcGx1Z2luO1xuXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7Ozs7O0FBTUEsQUFBTyxJQUFJLE9BQU8sR0FBRyxVQUFVLE1BQU0sRUFBRTtDQUN0QyxJQUFJLENBQUMsQ0FBQyxJQUFJLFlBQVksT0FBTyxDQUFDLEVBQUUsRUFBRSxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUU7O0NBRS9ELElBQUksY0FBYyxHQUFHO0VBQ3BCLEdBQUcsRUFBRSxPQUFPO0VBQ1osR0FBRyxFQUFFLFFBQVE7RUFDYixHQUFHLEVBQUUsS0FBSztFQUNWLENBQUM7O0NBRUYsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFN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
