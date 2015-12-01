'use strict';
(function() {
    angular.module('staffimTable')
        .directive('stFilter', function() {
            return {
                restrict: 'E',
                templateUrl: '/staffim-table/filter.html',
                replace: true,
                scope: {
                    columns: '=',
                    params: '='
                },
                controller: ['$scope', function($scope) {
                    $scope.items = _.chain($scope.columns)
                        .filter(function(column) {
                            return column.show() && column.filter();
                        })
                        .map(function(column) {
                            return column.filter();
                        })
                        .flatten()
                        .compact()
                        .value();

                    $scope.filterBy = function(item) {
                        _.each(item.data, function(value, key) {
                            if ($scope.isActive(item)) {
                                delete $scope.params.filter()[key];
                            } else {
                                $scope.params.filter()[key] = value;
                            }
                        });
                    };

                    $scope.isActive = function(item) {
                        var filter = $scope.params.filter();
                        var active = true;
                        _.each(item.data, function(value, key) {
                            if (filter[key] !== value) {
                                active = false;
                            }
                        });

                        return active;
                    };
                }]
            };
        });
})();
