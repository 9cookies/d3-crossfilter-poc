'use strict';

angular.module('delolap.services', [])
    .service('ChartService', [function () {
        var charts = {},
            groupSources = {};

        function render(chart) {
            chart.chart(chart.elem);
        }

        function renderGroup(group) {
            var prop, arr, source = groupSources[group];
            if (source) {
                window.source = source;
                console.log('source size', source.reduceCount().value());
            }
            if (charts.hasOwnProperty(group)) {
                arr = charts[group];
                for (prop in arr) {
                    if (arr.hasOwnProperty(prop)) {
                        render(arr[prop]);
                    }
                }
            } else {
                console.error('Unknown group ' + group);
            }
        }

        return {
            addChart: function (chart, elem, group) {
                if (!charts.hasOwnProperty(group)) {
                    charts[group] = {};
                }
                charts[group][chart.id()] = {
                    chart: chart,
                    elem: elem
                };
            },
            setGroupSource: function (group, source) {
                groupSources[group] = source;
            },
            renderGroup: renderGroup,
            resetChart: function (id, group) {
                charts[group][id].chart.filter(null);
                renderGroup(group);
            }
        }
    }]);
