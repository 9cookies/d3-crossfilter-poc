'use strict';

angular.module('delolap')
    .controller('MainCtrl', ['$scope', '$http', 'ChartService', function ($scope, $http, ChartService) {
        var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $scope.model = {};
        $scope.model.deliveries = [];

        function daysToMillis(days) {
            return days * 24 * 60 * 60 * 1000;
        }

        function dayRange(from, to) {
            return Math.floor((roundDate(to).getTime() - roundDate(from).getTime() - 1) / daysToMillis(1)) + 1;
        }

        function roundDate(date) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }

        function preProcess(arr) {
            var i,
                preProcessObj = function (obj) {
                    var prop, d;
                    for (prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            if (obj[prop] && isNaN(obj[prop]) && isNaN(Number(obj[prop]))) {
                                d = new Date(obj[prop]);
                                if (!isNaN(d.getMonth())) {
                                    obj[prop] = d;
                                }
                            }
                        }
                    }
                };
            for (i = 0; i < arr.length; i++) {
                preProcessObj(arr[i]);
            }
            return arr;
        }

        $scope.model.days = 60;
        $scope.model.from = roundDate(new Date(Date.now() - daysToMillis($scope.model.days)));
        $scope.model.to = new Date($scope.model.from.getTime() + daysToMillis($scope.model.days + 1) - 1);

        $scope.model.loading = true;
        $http.get('/api/deliveries', {
            params: {
                from: $scope.model.from,
                to: $scope.model.to
            }
        }).success(function (result) {
            var deliveries = preProcess(result.data),
                roundGroup = function (val) {
                    return function (d) {
                        return Math.floor(d / val) * val;
                    };
                },
                delivery = crossfilter(deliveries),
                all = delivery.groupAll(),
            // date
                date = delivery.dimension(function (d) {
                    return d.delivery_timestamp;
                }),
                dates = date.group(d3.time.day),
            // start delay
                startDelay = delivery.dimension(function (d) {
                    return d.start_delay;
                }),
                startDelays = startDelay.group(roundGroup(60)),
            // delivered delay
                deliveredDelay = delivery.dimension(function (d) {
                    return d.delivered_delay;
                }),
                deliveredDelays = deliveredDelay.group(roundGroup(60)),
            // estimated duration in sec
                estimatedDuration = delivery.dimension(function (d) {
                    return d.estimated_duration;
                }),
                estimatedDurations = estimatedDuration.group(roundGroup(6)),
            // actual duration
                actualDuration = delivery.dimension(function (d) {
                    return d.actual_duration;
                }),
                actualDurations = actualDuration.group(roundGroup(6)),
            // acceptance duration
                acceptanceDuration = delivery.dimension(function (d) {
                    return d.acceptance_duration;
                }),
                acceptanceDurations = acceptanceDuration.group(roundGroup(10)),
            // preparation duration
                preparationDuration = delivery.dimension(function (d) {
                    return d.preparation_duration;
                }),
                preparationDurations = preparationDuration.group(roundGroup(60)),
            // distance
                distance = delivery.dimension(function (d) {
                    return d.distance / 1000;
                }),
                distances = distance.group(roundGroup(0.2)),

                hour = delivery.dimension(function (d) {
                    return d.delivery_timestamp.getHours() + d.delivery_timestamp.getMinutes() / 60;
                }),
                hours = hour.group(Math.floor),

                day = delivery.dimension(function (d) {
                    return (d.delivery_timestamp.getDay() + 6) % 7;
                }),
                days = day.group(),

                routePosition = delivery.dimension(function (d) {
                    return d.ord;
                }),
                routePositions = routePosition.group(),

                score = delivery.dimension(function (d) {
                    return d.live_tracking_score;
                }),
                scores = score.group(Math.floor);


            function formatSeconds(s) {
                var negative = s < 0,
                    min = Math.floor(Math.abs(s) / 60),
                    sec = Math.abs(s) % 60;
                return (negative ? '-' : '') + min + ':' + (sec > 9 ? sec : '0' + sec);
            }

            $scope.model.charts = [
                {
                    title: 'Start delay [mmm:ss]',
                    model: {
                        crossFilterGroup: 1,
                        dimension: startDelay,
                        group: startDelays,
                        x: d3.scale.linear().domain([-6000, 6000]).rangeRound([0, 10 * 100]),
                        xAxisFormatter: formatSeconds,
                        barWidth: 5
                    }
                },
                {
                    title: 'Delivered delay [mmm:ss]',
                    model: {
                        crossFilterGroup: 1,
                        dimension: deliveredDelay,
                        group: deliveredDelays,
                        x: d3.scale.linear().domain([-6000, 6000]).rangeRound([0, 10 * 100]),
                        xAxisFormatter: formatSeconds,
                        barWidth: 5
                    }
                },
                {
                    title: 'Acceptance duration [mmm:ss]',
                    model: {
                        crossFilterGroup: 1,
                        dimension: acceptanceDuration,
                        group: acceptanceDurations,
                        x: d3.scale.linear().domain([0, 240]).rangeRound([0, 10 * 100]),
                        xAxisFormatter: formatSeconds,
                        barWidth: 41.6
                    }
                },
                {
                    title: 'Preparation time [mmm:ss]',
                    model: {
                        crossFilterGroup: 1,
                        dimension: preparationDuration,
                        group: preparationDurations,
                        x: d3.scale.linear().domain([0, 3000]).rangeRound([0, 10 * 100]),
                        xAxisFormatter: formatSeconds,
                        barWidth: 20
                    }
                },
                {
                    title: 'Estimated duration [mmm:ss]',
                    model: {
                        crossFilterGroup: 1,
                        dimension: estimatedDuration,
                        group: estimatedDurations,
                        x: d3.scale.linear().domain([0, 1200]).rangeRound([0, 10 * 100]),
                        xAxisFormatter: formatSeconds,
                        barWidth: 5
                    }
                },
                {
                    title: 'Actual duration [mmm:ss]',
                    model: {
                        crossFilterGroup: 1,
                        dimension: actualDuration,
                        group: actualDurations,
                        x: d3.scale.linear().domain([0, 1200]).rangeRound([0, 10 * 100]),
                        xAxisFormatter: formatSeconds,
                        barWidth: 5
                    }
                },
                {
                    title: 'Distance [km]',
                    model: {
                        crossFilterGroup: 1,
                        dimension: distance,
                        group: distances,
                        x: d3.scale.linear().domain([0, 20]).rangeRound([0, 10 * 60]),
                        barWidth: 6
                    }
                },
                {
                    title: 'Route position',
                    model: {
                        crossFilterGroup: 1,
                        dimension: routePosition,
                        group: routePositions,
                        round: Math.floor,
                        x: d3.scale.linear().domain([0, 10]).rangeRound([0, 10 * 10])
                    }
                },
                {
                    title: 'Live tracking score',
                    model: {
                        crossFilterGroup: 1,
                        dimension: score,
                        group: scores,
                        round: Math.floor,
                        x: d3.scale.linear().domain([0, 110]).rangeRound([0, 20 * 11])
                    }
                },
                {
                    title: 'Date',
                    model: {
                        crossFilterGroup: 1,
                        dimension: date,
                        group: dates,
                        round: d3.time.day.round,
                        x: d3.time.scale().domain([$scope.model.from, $scope.model.to]).rangeRound([0, 18 * dayRange($scope.model.from, $scope.model.to)]),
                        barWidth: 18
                    }
                },
                {
                    title: 'Day',
                    model: {
                        crossFilterGroup: 1,
                        dimension: day,
                        group: days,
                        round: Math.floor,
                        x: d3.scale.linear().domain([0, 7]).rangeRound([0, 20 * 7]),
                        xAxisFormatter: function (val) {
                            return DAYS[val % DAYS.length];
                        },
                        barWidth: 20
                    }
                },
                {
                    title: 'Hour of day',
                    model: {
                        crossFilterGroup: 1,
                        dimension: hour,
                        group: hours,
                        x: d3.scale.linear().domain([0, 24]).rangeRound([0, 10 * 24])
                    }
                }
            ];

            $scope.model.deliveries = deliveries;
            ChartService.setGroupSource(1, all);
        }).error(function () {
            console.error('Couldn\'t load deliveries', arguments);
            $scope.model.deliveries = [];
        }).finally(function () {
            $scope.model.loading = false;
        });
    }]);
