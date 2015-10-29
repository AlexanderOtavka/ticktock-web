'use strict';

/**
 * @ngdoc function
 * @name ticktockWebApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the ticktockWebApp
 */

angular.module('ticktockWebApp')
  .controller('MainCtrl', ['$scope', '$interval', function ($scope, $interval) {
    $interval(function(){
      var date = new Date();
      var seconds = date.getSeconds();

      $scope.seconds = seconds;

    }, 1000);

    $scope.things=[
      {
        name: "One"
      } ,
      {
        name: "Two"
      } ,
      {
        name: "Three"
      } ,
      {
        name: "Four"
      } ,
      {
        name: "Five"
      }
    ];

  }]);

