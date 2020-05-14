/*************************************legend and add or remove layers on the map****************************************************** */
let loadPApath = ["./PA/Montana/PADUS1_4Fee_Easements_MT"];
let loadMetropath = ["./Metro/MontanaIncorporatedCitiesTowns_MTmetro/MontanaIncorporatedCitiesTowns_MTmetro"];
let loadRoadpath = [
    "./Road/Montana_prisecroads/tl_2017_30_prisecroads_MTroad",
    "./Road/Idaho_prisecroads/tl_2017_16_prisecroads_IDroad",
    "./Road/Oregon_prisecroads/tl_2017_41_prisecroads_ORroad",
    "./Road/Washington_prisecroads/tl_2017_53_prisecroads_WAroad"
];
let loadParcel = ["./Parcel/ParcelPolygons_MTParcel"];
let paArr = ["MT"]; ////"WA", 
let metroArr = ["MTmetro"];
let roadArr = ["MTroad", "IDroad", "ORroad", "WAroad"];


////change the sort direction of attributes
let url4desc = "../stylesheets/legend/sort-desc.png";
let url4asc = "../stylesheets/legend/sort-asce.png";
function swithURl(url) {
    let url2show;
    if (url.slice(-15, -2) == "sort-desc.png") {
        url2show = url4asc;
    } else {
        url2show = url4desc
    }
    return url2show;
}

/*******************************3.1 filter patches based on the input of users - brush the distribution of the attributes.**************************************/
function operaterFromfilterPool4grid(filterPool4grid) {
    let keys = Object.keys(filterPool4grid);
    operator4sort = {};
    if (keys.length != 0) {
        let targetIcons = keys.map(d => {
            let name = "sortIcon4" + d;
            return name;
        })
        targetIcons.forEach(d => {
            let url = d3.select("#" + d).style("background-image");
            operator4sort[d.slice(9)] = url.slice(-10, -6);
        })
    }
}



