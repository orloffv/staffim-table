(function(){
    angular.module('staffimTable')
        .service('STWithSelect', STWithSelect);

    STWithSelect.$inject = [];
    function STWithSelect() {
        var service = {};
        service.getColumn = getColumn;
        service.init = init;

        function init(vm, $scope, stTableParams) {
            var stopWatchChecked, stopWatchItems;
            vm.selected = {
                checked: false,
                checkedItems: [],
                items: {}
            };

            stTableParams.on('data_changed', onDataChanged);
            onDataChanged();

            function onDataChanged() {
                if (_.isFunction(stopWatchChecked)) {
                    stopWatchChecked();
                }
                stopWatchChecked = $scope.$watch(function() {
                    return vm.selected.checked;
                }, function(value) {
                    if (!_.isNull(value)) {
                        vm.selected.items = _.reduce(stTableParams.data, function(memo, item) {
                            memo[item.id] = value;

                            return memo;
                        }, {});
                    }
                });

                if (_.isFunction(stopWatchItems)) {
                    stopWatchItems();
                }
                stopWatchItems = $scope.$watch(function() {
                    return vm.selected.items;
                }, function() {
                    var checked = 0,
                        unchecked = 0,
                        total = _.size(stTableParams.data);

                    vm.selected.checkedItems = [];
                    _.each(stTableParams.data, function(item) {
                        checked   +=  (vm.selected.items[item.id]) || 0;
                        unchecked += (!vm.selected.items[item.id]) || 0;
                        if (vm.selected.items[item.id]) {
                            vm.selected.checkedItems.push(item.id);
                        }
                    });

                    if ((unchecked === 0) || (checked === 0)) {
                        vm.selected.checked = (checked === total && total > 0);
                    } else {
                        vm.selected.checked = null;
                    }
                }, true);
            }
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
