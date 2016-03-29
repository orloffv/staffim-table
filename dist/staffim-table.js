(function(){
    angular.module('staffimTable', ['ngTable']);
})();

(function(){
    angular.module('staffimTable')
        .service('STWithSelect', STWithSelect);

    STWithSelect.$inject = [];
    function STWithSelect() {
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

            ngTableParams.on('data_changed', onDataChanged);
            onDataChanged();

            function onDataChanged() {
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

'use strict';
(function() {
    angular.module('staffimTable')
        .value('stDefaults', {
            params: {},
            settings: {}
        });
}());

'use strict';
(function() {
    angular.module('staffimTable')
        .factory('STParams', STParams);

    STParams.$inject = ['stDefaults', '$q', '$rootScope'];
    function STParams(stDefaults, $q, $rootScope) {
        var STParams = function(baseParameters, baseSettings) {
            var that = this;
            this.data = [];
            this.id = _.uniqueId('STParams');
            this.parameters = parameters;
            this.settings = settings;
            this.page = page;
            this.total = total;
            this.count = count;
            this.filter = filter;
            this.sorting = sorting;
            this.orderBy = orderBy;
            this.generatePagesArray = generatePagesArray;
            this.reload = reload;
            this.reloadPages = reloadPages;
            this.setData = setData;
            this.getData = getData;
            this.getDataWrapper = getDataWrapper;
            this.getSortFilterModel = getSortFilterModel;
            this.formSortFilter = formSortFilter;
            this.filterFormatter = filterFormatter;
            this.currentPages = [];
            this.on = on;
            this.emit = emit;
            this.destroy = destroy;
            this.destroyHandlers = [];

            function destroy() {
                delete this.data;
                if (formSortFilterInstance && formSortFilterInstance.destroy) {
                    formSortFilterInstance.destroy();
                }

                _.each(this.destroyHandlers, function(handler) {
                    handler();
                });
            }

            function getSortFilterModel() {
                var sorting = this.sorting();

                if (_.size(sorting) === 1) {
                    sorting = {once: _.first(_.keys(sorting)) + '|' + _.first(_.values(sorting))};
                }

                return {
                    sort: sorting,
                    filter: this.filter()
                };
            }

            function on(event, callback) {
                var handler = $rootScope.$on(this.id + '-' + event, function(event, params) {
                    callback(params);
                });

                this.destroyHandlers.push(handler);
            }

            function emit(event, params) {
                $rootScope.$emit(this.id + '-' + event, params);
            }

            function parameters(newParameters, init) {
                if (angular.isDefined(newParameters)) {
                    var filterFormattedData = settings.filterFormatter(angular.copy(this.filter()));
                    var filterChanged = false;
                    var otherChanged = false;
                    _.each(newParameters, function(value, key) {
                        var newValue = (_.isNumber(value) ? parseFloat(value) : value);
                        if (!_.isEqual(params[key], newValue)) {
                            params[key] = newValue;
                            if (key === 'filter') {
                                filterChanged = true;
                            } else {
                                otherChanged = true;
                            }
                        }
                    });
                    var formattedDataChanged = filterChanged && !_.isEqual(filterFormattedData, settings.filterFormatter(angular.copy(this.filter())));

                    if (!init && (formattedDataChanged || otherChanged)) {
                        if (!_.has(newParameters, 'page')) {
                            params.page = 1;
                        }
                        this.reload();
                    }

                    return this;
                }

                return params;
            }

            function orderBy() {
                return convertSortToOrderBy(params.sorting);
            }

            function convertSortToOrderBy(sorting) {
                return _.map(sorting, function(order, column) {
                    return (order === 'asc' ? '+' : '-') + column;
                });
            }

            function getData() {
                return this.data;
            }

            function setData(data) {
                this.data = data;
                this.emit('data_changed');
                this.reloadPages();

                return this;
            }

            function settings(newSettings) {
                if (angular.isDefined(newSettings)) {
                    var originalDataset = settings.data;
                    var newDataset = newSettings.dataset;

                    if (newDataset && !_.isEqual(newDataset, originalDataset)) {
                        this.setData(newDataset);
                    }
                    settings = angular.extend(settings, newSettings);
                    delete settings.dataset;

                    return this;
                }

                return settings;
            }

            function formSortFilter(form) {
                if (angular.isDefined(form)) {
                    form.updateFields(function(field) {
                        if (!field.modelOptions) {
                            field.modelOptions = {};
                        }

                        field.modelOptions.debounce = 500;
                    });
                    formSortFilterInstance = form;
                } else {
                    return formSortFilterInstance;
                }
            }

            function page(page) {
                return angular.isDefined(page) ?
                    this.parameters({
                        page: page
                    }) :
                    params.page;
            }

            function total(total) {
                return angular.isDefined(total) ?
                    this.settings({
                        total: total
                    }) :
                    settings.total;
            }

            function count(count) {
                return angular.isDefined(count) ?
                    this.parameters({
                        count: count,
                        page: 1
                    }) :
                    params.count;
            }

            function filter(filter) {
                return angular.isDefined(filter) && angular.isObject(filter) ?
                    this.parameters({
                        filter: filter,
                        page: 1
                    }) :
                    params.filter;
            }

            function filterFormatter() {
                return settings.filterFormatter(angular.copy(this.filter()));
            }

            function sorting(sorting) {
                if (arguments.length === 2) {
                    var sortArray = {};
                    sortArray[sorting] = arguments[1];
                    this.parameters({
                        sorting: sortArray
                    });

                    return this;
                }

                return angular.isDefined(sorting) ?
                    this.parameters({
                        sorting: sorting
                    }) :
                    params.sorting;
            }

            function generatePagesArray(currentPage, totalItems, pageSize, maxBlocks) {
                if (!arguments.length){
                    currentPage = this.page();
                    totalItems = this.total();
                    pageSize = this.count();
                }

                var maxPage, maxPivotPages, minPage, numPages, pages;
                maxBlocks = maxBlocks && maxBlocks < 6 ? 6 : maxBlocks;

                pages = [];
                numPages = Math.ceil(totalItems / pageSize);
                if (numPages > 1) {
                    pages.push({
                        type: 'prev',
                        number: Math.max(1, currentPage - 1),
                        active: currentPage > 1
                    });
                    pages.push({
                        type: 'first',
                        number: 1,
                        active: currentPage > 1,
                        current: currentPage === 1
                    });
                    maxPivotPages = Math.round((settings.paginationMaxBlocks - settings.paginationMinBlocks) / 2);
                    minPage = Math.max(2, currentPage - maxPivotPages);
                    maxPage = Math.min(numPages - 1, currentPage + maxPivotPages * 2 - (currentPage - minPage));
                    minPage = Math.max(2, minPage - (maxPivotPages * 2 - (maxPage - minPage)));
                    var i = minPage;
                    while (i <= maxPage) {
                        if ((i === minPage && i !== 2) || (i === maxPage && i !== numPages - 1)) {
                            pages.push({
                                type: 'more',
                                active: false
                            });
                        } else {
                            pages.push({
                                type: 'page',
                                number: i,
                                active: currentPage !== i,
                                current: currentPage === i
                            });
                        }
                        i++;
                    }
                    pages.push({
                        type: 'last',
                        number: numPages,
                        active: currentPage !== numPages,
                        current: currentPage === numPages
                    });
                    pages.push({
                        type: 'next',
                        number: Math.min(numPages, currentPage + 1),
                        active: currentPage < numPages
                    });
                }

                return pages;
            }

            function getDataWrapper() {
                var $defer = $q.defer();
                var pData = settings.getData.call(this, $defer, this);
                if (!pData) {
                    pData = $defer.promise;
                }

                return pData;
            }

            function reload() {
                var that = this;

                this.getDataWrapper()
                    .then(function(data) {
                        that.setData(data);

                        return data;
                    })
                    .catch(function(reason){
                        return $q.reject(reason);
                    });
            }

            function reloadPages() {
                var newPages = this.generatePagesArray();
                if (!_.isEqual(this.currentPages, newPages)) {
                    this.currentPages = newPages;
                    this.emit('pages_changed', newPages);
                }
            }

            var params = {
                page: 1,
                count: 10,
                filter: {},
                sorting: {}
            };
            angular.extend(params, stDefaults.params);

            var settings = {
                total: 0,
                defaultSort: 'desc',
                counts: [10, 25, 50, 100],
                paginationMaxBlocks: 11,
                paginationMinBlocks: 5,
                filterFormatter: function(data) {
                    return data;
                }
            };

            var formSortFilterInstance;

            this.settings(stDefaults.settings);
            this.settings(baseSettings);
            this.parameters(baseParameters, true);
        };

        return STParams;
    }
}());


'use strict';
(function() {
    angular.module('staffimTable')
        .directive('stPagination', stPagination);

    function stPagination() {
        return {
            restrict: 'E',
            templateUrl: '/staffim-table/pagination.html',
            scope: {
                params: '='
            },
            replace: true,
            link: function($scope) {
                $scope.pages = $scope.params.generatePagesArray();
                $scope.params.on('pages_changed', function(pages) {
                    if (!_.isEqual(pages, $scope.pages)) {
                        $scope.pages = pages;
                    }
                });
            }
        };
    }
}());

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

'use strict';
(function() {
    angular.module('staffimTable')
        .directive('stInlineEdit', stInlineEdit);

    function stInlineEdit() {
        return {
            templateUrl: '/staffim-table/inlineEdit.html',
            restrict: 'A',
            scope: {
                formInstance: '='
            },
            link: function($scope) {
                $scope.$watch('formInstance', function() {
                    $scope.options = $scope.formInstance.getFormOptions();
                    $scope.model = $scope.formInstance.getFormModel();
                    $scope.fields = $scope.formInstance.getFields();
                    $scope.onSubmit = $scope.formInstance.onSubmit.bind($scope.formInstance);
                });
            }
        };
    }
}());

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
    "    <th colspan=\"{{params.headerColspan ? params.headerColspan : $columns.length}}\">\n" +
    "        <div class=\"lv-header-alt clearfix\" ng-init=\"stSearch = {show: false};\" ng-class=\"params.headerClassName\">\n" +
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
    "</tr>\n" +
    "<tr ng-if=\"params.headerAdditionalRowTemplate\" ng-include=\"params.headerAdditionalRowTemplate\"></tr>\n" +
    "<tr ng-if=\"params.headerColumnsTitle\" ng-include=\"'/staffim-table/headerColumnsTitle.html'\"></tr>\n"
  );


  $templateCache.put('/staffim-table/headerCheckbox.html',
    "<input type=\"checkbox\" ng-model=\"vm.selected.checked\"/>\n"
  );


  $templateCache.put('/staffim-table/headerColumnsTitle.html',
    "<th ng-repeat=\"$column in $columns\" class=\"header\">\n" +
    "    <div class=\"ng-table-header\">\n" +
    "        <span ng-bind=\"$column.title(this)\"></span>\n" +
    "    </div>\n" +
    "</th>\n"
  );


  $templateCache.put('/staffim-table/headerFilter.html',
    "<div class=\"row\">\n" +
    "    <sf-table-header-filter params=\"params\" form-instance=\"vm.customFilterForm\" mapper=\"vm.customFilterFormMapper\"></sf-table-header-filter>\n" +
    "</div>\n"
  );


  $templateCache.put('/staffim-table/inlineEdit.html',
    "<formly-form model=\"model\" fields=\"fields\" options=\"formInstance.getFormOptions()\" form=\"formInstance.form\">\n" +
    "</formly-form>\n" +
    "<div class=\"block-absolute\">\n" +
    "    <div class=\"lv-actions actions\" ng-if=\"!options.formState.edit\" ng-click=\"options.formState.edit = true\">\n" +
    "        <a href=\"\">\n" +
    "            <i class=\"zmdi zmdi-edit\"></i>\n" +
    "        </a>\n" +
    "    </div>\n" +
    "    <div class=\"lv-actions actions\" ng-if=\"options.formState.edit\">\n" +
    "        <button type=\"submit\" class=\"btn btn-success m-r-5 waves-effect\" ng-click=\"onSubmit()\">\n" +
    "            <i class=\"zmdi zmdi-check\"></i>\n" +
    "        </button>\n" +
    "        <button type=\"button\" class=\"btn btn-default waves-effect\" ng-click=\"formInstance.resetModel(); options.formState.edit = false\">\n" +
    "            <i class=\"zmdi zmdi-close\"></i>\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n"
  );


  $templateCache.put('/staffim-table/pagination.html',
    "<div>\n" +
    "    <div class=\"lv-body ng-cloak ng-table-empty\" ng-if=\"params.total() === 0 && params.showEmpty !== false\">\n" +
    "        <div class=\"text-center text-uppercase p-25\">Ничего не найдено</div>\n" +
    "    </div>\n" +
    "    <div class=\"ng-cloak ng-table-pager\" ng-if=\"params.total() > params.count() && params.showPagination !== false\">\n" +
    "        <ul ng-if=\"pages.length\" class=\"pagination ng-table-pagination\">\n" +
    "            <li ng-class=\"{'disabled': !page.active && !page.current, 'active': page.current}\" ng-repeat=\"page in pages\" ng-switch=\"page.type\">\n" +
    "                <a ng-switch-when=\"prev\" ng-click=\"params.page(page.number)\" href=\"\">&laquo;</a>\n" +
    "                <a ng-switch-when=\"first\" ng-click=\"params.page(page.number)\" href=\"\"><span ng-bind=\"page.number\"></span></a>\n" +
    "                <a ng-switch-when=\"page\" ng-click=\"params.page(page.number)\" href=\"\"><span ng-bind=\"page.number\"></span></a>\n" +
    "                <a ng-switch-when=\"more\" ng-click=\"params.page(page.number)\" href=\"\">&#8230;</a>\n" +
    "                <a ng-switch-when=\"last\" ng-click=\"params.page(page.number)\" href=\"\"><span ng-bind=\"page.number\"></span></a>\n" +
    "                <a ng-switch-when=\"next\" ng-click=\"params.page(page.number)\" href=\"\">&raquo;</a>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
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


  $templateCache.put('/staffim-table/sortFilter.html',
    "<div class=\"row\">\n" +
    "    <div class=\"table-header-filter\">\n" +
    "        <formly-form model=\"model\" fields=\"fields\" options=\"form.getFormOptions()\" form=\"form.form\"></formly-form>\n" +
    "    </div>\n" +
    "</div>\n"
  );

}]);
