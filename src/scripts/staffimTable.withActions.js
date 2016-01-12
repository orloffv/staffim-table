(function(){
    angular.module('staffimTable')
        .service('STWithActions', STWithActions);

    STWithActions.$inject = ['ngTableEventsChannel'];
    function STWithActions(ngTableEventsChannel) {
        var service = {};
        service.getColumn = getColumn;
        service.init = init;

        function init(vm, $scope, ngTableParams, editForm) {
            vm.forms = {};

            ngTableEventsChannel.onAfterReloadData(function() {
                vm.forms = _.reduce(ngTableParams.data, function(memo, item) {
                    if (!memo[item.id]) {
                        var form = editForm.getFormInstance(item);
                        form.setTableOptions();

                        memo[item.id] = form;
                    }

                    return memo;
                }, vm.forms);

            }, $scope, ngTableParams);
        }

        function getColumn() {
            return {
                field: 'actions',
                title: ''
            };
        }

        return service;
    }
})();
