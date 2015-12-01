'use strict';
(function() {
    angular.module('staffimTable')
        .directive('stCompile', stCompile);

    stCompile.$inject = ['$compile'];
    function stCompile($compile) {
        return {
            restrict: 'A',
            link: function($scope, $element, $attr) {
                $scope.$watch($attr.stCompile, function(value) {
                    $element.html(value);
                    $compile($element.contents())($scope);
                });
            }
        };
    }
})();
