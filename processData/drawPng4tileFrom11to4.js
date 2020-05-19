const tilebelt = require('@mapbox/tilebelt');
const turf = require('@turf/turf');
// const _ = require("underscore");
// var $ = require('jQuery');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const co = require('co');
const url = 'mongodb://vaderserver0.cidse.dhcp.asu.edu:27017/eco_region';
const shapefile = require('shapefile');
const mkdirp = require('mkdirp');
// const VALID_STATES = ['Washington', 'Oregon', 'Montana', 'Idaho', 'California', 'Nevada', 'Utah', 'Arizona', 'Wyoming', 'Colorado', 'New Mexico'];
const STATE_NAME = 'Montana';
let collection = 'Montana_PA';
let zoomlevel = 6;

// Load the US Shapefile and return the specified states geoJSON
function loadShapeFile(stateName) {
    return new Promise(
        function (resolve, reject) {
            shapefile.open("tl_2017_us_state/tl_2017_us_state.shp")
                .then(source => source.read()
                    .then(function log(result) {
                        // If we finish reading the shapefile but did not find the specified state by name then the state was not found
                        if (result.done) {
                            reject('State not found, double check spelling:', stateName);
                        }

                        // If current feature is a valid state then we will store this to check if tiles are in the ocean
                        if (result.value.properties.NAME == stateName) {
                            return resolve(result.value);
                        }

                        // Still have features to read,
                        // recursively read remaining features until the specified state is found or there are none left to read
                        return source.read().then(log);
                    }))
                .catch(error => {
                    console.error(error.stack);
                    reject(error);
                });
        }
    )
}

// Converts from degrees to radians
Math.radians = function (degrees) {
    return degrees * Math.PI / 180;
};

// Converts from radians to degrees
Math.degrees = function (radians) {
    return radians * 180 / Math.PI;
};

// Converts from tile (x) to lng degree
function tile2lng(x, z) {
    return (x * 360 / Math.pow(2, z) - 180);
};

// Converts from tile (y) to lat degree
function tile2lat(y, z) {
    let n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);

    return (180 / Math.PI * Math.atan((Math.exp(n) - Math.exp(-n)) / 2));
};

// Converts from tile (x,y) to bounding box => [minLng, minLat, maxLng, matLat]
function tile2BBox(x0, y0) {
    let x = parseInt(x0);
    let y = parseInt(y0);
    let zoom = zoomlevel;

    let lat0 = tile2lat(y, zoom);
    let lng0 = tile2lng(x, zoom);
    let latN = tile2lat(y + 1, zoom);
    let lngN = tile2lng(x + 1, zoom);

    return [Math.min(lng0, lngN), Math.min(lat0, latN), Math.max(lng0, lngN), Math.max(lat0, latN)];
};

