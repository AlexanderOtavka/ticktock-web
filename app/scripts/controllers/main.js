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


    $scope.things=[0,1,2,3,4,5,6,7];
  }]);
