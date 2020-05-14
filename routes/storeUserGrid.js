const express = require('express');
const router = express.Router();
const co = require('co');
const turf = require('@turf/turf');

let PAcollection = "pashp";
let badPACollection = "badpashp";
let roadCollection = "roadshp";
let goodHy = "hydrologyShp";
let badHy = "badhydrologyShp";

const MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

// Connection URL
const url = 'mongodb://vaderserver0.cidse.dhcp.asu.edu:27017/eco_region';
let mongoDB = false;

function getRandomCost(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function squareGridBasedonPosition(rectangle, cellside) {
    let bbox = rectangle[1].concat(rectangle[3]);
    let polygon = { "type": "Polygon", "coordinates": [rectangle] };
    let options = { units: 'miles', mask: polygon };
    let squareGrid = turf.squareGrid(bbox, cellside, options);
    let patches = squareGrid.features;
    squareGrid.features = patches.map(patch => {
        let center = turf.center(patch).geometry.coordinates;
        patch.properties.center = center;
        // console.log("patch ",patch);
        return patch;
    })
    return squareGrid;
}
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


module.exports = function (appRoot) {
    /* GET map data. */
    router.get('/', function (req, res, next) {
        let request = req._parsedUrl.query;
        let parsedInfo = JSON.parse(request.replace(/%22/g, '"'));
        let rectangle = parsedInfo.rectangle;
        let cellside = parsedInfo.cellside;
        let bbox = rectangle[1].concat(rectangle[3]);
        let patchesArr = squareGridBasedonPosition(rectangle, cellside);
        let searchArea = patchesArr.features.length * Math.pow(cellside, 2);
        let userDefinedGridInfo = { "bbox": bbox, "cellside": cellside, "searchArea": searchArea };

        // console.log("patchesArr ",patchesArr);
        let arr2store = []

        co(function* () {
            let db = yield MongoClient.connect(url);
            let PAcol = db.collection(PAcollection);
            let badPAcol = db.collection(badPACollection);
            let roadCol = db.collection(roadCollection);
            let Montana_MetroCol = db.collection("Montana_Metro");
            let goodHyCol = db.collection(goodHy);
            let badHyCol = db.collection(badHy);
            // let Montana_PACol = db.collection("Montana_PA");
            // let grid_MontanaCol = db.collection("grid_Montana");
            let userGridsCol = db.collection('userGrids');
            // console.time('GetAversquares');


            /////////Method 2 to get the average of the user defined patch.
            let getAverMetrics = co.wrap(function* (patchGeo) {
                function typeName4sourcedata(colname) {
                    let propertyname, propertyvalue;
                    switch (colname) {
                        case 'HIIshp':
                            propertyname = "averageHII";
                            propertyvalue = "DN";
                            break;
                        case 'birdshp':
                            propertyname = "averagebird";
                            propertyvalue = "DN";
                            break;
                        case 'fishshp':
                            propertyname = "averagefish";
                            propertyvalue = "Join_Count";
                            break;
                        case 'mammalshp':
                            propertyname = "averagemammal";
                            propertyvalue = "DN";
                            break;
                        case 'reptileshp':
                            propertyname = "averagereptile";
                            propertyvalue = "DN";
                            break;
                        case 'amphibianshp':
                            propertyname = "averageamphibian";
                            propertyvalue = "Join_Count";
                            break;
                        case 'treeshp':
                            propertyname = "averagetree";
                            propertyvalue = "DN";
                            break;
                        default:
                            break;
                    }
                    return { "propertyname": propertyname, "propertyvalue": propertyvalue }
                }
                let area2find = patchGeo.geometry;
                let center = patchGeo.properties.center;
                let centerGeo = { "type": "Point", "coordinates": center };
                /*****************************get pa attribute for each parch******************************************* */
                let mingoodpaDist = -1;
                let minbadpaDist = -1;
                let minPaDist = -1;
                // get the minDist of good pa data
                let minPashpDistCursor = PAcol.aggregate([
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
                let minbadPaDistCursor = badPAcol.aggregate([
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
                patchGeo.properties.paAver = minPaDist;
                /***************************get hydrology attribute*********************************** */
                let mingoodHyDist = -1;
                let minbadHyDist = -1;
                let minHyDist = -1;
                // get the minDist of good hydrology data
                let minHydrologyDistCursor = goodHyCol.aggregate([
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
                while (yield minHydrologyDistCursor.hasNext()) {
                    let minDistItem = yield minHydrologyDistCursor.next();
                    let distance = minDistItem.dist.calculated;
                    mingoodHyDist = distance;
                }
                // get the minDist of the bad hydrology data
                let minbadHyDistCursor = badHyCol.aggregate([
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
                while (yield minbadHyDistCursor.hasNext()) {
                    let minDistItem = yield minbadHyDistCursor.next();
                    minbadHyDist = point2pa(center, minDistItem.geometry);
                }

                if (minbadHyDist == -1 || mingoodHyDist == -1) {
                    minHyDist = Math.max(minbadHyDist, mingoodHyDist);
                } else {
                    minHyDist = Math.min(minbadHyDist, mingoodHyDist);
                }
                patchGeo.properties.averHyDist = minHyDist;

                ///////ma attribute
                let metroValue = -1;
                let maAverage = Montana_MetroCol.aggregate(
                    [{
                        $match: {
                            'geometry':
                            {
                                $geoWithin:
                                    { $geometry: area2find }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            avg_metro: { $avg: "$properties.dist" },
                        }
                    }],
                    {
                        allowDiskUse: true
                    }
                );
                while (yield maAverage.hasNext()) {
                    let average = yield maAverage.next();
                    metroValue = average.avg_metro;
                }
                patchGeo.properties.metroAver = metroValue;
                // console.log("patchGeo with ma", patchGeo);

                ///////road attribute
                let minRdDist = -1;
                let minRdDistCursor = roadCol.aggregate([
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
                while (yield minRdDistCursor.hasNext()) {
                    let minDistItem = yield minRdDistCursor.next();
                    let distance = minDistItem.dist.calculated;
                    minRdDist = distance;
                }
                patchGeo.properties.roadAver = minRdDist;

                let getattrofhii = co.wrap(function* (colname, area2find, badColname) {
                    let propertyname = typeName4sourcedata(colname).propertyname;
                    let propertyvalue = typeName4sourcedata(colname).propertyvalue;
                    let col = db.collection(colname);
                    let finalAverage = 0;
                    let goodSum = 0;
                    let goodCount = 0;

                    // var attrCursor = col.find(
                    //     {
                    //         'geometry':
                    //             {
                    //                 $geoIntersects:
                    //                     { $geometry: area2find }
                    //             }
                    //     }
                    // ).batchSize(66000000).addCursorFlag('noCursorTimeout', true);
                    // let sum = 0;
                    // let count = 0;
                    // let average = 0;
                    // while (yield attrCursor.hasNext()) {
                    //     let item = yield attrCursor.next();
                    //     let index = item.properties[propertyvalue];
                    //     sum += index;
                    //     count++
                    // }
                    // if (count != 0) {
                    //     average = sum / count;
                    // }
                    ////get the average of hii , method 2.
                    goodCount = yield col.find(
                        {
                            'geometry':
                            {
                                $geoIntersects:
                                    { $geometry: area2find }
                            }
                        }
                    ).batchSize(66000000).addCursorFlag('noCursorTimeout', true).count();
                    if (goodCount != 0) {
                        let attrCursor;
                        if (colname != "fishshp" && colname != "amphibianshp") {
                            attrCursor = col.aggregate(
                                [{
                                    $match: {
                                        'geometry':
                                        {
                                            $geoIntersects:
                                                { $geometry: area2find }
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        avg_value: { $avg: "$properties.DN" },
                                    }
                                }],
                                {
                                    allowDiskUse: true
                                }
                            );
                        } else {
                            attrCursor = col.aggregate(
                                [{
                                    $match: {
                                        'geometry':
                                        {
                                            $geoIntersects:
                                                { $geometry: area2find }
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        avg_value: { $avg: "$properties.Join_Count" },
                                    }
                                }],
                                {
                                    allowDiskUse: true
                                }
                            );
                        }
                        while (yield attrCursor.hasNext()) {
                            let average = yield attrCursor.next();
                            finalAverage = average.avg_value;
                        }
                        goodSum = finalAverage * goodCount;

                    }

                    if (badColname) {
                        // console.log("I have bad collection!!!!!!");
                        let badcol = db.collection(badColname);
                        var badattrCursor = badcol.find(
                            {
                                'geometry':
                                {
                                    $geoIntersects:
                                        { $geometry: area2find }
                                }
                            }
                        ).batchSize(66000000).addCursorFlag('noCursorTimeout', true);
                        let badsum = 0;
                        let badcount = 0;
                        while (yield badattrCursor.hasNext()) {
                            console.log("we have bad shp!!!!! sad")
                            let item = yield badattrCursor.next();
                            let intersection = turf.intersect(item, patchGeo);
                            if (intersection) {
                                let index = item.properties[propertyvalue];
                                badsum += index;
                                badcount++
                            }
                        }
                        if (badcount != 0) {
                            finalAverage = (badsum + goodSum) / (goodCount + badcount)
                        }
                    }

                    patchGeo.properties[propertyname] = finalAverage;
                    return yield Promise.resolve(patchGeo);
                });
                patchGeo = yield getattrofhii('HIIshp', area2find);
                patchGeo = yield getattrofhii('birdshp', area2find, "badbirdshp");
                patchGeo = yield getattrofhii('fishshp', area2find);
                patchGeo = yield getattrofhii('mammalshp', area2find, "badmammalshp");
                patchGeo = yield getattrofhii('reptileshp', area2find, "badreptileshp");
                patchGeo = yield getattrofhii('treeshp', area2find, "badtreeshp");
                patchGeo = yield getattrofhii('amphibianshp', area2find, "badamphibianshp");
                return yield Promise.resolve(patchGeo);
            });

            for (let i = 0; i < patchesArr.features.length; i++) {
                let patch = yield getAverMetrics(patchesArr.features[i]);
                patch.properties.userDefinedGridInfo = userDefinedGridInfo;
                patch.properties.cost = getRandomCost(128, 6784) * Math.pow(cellside, 2) //the price need to add four zero
                patch.properties.area = Math.pow(cellside, 2);
                // console.log("patch ", i, patch);
                arr2store.push(patch);
            }

            // console.timeEnd('GetAversquares');
            // console.log("arr2store ",arr2store);
            let result = yield userGridsCol.insertMany(arr2store);
            db.close();

            // console.log("arr2store[0]", arr2store[0])
            res.send(arr2store);



        });



    });
    return router;
};

 ////Method 1 to get the average of the user defined patch, using aggregation of the small cells and get the average value
            /////the time to get the avergage value is very slow. 
            // let getAverMetrics = co.wrap(function* (patchGeo) {
            //     // let collectionNames = ['Montana_Metro', 'Montana_PA', 'grid_Montana', 'HIIshp', 'birdshp', 'fishshp', 'mammalshp', 'reptileshp', 'treeshp', 'amphibianshp'];
            //     function typeName4sourcedata(colname) {
            //         let propertyname, propertyvalue;
            //         switch (colname) {
            //             case 'HIIshp':
            //                 propertyname = "averageHII";
            //                 propertyvalue = "DN";
            //                 break;
            //             case 'birdshp':
            //                 propertyname = "averagebird";
            //                 propertyvalue = "DN";
            //                 break;
            //             case 'fishshp':
            //                 propertyname = "averagefish";
            //                 propertyvalue = "Join_Count";
            //                 break;
            //             case 'mammalshp':
            //                 propertyname = "averagemammal";
            //                 propertyvalue = "DN";
            //                 break;
            //             case 'reptileshp':
            //                 propertyname = "averagereptile";
            //                 propertyvalue = "DN";
            //                 break;
            //             case 'amphibianshp':
            //                 propertyname = "averageamphibian";
            //                 propertyvalue = "Join_Count";
            //                 break;
            //             case 'treeshp':
            //                 propertyname = "averagetree";
            //                 propertyvalue = "DN";
            //                 break;
            //             default:
            //                 break;
            //         }
            //         return { "propertyname": propertyname, "propertyvalue": propertyvalue }
            //     }

            //     let area2find = patchGeo.geometry;
            //     let maAverage = Montana_MetroCol.aggregate(
            //         [{
            //             $match: {
            //                 'geometry':
            //                     {
            //                         $geoWithin:
            //                             { $geometry: area2find }
            //                     }
            //             }
            //         },
            //         {
            //             $group: {
            //                 _id: null,
            //                 avg_metro: { $avg: "$properties.dist" },
            //             }
            //         }],
            //         {
            //             allowDiskUse: true
            //         }
            //     );
            //     while (yield maAverage.hasNext()) {
            //         let average = yield maAverage.next();
            //         let metroAver;
            //         metroAver = average.avg_metro;
            //         patchGeo.properties.metroAver = metroAver;
            //         // console.log("patchGeo in the while ",patchGeo);
            //     }
            //     // console.log("patchGeo with ma", patchGeo);


            //     var paAverage = Montana_PACol.aggregate(
            //         [{
            //             $match: {
            //                 'geometry':
            //                     {
            //                         $geoWithin:
            //                             { $geometry: area2find }
            //                     }
            //             }
            //         },
            //         {
            //             $group: {
            //                 _id: null,
            //                 avg_pa: { $avg: "$properties.dist" },
            //             }
            //         }],
            //         {
            //             allowDiskUse: true
            //         }
            //     );
            //     while (yield paAverage.hasNext()) {
            //         let average = yield paAverage.next();
            //         let paAver;
            //         paAver = average.avg_pa;
            //         patchGeo.properties.paAver = paAver;
            //     }
            //     // console.log("patchGeo with pa", patchGeo);

            //     var roadAverage = grid_MontanaCol.aggregate(
            //         [{
            //             $match: {
            //                 'geometry':
            //                     {
            //                         $geoWithin:
            //                             { $geometry: area2find }
            //                     }
            //             }
            //         },
            //         {
            //             $group: {
            //                 _id: null,
            //                 avg_road: { $avg: "$properties.roadDist" },
            //             }
            //         }],
            //         {
            //             allowDiskUse: true
            //         }
            //     );
            //     while (yield roadAverage.hasNext()) {
            //         let average = yield roadAverage.next();
            //         let roadAver;
            //         roadAver = average.avg_road;
            //         patchGeo.properties.roadAver = roadAver;
            //     }
            //     // console.log("patchGeo with road", patchGeo);

            //     let getattrofhii = co.wrap(function* (colname, area2find) {
            //         let propertyname = typeName4sourcedata(colname).propertyname;
            //         let propertyvalue = typeName4sourcedata(colname).propertyvalue;
            //         let col = db.collection(colname);

            //         var attrCursor = col.find(
            //             {
            //                 'geometry':
            //                     {
            //                         $geoIntersects:
            //                             { $geometry: area2find }
            //                     }
            //             }
            //         ).batchSize(66000000).addCursorFlag('noCursorTimeout', true);
            //         let sum = 0;
            //         let count = 0;
            //         let average = 0;
            //         while (yield attrCursor.hasNext()) {
            //             let item = yield attrCursor.next();
            //             let index = item.properties[propertyvalue];
            //             sum += index;
            //             count++
            //         }
            //         if (count != 0) {
            //             average = sum / count;
            //         }
            //         patchGeo.properties[propertyname] = average;
            //         return yield Promise.resolve(patchGeo);
            //     });
            //     patchGeo = yield getattrofhii('HIIshp', area2find);
            //     patchGeo = yield getattrofhii('birdshp', area2find);
            //     patchGeo = yield getattrofhii('fishshp', area2find);
            //     patchGeo = yield getattrofhii('mammalshp', area2find);
            //     patchGeo = yield getattrofhii('reptileshp', area2find);
            //     patchGeo = yield getattrofhii('treeshp', area2find);
            //     patchGeo = yield getattrofhii('amphibianshp', area2find);
            //     return yield Promise.resolve(patchGeo);
            // });