/*!
 * (c) 2015, iosphere GmbH
 *  Leaflet.hotline, a Leaflet plugin for drawing gradients along polylines.
 *  https://github.com/iosphere/Leaflet.hotline/
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

/*
 (c) 2015, iosphere GmbH
 Leaflet.hotline, a Leaflet plugin for drawing gradients along polylines.
 https://github.com/iosphere/Leaflet.hotline/
 */

L.Util.Gradienter = __webpack_require__(1);

L.HotlineUtil = L.extend(L.LineUtil, {
    /**
     * This is just a copy of the original Leaflet version that support a third z coordinate.
     * @see {@link http://leafletjs.com/reference.html#lineutil-clipsegment|Leaflet}
     */
    clipSegment: function (a, b, bounds, useLastCode, round) {
        var codeA = useLastCode ? this._lastCode : L.LineUtil._getBitCode(a, bounds),
            codeB = L.LineUtil._getBitCode(b, bounds),
            codeOut, p, newCode;

        // save 2nd code to avoid calculating it on the next segment
        this._lastCode = codeB;

        while (true) {
            // if a,b is inside the clip window (trivial accept)
            if (!(codeA | codeB)) { return [a, b]; }

            // if a,b is outside the clip window (trivial reject)
            if (codeA & codeB) { return false; }

            // other cases
            codeOut = codeA || codeB;
            p = this._getEdgeIntersection(a, b, codeOut, bounds, round);
            newCode = this._getBitCode(p, bounds);

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
    },

    /**
     * This is just a copy of the original Leaflet version that support a cantBeDeleted.
     */
    _simplifyDP: function (points, sqTolerance) {

        var len = points.length,
            ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,
            markers = new ArrayConstructor(len);

        markers[0] = markers[len - 1] = 1;

        for (var j = 0, pointsLength = points.length; j < pointsLength; j++) {
            if (points[j].cantBeDeleted) {
                markers[j] = 1;
            }
        }

        this._simplifyDPStep(points, markers, sqTolerance, 0, len - 1);

        var i,
            newPoints = [];

        for (i = 0; i < len; i++) {
            if (markers[i]) {
                newPoints.push(points[i]);
            }
        }

        return newPoints;
    },

    /**
     * This is just a copy of the original Leaflet version that support a cantBeDeleted.
     */
    _reducePoints: function (points, sqTolerance) {
        var reducedPoints = [points[0]];

        for (var i = 1, prev = 0, len = points.length; i < len; i++) {
            if (L.LineUtil._sqDist(points[i], points[prev]) > sqTolerance || points[i].cantBeDeleted) {
                reducedPoints.push(points[i]);
                prev = i;
            }
        }
        if (prev < len - 1) {
            reducedPoints.push(points[len - 1]);
        }
        return reducedPoints;
    }
});

/**
 * Core renderer.
 * @constructor
 * @param {HTMLElement | string} canvas - &lt;canvas> element or its id
 * to initialize the instance on.
 */
var Hotline = function (canvas, map) {
    if (!(this instanceof Hotline)) { return new Hotline(canvas); }

    var defaultPalette = {
        0.0: 'green',
        0.5: 'yellow',
        1.0: 'red'
    };

    this._map = map;
    this._canvas = canvas = typeof canvas === 'string'
        ? document.getElementById(canvas)
        : canvas;

    this._ctx = canvas.getContext('2d');
    this._width = canvas.width;
    this._height = canvas.height;

    this._weight = 5;

    this._min = 0;
    this._max = 1;

    this._data = [];
    this._dataOrigin = [];

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

    zoomWeight: function (zoomWeight) {
        this._zoomWeight = zoomWeight;
        return this;
    },

    /**
     * Sets the width of the outline around the path.
     * @param {number} outlines - array of the styles of the outline.
     */
    outlines: function (outlines) {
        this._outlines = outlines;
        return this;
    },

    /**
     * Sets the palette gradient.
     * @param {Object.<number, string>} palette  - Gradient definition.
     * e.g. { 0.0: 'white', 1.0: 'black' }
     */
    palette: function (palette) {
        this._palette = this.calcPalette(palette);
        return this;
    },

    calcPalette: function(palette) {
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

        return ctx.getImageData(0, 0, 1, 256).data;
    },

    unknownColor: function(unknownColor) {
        var palette = this.calcPalette([unknownColor]);
        this._unknownColor = [
            palette[0],
            palette[1],
            palette[2]
        ];
        return this;
    },

    maxGradient: function (maxGradient) {
        this._maxGradient = maxGradient;
        return this;
    },

    minGradient: function (minGradient) {
        this._minGradient = minGradient;
        return this;
    },

    minColorLength: function (minColorLength) {
        this._minColorLength = minColorLength;
        return this;
    },

    gradientPercent: function (gradientPercent) {
        this._gradientPercent = gradientPercent;
        return this;
    },

    color: function(color) {
        var palette = this.calcPalette([color]);
        this._color = [
            palette[0],
            palette[1],
            palette[2]
        ];
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
        this._dataOrigin = data;

        var i, j, dataLength, preCalculatedData = [], path, pathLength;
        // Предрасчет точек начала градиента
        for (i = 0, dataLength = data.length; i < dataLength; i++) {
            path = data[i];
            preCalculatedData[i] = [];
            for (j = 0, pathLength = path.length; j < pathLength; j++) {
                preCalculatedData[i][j] = L.point(path[j].x, path[j].y);
                preCalculatedData[i][j].z = path[j].z;
            }

            preCalculatedData[i] = this.setGradientPoint(preCalculatedData[i]);
        }
        // предрасчет RGB
        this._data = this.setRGBData(preCalculatedData);

        return this;
    },

    setGradientPoint: function(path) {
        var gradienter = new L.Util.Gradienter(path, {
            maxGradient: this._maxGradient,
            minGradient: this._minGradient,
            minColorLength: this._minColorLength,
            gradientPercent: this._gradientPercent
        });
        return gradienter.getGradientPath();
    },

    setRGBData: function(data) {
        var i, j, dataLength, path, pathLength, pointPrev, pointCurrent, pointNext;

        for (i = 0, dataLength = data.length; i < dataLength; i++) {
            path = data[i];

            for (j = 0, pathLength = path.length; j < pathLength; j++) {
                pointCurrent = path[j];
                if (typeof pointCurrent.z !== 'undefined') {
                    pointCurrent.rgb = this.getRBGForPoint(pointCurrent);
                }
            }

            for (j = 0, pathLength = path.length; j < pathLength; j++) {
                pointPrev = path[j - 1];
                pointCurrent = path[j];
                pointNext = path[j + 1];

                // Если надо вычислить - вычисляем
                if (!pointCurrent.rgb) {
                    if (pointPrev && pointNext && pointPrev.rgb && pointNext.rgb) {
                        pointCurrent.rgb =  [
                            Math.floor((pointPrev.rgb[0] + pointNext.rgb[0]) / 2),
                            Math.floor((pointPrev.rgb[1] + pointNext.rgb[1]) / 2),
                            Math.floor((pointPrev.rgb[2] + pointNext.rgb[2]) / 2)
                        ];
                    } else {
                        pointCurrent.rgb = this.getRBGForPoint(pointCurrent);
                    }
                }
            }
        }
        return data;
    },

    getRBGForPoint: function(point) {
        var rgb = point.rgb;
        if (!rgb) {
            if (typeof point.z === 'undefined') {
                rgb = this._color || this._unknownColor;
            } else if (point.z === -1) {
                rgb = this._unknownColor;
            } else {
                rgb = this.getRGBForValue(point.z);
            }
        }
        return rgb;
    },

    /**
     * Adds a path to the list of paths.
     * @param {Path} path
     */
    add: function (path) {
        this.data(this._dataOrigin.push(path));
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
        ctx.lineJoin = 'round';

        this._drawOutlines(ctx, clear);

        // No need to draw expensive gradients when clearing
        if (clear) { return this; }

        this._drawHotline(ctx);
        ctx.fill();

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

    _getActualWeight: function(obj) {
        obj = obj || this;
        var zoomWeight = obj._zoomWeight || obj.zoomWeight;
        if (zoomWeight && zoomWeight.length) {
            var i, zoomWeightLength = zoomWeight.length;
            var zoom = this._map.getZoom();
            for (i = 0; i < zoomWeightLength; i++) {
                if (zoom >= zoomWeight[i].zoom) {
                    return zoomWeight[i].weight;
                }
            }
            // берем последний
            return zoomWeight[i - 1].weight;
        }
        return obj._weight || obj.weight;
    },

    _drawOutlines: function(ctx, clear) {
        if (!this._outlines) {
            return;
        }

        var i, outlinesLength;
        for (i = 0, outlinesLength = this._outlines.length; i < outlinesLength; i++) {
            this._drawOutline(ctx, clear, this._outlines[i].color, this._getActualWeight(this._outlines[i]));
        }
    },

    /**
     * Draws the outline of the graphs.
     * @private
     */
    _drawOutline: function (ctx, clear, color, width) {
        var i, j, dataLength, path, lineWidth, pathLength, pointEnd;
        var actualWeight = this._getActualWeight();

        if (clear || width) {
            for (i = 0, dataLength = this._data.length; i < dataLength; i++) {
                path = this._data[i];
                lineWidth = actualWeight + 2 * width;

                // If clearing a path, do it with its previous line width and a little bit extra
                path._prevWidth = ctx.lineWidth = clear ? (path._prevWidth || lineWidth) + 1 : lineWidth;

                pathLength = path.length;
                if (pathLength) {
                    ctx.strokeStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(path[0].x, path[0].y);
                    for (j = 1, pathLength = path.length; j < pathLength; j++) {
                        pointEnd = path[j];
                        ctx.lineTo(pointEnd.x, pointEnd.y);
                    }
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
        var i, j, dataLength, path, pathLength, pointStart, pointEnd, gradient;
        var oneColor = [], oneColorLength, k;

        ctx.lineWidth = this._getActualWeight();

        for (i = 0, dataLength = this._data.length; i < dataLength; i++) {
            path = this._data[i];

            for (j = 1, pathLength = path.length; j < pathLength; j++) {
                pointStart = path[j - 1];
                pointEnd = path[j];

                oneColor.push(pointStart);
                if (pointStart.z !== pointEnd.z || j === pathLength - 1) {
                    // Строим линии одного цвета
                    var firstPoint = oneColor[0];
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgb(' + firstPoint.rgb.join(',') + ')';
                    ctx.moveTo(firstPoint.x, firstPoint.y);
                    for (k = 1, oneColorLength = oneColor.length; k < oneColorLength; k++) {
                        ctx.lineTo(oneColor[k].x, oneColor[k].y);
                    }
                    ctx.stroke();
                    oneColor = [];


                    // Create a gradient for each segment, pick start end end colors from palette gradient
                    gradient = ctx.createLinearGradient(pointStart.x, pointStart.y, pointEnd.x, pointEnd.y);
                    gradient.addColorStop(0, 'rgb(' + pointStart.rgb.join(',') + ')');
                    gradient.addColorStop(1, 'rgb(' + pointEnd.rgb.join(',') + ')');
                    ctx.strokeStyle = gradient;
                    ctx.beginPath();
                    ctx.moveTo(pointStart.x, pointStart.y);
                    ctx.lineTo(pointEnd.x, pointEnd.y);
                    ctx.stroke();
                }
            }
        }
    }
};


L.HotlineRenderer = L.Canvas.extend({
    _initContainer: function () {
        L.Canvas.prototype._initContainer.call(this);
        this._hotline = new Hotline(this._container, this._map);
    },

    _update: function () {
        L.Canvas.prototype._update.call(this);
        this._hotline.width(this._container.width);
        this._hotline.height(this._container.height);
    },

    _updatePoly: function (layer) {
        this._redrawBounds = null;

        var parts = layer._parts,
            len = parts.length;

        if (!len) { return; }

        this._drawnLayers[layer._leaflet_id] = layer;

        this._updateOptions(layer);

        this._hotline
            .data(parts)
            .draw(this._clear);
    },

    _updateOptions: function (layer) {
        if (layer.options.hasOwnProperty('color')) {
            this._hotline.color(layer.options.color);
        }
        if (layer.options.min != null) {
            this._hotline.min(layer.options.min);
        }
        if (layer.options.max != null) {
            this._hotline.max(layer.options.max);
        }
        if (layer.options.weight != null) {
            this._hotline.weight(layer.options.weight);
        }
        if (layer.options.zoomWeight != null) {
            this._hotline.zoomWeight(layer.options.zoomWeight);
        }
        if (layer.options.outlines != null) {
            this._hotline.outlines(layer.options.outlines);
        }
        if (layer.options.palette) {
            this._hotline.palette(layer.options.palette);
        }
        if (layer.options.unknownColor) {
            this._hotline.unknownColor(layer.options.unknownColor);
        }
        if (layer.options.maxGradient) {
            this._hotline.maxGradient(layer.options.maxGradient);
        }
        if (layer.options.minGradient) {
            this._hotline.minGradient(layer.options.minGradient);
        }
        if (layer.options.minColorLength) {
            this._hotline.minColorLength(layer.options.minColorLength);
        }
        if (layer.options.gradientPercent) {
            this._hotline.gradientPercent(layer.options.gradientPercent);
        }
    }
});
L.hotlineRenderer = function (options) {
    return new L.HotlineRenderer(options);
};

var renderer = function (options) {
    return L.Browser.canvas ? L.hotlineRenderer(options) : null;
};

L.Hotline = L.Polyline.extend({
    statics: {
        Renderer: L.hotlineRenderer,
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
        unknownColor: '#aaa',
        weight: 6,
        zoomWeight: [
            // для zoom <= 13 weight = 5
            {zoom: 13, weight: 5},
            // для zoom <= 11 weight = 4
            {zoom: 11, weight: 4}
        ],
        outlines: [{
            color: '#aaa',
            weight: 4,
            zoomWeight: [
                // для zoom <= 13 weight = 4
                {zoom: 13, weight: 4},
                // для zoom <= 11 weight = 3
                {zoom: 11, weight: 3}
            ]
        }, {
            color: 'white',
            weight: 3,
            zoomWeight: [
                // для zoom <= 13 weight = 3
                {zoom: 13, weight: 3},
                // для zoom <= 11 weight = 2
                {zoom: 11, weight: 2}
            ]
        }],
        maxGradient: 30,
        minGradient: 10,
        minColorLength: 10,
        gradientPercent: 30
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
                if (projectedBounds) {
                    projectedBounds.extend(ring[i]);
                }
            }
            result.push(ring);
        } else {
            for (i = 0; i < len; i++) {
                this._projectLatlngs(latlngs[i], result, projectedBounds);
            }
        }
    },

    /**
     * Just like the Leaflet version, but uses cantBeDeleted.
     */
    _simplifyPoints: function() {
        var parts = this._parts,
            tolerance = this.options.smoothFactor;

        for (var i = 0, len = parts.length; i < len; i++) {
            var path = parts[i];
            for (var j = 0, pathLength = path.length; j < pathLength; j++) {
                // Точка не может быть удалена, если кто-то из соседей имеет другой цвет
                path[j].cantBeDeleted = !path[j - 1] || path[j - 1].z !== path[j].z || !path[j + 1] || path[j + 1].z !== path[j].z;
            }

            parts[i] = L.HotlineUtil.simplify(parts[i], tolerance);
        }
    },

    /**
     * Just like the Leaflet version, but uses `L.HotlineUtil.clipSegment()`.
     */
    _clipPoints: function () {
        var bounds = this._renderer._bounds;

        this._parts = [];
        if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
            return;
        }

        if (this.options.noClip) {
            this._parts = this._rings;
            return;
        }

        var parts = this._parts,
            i, j, k, len, len2, segment, points;

        for (i = 0, k = 0, len = this._rings.length; i < len; i++) {
            points = this._rings[i];

            for (j = 0, len2 = points.length; j < len2 - 1; j++) {
                segment = L.HotlineUtil.clipSegment(points[j], points[j + 1], bounds, j, true);

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

    setOpacity: function(opacity) {
        if (this._renderer && this._renderer._hotline && this._renderer._hotline._canvas) {
            this._renderer._hotline._canvas.style.opacity = opacity;
        }
    },

    /**
     * Just like the Leaflet version, but uses this.options.outlines.
     */
    _clickTolerance: function () {
        var outlinesWidthes = [], i, outlinesLength;
        for (i = 0, outlinesLength = this.options.outlines.length; i < outlinesLength; i++) {
            outlinesWidthes.push(this.options.outlines[i].weight);
        }
        return this.options.weight / 2 + Math.max.apply(this, outlinesWidthes) + (L.Browser.touch ? 10 : 0);
    }
});

L.hotline = function (latlngs, options) {
    return new L.Hotline(latlngs, options);
};


/***/ }),
/* 1 */
/***/ (function(module, exports) {

function makeGradienter() {
    var MathUtil = {
        /**
         * Откладываем от point1 расстояние distance в направлении point2
         *
         * @param point1
         * @param point2
         * @param distance
         * @returns {*}
         */
        findPointOnLine: function (point1, point2, distance) {
            if (distance === 0) {
                return point1;
            }

            var x1 = point1.x;
            var y1 = point1.y;
            var x2 = point2.x;
            var y2 = point2.y;

            // Вычисляем направляющий вектор прямой
            var P = [x2 - x1, y2 - y1];
            // Вычисляем длину направляющего вектора
            var pLen = Math.sqrt(P[0] * P[0] + P[1] * P[1]);
            // Вычисляем единичный направляющий вектор прямой
            var unitP = [P[0] / pLen, P[1] / pLen]; // Возможно нужно учесть направление, проверить на практике. Коллинеарность вообще-то не означает сонаправленность.
            // Вычисляем координаты искомой точки
            return {x: x1 + distance * unitP[0], y: y1 + distance * unitP[1]};
        },

        distanceTo: function(point1, point2) {
            return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
        }
    };

    /**
     * Рассчитывает градиенты
     */
    function Gradienter(data, options) {
        options = options || {};

        this._data = data || [];
        this._grouped = [];
        this._gradientPercent = options.gradientPercent || 30;
        this._minGradient = options.minGradient || 10;
        this._minColorLength = options.minColorLength || 20;
        this._maxGradient = options.maxGradient || 30;
        this._needRecalc = true;
    }

    /**
     * Группировка точек по цвету
     * @returns {Gradienter}
     */
    Gradienter.prototype._groupedByColor = function() {
        // Группируем по значению z у подряд идущих точек
        var i, pathLength, pointCurrent, prevZ, groupedTmp = [];
        for (i = 0, pathLength = this._data.length; i < pathLength; i++) {
            pointCurrent = this._data[i];
            if (pointCurrent.z === prevZ) {
                groupedTmp.push(pointCurrent);
            } else {
                if (groupedTmp.length) {
                    if (groupedTmp.length === 1) {
                        groupedTmp.push(groupedTmp[0]);
                        }
                    this._grouped.push({
                        points: groupedTmp,
                        color: groupedTmp[0].z
                    });
                }
                groupedTmp = [pointCurrent];
            }
            prevZ = pointCurrent.z;
        }
        if (groupedTmp.length) {
            this._grouped.push({
                points: groupedTmp,
                color: groupedTmp[0].z
            });
        }

        return this;
    };
    /**
     * Расчет отрезков одного цвета
     * @returns {Gradienter}
     */
    Gradienter.prototype._setGroupsDistance = function() {
        // Высчитываем длину каждого участка
        var i, j, groupedLength, group, groupPointsLength, pointNext, pointCurrent, distance = 0;
        for (i = 0, groupedLength = this._grouped.length; i < groupedLength; i++) {
            group = this._grouped[i];
            distance = 0;

            for (j = 0, groupPointsLength = group.points.length; j < groupPointsLength; j++) {
                pointCurrent = group.points[j];
                pointNext = group.points[j + 1];

                if (pointNext) {
                    distance += MathUtil.distanceTo(pointCurrent, pointNext);
                }
            }

            group.distance = distance;
            group.toDelete = this._minColorLength > group.distance;
        }
        return this;
    };
    /**
     * Удаляем пустые группы
     */
    Gradienter.prototype._cleanGrouped = function() {
        var i, groupedLength, newGrouped = [], group;
        for (i = 0, groupedLength = this._grouped.length; i < groupedLength; i++) {
            group = this._grouped[i];
            if (group && group.points && group.points.length) {
                newGrouped.push(this._grouped[i]);
            }
        }
        this._grouped = newGrouped;
        return this;
    };
    /**
     * Расчет длин градиента
     * @returns {Gradienter}
     */
    Gradienter.prototype._setGradientsLength = function() {
        var i, group, groupedLength, nextGroup, prevGroup;
        for (i = 0, groupedLength = this._grouped.length; i < groupedLength; i++) {
            // Рассчитываем градиенты для начала и конца для участка, загоняя в рамки _maxGradient и _minGradient
            prevGroup = this._grouped[i - 1];
            group = this._grouped[i];
            nextGroup = this._grouped[i + 1];

            group.startGradient = 0;
            if (prevGroup) {
                group.startGradient = Math.floor(Math.min(prevGroup.distance, group.distance) * this._gradientPercent / 100);
                group.startGradient = Math.max(Math.min(group.startGradient, this._maxGradient), this._minGradient);
            }
            group.endGradient = 0;
            if (nextGroup) {
                group.endGradient = Math.floor(Math.min(nextGroup.distance, group.distance) * this._gradientPercent / 100);
                group.endGradient = Math.max(Math.min(group.endGradient, this._maxGradient), this._minGradient);
            }
        }
        return this;
    };
    Gradienter.prototype.changePointsColor = function(color, points) {
        var i, pointsLength;
        for (i = 0, pointsLength = points.length; i < pointsLength; i++) {
            points[i].z = color;
        }
        return points;
    };
    /**
     * Расчет точек начала и конца градиента
     * @returns {Gradienter}
     */
    Gradienter.prototype._calculateGradientPoints = function() { // !!!
        var i, j, pointCurrent, newPoint, groupedLength, group, groupPointsLength, pointNext, distance = 0;
        for (i = 0, groupedLength = this._grouped.length; i < groupedLength; i++) {
            group = this._grouped[i];
            // Находим точку начала и конца градиента
            // Перебираем точки, считаем дистанцию, как только она перевалила за значение для градиента
            if (group.startGradient) {
                distance = 0;
                var prevDistance = 0;
                for (j = 0, groupPointsLength = group.points.length; j < groupPointsLength; j++) {
                    pointCurrent = group.points[j];
                    pointNext = group.points[j + 1];

                    if (pointNext) {
                        distance += MathUtil.distanceTo(pointCurrent, pointNext);
                    }

                    if (distance > group.startGradient) {
                        // находим точную точку начала
                        // Задаем ей pointCurrent.z
                        // Выходим из цикла
                        newPoint = MathUtil.findPointOnLine(pointCurrent, pointNext, group.startGradient - prevDistance);
                        newPoint.z = pointNext.z;
                        group.points = group.points.slice(0, j + 1).concat([newPoint]).concat(group.points.slice(j + 1));
                        break;
                    }

                    prevDistance = distance;
                }
            }

            // То же самое, но для конца градиента
            if (group.endGradient) {
                distance = 0;
                var pointPrev;
                for (groupPointsLength = group.points.length - 1, j = groupPointsLength; j >= 0; j--) {
                    pointCurrent = group.points[j];
                    pointPrev = group.points[j - 1];

                    if (pointPrev) {
                        distance += MathUtil.distanceTo(pointCurrent, pointPrev);
                    }

                    if (distance > group.endGradient) {
                        newPoint = MathUtil.findPointOnLine(pointPrev, pointCurrent, distance - group.endGradient);
                        newPoint.z = pointCurrent.z;
                        group.points = group.points.slice(0, j).concat([newPoint]).concat(group.points.slice(j));
                        break;
                    }
                }
            }

            if (group.startGradient && group.points[0]) {
                group.points[0].z = undefined;
            }
            if (group.endGradient && group.points[group.points.length - 1]) {
                group.points[group.points.length - 1].z = undefined;
            }
        }
        return this;
    };
    /**
     * Получение нового массива точек
     * @returns {Array}
     */
    Gradienter.prototype._getPathByGrouped = function() {
        var i, groupedLength, path = [];
        for (i = 0, groupedLength = this._grouped.length; i < groupedLength; i++) {
            // При склеивании надо убирать последнюю точку у всех, кроме последнего, т.к. они дублируются
            var toConcat = this._grouped[i].points;
            if (i !== groupedLength - 1) {
                toConcat.pop();
            }
            path = path.concat(toConcat);
        }
        return path;
    };
    Gradienter.prototype._calculateGradientLength = function() {
        while (this._needRecalc) {
            this._needRecalc = false;
            this._setGroupsDistance()._deleteShortGroups();
        }
        this._setGradientsLength();
        return this;
    };
    Gradienter.prototype._deleteShortGroups = function() {
        var i, group, groupedLength, nextGroup, prevGroup;
        for (i = 0, groupedLength = this._grouped.length; i < groupedLength; i++) {
            prevGroup = this._grouped[i - 1];
            group = this._grouped[i];
            nextGroup = this._grouped[i + 1];
            if (group.toDelete && (prevGroup || nextGroup)) {
                // Приписываем к предыдущей, если следующей нет, либо следующая короче
                if (prevGroup && (!nextGroup || prevGroup.distance > nextGroup.distance)) {
                    group.points = this.changePointsColor(prevGroup.color, group.points);
                    prevGroup.points = prevGroup.points.concat(group.points);
                } else if (nextGroup) {
                    group.points = this.changePointsColor(nextGroup.color, group.points);
                    nextGroup.points = group.points.concat(nextGroup.points);
                }
                delete this._grouped[i];
                this._needRecalc = true;
            }
        }
        return this._cleanGrouped();
    };
    Gradienter.prototype.getGradientPath = function() {
        return this._groupedByColor()._calculateGradientLength()._calculateGradientPoints()._getPathByGrouped();
    };

    return Gradienter;
}

module.exports = makeGradienter();


/***/ })
/******/ ]);
});