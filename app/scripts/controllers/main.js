'use strict';

/**
 * @ngdoc function
 * @name ticktockWebApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the ticktockWebApp
 */

angular.module('ticktockWebApp')
  .controller('MainCtrl', ['$scope', '$interval', '$http', function ($scope, $interval, $http) {
    $scope.resp = 'no resp';

    $http({
      method:'GET',
      url:'http://localhost:14081/_ah/api/ticktock/v1/calendars'
    }).then(function callback(resp){
      $scope.resp = resp.status;
    });

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