function showMetroandPALayer(tileName) {
    // console.log("tileName ", tileName);
    var tileLayerPath;
    switch (tileName) {
        case 'tiles4Motana_metro':
            tileLayerPath = './getMetropng/{z}/{x}/{y}.png';
            break;
        case 'tile4PA':
            let pa = paType;
            switch (pa) {
                case "totalPA":
                    tileLayerPath = './data/{z}/{x}/{y}.png';
                    break;
                case "paLayer1":
                    tileLayerPath = './palayer1/{z}/{x}/{y}.png';
                    break;
                case "paLayer2":
                    tileLayerPath = './palayer2/{z}/{x}/{y}.png';
                    break;
                default:
                    break;
            }
            break;
        case 'tile4paArea':
            tileLayerPath = './getpaArea/{z}/{x}/{y}.png';
            break;
        case 'tile4Hii':
            tileLayerPath = './getHiiPng/{z}/{x}/{y}.png';
            break;
        case 'tile4Hydology':
            tileLayerPath = './getHydology/{z}/{x}/{y}.png';
            break;
        case 'tile4HydologyDist':
            tileLayerPath = './getHydologyDist/{z}/{x}/{y}.png';
            break;
        case 'tile4Amphibian':
            tileLayerPath = './getAmphibian/{z}/{x}/{y}.png';
            break;
        case 'tile4Tree':
            tileLayerPath = './getTree/{z}/{x}/{y}.png';
            break;
        case 'tile4Bird':
            tileLayerPath = './getBird/{z}/{x}/{y}.png';
            break;
        case 'tile4mammal':
            tileLayerPath = './getmammal/{z}/{x}/{y}.png';
            break;
        case 'tile4reptile':
            tileLayerPath = './getreptile/{z}/{x}/{y}.png';
            break;
        case 'tile4fish':
            tileLayerPath = './getfish/{z}/{x}/{y}.png';
            break;
        case 'tile4Highway':
            tileLayerPath = './getRoadPng/{z}/{x}/{y}.png';
            break;
        case 'tile4cost':
            tileLayerPath = './getcost/{z}/{x}/{y}.png';
            break;
        default:
            break;
    }

    var currentZoomlevel = map.getZoom();
    var defaultZoomlevel;
    // console.log("curremtZoomlevel ", currentZoomlevel);
    // if (14 <= currentZoomlevel && currentZoomlevel <= 20) {
    //     defaultZoomlevel = 16;
    // } else if (11 <= currentZoomlevel && currentZoomlevel <= 13) {
    //     defaultZoomlevel = 12;
    if (11 <= currentZoomlevel && currentZoomlevel <= 20) {
        defaultZoomlevel = 12;
    } else if (9 <= currentZoomlevel && currentZoomlevel <= 10) {
        defaultZoomlevel = 10;
    } else if (7 <= currentZoomlevel && currentZoomlevel <= 8) {
        defaultZoomlevel = 8;
    } else if (4 <= currentZoomlevel && currentZoomlevel <= 6) {
        defaultZoomlevel = 6;
    }

    tileName = L.tileLayer(tileLayerPath, {
        subdomains: 'abcd',
        minZoom: 4,
        maxZoom: 20,
        opacity: 0.5,
        maxNativeZoom: defaultZoomlevel,
        minNativeZoom: defaultZoomlevel
    }).addTo(map);
    map.on('zoom', function (e) {
        var zoomlevel = e.target._zoom;
        // console.log(zoomlevel);
        // if (13 <= zoomlevel && zoomlevel <= 20) {
        //     console.log('changing 13-20');
        //     delete tileName.options.minNativeZoom;
        //     delete tileName.options.maxNativeZoom;
        //     map._resetView(map.getCenter(), map.getZoom(), true)
        // }
        // if (18 <= zoomlevel && zoomlevel <= 20) {
        //     console.log('changing 18-20');
        //     tileName.options.minNativeZoom = 20;
        //     tileName.options.maxNativeZoom = 20;
        //     map._resetView(map.getCenter(), map.getZoom(), true)
        // }
        // if (14 <= zoomlevel && zoomlevel <= 20) {
        //     // console.log('changing 14-17');
        //     tileName.options.minNativeZoom = 16;
        //     tileName.options.maxNativeZoom = 16;
        //     map._resetView(map.getCenter(), map.getZoom(), true)
        // }
        // else if (11 <= zoomlevel && zoomlevel <= 13) {
        //     if (tileName.options.minNativeZoom != 12) {
        //         // console.log('changing 12')
        //         tileName.options.minNativeZoom = 12;
        //         tileName.options.maxNativeZoom = 12;
        //         map._resetView(map.getCenter(), map.getZoom(), true)
        //     }
        // }
        if (11 <= zoomlevel && zoomlevel <= 20) {
            if (tileName.options.minNativeZoom != 12) {
                // console.log('changing 12')
                tileName.options.minNativeZoom = 12;
                tileName.options.maxNativeZoom = 12;
                map._resetView(map.getCenter(), map.getZoom(), true)
            }
        }
        else if (9 <= zoomlevel && zoomlevel <= 10) {
            if (tileName.options.minNativeZoom != 10) {
                // console.log('changing 10')
                tileName.options.minNativeZoom = 10;
                tileName.options.maxNativeZoom = 10;
                map._resetView(map.getCenter(), map.getZoom(), true)
            }
        }
        else if (7 <= zoomlevel && zoomlevel <= 8) {
            if (tileName.options.minNativeZoom != 8) {
                // console.log('changing 8')
                tileName.options.minNativeZoom = 8;
                tileName.options.maxNativeZoom = 8;
                map._resetView(map.getCenter(), map.getZoom(), true)
            }
        }
        else if (4 <= zoomlevel && zoomlevel <= 6) {
            if (tileName.options.minNativeZoom != 6) {
                // console.log('changing 6')
                tileName.options.minNativeZoom = 6;
                tileName.options.maxNativeZoom = 6;
                map._resetView(map.getCenter(), map.getZoom(), true)
            }
        }
    })

    // map.on('zoomstart', function (e) {
    //     // console.log('zoomstart',e.target);
    // });

    return tileName;
}

