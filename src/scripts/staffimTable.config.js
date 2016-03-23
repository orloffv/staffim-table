'use strict';
(function() {
    angular.module('staffimTable')
        .run(sTables)
        .run(ngTables);

    ngTables.$inject = ['ngTableDefaults'];
    function ngTables(ngTableDefaults) {
        ngTableDefaults.params.count = 20;
        ngTableDefaults.settings.counts = [];
        ngTableDefaults.settings.paginationMaxBlocks = 10;
        ngTableDefaults.settings.paginationMinBlocks = 2;
    }

    sTables.$inject = ['stDefaults'];
    function sTables(stDefaults) {
        stDefaults.params.count = 20;
        stDefaults.settings.counts = [];
        stDefaults.settings.paginationMaxBlocks = 10;
        stDefaults.settings.paginationMinBlocks = 2;
    }
})();
