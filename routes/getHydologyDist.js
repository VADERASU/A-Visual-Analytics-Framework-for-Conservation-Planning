var express = require('express');
var router = express.Router();
var co = require('co');
var fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

module.exports = function(appRoot) {
	/* GET map data. */
	router.get('/:z/:x/:y', function(req, res, next) {
		var z = req.params.z;
		var x = Number(req.params.x);
		var y = Number(req.params.y.split('.png')[0]);
		co(function*(){	
			if (z == 16) {
				var xValue = "" + x;
				var yPng = y + ".png";
				res.sendFile(path.join(appRoot, 'images', '16hydrographyDist', xValue, yPng));
			}
			else if (z == 12) {
				var xValue = "" + x;
				var yPng = y + ".png";
				res.sendFile(path.join(appRoot, 'images', '12hydrographyDist', xValue, yPng));
			}
			else if (z == 10) {
				var xValue = "" + x;
				var yPng = y + ".png";
				res.sendFile(path.join(appRoot, 'images', '10hydrographyDist', xValue, yPng));
			}
			else if (z == 8) {
				var xValue = "" + x;
				var yPng = y + ".png";
				res.sendFile(path.join(appRoot, 'images', '8hydrographyDist', xValue, yPng));
			}
			else if (z == 6) {
				var xValue = "" + x;
				var yPng = y + ".png";
				res.sendFile(path.join(appRoot, 'images', '6hydrographyDist', xValue, yPng));
			}
			else{
				res.status(404).send('Not found');
			}
		});
	
});
	return router;
};