// Converts lat,lng to tile x,y returned as array [x,y]
function latLng2Tile(lat, lng) {
    let lat_deg = lat;
    let lng_deg = lng;
    let zoom = zoomlevel;

    let lat_rad = Math.radians(lat_deg);
    let n = Math.pow(2.0, zoom);
    let xtile = parseInt((lng_deg + 180.0) / 360.0 * n);
    let ytile = parseInt((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * n);

    return [xtile, ytile];
}

function getlowerTiles(tileLevel) {
    return tilebelt.getChildren(tileLevel);
}

function getFirstTile20(startn) {
    let recursiveNumber = 20 - startn[2];
    if (recursiveNumber == 0) {
        return startn;
    }
    let start = getlowerTiles(startn)[0];
    return getFirstTile20(start);
}

function drawTilePng(tileColorData, theTile) {
    // console.log("tileColorData ", tileColorData);
    var fs = require('fs'),
        PNG = require('pngjs').PNG;

    var png = new PNG({
        width: 256,
        height: 256,
        filterType: -1
    });

    //////////////////////empty the buffer before you use it to draw the image for tile12
    for (var index = 0; index < png.data.length; index++) {
        png.data[index] = 0;
    }

    for (var index = 0; index < tileColorData.length; index++) {
        var element = tileColorData[index];
        var y = element.position[1];
        var x = element.position[0];
        var colorRGB = element.color;
        var idx = (png.width * y + x) << 2;

        png.data[idx] = colorRGB[0];
        png.data[idx + 1] = colorRGB[1];
        png.data[idx + 2] = colorRGB[2];
        png.data[idx + 3] = 255;
    }

    var pathName = "./images/6PA/" + theTile[0];
    var pngName = "./images/6PA/" + theTile[0] + "/" + theTile[1] + ".png";
    // console.log("pngName ", pngName);
    mkdirp(pathName, function (err) {
        if (err) console.error(err)
        else {
        	// console.log(pngName);
        	var options = {colorType: 6};
    		var buffer = PNG.sync.write(png, options);
    		fs.writeFileSync(pngName, buffer);
        }
    });
    // var err = mkdirp.sync(pathName);
    // console.log(pngName, err);
    // var options = { colorType: 6 };
    // var buffer = PNG.sync.write(png, options);
    // fs.writeFileSync(pngName, buffer);
    // png.pack().pipe(fs.createWriteStream(pngName));
}

function checkPosition11to4(position) {
    // console.log("position is ", position);
    var segmentSize = Math.pow(2, (12 - zoomlevel));
    var remainderX = (position[0] + 1) % segmentSize;
    var remainderY = (position[1] + 1) % segmentSize;
    if (remainderX == 0 && remainderY == 0) {
        return true;
    } else {
        return false;
    }
}
function extractPosition11to4(position, z) {
    var segmentSize = Math.pow(2, (12 - z));
    var relativeX = (position[0] + 1) / segmentSize - 1;
    var relativeY = (position[1] + 1) / segmentSize - 1;
    var result = [relativeX, relativeY];
    return result;
}

function largeArea(pointArr) {
    pointArr00 = pointArr[0][0] - 0.0005;
    pointArr01 = pointArr[0][1] - 0.0005;

    pointArr10 = pointArr[1][0] - 0.0005;
    pointArr11 = pointArr[1][1] + 0.0005;

    pointArr20 = pointArr[2][0] + 0.0005;
    pointArr21 = pointArr[2][1] + 0.0005;

    pointArr30 = pointArr[3][0] + 0.0005;
    pointArr31 = pointArr[3][1] - 0.0005;

    pointArr40 = pointArr[4][0] - 0.0005;
    pointArr41 = pointArr[4][1] - 0.0005;

    var newArr = [[pointArr00, pointArr01], [pointArr10, pointArr11], [pointArr20, pointArr21], [pointArr30, pointArr31], [pointArr40, pointArr41]];
    return newArr;
}
//////for PA color
var color = [[0,88,36],[35,139,69],[65,174,118],[102,194,164],[153,216,201],[204,236,230],[237,248,251]];
//////for Metro color
// var color = [[140, 45, 4], [204, 76, 2], [236, 112, 20], [254, 153, 41], [254, 196, 79], [254, 227, 145], [255, 255, 212]];
//////for Road color
// var color = [[74,20,134],[106,81,163],[128,125,186],[158,154,200],[188,189,220],[218,218,235],[242,240,247]];
var threshold = 700;

function png4tileN(stateGeoJSON) {
    const stateBBox = turf.bbox(stateGeoJSON);
    // console.log("Montana bbox ",stateBBox);
    const startTile = latLng2Tile(stateBBox[3], stateBBox[0]);
    const stopTile = latLng2Tile(stateBBox[1], stateBBox[2]);
    const ROW_NUM = stopTile[1] - startTile[1];
    const COL_NUM = stopTile[0] - startTile[0];
    const TOTAL_TILES = ROW_NUM * COL_NUM;
    let tile = [startTile[0], startTile[1]];

    co(function* () {
        while (tile[1] <= stopTile[1]) {
            if (tile[1] > 21) { ////////last time stopped,22
            while (tile[0] <= stopTile[0]) {
                // console.time('one tile');
                var theTileN = [tile[0], tile[1], zoomlevel];
                var point1 = tilebelt.tileToGeoJSON(theTileN).coordinates[0][0];
                var point2 = tilebelt.tileToGeoJSON(theTileN).coordinates[0][1];
                var point3 = tilebelt.tileToGeoJSON(theTileN).coordinates[0][2];
                var point4 = tilebelt.tileToGeoJSON(theTileN).coordinates[0][3];
                var theTileNGeoJson = tilebelt.tileToGeoJSON(theTileN);
                // console.log("theTileN ", theTileN);
                // console.log("theTileNGeoJson ", JSON.stringify(theTileNGeoJson));
                var coordinatesOftheTileNGeoJson = theTileNGeoJson.coordinates[0];
                // console.log("coordinatesOfnode16GeoJson ",coordinatesOfnode16GeoJson);

                var result = largeArea(coordinatesOftheTileNGeoJson);
                // console.log("result ", result);
                var largerTileNArea = { "type": "Polygon", "coordinates": [result] };
                if (turf.inside(point1, stateGeoJSON) || turf.inside(point2, stateGeoJSON) || turf.inside(point3, stateGeoJSON) || turf.inside(point4, stateGeoJSON)) {
                    var start20 = getFirstTile20(theTileN);
                    var tile20Arr = [];
                    var childrenNumber = Math.pow(2, (20 - zoomlevel));
////////////////method2: based on the start tile20 to get the whole tile20 in the tileN. Then to query the database to get the dist. query at most 65536 time. 
////////////////The method2 is slower than the method 1.
                    // var unit =  childrenNumber / 256;
                    // var x = 0, 
                    // y = 0;
                    // var options = {
                    //         socketTimeoutMS: 90000000000,
                    //         connectTimeoutMS: 90000000000
                    //     };
                    // let db = yield MongoClient.connect(url, options);
                    // let col = db.collection(collection);
                    // while (y < childrenNumber) {
                    //     while (x < childrenNumber) {
                    //         var next20X = start20[0] + (x + 1) * unit - 1;
                    //         var next20Y = start20[1] + (y + 1) * unit - 1;
                    //         var next20 = [next20X, next20Y];
                    //         // console.log("next20 is ", next20);
                    //         var result = yield col.find({"properties.tile": next20}).toArray();
                    //         // console.log("result got from the database is aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", result);
                    //         if (result.length > 0) {
                    //             var distance  = result[0].properties.dist;
                    //             var temporaryX = (x + 1) * unit - 1;
                    //             var temporaryY = (y + 1) * unit - 1;
                    //             var temporary = [temporaryX, temporaryY];
                    //             var relativePosition = extractPosition11to4(temporary, zoomlevel);
                    //             var level = Math.floor(distance / threshold);
                    //             if (level > 6) level = 6;
                    //             var theColor = color[level];
                    //             var obj = { "position": relativePosition, "color": theColor };
                    //             tile20Arr.push(obj);
                    //         }
                    //         x++; 
                    //     }
                    //     y++;
                    // }

///////////////method1: based on the tileN to query one time database. Do the while loop for the at most 0.2 billion data.
                    // console.log("start20 is ", start20);
                    // console.log(JSON.stringify(theTileNGeoJson));
                    var options = {
                        socketTimeoutMS: 90000000000,
                        connectTimeoutMS: 90000000000
                    };
                    let db = yield MongoClient.connect(url, options);
                    let col = db.collection(collection);
                    var tile20cursor = col.find(
                        {
                            'geometry':
                                {
                                    $geoWithin:
                                        { $geometry: largerTileNArea }
                                }
                        }
                        // { timeout: false },
                        // { batchSize: 30000000000 }
                    ).batchSize(66000).addCursorFlag('noCursorTimeout', true);
                    // console.log("tile20cursor array ", tile20cursor.length);

                    // console.log('After find')
                    while (yield tile20cursor.hasNext()) {
                        // console.log("ddddddddddddddddddddddddddddddddddddddddddddddddddddddd");
                        let item = yield tile20cursor.next();
                        // console.log("item in the while loop is ", item);
                        var tileXY = item.properties.tile;
                        var positionX = tileXY[0] - start20[0];
                        var positionY = tileXY[1] - start20[1];
                        var positionInfo = [positionX, positionY];
                        if (positionX < 0 || positionX >= childrenNumber || positionY < 0 || positionY >= childrenNumber) {
                            continue;
                        } else {
                            // console.log("z is 11 and the tile ", checkPosition11to4(positionInfo));
                            if (checkPosition11to4(positionInfo)) {
                                // console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa corner tile!");
                                var newPosition = extractPosition11to4(positionInfo, zoomlevel);
                                // console.log("newPosition ", newPosition);
                                ////////////for PA and Metro area
                                // var distance = item.properties.dist;
                                ////////////for road
                                if (item.properties.hasOwnProperty('dist')) {
                                    var distance = item.properties.dist;
                                    if (distance > 0) {
                                        // console.log("the distance is greater than zero. ", distance);
                                        var level = Math.floor(distance / threshold);
                                        if (level > 6) level = 6;
                                        var theColor = color[level];
                                        var obj = { "position": newPosition, "color": theColor };
                                        tile20Arr.push(obj);
                                    }
                                }
                            }
                        }
                        if(tile20Arr.length >= (65536)){
                            // console.log(iteratorcount)
                            break;
                        }
                    }

                    // console.log('after while')

                    db.close();

                    if (tile20Arr.length > 0) {
                        // console.log("tile20Arr.length ", tile20Arr.length);
                        // console.time('draw tile8');
                        drawTilePng(tile20Arr, theTileN);
                        // console.timeEnd('draw tile8');
                    }

                } ////end of if condition
                // Increment X position
                tile[0]++;
                // console.timeEnd('one tile');
            }
            // Reset X position and increment Y position
            tile[0] = startTile[0];
        }
            tile[1]++;
            console.log("new road row of tile6 ", tile[1]);
        }
        return;

    }) //end of co function




}

loadShapeFile(STATE_NAME)
    .then((stateGeoJSON) => png4tileN(stateGeoJSON))
    .catch((err) => assert.equal(err, null));


