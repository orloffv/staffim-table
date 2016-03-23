'use strict';
(function() {
    angular.module('staffimTable')
        .directive('stSortFilter', stSortFilter);

    function stSortFilter() {
        return {
            restrict: 'E',
            templateUrl: '/staffim-table/sortFilter.html',
            scope: {
                params: '='
            },
            replace: true,
            link: function($scope) {
                $scope.form = $scope.params.formSortFilter();
                $scope.options = $scope.form.getFormOptions();
                $scope.model = $scope.form.getFormModel();
                $scope.fields = $scope.form.getFields();

                $scope.$watch('model.filter', function(data) {
                    var filter = angular.copy($scope.params.filter());
                    _.each(data, function(value, key) {
                        if (!_.isNull(value) && !_.isUndefined(value)) {
                            if (value !== filter[key]) {
                                filter[key] = value;
                            }
                        } else {
                            delete filter[key];
                        }
                    });

                    if (!_.isEqual($scope.params.filter(), filter)) {
                        $scope.params.filter(filter);
                    }
                }, true);

                $scope.$watch('model.sort', function(data) {
                    var sort = {};
                    _.each(data, function(value, key) {
                        var words = _.words(value, '|');
                        if (_.size(words) === 2) {
                            //if (!_.has(sort, words[0]) || words[1] === sort[words[0]]) {}
                            sort[words[0]] = words[1];
                        } else {
                            sort[key] = value;
                        }
                    });

                    if (!_.isEqual($scope.params.sorting(), sort)) {
                        $scope.params.sorting(sort);
                    }
                }, true);
            }
        };
    }
}());
