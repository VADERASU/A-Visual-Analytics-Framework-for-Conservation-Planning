const express = require('express');
const router = express.Router();
const co = require('co');
const turf = require('@turf/turf');
const fs = require('fs');
var ObjectId = require('mongodb').ObjectID;

const MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

// Connection URL
const url = 'mongodb://vaderserver0.cidse.dhcp.asu.edu:27017/eco_region';
let mongoDB = false;

// const pashpCollection = "pashp";
const badpashpCollection = "newMTparcel_bad";
// const layer1pa = JSON.parse(fs.readFileSync("./processData/layer1pa.json", 'utf8'));
// const layer2pa = JSON.parse(fs.readFileSync("./processData/layer2pa.json", 'utf8'));



module.exports = function (appRoot) {
    /* GET map data. */
    router.get('/', function (req, res, next) {
        // let request = req._parsedUrl.query;
        // let parsedInfo = JSON.parse(request.replace(/%22/g, '"'));
        // console.log("request", parsedInfo);
        // let parsedInfo = "Other Conservation Area";

        co(function* () {
            let db = yield MongoClient.connect(url);
            // let pashpCol = db.collection(pashpCollection);
            let badpashpCol = db.collection(badpashpCollection);
            // let gridCol = db.collection("grid_Montana_layer1and2");
            // let result = yield gridCol.find({"properties.center":[-104.04584884643555, 48.003821039657645]}, { timeout: false }).toArray();
            let result = yield badpashpCol.find(ObjectId('5b7b213f0f43f967774f95f9')).toArray();
            db.close();
            res.send(result);
        })

        //     //     //operation in good parcel collection
        //     //     // let pashpArr = yield pashpCol.find({
        //     //     //     $and: [
        //     //     //         { "properties.IUCN_Cat": { $nin: ["Unassigned", "N/R"] } },
        //     //     //         { "properties.State_Nm": "MT" }
        //     //     //     ]
        //     //     // }).toArray();
        //     //     // let badshpArr = yield badpashpCol.find({
        //     //     //     $and: [
        //     //     //         { "properties.IUCN_Cat": { $in: ["Ia", "Ib", "II", "III", "IV", "V", "VI"] } },
        //     //     //         { "properties.State_Nm": "MT" }
        //     //     //     ]
        //     //     // }).toArray();
        //     //     // // let resultArr = pashpArr.concat(badshpArr);
        //     //     // db.close();
        //     //     // res.send(badshpArr);


        //     //     // let db = yield MongoClient.connect(url);
        //     //     // let badpashpCol = db.collection(badpashpCollection);
        //     //     // let pashpCol = db.collection(pashpCollection);

        //     //     // //demo badpa
        //     //     // let badshpArr = yield badpashpCol.find({ "properties.State_Nm": "MT" }).toArray();
        //     //     // let pashpArr = yield pashpCol.find({ "properties.State_Nm": "MT" }).toArray();
        //     //     // db.close();
        //     res.send(result);
        // });
        // let bufferArr = layer1pa.map(pa => {
        //     return turf.buffer({ "type": 'Feature', "properties": {}, "geometry": pa.geometry }, 22);
        // });
        // console.log(bufferArr)
        // let originalArr = layer1pa.map(pa => {
        //     return { "type": 'Feature', "properties": {}, "geometry": pa.geometry };
        // });
        // var buffered = turf.buffer({ "type": 'Feature', "properties": {}, "geometry": layer1pa[3].geometry }, 22);
        // var buffered2 = turf.buffer({ "type": 'Feature', "properties": {}, "geometry": layer2pa[386].geometry }, 22);
        // var buffered3 = turf.buffer({ "type": 'Feature', "properties": {}, "geometry": layer1pa[58].geometry }, 21);
        // var bbox = turf.bbox(buffered3);
        // var bboxPolygon = turf.bboxPolygon(bbox);
        // console.log(bboxPolygon.geometry.coordinates)
        //{ "buffered": buffered, "original": { "type": 'Feature', "properties": {}, "geometry": layer1pa[77].geometry } }
        //{ "bufferArr": bufferArr, "originalArr": originalArr}
        // res.send(buffered3);
    });
    return router;
};
