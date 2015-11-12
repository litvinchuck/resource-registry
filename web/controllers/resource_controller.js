(function(){
    'use strict';
    
    angular
        .module('restApp')
        .controller('index', index);
        index.$inject = ['$scope',
                        '$http',
                        'RestService',
                        '$rootScope',
                        '$location',
                        '$route',
                        'PaginationService',
                        'constant',
                        'CoordsService'
        ];

        function index($scope, $http, RestService, $rootScope, $location, $route, PaginationService, constant, CoordsService) {

            $rootScope.currentUser = angular.fromJson(sessionStorage.getItem('user'));

            $rootScope.coords = [];
            $rootScope.mapOptions = {};

            $scope.coordId = null;
            $scope.coord = {};
            $scope.lat = {};
            $scope.lng = {};
            $scope.coord_center = {};

            $scope.params = {
                                3:{value:constant.DEFAULT_SQUAERE_VAL},
                                6:{value:constant.DEFAULT_PERIM_VAL}
                            };


            $scope.resource = {};
            
            $scope.isShowMap = false;
            $scope.showMap = function (){
                $scope.isShowMap = !$scope.isShowMap;
            };

            $scope.formatCoords = function(coords){
                return  CoordsService.formatCoords (coords);
            };


            $rootScope.$watch('mapOptions.created', function(val) {
                if (val) {
                    var center = L.polygon($rootScope.coords).getBounds().getCenter();
                    $scope.params[3].value = (getArea($rootScope.coords).toFixed(5));
                    $scope.params[6].value = getPerimeter($rootScope.coords).toFixed(0);
                    $rootScope.mapOptions.created = false;
                    $scope.coord_center.lat = center.lat.toFixed(4);
                    $scope.coord_center.lng = center.lng.toFixed(4);
                }

            });

            $scope.createCoords = function(lat, lng){
                var lat = CoordsService.convertDMSToDD(lat.deg,lat.min, lat.sec).toFixed(8);
                var lng = CoordsService.convertDMSToDD(lng.deg,lng.min, lng.sec).toFixed(8);
                var coord = {lat: lat, lng: lng};
                if(!CoordsService.createCoords(coord, $rootScope.coords, $scope.coordId)){
                    $scope.coordId = null;
                }
                $scope.lat = {};
                $scope.lng = {};
                $scope.coord = {};
                $rootScope.mapOptions.created = true;
            };

            $scope.changeCoords = function(coord, coordId){
                var newCoords = CoordsService.changeCoords(coord, coordId);
                $scope.coord = newCoords.coord;
                var newLat = CoordsService.convertDDToDMS($scope.coord.lat);
                var newLng = CoordsService.convertDDToDMS($scope.coord.lng);
                $scope.lat = {deg: newLat.deg, min: newLat.min, sec: newLat.sec};
                $scope.lng = {deg: newLng.deg, min: newLng.min, sec: newLng.sec};
                $scope.coordId = newCoords.coordId;
                $rootScope.mapOptions.created = true;
            };

            $scope.deleteCoords = function(){
                CoordsService.deleteCoords($rootScope.coords, $scope.coordId);
                $scope.coordId = null;
                $scope.coord = {};
                $scope.lat = {};
                $scope.lng = {};
                $rootScope.mapOptions.created = true;

            };


            //Load resources per page
            RestService.getData(constant.resourcesQuery + '?&per-page=' + constant.perPage)
                .then(function(data){
                    $scope.resources = data.data;
                });
            //Load resource class
            RestService.getData(constant.resource_classesQuery)
                .then(function(data){
                    $scope.resource_classes = data.data;
                });
            
            //MAIN HASH REQUEST FOR RESOURCE

            $scope.resource = {
                reason:{
                    passport:{
                        department:'1',
                        date:'',
                    },
                    text:'',
                },
                registrar_data_id: null,
                date:'',
            };

            $scope.owner = {
                passport_series:'',
                passport_number:'',
                first_name:'',
                last_name:'',
                middle_name:'',
                address:''
            };

            //Get date creation start

            $scope.datePicker = {
                date:constant.DEFOULT_START_DATE
            };

            $scope.dateOptions = {
                startingDay: 1,
                showWeeks: false,
                formatYear: 'yy'
            };

            $scope.format = 'yyyy.MM.dd';

            $scope.today = function() {
                $scope.datePicker.date = new Date();
            };
            $scope.today();

            $scope.minDate =  null;

            $scope.clear = function () {
                $scope.datePicker.date = null;
            };

            $scope.status = {
                opened: false
            };

            $scope.open = function($event) {
                $scope.status.opened = true;
            };

            $scope.setDate = function(year, month, day) {
                $scope.datePicker.date = new Date(year, month, day);
            };

            $scope.$watch("datePicker.date", function(time) {

                if (time < $scope.minDate) $scope.datePicker.date = constant.DEFOULT_MIN_DATE;

                $scope.resource.date = ( time instanceof Date)? toDateFormatUTC(time) : null;

            });

            if ($rootScope.currentUser !== null) {
                RestService.getDataById($rootScope.currentUser.userDataID , constant.personal_datasQuery)
                    .then(function(data){
                        $scope.personal_data = data.data;
                        $scope.resource.registrar_data_id = data.data.personal_data_id;
                        getRegistrationNumber($rootScope.currentUser.userDataID);

                    })
            };

            //END Get personal date

            $scope.reason = {
                passport:{
                    date:new Date()
                }
            };

            $scope.reason_date = {
                date:''
            };

            $scope.reasonPassportDateStatus = {
                opened: false
            };

            $scope.openReasonPassportDate = function($event) {
                $scope.reasonPassportDateStatus.opened = true;
            };

            $scope.today = function() {
                $scope.reason.passport.date = new Date();
            };

            $scope.reasonPassportMinDate = null;

            $scope.clear = function () {
                $scope.reason.passport.date = null;
            };

            $scope.$watch("reason.passport.date", function(time) {
                            $scope.reason_date.date = ( time instanceof Date)? toDateFormatUTC(time) : '';
                        });

            $scope.$watchGroup(constant.reasonWatchGroupHash, function(scope) {

                             $scope.reason.text = constant.MSG_REASON_DOC_PSW +
                         ' '+$scope.owner.passport_series+
                         ' '+$scope.owner.passport_number+
                         ' ,'+constant.MSG_REASON_DOC_DEPARTMENT+
                         ' '+$scope.owner.last_name +
                         ' '+$scope.owner.first_name +
                         ' '+$scope.owner.middle_name +
                         ' '+$scope.reason.passport.department +
                         ' '+$scope.reason_date.date;

            });


            $scope.$watch("reason.text", function(text) {
                $scope.resource.reason = text;
            });


            function toDateFormatUTC(time) {
                var now = new Date(time);
                var todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
                return todayUTC.toISOString().slice(constant.DAY_CHAR_START, constant.DAY_CHAR_END).replace(/-/g, '.');
            };


            //END Get personal date

            $scope.deleteResource = function(resourceID, ownerId) {

               if(confirm(constant.MSG_DELATE_RESOURCE) == true && resourceID >0){
                   RestService.deleteData(resourceID, constant.resourcesQuery)
                       .then(function(){
                           $route.reload();
                           $location.path('resource/index');
                   });

                }
            };

            // for backup data
            var oldOwnerData = {};

                $scope.search = {
                    owner:{}
                };

            // empty default data
            var clearOwnerData = {
                address: '',
                first_name: '',
                last_name: '',
                middle_name: '',
                passport_number: '',
                passport_series: '',
                personal_data_id: '',
                registrar_key: ''
            };


            $scope.searchOwnerId = function(dataSearch) {

                if(dataSearch!=null&&Object.keys(dataSearch).length>=constant.DEFAULT_MIN_SEARCH_OWNER_DATA_CREATE){
                    
                    RestService.getData(constant.personal_datasQuery + '/search?'+buildQuery(dataSearch))
                        .then(function (result) {
                            $scope.show_search_result=true;
                            $scope.owner_data = result.data;
                        })
                }
                $scope.search.owner = {};
            };


            $scope.cancelSearch = function(data){
                    // restore previous fields
                    angular.copy(clearOwnerData, $scope.owner);
                    $scope.ownerUpdate = false;
                    $scope.show_owner_search = true;
                    $scope.show_search_result = false;
            };

            $scope.confirmOwner = function(data){

                if(confirm(constant.MSG_LOAD_USER)){
                    angular.copy(data,$scope.owner);
                    $scope.ownerUpdate = true;
                    $scope.show_search_result = false;
                }
            };

        $scope.ownerUpdate = false;

        $scope.createResource = function(resource, owner, params) {

            //CREATE RESOURCE

            resource.coordinates = ($rootScope.coords.length)? CoordsService.coordsToGeotype($rootScope.coords): resource.coordinates = [];

            resource.coords_center_lat = $scope.coord_center.lat;
            resource.coords_center_lng = $scope.coord_center.lng;

            if (!owner || Object.keys(owner).length < constant.paramsNumber || !isDataForObject(owner)) {
                    //'Create Resource without owner'

                    RestService.createData(resource, constant.resourcesQuery)
                         .then(function(response){
                             createParameters(params, response.data.resource_id);
                         });

                } else if ($scope.ownerUpdate) {
                            //Create with actual  owner - owner ID

                            resource.owner_data_id = owner.personal_data_id;

                            RestService.createData(resource, constant.resourcesQuery)
                                .then(function(response){
                                    createParameters(params, response.data.resource_id);
                                })

                }else{
                       //create owner AND RESOURCE

                       RestService.createData(owner, constant.personal_datasQuery)
                           .then(function (response) {
                               resource.owner_data_id = response.data.personal_data_id;
                               return RestService.createData(resource, constant.resourcesQuery);
                           })
                           .then(function(response){
                               createParameters(params, response.data.resource_id);
                           })
                }
                    $route.reload();
                    $location.path('resource/index');
            };


            function createParameters  (params, resourceId) {

                for (var i in params) {

                    if (params[i]) {
                        params[i].resource_id = resourceId;
                        params[i].attribute_id = parseInt(i) + 1;
                        if (params[i]['attribute_id']===constant.SQUARE_ID){
                            params[i]['value'] = toSquareMeters(params[i]['value']);
                        }
                        RestService.createData(params[i], constant.parametersQuery)
                    }
                }
            };

            function getArea(zones) {
                var currzonecoords = [];

                for(var k=0;k<zones.length;k++) {
                    var currentcoord=new google.maps.LatLng(zones[k]['lat'],zones[k]['lng']);
                    currzonecoords.push(currentcoord);
                }
                var zonearea = google.maps.geometry.spherical.computeArea(currzonecoords);
                return zonearea;
            };

            function getRegistrationNumber(id){
                //get last registration number
                RestService.getData(constant.resourcesQuery + '/getregisterkey?registrar_data_id=' + id)
                    .then(function(data){
                        if (data.data.items.length){
                            $scope.resource.registration_number = nextRegistrationKey(data.data.items[0].registration_number);
                        }else{
                            RestService.getData('personal_datas/' + id)
                                .then(function(data){
                                    if (data.data){
                                        $scope.resource.registration_number = nextRegistrationKey(data.data.registrar_key);
                                }
                            });
                        }
                    });

                function nextRegistrationKey(key) {
                    var parts = key.split(':');
                    parts[parts.length - 1] = ('000' + (Number(parts[parts.length - 1]) + 1)).slice(-4);
                    return parts.join(':');
                }
            };

            function toSquareMeters(val) {
               return (val).toString();
            };


            function getPerimeter(zones) {
                var perimeter = 0;

                for(var k=0;k<zones.length-1;k++) {
                    var p1 = new google.maps.LatLng(zones[k]['lat'],zones[k]['lng']),
                        p2 = new google.maps.LatLng(zones[k+1]['lat'],zones[k+1]['lng']);

                    perimeter += google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
                }
                var p1 = new google.maps.LatLng(zones[0]['lat'],zones[0]['lng']),
                    p2 = new google.maps.LatLng(zones[zones.length-1]['lat'],zones[zones.length-1]['lng']);

                perimeter += google.maps.geometry.spherical.computeDistanceBetween(p1, p2);

                return perimeter;
            };


            function requestToChangeData(newObj, oldObj){

                if (Object.keys(newObj).length>0) {
                    var newDataRequest = {};
                    for (var key in oldObj) {
                        if (oldObj[key] != newObj[key]) newDataRequest[key] = newObj[key];
                    }
                }
                return newDataRequest || false;
            };

            function buildQuery(res) {
                var requestData = res,
                    str = '';
                for (var key in requestData){
                    str += key + '=' + requestData[key] + '&';
                }
                return str.slice(0, - 1);
            };

            function isDataForObject (Obj){
                for (var key in Obj){
                    return (Obj[key].length===0)?false:true;
                }
            };

        }

})();
