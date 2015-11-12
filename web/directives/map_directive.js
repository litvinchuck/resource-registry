(function () {

	'use strict';

	angular.module('restApp').directive("leafletMap", function () {

		var link = function ($scope, $element, attrs) {

			var defaults = {
				height: '500px',
				width: '500px',
				position: {
					lat: 49.900,
					lng: 24.8467,
					zoom: 10
				}
			};

			$scope.mapCreated = false;
			$scope.resourcesGeoJsonOn = false;

			// Map init

			$scope.updateMapView = function (position, zoom) {
				position = angular.fromJson(position);
				$scope.map.setView(position, zoom);
			};

			$scope.createMap = function () {
				if (!$scope.mapCreated) {
					$('#map').show();
					$scope.map = L.map('map');

					$scope.baseLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
						minZoom: 5,
						maxZoom: 19
					});
					$scope.baseLayer.addTo($scope.map);

					initMapElements();

					$scope.updateMapView($scope.center, $scope.center.zoom);

					if (attrs.noupdate !== "true" && "geolocation" in navigator) {
						navigator.geolocation.getCurrentPosition(function (position) {
							$scope.geolocation = {
								lat: position.coords.latitude,
								lng: position.coords.longitude,
								zoom: 15
							};
							$scope.updateMapView($scope.geolocation, $scope.geolocation.zoom);
						});
					}

					$scope.mapCreated = true;
				}
			};

			$scope.removeMap = function () {
				if ($scope.mapCreated) {
					if ($scope.coordinates === 'true')
						$scope.coordinates.removeFrom($scope.map);
					if ($scope.info === 'true')
						$scope.info.removeFrom($scope.map);
					if ($scope.add === 'true')
						$scope.drawControl.removeFrom($scope.map);

					$scope.map.remove();
					$('#map').hide();

					$scope.mapCreated = false;
				}
			};

			$scope.toggleMap = function () {
				if ($scope.mapCreated) {
					$scope.removeMap();
				} else {
					$scope.createMap();
				}
			};

			if (attrs.toggledon === 'true') {
				$scope.createMap();
			}

			$scope.$watch('options.showPolygonOnMap.showPolygon', function (val) {
				console.log(val);
				if ($scope.mapCreated && val) {
					$scope.options.showPolygonOnMap.latlngs = angular.fromJson($scope.options.showPolygonOnMap.latlngs);
					var polygon = L.polygon($scope.options.showPolygonOnMap.latlngs);
					$scope.map.fitBounds(polygon.getBounds());

					if ($scope.geoJsonLayer)
						$scope.map.removeLayer($scope.geoJsonLayer);
					$scope.geoJsonLayer = L.geoJson(L.polygon($scope.options.showPolygonOnMap.latlngs).toGeoJSON(), {
						style: style,
						onEachFeature: infoOnEachFeature
					}).addTo($scope.map);
					$scope.options.showPolygonOnMap.showPolygon = false;
				}
			});

			$scope.$watch('options.toggleMap', function (val) {
				if (val) {
					$scope.toggleMap();
					$scope.options.toggleMap = false;
				}
			});

			$scope.$watch('options.resources.showResources', function (val) {
				if (val) {
					if ($scope.resourcesGeoJsonOn == true) {
						for (var i = 0; i < $scope.resourcesGeoJson.length; i++) {
							$scope.map.removeLayer($scope.resourcesGeoJson[i]);
						}
						$scope.resourcesGeoJsonOn = false;
					}
					$scope.resourcesGeoJson = [];
					for (var i = 0; i < $scope.options.resources.objects.length; i++) {
						console.log($scope.options.resources.objects);
						var geojson = L.polygon(JSON.parse($scope.options.resources.objects[i].coordinates)).toGeoJSON();
						geojson.properties.name = $scope.options.resources.objects[i].name;
						var resource = L.geoJson(geojson, {
							style: styleResource,
							onEachFeature: resourceOnEachFeature
						});
						resource.addTo($scope.map);
						$scope.resourcesGeoJson.push(resource);
					}
					$scope.resourcesGeoJsonOn = true;
				}
			});

			$scope.$watch('options.resources.hideResources', function (val) {
				if (val) {
					if ($scope.resourcesGeoJsonOn == true) {
						for (var i = 0; i < $scope.resourcesGeoJson.length; i++) {
							$scope.map.removeLayer($scope.resourcesGeoJson[i]);
						}
						$scope.resourcesGeoJsonOn = false;
					}
				}
			});


			function initMapElements() {

				initCssProperties();
				initCoordinatesElement();
				initInteractivity();
				initAdding();
				initSearch();
				initGeojson();

				L.easyButton('glyphicon-star', 
	              function () {
	              	$scope.options.resources.center = $scope.map.getCenter();
	              	$scope.options.resources.getResources = true;
	              	console.log($scope.options.resources);
	              	$scope.$apply();
	              }, '').addTo($scope.map);

				function initCssProperties () {
					$('#map').css({ 'height': attrs.height || defaults.height });
					$('#map').css({ 'width': attrs.width || defaults.width });
				}

				function initCoordinatesElement () {
					if (attrs.coordinates === 'true') {
						$scope.coordinates = L.control.coordinates();
						$scope.coordinates.addTo($scope.map);
					}
				}

				function initInteractivity () {
					if (attrs.interactivity === 'false') {
						$scope.map.dragging.disable();
						$scope.map.touchZoom.disable();
						$scope.map.doubleClickZoom.disable();
						$scope.map.scrollWheelZoom.disable();
						$scope.map.boxZoom.disable();
						$scope.map.keyboard.disable();

						if ($scope.map.tap)
							$scope.map.tap.disable();

						$('#map').css({ 'cursor': 'default' });
						$(".leaflet-control-zoom").css("visibility", "hidden");

					}
				}

				function initAdding () {

					if (attrs.add === 'true') {
						$scope.drawnItems = new L.FeatureGroup();
						$scope.map.addLayer($scope.drawnItems);

						$scope.drawControl = new L.Control.Draw({
							draw: {
								polyline: false,
								marker: false,
								circle: false,
								polygon: {
									shapeOptions: {
										color: '#A52A2A'
									}
								}
							},
							edit: {
								featureGroup: $scope.drawnItems,
								edit: false,
								remove: false
							}
						});
						$scope.map.addControl($scope.drawControl);

						$scope.map.on('draw:created', function (e) {
							var type = e.layerType;
							$scope.drawnItem = e.layer;

							$scope.bind = $scope.drawnItem._latlngs;

							$scope.options.created = true;
							var i;
							for (i in $scope.bind) {
								$scope.bind[i].lat = parseFloat($scope.bind[i].lat);
								$scope.bind[i].lng= parseFloat($scope.bind[i].lng);
							}
							$scope.options.newCoords = $scope.bind;
							if ($scope.geoJsonLayer)
								$scope.map.removeLayer($scope.geoJsonLayer);
							$scope.geoJsonLayer = L.geoJson($scope.drawnItem.toGeoJSON(), {
								style: style,
								onEachFeature: infoOnEachFeature
							}).addTo($scope.map);
							$scope.$apply();
						});

						$scope.map.on('draw:drawstart', function() {
							if ($scope.drawnItem) {
								$scope.drawnItems.removeLayer($scope.drawnItem);
								$scope.$apply();
							}
						});

						$scope.map.on('draw:deleted', function() {
							$scope.bind = {};
							$scope.$apply();
						});

						$scope.map.on('draw:editstop', function() {
							$scope.bind = $scope.drawnItem._latlngs;
							$scope.$apply();
						});
					}
				}

				function initSearch () {
					
					$scope.map.addControl( new L.Control.Search({
						url: 'http://nominatim.openstreetmap.org/search?format=json&q={s}',
						jsonpParam: 'json_callback',
						propertyName: 'display_name',
						propertyLoc: ['lat','lon'],
						textPlaceholder: 'Шукати...',
						textCancel: 'Відмінити',
						textErr: 'Не знайдено',
						circleLocation: false,
						markerLocation: true,			
						autoType: false,
						autoCollapse: true,
						minLength: 2,
						zoom:10
					}) );

				}

				function initGeojson () {
					if ($scope.geojson) {
						$scope.geoJsonLayer.addData($scope.geojson);
					}
				}
			}

			// GeoJson objects styling functions

			function style(feature) {
				return {
					fillColor: '#FD8D3C',
					weight: 2,
					opacity: 1,
					color: 'white',
					dashArray: '3',
					fillOpacity: 0.7
				};
			}

			function styleResource(feature) {
				return {
					fillColor: '#008000',
					weight: 2,
					opacity: 1,
					color: 'white',
					dashArray: '3',
					fillOpacity: 0.7
				};
			}

			function infoHighlightFeature(e) {
				var layer = e.target;

				layer.setStyle({
					weight: 5,
					color: '#666',
					dashArray: '',
					fillOpacity: 0.7
				});
			}

			function infoResetHighlight(e) {
				$scope.geoJsonLayer.resetStyle(e.target);
			}

			function infoZoomToFeature(e) {
				$scope.map.fitBounds(e.target.getBounds());
			}

			function infoOnEachFeature(feature, layer) {
				layer.on({
					mouseover: infoHighlightFeature,
					mouseout: infoResetHighlight,
					click: infoZoomToFeature
				});
			}

			function resourceOnEachFeature(feature, layer) {
				layer.bindPopup(feature.properties.name);
			}

			// GeoJson functions

			function toGeoJSON(pointsArray) {
				var geojson = {};
				geojson['type'] = 'FeatureCollection';
				geojson['features'] = [];
				var newFeature = {
					"type": "Feature",
					"geometry": {
						"type": "Polygon",
						"coordinates": []
					},
					"properties": {
						"title": "",
						"description":""
					}
				};

				for (var pointIndex in pointsArray) {
					var array = [parseFloat(pointsArray[pointIndex].lat), parseFloat(pointsArray[pointIndex].lng)];
					newFeature.geometry.coordinates.push(array);
				}
				geojson['features'].push(newFeature);
				return geojson;
			}

			function toggleResources () {
				$scope.options.resources.showResources = true;
			}
		};

		return {
			restrict: 'E',
			template: '<div id="map"></div>',
			controller: 'MapCtrl',
			scope: {
				bind: '=bind',
				options: '=update'
			},
			link: link
		};

	});


})();
