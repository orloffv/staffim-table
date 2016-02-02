(function(){
    angular.module('staffimTable', ['ngTable']);
})();

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

                    _.each(ngTableParams.data, function(item) {
                        checked   +=  (vm.selected.items[item.id]) || 0;
                        unchecked += (!vm.selected.items[item.id]) || 0;
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

(function(){
    angular.module('staffimTable')
        .service('STWithActions', STWithActions);

    STWithActions.$inject = ['ngTableEventsChannel'];
    function STWithActions(ngTableEventsChannel) {
        var service = {};
        service.getColumn = getColumn;
        service.init = init;

        function init(vm, $scope, ngTableParams, editForm, model) {
            vm.forms = {};

            ngTableEventsChannel.onAfterReloadData(function() {
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

'use strict';
(function() {
    angular.module('staffimTable')
        .directive('stFilter', function() {
            return {
                restrict: 'E',
                templateUrl: '/staffim-table/filter.html',
                replace: true,
                scope: {
                    columns: '=',
                    params: '='
                },
                controller: ['$scope', function($scope) {
                    $scope.items = _.chain($scope.columns)
                        .filter(function(column) {
                            return column.show() && column.filter();
                        })
                        .map(function(column) {
                            return column.filter();
                        })
                        .flatten()
                        .compact()
                        .value();

                    $scope.filterBy = function(item) {
                        _.each(item.data, function(value, key) {
                            if ($scope.isActive(item)) {
                                delete $scope.params.filter()[key];
                            } else {
                                $scope.params.filter()[key] = value;
                            }
                        });
                    };

                    $scope.isActive = function(item) {
                        var filter = $scope.params.filter();
                        var active = true;
                        _.each(item.data, function(value, key) {
                            if (filter[key] !== value) {
                                active = false;
                            }
                        });

                        return active;
                    };
                }]
            };
        });
})();

'use strict';
(function() {
    angular.module('staffimTable')
        .directive('stSort', function() {
            return {
                restrict: 'E',
                templateUrl: '/staffim-table/sort.html',
                replace: true,
                scope: {
                    columns: '=',
                    params: '='
                },
                controller: ['$scope', function($scope) {
                    $scope.items = _.chain($scope.columns)
                        .filter(function(column) {
                            return column.show() && column.sortable();
                        })
                        .map(function(column) {
                            var headerTitle = column.headerTitle();
                            if (!headerTitle) {
                                return [];
                            }

                            return [
                                {
                                    title: headerTitle['asc'],
                                    direction: 'asc',
                                    sortable: column.sortable()
                                },
                                {
                                    title: headerTitle['desc'],
                                    direction: 'desc',
                                    sortable: column.sortable()
                                }
                            ];
                        })
                        .flatten()
                        .compact()
                        .value();

                    $scope.sortBy = function(item) {
                        var sortingParams = {};
                        sortingParams[item.sortable] = item.direction;

                        $scope.params.parameters({
                            sorting: sortingParams
                        });
                    };

                    $scope.isActive = function(item) {
                        return $scope.params.sorting()[item.sortable] === item.direction;
                    };
                }]
            };
        });
})();

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
                search: '='
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

                $scope.$watch('search.show', function(show) {
                    if (show) {
                        $timeout(function() {
                            element.find('[data-field="input_search"]').focus();
                        });
                    }
                });
            }
        };
    }
})();

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

angular.module('staffimTable').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('/staffim-table/filter.html',
    "<li class=\"dropdown\" uib-dropdown ng-show=\"items.length\">\n" +
    "    <a href=\"\" uib-dropdown-toggle>\n" +
    "        <i class=\"zmdi zmdi-filter-list\"></i>\n" +
    "    </a>\n" +
    "    <ul class=\"dropdown-menu dropdown-menu-right\">\n" +
    "        <li class=\"dropdown-header text-right\">\n" +
    "            <span>Фильтр</span>\n" +
    "        </li>\n" +
    "        <li\n" +
    "            ng-repeat=\"item in items\"\n" +
    "            ng-class=\"{'active': isActive(item)}\"\n" +
    "            ng-click=\"filterBy(item)\">\n" +
    "            <a href=\"#\">\n" +
    "                {{item.title}}\n" +
    "            </a>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "</li>\n"
  );


  $templateCache.put('/staffim-table/header.html',
    "<tr class=\"ng-table-sort-header\">\n" +
    "    <th colspan=\"{{$columns.length}}\">\n" +
    "        <div class=\"lv-header-alt clearfix\" ng-init=\"stSearch = {show: false};\">\n" +
    "            <ng-include ng-if=\"params.headerTemplate\" src=\"params.headerTemplate\"></ng-include>\n" +
    "            <h2 class=\"lvh-label hidden-xs\" ng-if=\"params.headerH2\">{{params.headerH2}}</h2>\n" +
    "            <st-search ng-if=\"params.searchDisable !== true\" columns=\"$columns\" params=\"params\" search=\"stSearch\"></st-search>\n" +
    "            <ul class=\"lv-actions actions\">\n" +
    "                <li ng-if=\"params.searchDisable !== true\">\n" +
    "                    <a href=\"\" ng-click=\"stSearch.show = true\">\n" +
    "                        <i class=\"zmdi zmdi-search\"></i>\n" +
    "                    </a>\n" +
    "                </li>\n" +
    "                <st-filter columns=\"$columns\" params=\"params\"></st-filter>\n" +
    "                <st-sort columns=\"$columns\" params=\"params\"></st-sort>\n" +
    "            </ul>\n" +
    "        </div>\n" +
    "    </th>\n" +
    "</tr>\n"
  );


  $templateCache.put('/staffim-table/headerCheckbox.html',
    "<input type=\"checkbox\" ng-model=\"vm.selected.checked\"/>\n"
  );


  $templateCache.put('/staffim-table/pagination.html',
    "<div class=\"lv-body ng-cloak ng-table-empty\" ng-if=\"params.total() === 0 && params.showEmpty !== false\">\n" +
    "    <div class=\"text-center text-uppercase p-25\">Ничего не найдено</div>\n" +
    "</div>\n" +
    "<div class=\"ng-cloak ng-table-pager\" ng-if=\"params.total() > params.count()\">\n" +
    "    <ul ng-if=\"pages.length\" class=\"pagination ng-table-pagination\">\n" +
    "        <li ng-class=\"{'disabled': !page.active && !page.current, 'active': page.current}\" ng-repeat=\"page in pages\" ng-switch=\"page.type\">\n" +
    "            <a ng-switch-when=\"prev\" ng-click=\"params.page(page.number)\" href=\"\">&laquo;</a>\n" +
    "            <a ng-switch-when=\"first\" ng-click=\"params.page(page.number)\" href=\"\"><span ng-bind=\"page.number\"></span></a>\n" +
    "            <a ng-switch-when=\"page\" ng-click=\"params.page(page.number)\" href=\"\"><span ng-bind=\"page.number\"></span></a>\n" +
    "            <a ng-switch-when=\"more\" ng-click=\"params.page(page.number)\" href=\"\">&#8230;</a>\n" +
    "            <a ng-switch-when=\"last\" ng-click=\"params.page(page.number)\" href=\"\"><span ng-bind=\"page.number\"></span></a>\n" +
    "            <a ng-switch-when=\"next\" ng-click=\"params.page(page.number)\" href=\"\">&raquo;</a>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "</div>\n"
  );


  $templateCache.put('/staffim-table/search.html',
    "<div class=\"lvh-search\" ng-show=\"search.show\">\n" +
    "    <input\n" +
    "        data-field=\"input_search\"\n" +
    "        type=\"text\" class=\"lvhs-input\" placeholder=\"Поиск...\" autocapitalize=\"false\" spellcheck=\"false\" autocomplete=\"off\"\n" +
    "        ng-model=\"filter.query\"\n" +
    "        ng-model-options=\"{updateOn: 'default blur', debounce: {'default': 500, 'blur': 0}}\"\n" +
    "        >\n" +
    "    <i class=\"lvh-search-close\" ng-click=\"search.show = false; filter.query = ''\">&times;</i>\n" +
    "</div>\n"
  );


  $templateCache.put('/staffim-table/sort.html',
    "<li class=\"dropdown\" uib-dropdown ng-show=\"items.length\">\n" +
    "    <a href=\"\" uib-dropdown-toggle>\n" +
    "        <i class=\"zmdi zmdi-sort\"></i>\n" +
    "    </a>\n" +
    "    <ul class=\"dropdown-menu dropdown-menu-right\">\n" +
    "        <li\n" +
    "            ng-repeat=\"item in items\"\n" +
    "            ng-class=\"{'active': isActive(item)}\"\n" +
    "            ng-click=\"sortBy(item)\">\n" +
    "            <a href=\"#\">\n" +
    "                {{item.title}}\n" +
    "            </a>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "</li>\n"
  );

}]);
