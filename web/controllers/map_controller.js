(function () {

	angular.module('restApp').controller("MapCtrl", ["$scope", '$rootScope', 'SearchService', function ($scope, $rootScope, SearchService) {
		$scope.center = {
			lat: 49.900,
			lng: 24.8467,
			zoom: 6
		};

		$scope.options = {
			toggleMap: false,
			showPolygonOnMap: {
				showPolygon: false,
				latlngs: []
			},
			resources: {
				showResources: false,
				objects: [],
				getResources: false
			}
		};

		$scope.showPolygonOnMap = function (coordinates) {
			$scope.options.showPolygonOnMap.showPolygon = true;
			$scope.options.showPolygonOnMap.latlngs = coordinates;
		}

		$scope.toggleMap = function () {
			$scope.options.toggleMap = true;
		}

		$scope.$watch('options.resources.getResources', function(val) {
			if (val) {
				$scope.options.resources.hideResources = true;
				$scope.options.resources.showResources = false;
				$scope.options.resources.getResources = false;
				SearchService.getResourceByCoordinates($scope.options.resources.center) 
					.then(function (data) {
						$scope.options.resources.objects = data.data.items;
						$scope.options.resources.showResources = true;
					});
			}
		});

		$scope.$watch('options.created', function(val){

			if(val) {
				$rootScope.coords = [];
				var i;
				for (i in $scope.options.newCoords) {
					$rootScope.coords.push({lat: $scope.options.newCoords[i].lat, lng: $scope.options.newCoords[i].lng});
				}
				$scope.options.created = false;
				$rootScope.mapOptions.created = true;
			}

		});
	}]);

})();
