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
        name: "One",
        isOpen: false
      } ,
      {
        name: "Two",
        isOpen: false
      } ,
      {
        name: "Three",
        isOpen: false
      } ,
      {
        name: "Four",
        isOpen: false
      } ,
      {
        name: "Five",
        isOpen: false
      }
    ];

  }]);

