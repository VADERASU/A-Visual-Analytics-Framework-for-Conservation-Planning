const express = require('express');
const router = express.Router();
const co = require('co');
const turf = require('@turf/turf');

// let parcel = "MTparceltoremoveSome"; //change to "grid_Montana_layer1and2_version3" later.
// let parcel_layer1and2 = "MTParcel_layer1and2";
let parcel_bad = "MTParcel_layer1and2_bad"; //change to MTParcel_layer1and2_bad later

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
        let rectangle = parsedInfo.rectangle;
        let paType = parsedInfo.paType;
        let bbox = rectangle[1].concat(rectangle[3]);
        let area2find = {
            type: "Polygon",
            coordinates: [rectangle]
        }
        let userDefinedGridInfo = { "bbox": bbox, "cellside": null }; //missing searchArea
        let searchArea = 0;

        let arr2store = []

        co(function* () {
            let db = yield MongoClient.connect(url);
            let parcel = (paType == "totalPA") ? "MTparceltoremoveSome" : "MTParcel_layer1and2";
            let parcelCol = db.collection(parcel);
            // let parcelCol = db.collection("MTparceltoremoveSome");
            let parcel_badCol = db.collection(parcel_bad);
            let userGridsCol = db.collection('userGrids');

            //get total area of the drawn area,  this wastes the time. It's not faster than the following method.
            // let searchAreaCursor = parcelCol.aggregate({
            //     $group: {
            //         _id: '',
            //         subida: { $sum: '$properties.area' }
            //     }
            // }, {
            //         $project: {
            //             _id: 0,
            //             subida: '$properties.area'
            //         }
            //     })
            // while (yield searchAreaCursor.hasNext()) {
            //     let item = yield searchAreaCursor.next();
            //     console.log(item)
            // }

            //operation in good parcel collection
            let parcelCursor = parcelCol.find(
                {
                    'geometry':
                    {
                        $geoIntersects:
                            { $geometry: area2find }
                    }
                }
            )
            while (yield parcelCursor.hasNext()) {
                let item = yield parcelCursor.next();
                delete item._id;
                searchArea += item.properties.area;
                arr2store[arr2store.length] = data2storeFormat(item, paType);
            }
            //operation in bad parcel collection
            let badparcelCursor = parcel_badCol.find(
                {
                    'geometry':
                    {
                        $geoIntersects:
                            { $geometry: area2find }
                    }
                }
            )
            while (yield badparcelCursor.hasNext()) {
                let item = yield badparcelCursor.next();
                delete item._id;
                searchArea += item.properties.area;
                arr2store[arr2store.length] = data2storeFormat(item, paType);
            }

            // console.log(searchArea);
            userDefinedGridInfo.searchArea = searchArea;
            arr2store.map(d => {
                d.properties.userDefinedGridInfo = userDefinedGridInfo
            })

            yield userGridsCol.insertMany(arr2store);
            db.close();
            res.send(arr2store);
        });
    });
    return router;
};
function get21KnegativeOne4distance(value, datatype) {
    if (datatype == "pa") {
        // console.log("I am pa layer!!!!totalPA!")
        if (value == undefined) {
            // console.log("undefined", value);
            value = -2;
            /*
            For 30*30 patch, the patch with padist =0 or >20k would be skipped in the Montana_PA collection. There is no way to distinguish the patch 
            in the pa and the patch which is too far way from the pa. Therefore, the two kinds of patch would not appear on the map. 
            */
        }
    } else if (datatype == "ma") {
        if (value < 0) {
            // console.log("zero", value);
            value = 0;
        } else if (value == undefined) {
            // console.log("undefined", value);
            value = 21000;
        }
    } else if (datatype == "hw") {
        if (value == -1) {
            value = 21000;
        }
    } else if (datatype == "hy") {
        if (value == undefined) {
            value = 21000;
        }
    }
    return value;
}
function revisedData4hii(value) {
    if (value == undefined) {
        value = 0
    }
    return value;
}
function data2storeFormat(item, paType) {
    let result = {
        type: item.type,
        properties: {
            center: item.properties.center,
            metroAver: get21KnegativeOne4distance(item.properties.metroAver, "ma"),
            paAver: (paType == "totalPA") ? get21KnegativeOne4distance(item.properties.paAver, "pa") : ((paType == "paLayer1") ? item.properties.layer1paDist : item.properties.layer2paDist),
            roadAver: get21KnegativeOne4distance(item.properties.roadAver, "hw"),
            averageHII: revisedData4hii(item.properties.averageHII),
            averagebird: revisedData4hii(item.properties.averagebird),
            averagefish: revisedData4hii(item.properties.averagefish),
            averagemammal: revisedData4hii(item.properties.averagemammal),
            averagereptile: revisedData4hii(item.properties.averagereptile),
            averagetree: revisedData4hii(item.properties.averagetree),
            averageamphibian: revisedData4hii(item.properties.averageamphibian),
            averHyDist: get21KnegativeOne4distance(item.properties.averHyDist, "hy"),
            cost: item.properties.cost,
            area: item.properties.area,
            costAver: item.properties.costAver
        },
        geometry: item.geometry
    }
    return result;
}