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
let preprocessedData;

function filterData(originalDataArr, filterInfo) {
    let filteredData = originalDataArr.filter((obj) => {
        let condition = true;
        let filters = Object.keys(filterInfo);
        filters.forEach(key => {
            let filterrange = filterInfo[key].filterRange.range;
            let filtermaxvalue = filterInfo[key].filterRange.maxValue;
            if (filterrange != null) {
                if (filterrange.length > 1) {
                    if (Math.max(...filterrange) != filtermaxvalue) {
                        condition = ((obj.properties[key] >= Math.min(...filterrange)) && (obj.properties[key] <= Math.max(...filterrange))) && condition;
                    } else {
                        condition = (obj.properties[key] >= Math.min(...filterrange)) && condition;
                    }
                } else {
                    if (Math.min(...filterrange) != filtermaxvalue) {
                        condition = (obj.properties[key] == Math.min(...filterrange)) && condition;
                    } else {
                        condition = (obj.properties[key] >= Math.min(...filterrange)) && condition;
                    }
                }
            }

        });
        return condition;
    });
    return filteredData;
}
function getMedianRank(filteredDatabyAttr, filterInfo) {
    let flag4mr = 0;
    let filteredAttrs = Object.keys(filterInfo);
    if (filteredAttrs.length != 0) {
        flag4mr = 1;
        filteredAttrs.forEach(attribute => {
            let operator = filterInfo[attribute].sortDirection;
            if (operator == "desc") {
                filteredDatabyAttr.sort(function (a, b) { return b.properties[attribute] - a.properties[attribute] }); //descending order for pa
            } else if (operator == "asce") {
                filteredDatabyAttr.sort(function (a, b) { return a.properties[attribute] - b.properties[attribute] }); //ascending order for pa
            }
            let indexName = attribute + "Index";
            let count4medianRanking = 0;
            let previousOne = null;
            filteredDatabyAttr.map((a, i) => {
                if (a.properties[attribute] != previousOne) count4medianRanking++;
                previousOne = a.properties[attribute];

                if (a.properties.rankingsets) {
                    a.properties.rankingsets[indexName] = count4medianRanking;
                } else {
                    a.properties.rankingsets = {};
                    a.properties.rankingsets[indexName] = count4medianRanking;
                }

            })
        })
        filteredDatabyAttr.map(d => {
            let rankingsets = d.properties.rankingsets;
            let allrankings = Object.keys(rankingsets).map((k) => rankingsets[k]);
            let sortedRankings = (allrankings.sort(function (a, b) { return a - b })); // ascending for median ranking
            let length = sortedRankings.length;
            if (length != 1) {
                let fomerMedian = sortedRankings[Math.ceil(length / 2) - 1];
                let laterMedian = sortedRankings[Math.ceil(length / 2 + 0.5) - 1];
                d.properties["medianRanking"] = (fomerMedian + laterMedian) / 2;
            } else {
                d.properties["medianRanking"] = sortedRankings[0];
            }
            delete d.properties.rankingsets;
            return d;
        })
    }
    return { "data": filteredDatabyAttr, "flag": flag4mr };
}
function filterDatabyRanking(filteredDatabyAttr, ranking2filter) {
    let selectedData = filteredDatabyAttr.filter((obj) => {
        let ranking = obj.properties.medianRanking;
        // console.log("condition ", ((ranking < ranking2filter[1]) || (ranking == ranking2filter[1])) && ((ranking > ranking2filter[0]) || (ranking == ranking2filter[0])));
        return ((ranking < ranking2filter[1]) || (ranking == ranking2filter[1])) && ((ranking > ranking2filter[0]) || (ranking == ranking2filter[0]));
    })
    return selectedData;
}

