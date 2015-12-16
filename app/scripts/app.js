'use strict';

/**
 * @ngdoc overview
 * @name ticktockWebApp
 * @description
 * # ticktockWebApp
 *
 * Main module of the application.
 */
angular
  .module('ticktockWebApp', [
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngMaterial',
    'ngTouch',
    'angular-svg-round-progress',
    'snap',
    'ui.bootstrap'

  ])
  .config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('pink')
      .accentPalette('orange');
  })
  .config(function(snapRemoteProvider){
    snapRemoteProvider.globalOptions = {
      disable: 'right'
    };
  })
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .controller('TopCtrl', ['$scope',function($scope){
    $scope.topMenuItems=[
      {
        name:'All',
        link: '#/'
      },
      {
        name:'Holidays',
        link: '#/'
      },
      {
        name:'Work',
        link: '#/'
      }
    ];
    $scope.bottomMenuItems=[
      {
        name: 'Settings',
        link: '#/'
      }
    ];
  }]);
