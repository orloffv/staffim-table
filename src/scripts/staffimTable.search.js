'use strict';
(function() {
    angular.module('staffimTable')
        .directive('stSearch', STSearch);

    STSearch.$inject = ['$timeout'];
    function STSearch($timeout) {
        return {
            restrict: 'E',
            templateUrl: '/staffim-table/search.html',
            replace: true,
            scope: {
                columns: '=',
                params: '=',
                showSearch: '='
            },
            link: function($scope, element) {
                var lastQuery = '';

                $scope.filter = {
                    query: ''
                };

                $scope.$watch('filter.query', function(query) {
                    if ((!query || query.length >= 3) && lastQuery !== query) {
                        $scope.params.filter()['name'] = query;
                        lastQuery = query;
                    }
                });

                $scope.$watch('showSearch', function(showSearch) {
                    if (showSearch) {
                        $timeout(function() {
                            element.find('[data-field="input_search"]').focus();
                        });
                    }
                });
            }
        };
    }
})();
