(function(){
    angular.module('staffimTable')
        .service('STWithSelect', STWithSelect);

    STWithSelect.$inject = ['ngTableEventsChannel'];
    function STWithSelect(ngTableEventsChannel) {
        var service = {};
        service.getColumn = getColumn;
        service.init = init;

        function init(vm, $scope, ngTableParams) {
            var stopWatchChecked, stopWatchItems;
            vm.selected = {
                checked: false,
                checkedItems: [],
                items: {}
            };

            ngTableEventsChannel.onAfterReloadData(function() {
                if (_.isFunction(stopWatchChecked)) {
                    stopWatchChecked();
                }
                stopWatchChecked = $scope.$watch(function() {
                    return vm.selected.checked;
                }, function(value) {
                    vm.selected.items = _.reduce(ngTableParams.data, function(memo, item) {
                        memo[item.id] = value;

                        return memo;
                    }, {});
                });

                if (_.isFunction(stopWatchItems)) {
                    stopWatchItems();
                }
                stopWatchItems = $scope.$watch(function() {
                    return vm.selected.items;
                }, function() {
                    var checked = 0,
                        unchecked = 0,
                        total = _.size(ngTableParams.data);

                    vm.selected.checkedItems = [];
                    _.each(ngTableParams.data, function(item) {
                        checked   +=  (vm.selected.items[item.id]) || 0;
                        unchecked += (!vm.selected.items[item.id]) || 0;
                        if (vm.selected.items[item.id]) {
                            vm.selected.checkedItems.push(item.id);
                        }
                    });

                    if ((unchecked === 0) || (checked === 0)) {
                        vm.selected.checked = (checked === total && total > 0);
                    }
                }, true);
            }, $scope, ngTableParams);
        }

        function getColumn() {
            return {
                field: 'selector',
                title: '',
                headerTemplateURL: '/staffim-table/headerCheckbox.html',
                getValue: function(row) {
                    return '<input type="checkbox" ng-model="vm.selected.items[row.id]">';
                }
            };
        }

        return service;
    }
})();
