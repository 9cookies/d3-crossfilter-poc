'use strict';

var pg = require('pg');
var env = require('./../../config/local.env');
if (!env.DB_USER || !env.DB_PWD || !env.DB_NAME) {
    console.error('ERR: Please set the DB_USER, DB_PWD and DB_NAME properties in server/config/local.env.js');
    process.exit(1);
}
var CON_STRING = 'postgres://' + env.DB_USER + ':' + env.DB_PWD + '@' + (env.DB_HOST || 'localhost') + ':' + (env.DB_PORT || 5432) + '/' + env.DB_NAME;

function connect(callback) {
    pg.connect(CON_STRING, callback);
}

exports.query = function (query, params, callback) {
    connect(function (err, client, done) {
        if (err) {
            return console.error('Error fetching client from pool!', err);
        }
        client.query(query, params, function (err, result) {
            done();
            if (err) {
                return console.error('Error running query ' + query + ' with params {' + params + '}!', err);
            }
            callback(result.rows);
            client.end();
        });
    });
};
