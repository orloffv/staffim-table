'use strict';
(function() {
    angular.module('staffimTable')
        .directive('stPagination', stPagination);

    function stPagination() {
        return {
            restrict: 'E',
            templateUrl: '/staffim-table/pagination.html',
            scope: {
                params: '='
            },
            replace: true,
            link: function($scope) {
                $scope.pages = $scope.params.generatePagesArray();
                $scope.params.on('pages_changed', function(pages) {
                    if (!_.isEqual(pages, $scope.pages)) {
                        $scope.pages = pages;
                    }
                });
            }
        };
    }
}());
