const express = require('express');
const router = express.Router();
const co = require('co');
const fs = require('fs');
const _ = require('underscore');
const path = require('path');
const turf = require('@turf/turf');
const glp = require("glpk");


const MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017/eco_region';
let mongoDB = false;

function getRandomCost(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getsquareGrid(cellside) {
    let MontanaBbox = [-112, 48, -111.5, 47.5];
    let polygonOfMontanaBbox = [[-112, 48], [-112, 47.5], [-111.5, 47.5], [-111.5, 48], [-112, 48]];
    let polygon = { "type": "Polygon", "coordinates": [polygonOfMontanaBbox] };
    let options = { units: 'miles', mask: polygon };
    let squareGrid = turf.squareGrid(MontanaBbox, cellside, options);
    return squareGrid;
}

let color72reverse = [
    "#edf8e9",
    "#c7e9c0",
    "#a1d99b",
    "#74c476",
    "#41ab5d",
    "#238b45",
    "#005a32"
];
let color7 = color72reverse.reverse();

// let subareaPolygon = [
//     [-111.75, 47.82236579157189],
//     [-111.75, 47.74999999999999],
//     [-111.6418508319635, 47.74999999999999],
//     [-111.6418508319635, 47.82236579157189],
//     [-111.75, 47.82236579157189]
// ]
// let searcharea = { "type": "Polygon", "coordinates": [subareaPolygon] };

module.exports = function (appRoot) {
    /* GET map data. */
    router.get('/', function (req, res, next) {
        let request = req._parsedUrl.query;
        let parsedInfo = JSON.parse(request.replace(/%22/g, '"'));
        let attributeCon = parsedInfo.attributes;
        let preprocessingCon = parsedInfo.preprocessing;
        let constraintsCon = parsedInfo.constraints;
        let objectiveFunCon = parsedInfo.objectiveFun;
        let cellesize = Number(parsedInfo.cellside);
        // console.log(attributeCon, preprocessingCon, constraintsCon, objectiveFunCon, cellesize);
        /***************************************************get the patches based on the cellsize************************************************************** */
        let patchesArr = getsquareGrid(cellesize);
        // console.log("patchesArr ",patchesArr);
        let area2findArr = [];
        patchesArr.features.forEach(obj => {
            let position = obj.geometry;
            area2findArr.push(position);
        })
        co(function* () {
            let db = yield MongoClient.connect(url);
            let subsetMillonCol = db.collection('subsetMillon');
            let count = 0;
            let resultArr = [];
            // console.log("area2findArr ", area2findArr);
            let getAverMetrics = co.wrap(function* (area2find) {
                var aver_result = subsetMillonCol.aggregate(
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
                            avg_road: { $avg: "$properties.roadDist" },
                            avg_metro: { $avg: "$properties.metroDist" },
                            avg_pa: { $avg: "$properties.paDist" },
                            avg_hii: { $avg: "$properties.hii" },
                        }
                    }],
                    {
                        allowDiskUse: true
                    }
                );
                let result;
                while (yield aver_result.hasNext()) {
                    let average = yield aver_result.next();
                    let paAver;
                    let roadAver;
                    let metroAver;
                    let hiiAver;
                    paAver = average.avg_pa;
                    roadAver = average.avg_road;
                    metroAver = average.avg_metro;
                    hiiAver = average.avg_hii;
                    let cost = getRandomCost(1500 * cellesize * cellesize, 15000 * cellesize * cellesize);
                    result = { "patch": area2find, "paAver": paAver, "metroAver": metroAver, "hiiAver": hiiAver, "roadAver": roadAver, "costAver": cost };
                }
                return result;
            });
            console.time('GetAverselectedsquares');
            for (let i = 0; i < area2findArr.length; i++) {
                let result = yield getAverMetrics(area2findArr[i]);
                resultArr.push(result);
            }
            console.timeEnd('GetAverselectedsquares');
            /**************************************Preprocessing based on the selected attribute condition***********************************************/
            function averPPName(attributeName) {
                switch (attributeName) {
                    case "paCheckbox":
                        attributeName = "paAver";
                        return attributeName;
                        break;
                    case "metroCheckbox":
                        attributeName = "metroAver";
                        return attributeName;
                        break;
                    case "hiiCheckbox":
                        attributeName = "hiiAver";
                        return attributeName;
                        break;
                    case "hydologyCheckbox":
                        attributeName = "hydologyAver";
                        return attributeName;
                        break;
                    case "amphibianCheckbox":
                        attributeName = "amphibianAver";
                        return attributeName;
                        break;
                    case "treesCheckbox":
                        attributeName = "treesAver";
                        return attributeName;
                        break;
                    case "birdCheckbox":
                        attributeName = "birdAver";
                        return attributeName;
                        break;
                    case "mammalCheckbox":
                        attributeName = "mammalAver";
                        return attributeName;
                        break;
                    case "reptileCheckbox":
                        attributeName = "reptileAver";
                        return attributeName;
                        break;
                    case "birdCheckbox":
                        attributeName = "birdAver";
                        return attributeName;
                        break;
                    case "fishCheckbox":
                        attributeName = "fishAver";
                        return attributeName;
                        break;
                    case "roadCheckbox":
                        attributeName = "roadAver";
                        return attributeName;
                        break;
                    default:
                        break;
                }
            }
            attributeCon.forEach(attribute => {
                let attributeName = attribute.id;
                attributeName = averPPName(attributeName);
                // console.log("attributeName ", attributeName);
                let operator = attribute.operator;
                let value = attribute.filtervalue;
                resultArr = resultArr.filter(obj => {
                    if (operator == 0) {
                        if (obj[attributeName] >= value) return obj;
                    } else if (operator == 1) {
                        if (obj[attributeName] <= value) return obj;
                    } else {
                        if (obj[attributeName] <= value) return obj;
                    }
                })

            })
            // console.log("resultArr ", resultArr);
            /************************************Median ranking based on the selected topN************************************************************* */
            let topNofMR = preprocessingCon.filtervalue;
            // let attributeTypes = attributeCon.map(a => a.id);
            function getMedianRank(resultArr, topNofMR, attributeCon) {
                attributeCon.forEach(attribute => {
                    let attributeName = attribute.id;
                    let operator = attribute.operator;
                    let flag = 0;
                    switch (attributeName) {
                        case "paCheckbox":
                            if (operator == 0) {
                                resultArr.sort(function (a, b) { return b.paAver - a.paAver }); //descending order for pa
                                flag = 1;
                            } else if (operator == 1) {
                                resultArr.sort(function (a, b) { return a.paAver - b.paAver }); //ascending order for pa
                                flag = 1;
                            }
                            if (flag == 1) {
                                resultArr.map((a, i) => {
                                    a["paIndex"] = i;
                                })
                            }
                            break;
                        case "metroCheckbox":
                            if (operator == 0) {
                                resultArr.sort(function (a, b) { return b.metroAver - a.metroAver }); //descending order for metro
                                flag = 1;
                            } else if (operator == 1) {
                                resultArr.sort(function (a, b) { return a.metroAver - b.metroAver }); //ascending order for metro
                                flag = 1;
                            }
                            if (flag == 1) {
                                resultArr.map((a, i) => {
                                    a["metroIndex"] = i;
                                })
                            }
                            break;
                        case "hiiCheckbox":
                            if (operator == 0) {
                                resultArr.sort(function (a, b) { return b.hiiAver - a.hiiAver }); //descending order for hiiAver
                                flag = 1;
                            } else if (operator == 1) {
                                resultArr.sort(function (a, b) { return a.hiiAver - b.hiiAver }); //ascending order for hii
                                flag = 1;
                            }
                            if (flag == 1) {
                                resultArr.map((a, i) => {
                                    a["hiiIndex"] = i;
                                })
                            }
                            break;
                        case "hydologyCheckbox":
                            break;
                        case "amphibianCheckbox":
                            break;
                        case "treesCheckbox":
                            break;
                        case "birdCheckbox":
                            break;
                        case "mammalCheckbox":
                            break;
                        case "reptileCheckbox":
                            break;
                        case "birdCheckbox":
                            break;
                        case "fishCheckbox":
                            break;
                        case "roadCheckbox":
                            if (operator == 0) {
                                resultArr.sort(function (a, b) { return b.roadAver - a.roadAver }); //descending order for road
                                flag = 1;
                            } else if (operator == 1) {
                                resultArr.sort(function (a, b) { return a.roadAver - b.roadAver }); //ascending order for road
                                flag = 1;
                            }
                            if (flag == 1) {
                                resultArr.map((a, i) => {
                                    a["roadIndex"] = i;
                                })
                            }
                            break;
                        default:
                            break;
                    }
                })
                resultArr.map(d => {
                    let arr = [d.paIndex, d.roadIndex, d.metroIndex, d.hiiIndex];
                    let medianRanking = (arr.sort(function (a, b) { return a - b }))[1]; // ascending for median ranking
                    d["medianRanking"] = medianRanking;
                })
                resultArr.sort(function (a, b) { return a.medianRanking - b.medianRanking }); //ascending order hii
                resultArr = resultArr.slice(0, topNofMR);
                // console.log("resultArr!!!!!!!! ",resultArr);
                return resultArr;
            } //end of getMedianRank function
            console.time('rankaverResult');
            let sortedResult = getMedianRank(resultArr, topNofMR, attributeCon);
            console.timeEnd('rankaverResult');
            /********************************optimization based on the median ranking result, constraints and objective function****************************** */
            ////////////////get the input txt for glpk
            // console.log("constraintsCon ", constraintsCon);
            // console.log("objectiveFunCon ", objectiveFunCon);
            // console.log("sortedResult ", sortedResult);
            let operator4constraint = constraintsCon[0].operator;
            if (operator4constraint == 0) {
                operator4constraint = ">=";
            } else if (operator4constraint == 1) {
                operator4constraint = "<=";
            } else {
                operator4constraint = "=";
            }
            let filtervalue4cons = constraintsCon[0].filtervalue;
            let minormax4objfun = objectiveFunCon[0].operator;
            let writeStream = fs.createWriteStream('optimizationInput.txt');
            /////objective function
            writeStream.write(minormax4objfun + '\n obj:');
            sortedResult.forEach((p, i) => {
                if (i != sortedResult.length - 1) {
                    writeStream.write('x' + i + ' + ');
                } else {
                    writeStream.write('x' + i + '\nSubject To' + '\n c1:');
                }
            })
            /////constraints
            let testingCost = 0;
            // console.log("constraintsCon ", constraintsCon);
            sortedResult.forEach((p, i) => {
                if (i != sortedResult.length - 1) {
                    writeStream.write(p.costAver + ' x' + i + ' + ');
                } else {
                    writeStream.write(p.costAver + ' x' + i + ' ' + operator4constraint + ' ' + filtervalue4cons + '\nBounds\n');
                }
                testingCost += p.costAver;
            })
            console.log("testingCost ",testingCost);
            //////bounds
            sortedResult.forEach((p, i) => {
                if (i != sortedResult.length - 1) {
                    writeStream.write('0 <= x' + i + ' <= 1\n');
                } else {
                    writeStream.write('0 <= x' + i + ' <= 1\nBinaries \n');
                }
            })
            ///////binaries
            sortedResult.forEach((p, i) => {
                if (i != sortedResult.length - 1) {
                    writeStream.write('x' + i + ' ');
                } else {
                    writeStream.write('x' + i + ' \nEnd');
                }
            })

            // the finish event is emitted when all data has been flushed from the stream
            writeStream.on('finish', () => {
                console.log('wrote all data to file');

                let prob = new glp.Problem();

                prob.readLpSync("optimizationInput.txt");
                prob.scaleSync(glp.SF_AUTO);
                prob.simplexSync({ presolve: glp.ON });
                let variablesNum = prob.getNumInt();
                // console.log("variablesNum ",variablesNum);
                if (prob.getNumInt() > 0) {
                    function callback(tree) {
                        if (tree.reason() == glp.IBINGO) {
                            // ...
                        }
                    }
                    prob.intoptSync({ cbFunc: callback });
                }
                console.log("objective: " + prob.mipObjVal());
                let patch2buy = [];
                for (let i = 1; i < variablesNum + 1; i++) {
                    console.log("varibles" + (i-1) + ": " + prob.getColPrim(i));
                    if(prob.getColPrim(i) == 1){
                        patch2buy.push(sortedResult[i-1])
                    }
                }
                prob.delete();

                // console.log("patch2buy!!!!!!!!!!!!!! ",patch2buy);
                //////optimization result
                let optimizationResult = [];
                patch2buy.forEach(d => {
                    let geometry = d.patch;
                    let geojsonFeature = {
                        "type": "Feature",
                        "properties": {}
                    };
                    geojsonFeature.geometry = geometry;
                    geojsonFeature.properties.color = 'red';
                    optimizationResult.push(geojsonFeature);
                })

                //////median ranking
                let minRanking = sortedResult[0].medianRanking;
                let maxRanking = sortedResult[sortedResult.length - 1].medianRanking;
                let scale = (maxRanking - minRanking) / 6;
                let medianRResult = [];
                sortedResult.forEach(d => {
                    let geometry = d.patch;
                    let ranking = d.medianRanking;
                    let level = Math.floor((ranking - minRanking) / scale);
                    // console.log("level ", level);
                    let geojsonFeature = {
                        "type": "Feature",
                        "properties": {}
                    };
                    geojsonFeature.geometry = geometry;
                    geojsonFeature.properties.color = color7[level];
                    medianRResult.push(geojsonFeature);
                })
                let result2send = {"medianRResult":medianRResult, "optimizationResult":optimizationResult}
                db.close();
                res.send(result2send);
                

            });

            // close the stream
            writeStream.end();






        });



    });
    return router;
};
