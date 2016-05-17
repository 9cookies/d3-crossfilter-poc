'use strict';

angular.module('delolap')
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'partials/main.jade',
                controller: 'MainCtrl'
            });
    });