module.exports = function (appRoot) {
    /* GET map data. */
    router.get('/', function (req, res, next) {
        let request = req._parsedUrl.query;
        let parsedInfo = JSON.parse(request.replace(/%22/g, '"'));
        let userDefinedGridInfo = parsedInfo.userDefinedGridInfo;
        let filterInfo = parsedInfo.filterInfo;
        let ranking2filter = parsedInfo.ranking2filter;
        let constraints = parsedInfo.constraints;
        let objFun = parsedInfo.objFun;
        let paType = parsedInfo.paType;
        // console.log(userDefinedGridInfo, filterInfo, ranking2filter, constraints, objFun);
        // console.log("constraints ", constraints);
        // console.log("objFun ", objFun);

        co(function* () {
            //////////////get the input txt for glpk
            function generateGLPK(preprocessedData, constraints, objFun) {
                let writeStream = fs.createWriteStream('optimizationInput.txt');
                let minormax4objfun = objFun.goalDirection;
                let goal = objFun.goal;
                /////objective function
                writeStream.write(minormax4objfun + '\n obj:');
                preprocessedData.forEach((p, i) => {
                    let weight = p.properties[goal];
                    if (i != preprocessedData.length - 1) {
                        writeStream.write(weight + ' x' + i + ' + ');
                    } else {
                        writeStream.write(weight + ' x' + i + '\nSubject To' + '\n c1:');
                    }
                })
                /////constraints
                let constraintId = constraints.id;
                let constraintRange = constraints.range;
                preprocessedData.forEach((p, i) => {
                    let weight4constraint = p.properties[constraintId];
                    if (i != preprocessedData.length - 1) {
                        writeStream.write(weight4constraint + ' x' + i + ' + ');
                    } else {
                        writeStream.write(weight4constraint + ' x' + i + ' >= ' + constraintRange[0] + '\n c2:');
                    }
                })
                preprocessedData.forEach((p, i) => {
                    let weight4constraint = p.properties[constraintId];
                    if (i != preprocessedData.length - 1) {
                        writeStream.write(weight4constraint + ' x' + i + ' + ');
                    } else {
                        writeStream.write(weight4constraint + ' x' + i + ' <= ' + constraintRange[1] + '\nBounds\n');
                    }
                })
                //////bounds
                preprocessedData.forEach((p, i) => {
                    if (i != preprocessedData.length - 1) {
                        writeStream.write('0 <= x' + i + ' <= 1\n');
                    } else {
                        writeStream.write('0 <= x' + i + ' <= 1\nBinaries \n');
                    }
                })
                ///////binaries
                preprocessedData.forEach((p, i) => {
                    if (i != preprocessedData.length - 1) {
                        writeStream.write('x' + i + ' ');
                    } else {
                        writeStream.write('x' + i + ' \nEnd');
                    }
                })

                writeStream.on('finish', function () {
                    console.log('file has been written');
                    let prob = new glp.Problem();
                    prob.readLpSync("optimizationInput.txt");
                    prob.scaleSync(glp.SF_AUTO);
                    prob.simplexSync({ presolve: glp.ON });
                    let variablesNum = prob.getNumInt();
                    // console.log("variablesNum ", variablesNum);
                    if (prob.getNumInt() > 0) {
                        function callback(tree) {
                            if (tree.reason() == glp.IBINGO) {
                                // ...
                            }
                        }
                        prob.intoptSync({ cbFunc: callback });
                    }
                    // console.log("objective: " + prob.mipObjVal());
                    let patch2buy = [];
                    for (let i = 1; i < variablesNum + 1; i++) {
                        // console.log("varibles" + (i - 1) + ": " + prob.getColPrim(i));
                        if (prob.getColPrim(i) == 1) {
                            patch2buy.push(preprocessedData[i - 1])
                        }
                    }
                    prob.delete();
                    // console.log("patch2buy ", patch2buy.length);
                    res.send(patch2buy);
                });
                writeStream.end();
            }
            let db = yield MongoClient.connect(url);
            let userGridsCol = db.collection('userGrids');
            let originalDataArr = yield userGridsCol.find({ "properties.userDefinedGridInfo": userDefinedGridInfo }).toArray();
            if (paType == "totalPA") {
                originalDataArr = originalDataArr.filter(obj => obj.properties.paAver != -2); //this line is given to keep consistent with the frontend. Filter the parcle in side the protected area. 
            }
            // console.log("originalDataArr, ", originalDataArr.length);
            let filteredDatabyAttr = filterData(originalDataArr, filterInfo);
            let flag4MedianRanking = getMedianRank(filteredDatabyAttr, filterInfo).flag;
            if (flag4MedianRanking == 1) {
                preprocessedData = filterDatabyRanking(filteredDatabyAttr, ranking2filter);
            } else {
                preprocessedData = filteredDatabyAttr;
            }
            // console.log("preprocessedData ",preprocessedData.length);
            db.close();
            generateGLPK(preprocessedData, constraints, objFun);
        });


    });
    return router;
};
