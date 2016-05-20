'use strict';

angular.module('delolap')
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'partials/main.jade',
                controller: 'MainCtrl'
            });
    }]);
