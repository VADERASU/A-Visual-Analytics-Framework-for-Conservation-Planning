var express = require('express');
var router = express.Router();
var co = require('co');
var fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

const MongoClient = require('mongodb').MongoClient,
assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017/eco_region';
let mongoDB = false;

module.exports = function(appRoot) {
	/* GET map data. */
	router.get('/:z/:x/:y', function(req, res, next) {
		// console.log(req.params)

		var z = req.params.z;
		var x = Number(req.params.x);
		var y = Number(req.params.y.split('.png')[0]);
		
		co(function*(){	
			var db = yield MongoClient.connect(url);
			var metroCol4MT = db.collection('Montana_Metro');
			// var metroCol4WA = db.collection('');
			

			var baseDist = 700;
			var tileInfo = [x,y];
			if(z == 20){
				// console.log(tileInfo);
				var finalData;
				var data = yield metroCol4MT.find({"properties.tile": tileInfo}, {timeout: false}, {batchSize: 30000000000}).toArray();
				// var data4WA = yield metroCol4WA.find({"properties.tile": tileInfo}, {timeout: false}, {batchSize: 30000000000}).toArray();
				if (data.length > 0) {
					finalData = data;
				}
				// else if (data4WA > 0) {
				// 	finalData = data4WA;
				// } 
				else {
					finalData = [];
				}
				if (finalData.length > 0) {
					// console.log("finalData ", finalData);
					var dist = finalData[0].properties.dist;
					var colorLevel = Math.floor(dist/baseDist);
					if(colorLevel > 6) colorLevel = 6;
					var image = colorLevel + ".png";
					db.close();
					res.sendFile(path.join(appRoot, 'public', '7png4metro',image));
				}
				else{
					res.status(404).send('Not found');
				}
			}
			else if (z == 16) {
				var xValue = "" + x;
				var yPng = y + ".png";
				res.sendFile(path.join(appRoot, '16', xValue, yPng));
			} 
			else if (z == 12) {
				var xValue = "" + x;
				var yPng = y + ".png";
				res.sendFile(path.join(appRoot, '12', xValue, yPng));
			}
			else{
				res.status(404).send('Not found');
			}
		

		});
	
});
	return router;
};