/////////////get the size of the visible map
map.on('zoomend', function (e) {
    var bounds = map.getBounds();
    var NE = bounds._northEast;
    var SW = bounds._southWest;
    var NW = [NE.lng, SW.lat];
    var SE = [SW.lng, NE.lat];
    var widthFrom = turf.point([NE.lng, NE.lat]);
    var widthTo = turf.point(NW);
    var width = turf.distance(widthFrom, widthTo);
    var heightFrom = turf.point([SW.lng, SW.lat]);
    var heightTo = turf.point(NW);
    var height = turf.distance(heightFrom, heightTo);
    var size = width * height;
    var zoomlevel = e.target._zoom;
    // console.log('size of the view  ', zoomlevel, size);

});

function loadPAShapefile(pathOfPA) {
    shp(pathOfPA).then(function (geojson) {  //This line is to put dada!!you can change different data here.
        var layerName = pathOfPA.slice(-2);
        globalTest[layerName] = L.geoJson(geojson, {
            style: myStyle1,
            // onEachFeature: onEachFeatureTest
        }).addTo(map);
        // console.log("geojson of pa ", geojson);
    });
}
function loadMetroShapefile(pathofMetro) {
    shp(pathofMetro).then(function (geojson) {  //This line is to put dada!!you can change different data here.
        var layerName = pathofMetro.slice(-7);
        globalTest[layerName] = L.geoJson(geojson, {
            style: myStyle4metro,
            // onEachFeature: onEachFeatureTest
        }).addTo(map);
        // console.log("glocalTest ", globalTest);

    });
}

function loadHighwayShapefile(pathofMetro) {
    shp(pathofMetro).then(function (geojson) {  //This line is to put dada!!you can change different data here.
        var layerName = pathofMetro.slice(-6);
        // console.log("new layer name ", layerName); 
        globalTest[layerName] = L.geoJson(geojson, {
            style: myStyle4highway,
            // onEachFeature: onEachFeatureTest
        }).addTo(map);
        // console.log("glocalTest ", globalTest);

    });
}

function loadParcelShapefile(pathofparcel) {
    shp(pathofparcel).then(function (geojson) {  //This line is to put dada!!you can change different data here.
        var layerName = pathofparcel.slice(-8);
        // console.log("new layer name ", layerName); 
        globalTest[layerName] = L.geoJson(geojson, {
            style: myStyle4parcel,
            // onEachFeature: onEachFeatureTest
        }).addTo(map);
        console.log("glocalTest ", globalTest);
        console.log("geojsonof parcel ", geojson);

    });
}
function loadSquareGrid(sqaureGridName) {
    let cellside = d3.select("#unit4cellsize").property("value");
    // console.log("cellside ", cellside);
    globalTest[sqaureGridName] = L.geoJSON(
        getsquareGrid(cellside),
        {
            style: myStyle4squareGrid,
            // onEachFeature: onEachFeature4squareGrid
        }
    ).addTo(map);
    // console.log("globalTest ",globalTest);
}

// Style of Boundary layers
var myStyle1 = {  // base layer of Chicago boundary - always on
    // "color": "#f03b20",
    "weight": 1,
    "fillColor": "blue",
    "fillOpacity": 0.7
    // "fill": false
};

var myStyle4metro = {  // base layer of Chicago boundary - always on
    "color": "#494646",
    "weight": 1,
    "fillColor": "pink",
    "fillOpacity": 0.7
    // "fill": false
};

var myStyle4highway = {
    "color": "#e41a1c",
    "weight": 1,
    "fillColor": "#e41a1c",
    "fillOpacity": 0.7
}

var myStyle4parcel = {
    "color": "#fa9fb5",
    "weight": 1,
    "fillColor": "#fa9fb5",
    "fillOpacity": 0.7
}
let myStyle4squareGrid = {  // base layer of Chicago boundary - always on
    "color": "#3182bd",
    "weight": 1,
    // "fillColor": "pink",
    "fillOpacity": 0.1
    // "fill": false //////This is a tricky thing, if you set the "fill" property to be false, it means if you want to add event such as click to the object, 
    /////////////you click the area which the polyline conclude, there will not triger the event. So you must set the "fill" to be true such that you can triger the event
};