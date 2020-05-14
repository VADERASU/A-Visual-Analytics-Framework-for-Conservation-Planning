const express = require('express');
const router = express.Router();
const co = require('co');
const fs = require('fs');
const _ = require('underscore');
const path = require('path');
const turf = require('@turf/turf');

const MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017/eco_region';
let mongoDB = false;

module.exports = function (appRoot) {
    /* GET map data. */
    router.get('/', function (req, res, next) {
        let request = req._parsedUrl.query;
        let parsedInfo = JSON.parse(request.replace(/%22/g, '"'));
        let screenshotId = parsedInfo.screenshotId;
        // fs.writeFile('./resultList.json', JSON.stringify(parsedInfo, null, 2) , 'utf-8');

        co(function* () {
            let db = yield MongoClient.connect(url);
            let imageInfoCol = db.collection('saveImageInfo');
            let upserImage = yield imageInfoCol.update(
                { "screenshotId": screenshotId },
                parsedInfo,
                {upsert: true}
            );
            db.close();
            res.send("saved");
        });


    });
    return router;
};
