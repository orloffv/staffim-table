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
            this.currentPages = [];
            this.on = on;
            this.emit = emit;

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
            }

            function emit(event, params) {
                $rootScope.$emit(this.id + '-' + event, params);
            }

            function parameters(newParameters, init) {
                if (angular.isDefined(newParameters)) {
                    var changed = false;
                    _.each(newParameters, function(value, key) {
                        var newValue = (_.isNumber(value) ? parseFloat(value) : value);
                        if (!_.isEqual(params[key], newValue)) {
                            params[key] = newValue;
                            changed = true;
                        }
                    });
                    if (!init && changed) {
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
                    formSortFilter = form;
                } else {
                    return formSortFilter;
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
                paginationMinBlocks: 5
            };

            var formSortFilter;

            this.settings(stDefaults.settings);
            this.settings(baseSettings);
            this.parameters(baseParameters, true);
        };

        return STParams;
    }
}());

