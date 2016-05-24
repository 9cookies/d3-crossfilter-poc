'use strict';

angular.module('delolap')
    .controller('MainCtrl', ['$scope', '$http', 'dcService', function ($scope, $http, dc) {
        var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            model = {};
        $scope.model = model;
        model.deliveries = [];

        function daysToMillis(days) {
            return days * 24 * 60 * 60 * 1000;
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

        model.days = 60;
        model.from = roundDate(new Date(Date.now() - daysToMillis(model.days)));
        model.to = new Date(model.from.getTime() + daysToMillis(model.days + 1) - 1);

        function initCrossfilter(deliveries) {
            var roundGroup = function (val) {
                    return function (d) {
                        return Math.floor(d / val) * val;
                    };
                },
                delivery = crossfilter(deliveries),
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
            // indicated cooking time
                indicatedCookingTime = delivery.dimension(function (d) {
                    return d.indicated_cooking_time;
                }),
                indicatedCookingTimes = indicatedCookingTime.group(roundGroup(60)),
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
                scores = score.group(Math.floor),
                distancePerMinute = delivery.dimension(function (d) {
                    return d.distance / (d.actual_duration / 60);
                }),
                distancesPerMinute = distancePerMinute.group(roundGroup(25));


            function formatSeconds(s) {
                var negative = s < 0,
                    min = Math.floor(Math.abs(s) / 60),
                    sec = Math.abs(s) % 60;
                return (negative ? '-' : '') + min + ':' + (sec > 9 ? sec : '0' + sec);
            }

            function xUnits(cnt) {
                return function () {
                    return cnt;
                }
            }

            model.deliveryCrossfilter = delivery;
            model.charts = [
                {
                    id: 'startDelay',
                    title: 'Start delay [mmm:ss]',
                    model: {
                        width: 1060,
                        crossFilterGroup: 1,
                        dimension: startDelay,
                        group: startDelays,
                        x: d3.scale.linear().domain([-6000, 6000]),
                        xUnits: xUnits(200),
                        xAxisFormatter: formatSeconds,
                        barWidth: 5
                    }
                },
                {
                    id: 'deliveredDelay',
                    title: 'Delivered delay [mmm:ss]',
                    model: {
                        width: 1060,
                        crossFilterGroup: 1,
                        dimension: deliveredDelay,
                        group: deliveredDelays,
                        x: d3.scale.linear().domain([-6000, 6000]),
                        xUnits: xUnits(200),
                        xAxisFormatter: formatSeconds,
                        barWidth: 5
                    }
                },
                {
                    id: 'preparationTime',
                    title: 'Preparation time [mmm:ss]',
                    model: {
                        width: 1060,
                        crossFilterGroup: 1,
                        dimension: preparationDuration,
                        group: preparationDurations,
                        x: d3.scale.linear().domain([0, 14400]),
                        xUnits: xUnits(240),
                        xAxisFormatter: formatSeconds,
                        barWidth: 20
                    }
                },
                {
                    id: 'estimatedDuration',
                    title: 'Estimated duration [mmm:ss]',
                    model: {
                        width: 1060,
                        crossFilterGroup: 1,
                        dimension: estimatedDuration,
                        group: estimatedDurations,
                        x: d3.scale.linear().domain([0, 1200]),
                        xUnits: xUnits(200),
                        xAxisFormatter: formatSeconds,
                        barWidth: 5
                    }
                },
                {
                    id: 'actualDuration',
                    title: 'Actual duration [mmm:ss]',
                    model: {
                        width: 1060,
                        crossFilterGroup: 1,
                        dimension: actualDuration,
                        group: actualDurations,
                        x: d3.scale.linear().domain([0, 1200]),
                        xUnits: xUnits(200),
                        xAxisFormatter: formatSeconds,
                        barWidth: 5
                    }
                },
                {
                    id: 'acceptanceDuration',
                    title: 'Acceptance duration [mmm:ss]',
                    model: {
                        width: 560,
                        crossFilterGroup: 1,
                        dimension: acceptanceDuration,
                        group: acceptanceDurations,
                        x: d3.scale.linear().domain([0, 240]),
                        xUnits: xUnits(24),
                        xAxisFormatter: formatSeconds,
                        barWidth: 41.6
                    }
                },
                {
                    id: 'indicatedCookingTime',
                    title: 'Indicated cooking time [mmm:ss]',
                    model: {
                        width: 560,
                        crossFilterGroup: 1,
                        dimension: indicatedCookingTime,
                        group: indicatedCookingTimes,
                        x: d3.scale.linear().domain([0, 7200]),
                        xUnits: xUnits(24),
                        xAxisFormatter: formatSeconds,
                        barWidth: 20
                    }
                },
                {
                    id: 'distancePerMinute',
                    title: 'Distance per minute [m/min]',
                    model: {
                        width: 560,
                        crossFilterGroup: 1,
                        dimension: distancePerMinute,
                        group: distancesPerMinute,
                        x: d3.scale.linear().domain([0, 2000]),
                        xUnits: xUnits(80),
                        barWidth: 25
                    }
                },
                {
                    id: 'distance',
                    title: 'Distance [km]',
                    model: {
                        width: 560,
                        crossFilterGroup: 1,
                        dimension: distance,
                        group: distances,
                        x: d3.scale.linear().domain([0, 20]),
                        xUnits: xUnits(100),
                        barWidth: 6
                    }
                },
                {
                    id: 'date',
                    title: 'Date',
                    model: {
                        width: 560,
                        crossFilterGroup: 1,
                        dimension: date,
                        group: dates,
                        round: d3.time.day.round,
                        x: d3.time.scale().domain([model.from, model.to]),
                        xUnits: xUnits(model.days),
                        barWidth: 18
                    }
                },
                {
                    id: 'day',
                    title: 'Day',
                    model: {
                        width: 200,
                        crossFilterGroup: 1,
                        dimension: day,
                        group: days,
                        round: Math.floor,
                        x: d3.scale.linear().domain([0, 7]),
                        xUnits: xUnits(7),
                        xAxisFormatter: function (val) {
                            return DAYS[val % DAYS.length];
                        },
                        barWidth: 20
                    }
                },
                {
                    id: 'hourOfDay',
                    title: 'Hour of day',
                    model: {
                        width: 300,
                        crossFilterGroup: 1,
                        dimension: hour,
                        group: hours,
                        x: d3.scale.linear().domain([0, 24]).rangeRound([0, 10 * 24]),
                        xUnits: xUnits(24)
                    }
                },
                {
                    id: 'routePosition',
                    title: 'Route position',
                    model: {
                        width: 160,
                        crossFilterGroup: 1,
                        dimension: routePosition,
                        group: routePositions,
                        round: Math.floor,
                        x: d3.scale.linear().domain([0, 10]),
                        xUnits: xUnits(10)
                    }
                },
                {
                    id: 'liveTrackingScore',
                    title: 'Live tracking score',
                    model: {
                        width: 280,
                        crossFilterGroup: 1,
                        dimension: score,
                        group: scores,
                        round: Math.floor,
                        x: d3.scale.linear().domain([0, 110]),
                        xUnits: xUnits(11)
                    }
                }
            ];
        }

        initCrossfilter([]);
        function load(size, offset) {
            $http.get('/api/deliveries', {
                params: {
                    from: model.from,
                    to: model.to,
                    limit: size,
                    offset: offset
                }
            }).success(function (result) {
                if (result.data && result.data.length) {
                    var deliveries = preProcess(result.data);
                    Array.prototype.push.apply(model.deliveries, deliveries);
                    model.deliveryCrossfilter.add(deliveries);
                    if (result.data.length === size) {
                        load(Math.floor(size * 2), offset + size);
                    } else {
                        model.loading = false;
                    }
                } else {
                    model.loading = false;
                }
            }).error(function () {
                console.error('Couldn\'t load deliveries', arguments);
                model.loading = false;
            }).finally(function () {
                if (model.firstLoad) {
                    model.firstLoad = false;
                } else {
                    dc.renderAll();
                }
            });
        }

        model.firstLoad = true;
        model.loading = true;
        load(1000, 0);
    }]);
