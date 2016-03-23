(function(){
    angular.module('staffimTable')
        .service('STWithActions', STWithActions);

    STWithActions.$inject = [];
    function STWithActions() {
        var service = {};
        service.getColumn = getColumn;
        service.init = init;

        function init(vm, $scope, ngTableParams, editForm, model) {
            vm.forms = {};

            ngTableParams.on('data_changed', onDataChanged);
            onDataChanged();

            function onDataChanged() {
                vm.forms = _.reduce(ngTableParams.data, function(memo, item) {
                    if (!memo[item.id]) {
                        var newModel = model.$build(item);
                        newModel.$pk = item.id;
                        var form = editForm.getFormInstance(newModel);
                        form.setTableOptions();

                        memo[item.id] = form;
                    }

                    return memo;
                }, vm.forms);
            }
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
