'use strict';

/**
 * @ngdoc function
 * @name ticktockWebApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the ticktockWebApp
 */
angular.module('ticktockWebApp')
  .controller('MainCtrl', ['$scope', function ($scope) {
    /*
    $scope.progressbar = ngProgressFactory.createInstance(); // create

    $scope.progressbar.setHeight('8px'); // Set the height
    $scope.progressbar.setColor('#25c122'); // Set the colour

    $scope.progressbar.set(67);
    */
    $scope.things=[0,1,2,3,4,5,6,7];
  }]);
