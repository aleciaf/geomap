/*!
 * Geomap v1.3 / Géocarte v1.3
 * Web Experience Toolkit (WET) / Boîte à outils de l'expérience Web (BOEW)
 * www.tbs.gc.ca/ws-nw/wet-boew/terms / www.sct.gc.ca/ws-nw/wet-boew/conditions
 */

/**
* Geomap is a jQuery plugin for adding a Web map to your page through a simple wrapper
*  for OpenLayers (http://www.openlayers.org/). Anything that is possible with OpenLayers, 
*  is also possible with Geomap.
*
* Supports : Firefox, Opera, Safari, Chrome, IE 6 and IE 7+
*
* @name Geomap
* @author Dave Schindler, Alex Bégin
* @version 1.1
*/
 
(function ($) {
	var config;
	window.map = null;
	init();
	$(document).ready(function(){$(document).geomap();});
	
	function init() {
		var defaults = { theme: 'default' };
		// get the plugin parameters from the html page
		var params = Utils.loadParamsFromScriptID("geomap");
		// extend the defaults with the params, if any
		config = $.extend(defaults, params);
		
		// load dependencies
		PE.load('geomap/proj4js-compressed.js');
		PE.load('geomap/OpenLayers.js');
		PE.load('geomap/EPSG42304.js');
		
		// load API dependencies
		if (config.apis && config.apis.length) {
			var src = decodeURIComponent(config.apis).split(',');
			for (var i=0; i<src.length; i++) {
				document.write('<script type="text/javascript" src="' + src[i] + '"><\/script>');
			}
		}
	} // end of init
	
	$.fn.geomap = function () {
		// http://www.urbandictionary.com/define.php?term=Accessiblize&defid=5290458
		accessibilize();
		// Location for the controls' images
		OpenLayers.ImgPath = Utils.getSupportPath() + '/geomap/theme/' + config.theme + '/img/';
		PE.language === 'fra' ? OpenLayers.Lang.setCode('fr') : OpenLayers.Lang.setCode('en');
		
		// load custom script
		$.ajax({
			url: Utils.getLibraryPath() + '/geomap/' + config.codeToRun,
			dataType: "text",
			success: function (data) {
				// run the user's file
				(new Function(data))();
				
				// fix for the defect #3204 http://tbs-sct.ircan-rican.gc.ca/issues/3204
				$("#" + map.div.id).before((PE.language == "eng") ? '<p><strong>Keyboard users:</strong> Use the arrow keys to move the map and use plus and minus to zoom.</p>' : '<p><strong>Utilisateurs de clavier :</strong> Utiliser les touches flèches pour déplacer la carte et utiliser les touches plus et négatif pour faire un zoom.</p>');
				
				//wai-aria();
				// Repoint the css to the proper location. A fix for a "bug" in Openlayers prevents this from being done through its API (see http://trac.openlayers.org/ticket/1206).
				$('link[href*="js/lib/geomap/"]').attr('href', Utils.getSupportPath() + '/geomap/theme/' + config.theme + '/style.css');
			}
		});
	}; // end of $.fn.geomap
	
	function removeDefaultControls() {
		var defaultControls = map.getControlsBy("CLASS_NAME", /OpenLayers\.Control\.\w*/);
		for (var c in defaultControls) {
			if (defaultControls.hasOwnProperty(c)) {
				map.removeControl(defaultControls[c]);
			}
		}
	}
	
	function waiaria(){
	
	}
	
	function accessibilize() {
		OpenLayers.Control.PanZoom.prototype._addButton = 
		OpenLayers.Control.PanZoomBar.prototype._addButton = function(id, img, xy, sz, title) {
			var imgLocation = OpenLayers.Util.getImagesLocation() + img;
			var btn = OpenLayers.Util.createAlphaImageDiv(this.id + "_" + id, xy, sz, imgLocation, "absolute");
			// add tooltips and alt text
			if (title) {
				btn.firstChild.alt = title;
				btn.title = title;
			}
			// make it tab-able
			btn.tabIndex = 0;
			//we want to add the outer div
			this.div.appendChild(btn);
			OpenLayers.Event.observe(btn, "mousedown", OpenLayers.Function.bindAsEventListener(this.buttonDown, btn));
			OpenLayers.Event.observe(btn, "dblclick", OpenLayers.Function.bindAsEventListener(this.doubleClick, btn));
			OpenLayers.Event.observe(btn, "click", OpenLayers.Function.bindAsEventListener(this.doubleClick, btn));
			// keyboard events
			OpenLayers.Event.observe(btn, "keydown", OpenLayers.Function.bindAsEventListener(this.buttonDown, btn));
			btn.action = id;
			btn.map = this.map;
			if(!this.slideRatio) {
				var slideFactorPixels = this.slideFactor;
				var getSlideFactor = function() {
					return slideFactorPixels;
				};
			} else {
				var slideRatio = this.slideRatio;
				var getSlideFactor = function(dim) {
					return this.map.getSize()[dim] * slideRatio;
				};
			}
			btn.getSlideFactor = getSlideFactor;
			//we want to remember/reference the outer div
			this.buttons.push(btn);
			return btn;
		};
		
		OpenLayers.Control.PanZoom.prototype.draw = function(px) {
			// initialize our internal div
			OpenLayers.Control.prototype.draw.apply(this, arguments);
			px = this.position;
			// place the controls
			this.buttons = [];
			var sz = new OpenLayers.Size(18,18);
			var centered = new OpenLayers.Pixel(px.x+sz.w/2, px.y);
			if(PE.language === 'eng') {
				this._addButton("panup", "north-mini.png", centered, sz, "Pan up");
				px.y = centered.y+sz.h;
				this._addButton("panleft", "west-mini.png", px, sz, "Pan left");
				this._addButton("panright", "east-mini.png", px.add(sz.w, 0), sz, "Pan right");
				this._addButton("pandown", "south-mini.png", centered.add(0, sz.h*2), sz, "Pan down");
				this._addButton("zoomin", "zoom-plus-mini.png", centered.add(0, sz.h*3+5), sz, "Zoom in");
				this._addButton("zoomworld", "zoom-world-mini.png", centered.add(0, sz.h*4+5), sz, "Zoom to world");
				this._addButton("zoomout", "zoom-minus-mini.png", centered.add(0, sz.h*5+5), sz, "Zoom out");
			} else {
				this._addButton("panup", "north-mini.png", centered, sz, "Déplacer ver le haut");
				px.y = centered.y+sz.h;
				this._addButton("panleft", "west-mini.png", px, sz, "Déplacer ver la gauche");
				this._addButton("panright", "east-mini.png", px.add(sz.w, 0), sz, "Déplacer ver la droite");
				this._addButton("pandown", "south-mini.png", centered.add(0, sz.h*2), sz, "Déplacer ver le bas");
				this._addButton("zoomin", "zoom-plus-mini.png", centered.add(0, sz.h*3+5), sz, "Zoom avant");
				this._addButton("zoomworld", "zoom-world-mini.png", centered.add(0, sz.h*4+5), sz, "Zoom au monde");
				this._addButton("zoomout", "zoom-minus-mini.png", centered.add(0, sz.h*5+5), sz, "Zoom arrière");
			}
			return this.div;
		};
		
		OpenLayers.Control.PanZoom.prototype.buttonDown =
		OpenLayers.Control.PanZoomBar.prototype.buttonDown = function (evt) {
			if (OpenLayers.Event.isLeftClick(evt) || evt.keyCode == 13 || evt.keyCode == 32) {
				switch (this.action) {
					case "panup": 
						this.map.pan(0, -this.getSlideFactor("h"));
						break;
					case "pandown": 
						this.map.pan(0, this.getSlideFactor("h"));
						break;
					case "panleft": 
						this.map.pan(-this.getSlideFactor("w"), 0);
						break;
					case "panright": 
						this.map.pan(this.getSlideFactor("w"), 0);
						break;
					case "zoomin": 
						this.map.zoomIn(); 
						break;
					case "zoomout": 
						this.map.zoomOut(); 
						break;
					case "zoomworld": 
						this.map.zoomToMaxExtent(); 
						break;
				}
				this.focus();
				OpenLayers.Event.stop(evt);
			}
		};
	
		OpenLayers.Control.PanZoomBar.prototype.draw = function(px) {
			// initialize our internal div
			OpenLayers.Control.prototype.draw.apply(this, arguments);
			px = this.position.clone();
			// place the controls
			this.buttons = [];
			var sz = new OpenLayers.Size(18,18);
			var centered = new OpenLayers.Pixel(px.x+sz.w/2, px.y);
			var wposition = sz.w;
			if (this.zoomWorldIcon) {
				centered = new OpenLayers.Pixel(px.x+sz.w, px.y);
			}
			if (PE.language==='eng') {
				this._addButton("panup", "north-mini.png", centered, sz, "Pan up");
				px.y = centered.y+sz.h;
				this._addButton("panleft", "west-mini.png", px, sz, "Pan left");
				if (this.zoomWorldIcon) {
					this._addButton("zoomworld", "zoom-world-mini.png", px.add(sz.w, 0), sz, "Zoom to world");
					wposition *= 2;
				}
				this._addButton("panright", "east-mini.png", px.add(wposition, 0), sz, "Pan right");
				this._addButton("pandown", "south-mini.png", centered.add(0, sz.h*2), sz, "Pan down");
				this._addButton("zoomin", "zoom-plus-mini.png", centered.add(0, sz.h*3+5), sz, "Zoom in");
				centered = this._addZoomBar(centered.add(0, sz.h*4 + 5));
				this._addButton("zoomout", "zoom-minus-mini.png", centered, sz, "Zoom out");
			} else {
				this._addButton("panup", "north-mini.png", centered, sz, "Déplacer ver le haut");
				px.y = centered.y+sz.h;
				this._addButton("panleft", "west-mini.png", px, sz, "Déplacer ver la gauche");
				if (this.zoomWorldIcon) {
					this._addButton("zoomworld", "zoom-world-mini.png", px.add(sz.w, 0), sz, "Zoom au monde");
					wposition *= 2;
				}
				this._addButton("panright", "east-mini.png", px.add(wposition, 0), sz, "Déplacer ver la droite");
				this._addButton("pandown", "south-mini.png", centered.add(0, sz.h*2), sz, "Déplacer ver le bas");
				this._addButton("zoomin", "zoom-plus-mini.png", centered.add(0, sz.h*3+5), sz, "Zoom avant");
				centered = this._addZoomBar(centered.add(0, sz.h*4 + 5));
				this._addButton("zoomout", "zoom-minus-mini.png", centered, sz, "Zoom arrière");
			}
			return this.div;
		};
	
		OpenLayers.Control.LayerSwitcher.prototype.redraw = function() {
			//if the state hasn't changed since last redraw, no need 
			// to do anything. Just return the existing div.
			if (!this.checkRedraw()) { 
				return this.div; 
			} 
			// make LayerSwitcher expandable with the keyboard
			this.maximizeDiv.tabIndex = 0;
			var filterMax = function(evt) {
				if (evt.keyCode == 13 || evt.keyCode == 32) {
					this.maximizeControl(evt);
					this.minimizeDiv.focus();
				}
			};
			OpenLayers.Event.observe(this.maximizeDiv, "keydown", OpenLayers.Function.bindAsEventListener(filterMax, this));
			this.minimizeDiv.tabIndex = 0;
			var filterMin = function(evt) {
				if (evt.keyCode == 13 || evt.keyCode == 32) {
					this.minimizeControl(evt);
					this.maximizeDiv.focus();
				}
			};
			OpenLayers.Event.observe(this.minimizeDiv, "keydown", OpenLayers.Function.bindAsEventListener(filterMin, this));
			// make the max/min divs focusable on click (ignores if IE since IE6 - IE8 throws an error)
			if (!$.browser.msie) {
				var that = this;
				$(this.minimizeDiv).click(function(){that.maximizeDiv.focus()});
				$(this.maximizeDiv).click(function(){that.minimizeDiv.focus()});
			}
			// add alt and title attributes to the min/max buttons
			this.minimizeDiv.title = (PE.language==='eng' ? "Close Layer Switcher" : "Fermer le sélecteur de couche");
			this.minimizeDiv.firstChild.alt = (PE.language==='eng' ? "Close Layer Switcher" : "Fermer le sélecteur de couche");
			this.maximizeDiv.title = (PE.language==='eng' ? "Open Layer Switcher" : "Ouvrir le sélecteur de couche");
			this.maximizeDiv.firstChild.alt = (PE.language==='eng' ? "Open Layer Switcher" : "Ouvrir le sélecteur de couche");
			
			// fix for the defect #3203 http://tbs-sct.ircan-rican.gc.ca/issues/3203
			// change the label "Base layer" to French if needed. OpenLayer.js 2.10 does not have French translations. There are French translations in OpenLayer.js 2.11. No need to set the label manually after upgrading to 2.11.
			this.baseLbl.innerHTML = (PE.language==='eng' ? "Base Layer" : "Fond de carte");
			this.dataLbl.innerHTML = (PE.language==='eng' ? "Overlays" : "Couche thématique ");
			
			//clear out previous layers 
			this.clearLayersArray("base");
			this.clearLayersArray("data");
			var containsOverlays = false;
			var containsBaseLayers = false;
			// Save state -- for checking layer if the map state changed.
			// We save this before redrawing, because in the process of redrawing
			// we will trigger more visibility changes, and we want to not redraw
			// and enter an infinite loop.
			var len = this.map.layers.length;
			this.layerStates = new Array(len);
			for (var i=0; i <len; i++) {
				var layer = this.map.layers[i];
				this.layerStates[i] = {
					'name': layer.name, 
					'visibility': layer.visibility,
					'inRange': layer.inRange,
					'id': layer.id
				};
			}    
			var layers = this.map.layers.slice();
			if (!this.ascending) { layers.reverse(); }
			for(var i=0, len=layers.length; i<len; i++) {
				var layer = layers[i];
				var baseLayer = layer.isBaseLayer;
				if (layer.displayInLayerSwitcher) {
					if (baseLayer) {
						containsBaseLayers = true;
					} else {
						containsOverlays = true;
					}
					// only check a baselayer if it is *the* baselayer, check data
					//  layers if they are visible
					var checked = (baseLayer) ? (layer == this.map.baseLayer) : layer.getVisibility();
					// create input element
					var inputElem = document.createElement("input");
					inputElem.id = this.id + "_input_" + layer.name;
					inputElem.name = (baseLayer) ? this.id + "_baseLayers" : layer.name;
					inputElem.type = (baseLayer) ? "radio" : "checkbox";
					inputElem.value = layer.name;
					inputElem.checked = checked;
					inputElem.defaultChecked = checked;
					if (!baseLayer && !layer.inRange) {
						inputElem.disabled = true;
					}
					var context = {
						'inputElem': inputElem,
						'layer': layer,
						'layerSwitcher': this
					};
					OpenLayers.Event.observe(inputElem, "mouseup", OpenLayers.Function.bindAsEventListener(this.onInputClick, context));
					// make the radio buttons tab-able
					inputElem.tabIndex = 0;
					var filterInput = function(evt) {
						if (evt.keyCode == 13 || evt.keyCode == 32) {
							this.layerSwitcher.onInputClick.call(this, evt);
						} else if (37 <= evt.keyCode && evt.keyCode <= 40) {
							// prevent up/down/left/right keys from moving map while focus is on inputElem
							evt.stopPropagation ? evt.stopPropagation() : evt.cancelBubble = true;
						}
					};
					OpenLayers.Event.observe(inputElem, "keydown", OpenLayers.Function.bindAsEventListener(filterInput, context));
					// create span
					var labelSpan = document.createElement("span");
					OpenLayers.Element.addClass(labelSpan, "labelSpan");
					if (!baseLayer && !layer.inRange) {
						labelSpan.style.color = "gray";
					}
					labelSpan.innerHTML = layer.name;
					labelSpan.style.verticalAlign = (baseLayer) ? "bottom" : "baseline";
					// create label
					var label = document.createElement("label");
					label.setAttribute("for", this.id + "_input_" + layer.name);
					OpenLayers.Event.observe(label, "click", OpenLayers.Function.bindAsEventListener(this.onInputClick, context));
					// create line break
					var br = document.createElement("br");
					var groupArray = (baseLayer) ? this.baseLayers : this.dataLayers;
					groupArray.push({
						'layer': layer,
						'inputElem': inputElem,
						'labelSpan': labelSpan
					});
					var groupDiv = (baseLayer) ? this.baseLayersDiv : this.dataLayersDiv;
					groupDiv.appendChild(inputElem);
					label.appendChild(labelSpan);
					groupDiv.appendChild(label);
					groupDiv.appendChild(br);
				}
			}
			// if no overlays, dont display the overlay label
			this.dataLbl.style.display = (containsOverlays) ? "" : "none";        
			// if no baselayers, dont display the baselayer label
			this.baseLbl.style.display = (containsBaseLayers) ? "" : "none";        
			
			// move radio buttons after min/max buttons
			$('.olControlLayerSwitcher > .minimizeDiv').detach().prependTo('.olControlLayerSwitcher');
			$('.olControlLayerSwitcher > .maximizeDiv').detach().prependTo('.olControlLayerSwitcher');
			
			return this.div;
		};
		
		OpenLayers.Control.LayerSwitcher.prototype.onInputClick = function(e) {
			if (!this.inputElem.disabled) {
				if (this.inputElem.type == "radio") {
					this.inputElem.checked = true;
					this.layer.map.setBaseLayer(this.layer);
				} else {
					this.inputElem.checked = !this.inputElem.checked;
					this.layerSwitcher.updateMap();
				}
				// keep the focus on the radio button after it's clicked/pressed
				document.getElementById(this.inputElem.id).focus();
			}
			OpenLayers.Event.stop(e);
		};
	}
})(jQuery);
