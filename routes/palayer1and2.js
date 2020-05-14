const express = require('express');
const router = express.Router();
const fs = require('fs');

module.exports = function (appRoot) {
    /* GET map data. */
    router.get('/', function (req, res, next) {
        let request = req._parsedUrl.query;
        let parsedInfo = JSON.parse(request.replace(/%22/g, '"'));
        let result;
        if (parsedInfo == "paLayer1") {
            result = JSON.parse(fs.readFileSync("./processData/layer1pa.json", 'utf8'));
        } else {
            result = JSON.parse(fs.readFileSync("./processData/layer2pa.json", 'utf8'));
        }
        result = result.map(obj => ({
            "type":'Feature',
            'properties':{},
            "geometry": obj.geometry
        }))
        res.send(result);
    });
    return router;
};
