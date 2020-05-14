var express = require('express');
var router = express.Router();
var co = require('co');
var fs = require('fs');
var _ = require('underscore');
const path = require('path');
const turf = require('@turf/turf');


const MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

// Connection URL
const url = 'mongodb://vaderserver0.cidse.dhcp.asu.edu:27017/eco_region';
let mongoDB = false;

module.exports = function (appRoot) {
    /* GET map data. */
    router.get('/', function (req, res, next) {

        co(function* () {
            var db = yield MongoClient.connect(url);
            var badNullData = db.collection('MTparcel');

            let result = yield badNullData.find().toArray();
            db.close();
            res.send(result);

        });
    });
    return router;
};









// // var express = require('express');
// // var router = express.Router();
// // var co = require('co');
// // var fs = require('fs');
// // var _ = require('underscore');
// // const path = require('path');
// // const turf = require('@turf/turf');


// // const MongoClient = require('mongodb').MongoClient,
// // 	assert = require('assert');

// // // Connection URL
// // const url = 'mongodb://vaderserver0.cidse.dhcp.asu.edu:27017/eco_region';
// // let mongoDB = false;

// // module.exports = function (appRoot) {
// // 	/* GET map data. */
// // 	router.get('/', function (req, res, next) {
// // 		// console.log('Here:',req.query.box)
// // 		var position = JSON.parse(req._parsedUrl.query);
// // 		// console.log("position ",position);
// // 		var area2find = { "type": "Polygon", "coordinates": [position] };
// // 		// console.log("area2find ",JSON.stringify(area2find));
// // 		// console.log("req in 10mileSquare", req._parsedUrl.query);

// // 		co(function* () {
// // 			var db = yield MongoClient.connect(url);
// // 			var subsetMillonCol = db.collection('subsetMillon');
// // 			// 			var MT_PA = db.collection('Montana_PA');
// // 			// 			var MT_Metro = db.collection('Montana_Metro');
// // 			// 			var HIICol = db.collection('HIIshp');
// // 			// console.time('timetoqueryforpa')
// // 			// 			var paCursor = MT_PA.find(
// // 			// 				{
// // 			// 					'geometry':
// // 			// 						{
// // 			// 							$geoWithin:
// // 			// 								{ $geometry: area2find }
// // 			// 						}
// // 			// 				}
// // 			// 			).addCursorFlag('noCursorTimeout', true);
// // 			// 			console.timeEnd('timetoqueryforpa')
// // 			// 			// console.time('sampelpart');
// // 			// 			// let countOfPACursor = yield paCursor.count();
// // 			// 			// let paCursorArr = yield paCursor.toArray();
// // 			// 			// let samplePA = _.sample(paCursorArr,100);
// // 			// 			// console.log("samplePA ", samplePA.length);
// // 			// 			// // console.log("pacursorArr ", paCursorArr);
// // 			// 			// // console.log("size of the pacursor ", countOfPACursor);
// // 			// 			// console.timeEnd('sampelpart')
// // 			// 			var paSum = 0;
// // 			// 			var paCount = 0;
// // 			// 			var paAver;
// // 			// 			console.time('paCursorTime')
// // 			// 			while (yield paCursor.hasNext()) {
// // 			// 				let item = yield paCursor.next();
// // 			// 				paCount++;
// // 			// 				paSum += item.properties.dist;
// // 			// 			}
// // 			// 			console.timeEnd('paCursorTime');
// // 			// 			if (paCount == 0) {
// // 			// 				paAver = 'too far';
// // 			// 			} else {
// // 			// 				paAver = (paSum / paCount).toFixed(2);
// // 			// 			}

// // 			// 			console.time('timeforquerymetro')
// // 			// 			var metroCursor = MT_Metro.find(
// // 			// 				{
// // 			// 					'geometry':
// // 			// 						{
// // 			// 							$geoWithin:
// // 			// 								{ $geometry: area2find }
// // 			// 						}
// // 			// 				}
// // 			// 			).addCursorFlag('noCursorTimeout', true);
// // 			// 			console.timeEnd('timeforquerymetro')
// // 			// 			var metroSum = 0;
// // 			// 			var metroCount = 0;
// // 			// 			var metroAver;
// // 			// 			console.time('metroCursorTime')


// // 			///pusdo code to sample the result to reduce the running time 
// // 			// console.time('timeforquerysubsetMillon')
// // 			var aver_result = subsetMillonCol.aggregate(
// // 				[{
// // 					$match: {
// // 						'geometry':
// // 						{
// // 							$geoWithin:
// // 								{ $geometry: area2find }
// // 						}
// // 					}
// // 				},
// // 				{ 
// // 					$group: {
// // 						_id: null,
// // 						avg_road: { $avg: "$properties.roadDist" },
// // 						avg_metro: { $avg: "$properties.metroDist" },
// // 						avg_pa: { $avg: "$properties.paDist" },
// // 						avg_hii: { $avg: "$properties.hii" },
// // 					}
// // 				}],
// // 				{
// // 					allowDiskUse: true
// // 				}
// // 				).toArray();
// // 				let average = yield aver_result;
// // 			// console.timeEnd('timeforquerysubsetMillon')
// // 			let paAver;
// // 			let roadAver;
// // 			let metroAver;
// // 			let hiiAver;
// // 			paAver = average[0].avg_pa;
// // 			roadAver = average[0].avg_road;
// // 			metroAver = average[0].avg_metro;
// // 			hiiAver = average[0].avg_hii;

// // 			// 		while (yield metroCursor.hasNext()) {
// // 			// 	let item = yield metroCursor.next();
// // 			// 	metroCount++;
// // 			// 	metroSum += item.properties.dist;
// // 			// }
// // 			// if (metroCount == 0) {
// // 			// 	metroAver = 'too far';
// // 			// } else {
// // 			// 	metroAver = (metroSum / metroCount).toFixed(2);
// // 			// }
// // 			// console.timeEnd('metroCursorTime');

// // 			// console.time('timetoqueryforhii')
// // 			// var hiiCursor = HIICol.find(
// // 			// 	{
// // 			// 		'geometry':
// // 			// 			{
// // 			// 				$geoWithin:
// // 			// 					{ $geometry: area2find }
// // 			// 			}
// // 			// 	}
// // 			// ).addCursorFlag('noCursorTimeout', true);
// // 			// console.timeEnd('timetoqueryforhii')
// // 			// var hiiSum = 0;
// // 			// var hiicount = 0;
// // 			// var hiiAver;
// // 			// console.time('hiiCursorTime')
// // 			// while (yield hiiCursor.hasNext()) {
// // 			// 	let item = yield hiiCursor.next();
// // 			// 	hiicount++;
// // 			// 	hiiSum += item.properties.DN;
// // 			// }
// // 			// console.timeEnd('hiiCursorTime');
// // 			// if (hiicount == 0) {
// // 			// 	hiiAver = 'no influence';
// // 			// } else {
// // 			// 	hiiAver = (hiiSum / hiicount).toFixed(2);
// // 			// }

// // 			db.close();
// // 			var result = { "paAver": paAver, "metroAver": metroAver, "hiiAver": hiiAver, "roadAver": roadAver };
// // 			res.send(result);

// // 		});



// // 	});
// // 	return router;
// // };
