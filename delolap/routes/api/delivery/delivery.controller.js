'use strict';

var pg = require('../../../components/pg/pg');
var queries = {
    deliveries: "select " +
    "d.delivery_timestamp, " +
    "d.live_tracking_score, " +
    "d.belongs_to, " +
    "substr(drd.route_id || '', 29) as route, " +
    "drd.sort_order as ord, " +
    "dr.start_at as estimated_route_start, " +
    "d.route_start_timestamp as actual_route_start, " +
    "d.delivered_timestamp, " +
    "d.deliver_at as promised_timestamp, " +
    "round(extract(EPOCH from accepted_timestamp - delivery_timestamp)) as acceptance_duration, " +
    "round(extract(EPOCH from route_start_timestamp - accepted_timestamp)) as preparation_duration, " +
    "round(extract(EPOCH from delivered_timestamp - deliver_at)) as delivered_delay, " +
    "round(extract(EPOCH from route_start_timestamp - deliver_at) + duration) as start_delay, " +
    "drd.duration as estimated_duration, " +
    "drd.distance as distance, " +
    "round(extract(EPOCH from delivered_timestamp - d.route_start_timestamp)) as actual_duration " +
    "from delivery d " +
    "inner join driver_route_delivery drd on (drd.delivery_id = d.delivery_id and drd.belongs_to = d.belongs_to) " +
    "inner join driver_route dr on (dr.belongs_to = drd.belongs_to and dr.id = drd.route_id) " +
    "where " +
    "delivery_timestamp between $1 and $2 and " +
    "(d.flags IS NULL or d.flags & 256 != 256) and " +
    "d.state IN (3, 4) and d.tracking_state > 0 and " +
    "drd.duration > 0 and " +
    "d.delivered_timestamp is not null"
};

exports.index = function (request, response) {
    var DAYS_30 = 60 * 24 * 60 * 60 * 1000,
        from = new Date(request.query.from || Date.now() - DAYS_30),
        to = new Date(request.query.to || Date.now());
    pg.query(queries.deliveries, [from, to], function (result) {
        response.json({data: result});
    });
};
