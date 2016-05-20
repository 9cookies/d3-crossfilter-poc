'use strict';

angular.module('delolap', [
    'ngRoute',
    'delolap.directives'
])
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        $routeProvider
            .otherwise({
                redirectTo: '/'
            });
        $locationProvider.html5Mode(true);
    }]);
