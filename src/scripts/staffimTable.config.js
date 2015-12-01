'use strict';
(function() {
    angular.module('staffimTable')
        .run(ngTables);

    ngTables.$inject = ['ngTableDefaults'];
    function ngTables(ngTableDefaults) {
        ngTableDefaults.params.count = 20;
        ngTableDefaults.settings.counts = [];
        ngTableDefaults.settings.paginationMaxBlocks = 10;
        ngTableDefaults.settings.paginationMinBlocks = 2;
    }
})();
