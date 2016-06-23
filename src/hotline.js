/**
 * Core renderer.
 * @constructor
 * @param {HTMLElement | string} canvas - &lt;canvas> element or its id
 * to initialize the instance on.
 */
export var Hotline = function (canvas) {
	if (!(this instanceof Hotline)) { return new Hotline(canvas); }

	var defaultPalette = {
		0.0: 'green',
		0.5: 'yellow',
		1.0: 'red'
	};

	this._canvas = canvas = typeof canvas === 'string'
		? document.getElementById(canvas)
		: canvas;

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
