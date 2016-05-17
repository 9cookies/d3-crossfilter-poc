'use strict';

angular.module('delolap', [
    //'ngCookies',
    //'ngResource',
    //'ngSanitize',
    'ngRoute',
    //'ui.bootstrap',
    'delolap.services',
    'delolap.directives'
])
    .config(function ($routeProvider, $locationProvider) {
        $routeProvider
            .otherwise({
                redirectTo: '/'
            });

        $locationProvider.html5Mode(true);
    });
