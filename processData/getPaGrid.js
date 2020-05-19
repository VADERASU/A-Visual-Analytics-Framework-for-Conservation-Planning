const turf = require('@turf/turf');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const co = require('co');
const url = 'mongodb://vaderserver0.cidse.dhcp.asu.edu:27017/eco_region';
const shapefile = require('shapefile');

let gridCollection = "grid_Idaho";
let PAcollection = "pashp";
let badPACollection = "badpashp";

// distance from point to polygon
function point2pa(center, geometry) {
    let minDist;
    let centerpoint = turf.point(center);
    let type = geometry.type;
    let coordinates = geometry.coordinates;
    if (type == 'MultiPolygon') {
        let firstSubpoly = coordinates[0][0];
        let firstline = turf.lineString(firstSubpoly);
        minDist = turf.pointToLineDistance(centerpoint, firstline);
        coordinates.forEach(polygon => {
            polygon.forEach(subpoly => {
                let line = turf.lineString(subpoly);
                let distance = turf.pointToLineDistance(centerpoint, line);
                if (minDist > distance) minDist = distance;
            });
        });
    } else {
        coordinates.forEach(subpoly => {
            let line = turf.lineString(subpoly);
            let distance = turf.pointToLineDistance(centerpoint, line);
            if (minDist > distance) minDist = distance;
        });
    }
    return minDist;
};

co(function* () {
    let options = {
        socketTimeoutMS: 90000000000,
        connectTimeoutMS: 90000000000
    };
    let db = yield MongoClient.connect(url, options);
    let gridCol = db.collection(gridCollection);
    let pashpCol = db.collection(PAcollection);
    let badpaCol = db.collection(badPACollection);
    let gridCursor = gridCol.find({ "properties.paDist": { $exists: false } }).batchSize(600000000).addCursorFlag('noCursorTimeout', true);

    let count = 0;
    while (yield gridCursor.hasNext()) {
        let item = yield gridCursor.next();
        let id = item._id;
        let center = item.properties.center;
        let centerGeo = { "type": "Point", "coordinates": center };

        let mingoodpaDist = -1;
        let minbadpaDist = -1;
        let minPaDist = -1;
        // get the minDist of good pa data
        let minPashpDistCursor = pashpCol.aggregate([
            {
                $geoNear: {
                    near: centerGeo,
                    distanceField: "dist.calculated",
                    maxDistance: 20000,
                    num: 1,
                    spherical: true
                }
            }
        ])
        while (yield minPashpDistCursor.hasNext()) {
            let minDistItem = yield minPashpDistCursor.next();
            let distance = minDistItem.dist.calculated;
            mingoodpaDist = distance;
        }
        // get the minDist of the bad pa data
        let minbadPaDistCursor = badpaCol.aggregate([
            {
                $geoNear: {
                    near: centerGeo,
                    distanceField: "dist.calculated",
                    maxDistance: 20000,
                    num: 1,
                    spherical: true
                }
            }
        ])
        while (yield minbadPaDistCursor.hasNext()) {
            let minDistItem = yield minbadPaDistCursor.next();
            minbadpaDist = point2pa(center, minDistItem.geometry);
        }

        if (minbadpaDist == -1 || mingoodpaDist == -1) {
            minPaDist = Math.max(minbadpaDist, mingoodpaDist);
        } else {
            minPaDist = Math.min(minbadpaDist, mingoodpaDist);
        }
        gridCol.update(
            { _id: id },
            { $set: { "properties.paDist": minPaDist } }
        )
        count++;
        if ((count % 10000) == 0) {
            console.log("id and distance ", id, minPaDist);
            console.log("totalnumber ", count);
        }


    }
    db.close();

}) // end of the co function

