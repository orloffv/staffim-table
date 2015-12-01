'use strict';
(function() {
    angular.module('staffimTable')
        .directive('stSort', function() {
            return {
                restrict: 'E',
                templateUrl: '/staffim-table/sort.html',
                replace: true,
                scope: {
                    columns: '=',
                    params: '='
                },
                controller: ['$scope', function($scope) {
                    $scope.items = _.chain($scope.columns)
                        .filter(function(column) {
                            return column.show() && column.sortable();
                        })
                        .map(function(column) {
                            var headerTitle = column.headerTitle();
                            if (!headerTitle) {
                                return [];
                            }

                            return [
                                {
                                    title: headerTitle['asc'],
                                    direction: 'asc',
                                    sortable: column.sortable()
                                },
                                {
                                    title: headerTitle['desc'],
                                    direction: 'desc',
                                    sortable: column.sortable()
                                }
                            ];
                        })
                        .flatten()
                        .compact()
                        .value();

                    $scope.sortBy = function(item) {
                        var sortingParams = {};
                        sortingParams[item.sortable] = item.direction;

                        $scope.params.parameters({
                            sorting: sortingParams
                        });
                    };

                    $scope.isActive = function(item) {
                        return $scope.params.sorting()[item.sortable] === item.direction;
                    };
                }]
            };
        });
})();
