const turf = require('@turf/turf');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const cluster = require('cluster');
const os = require('os');
const co = require('co');
const url = 'mongodb://vaderserver0.cidse.dhcp.asu.edu:27017/eco_region';
const shapefile = require('shapefile');

const INSERT_BATCH_SIZE = 20000;
// Get the max number of available cpu threads, subtract threads to keep from maxing out cpu. Adjust accrodingly
const CPU_LIMIT = (os.cpus().length) - 2;

let gridCollection = "grid_Idaho";
let PAcollection = "pashp";
let badPACollection = "badpashp";

let options = {
    socketTimeoutMS: 90000000000,
    connectTimeoutMS: 90000000000
};

let count = 0;
// let stopY = 374948; //for WA
let stopY = 389295; //for ID

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

function storerowPADist(startYvalue) {
    co(function* () {
        let db = yield MongoClient.connect(url, options);
        let gridCol = db.collection(gridCollection);
        let pashpCol = db.collection(PAcollection);
        let badpaCol = db.collection(badPACollection);
        let gridCursor = gridCol.find({ "properties.tile": { $elemMatch: { $eq: startYvalue } }, "properties.paDist": { "$exists": false } }).batchSize(600000000).addCursorFlag('noCursorTimeout', true);


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
            yield gridCol.update(
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
        //////////////////////Here is very important, when you finish the function ,you should tell the master that you are ready
        //////////////////////for next .
        process.send({ cmd: 'ready' });

    }) // end of the co function
}


//////////One way to get the callback things ---co, yield
/////////If you want to get the result, you should be in the co function and use yiled to call the function.
let getStartY = co.wrap(function* () {
    let db = yield MongoClient.connect(url, options);
    let gridCol = db.collection(gridCollection);
    let startcell = yield gridCol.findOne({ "properties.paDist": { $exists: false } });
    // console.log(startcell);
    // let startY = startcell[0].properties.tile[1];
    db.close();
    return yield Promise.resolve(startcell.properties.tile[1]);
});

/////////another way to get the callback things --- async, await.
/////////////////If you use async and await to get the callback data, when you use the data in other function ,the other
////////////////function should also be async and use the await to get the result.
// async function getY(){
//     return new Promise((resolve, rej)=>{
//         let db = await MongoClient.connect(url, options);
//         let gridCol = db.collection(gridCollection);
//         let startcell = await gridCol.findOne({ "properties.paDist": { $exists: false } });
//         db.close();
//         resolve(startcell.properties.tile[1]);
//     });    
// }

co(function* () {
    ///////////////get the startY value

    if (cluster.isMaster) {
        let startY = yield getStartY();
        console.log("startY ", startY);

        ////the function is used for master to know that if the work told him it is ok, the master could send the data to the worker.
        function messageHandler(msg) {
            if (msg.cmd && msg.cmd === 'ready') {
                if (startY < stopY) {
                    this.process.send({ cmd: 'process', data: { y: startY++ } });
                    console.log(this.process.pid + ' tile y:' + startY);
                }
            }
            else {
                console.log('Complete closing Worker(', this.process.pid, ')');

                // In 2 seconds kill the Worker if it does not disconnect on its own
                let worker = this.process;
                let timeout = setTimeout(() => {
                    worker.kill();
                }, 2000);

                // On disconnect clear the timeout since the Worker disconnected on its own
                this.process.on('disconnect', () => {
                    clearTimeout(timeout);
                });

                // Ask Worker to shutdown gracefully
                this.process.disconnect();
            }
        }

        for (let i = 0; i < CPU_LIMIT; i++) {
            cluster.fork();
        }
        ////////here is used for the worker to apply the message function such that he could send the ready message to master to get the job(data).
        for (const id in cluster.workers) {
            cluster.workers[id].on('message', messageHandler);
        }

    } else {
        let workerStartY;

        /////////////////////The following is used for the work to get the message and data from master. 
        /////////////////The process is that: work apply the message function to send "ready" to master. Master get the message and respond "process" and data to worker.
        //Worker could get the data according to the process.
        // Handle messages from Master process
        process.on('message', (msg) => {
            // Setup data format if necessary, otherwise notify Master of ready state
            if (msg.cmd && msg.cmd === 'process' && msg.data) {
                workerStartY = msg.data.y;
                //Call Work
                // console.log("workerIp ", process.pid);
                storerowPADist(workerStartY);
            }
        });

        // notify master about the request
        process.send({ cmd: 'ready' });
    }
})