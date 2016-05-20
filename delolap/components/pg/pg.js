'use strict';

var pg = require('pg');
var env = require('./../../config/local.env');
if (!env.DB_USER || !env.DB_PWD || !env.DB_NAME) {
    console.error('ERR: Please set the DB_USER, DB_PWD and DB_NAME properties in config/local.env.js');
    process.exit(1);
}
var CON_STRING = 'postgres://' + env.DB_USER + ':' + env.DB_PWD + '@' + (env.DB_HOST || 'localhost') + ':' + (env.DB_PORT || 5432) + '/' + env.DB_NAME;

function connect(callback) {
    pg.connect(CON_STRING, callback);
}

exports.query = function (query, params, callback, errCallback) {
    connect(function (err, client, done) {
        var handleError = function (err) {
            if (!err) return false;
            if (client) {
                done(client);
            }
            if (errCallback) {
                errCallback(err);
            }
            return true;
        };
        if (handleError(err)) return;
        client.query(query, params, function (err, result) {
            if (handleError(err)) return;
            done();
            callback(result.rows);
        });
    });
};