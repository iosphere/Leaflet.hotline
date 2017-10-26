/*
 (c) 2015, iosphere GmbH
 Leaflet.hotline, a Leaflet plugin for drawing gradients along polylines.
 https://github.com/iosphere/Leaflet.hotline/
 */

L.Util.Gradienter = require('./Gradienter');

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
