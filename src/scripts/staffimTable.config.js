'use strict';
(function() {
    angular.module('staffimTable')
        .run(sTables);

    sTables.$inject = ['stDefaults'];
    function sTables(stDefaults) {
        stDefaults.params.count = 20;
        stDefaults.settings.counts = [];
        stDefaults.settings.paginationMaxBlocks = 10;
        stDefaults.settings.paginationMinBlocks = 2;
    }
})();
