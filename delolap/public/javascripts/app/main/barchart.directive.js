'use strict';

angular.module('delolap.directives', ['dc'])
    .directive('dcBarChart', ['dcService', function (dc) {
        return {
            template: '' +
            '<div id="dc-chart_{{model.id}}" style="float: left;">' +
            '   <div class="title">{{model.title}} <a href="#" class="reset" style="display: none;" ng-click="local.reset()">reset</a></div>' +
            '</div>',
            replace: true,
            scope: {
                model: '=dcBarChart'
            },
            link: function (scope, elem) {
                var model = scope.model.model,
                    chart = dc.barChart(elem[0]);
                chart
                    .dimension(model.dimension)
                    .x(model.x)
                    .group(model.group)
                    .renderHorizontalGridLines(true)
                    .renderVerticalGridLines(true)
                    .width(model.width || 500)
                    .height(model.height || 160)
                    .elasticY(true)
                    .valueAccessor(function (d) {
                        return d.value;
                    })
                    .margins(model.margins || {top: 20, right: 20, bottom: 20, left: 40});
                if (model.round) {
                    chart.round(model.round);
                }
                if (model.y) {
                    chart.y(model.y);
                }
                if (model.filter) {
                    chart.filter(model.filter);
                }
                if (model.xAxisFormatter) {
                    chart.xAxis().tickFormat(model.xAxisFormatter);
                }
                if (model.xUnits) {
                    chart.xUnits(model.xUnits);
                }
                chart.render();
                scope.local = {
                    reset: function () {
                        chart.filterAll();
                        dc.redrawAll();
                    }
                };
            }
        }
    }]);
