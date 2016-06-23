import L from 'leaflet';
import { Hotline } from './hotline.js';


export var Renderer = L.Canvas.extend({
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
		if (layer.options.min != null) {
			this._hotline.min(layer.options.min);
		}
		if (layer.options.max != null) {
			this._hotline.max(layer.options.max);
		}
		if (layer.options.weight != null) {
			this._hotline.weight(layer.options.weight);
		}
		if (layer.options.outlineWidth != null) {
			this._hotline.outlineWidth(layer.options.outlineWidth);
		}
		if (layer.options.outlineColor != null) {
			this._hotline.outlineColor(layer.options.outlineColor);
		}
		if (layer.options.palette) {
			this._hotline.palette(layer.options.palette);
		}
	}
});

export var renderer = function (options) {
	return L.Browser.canvas ? new Renderer(options) : null;
};
