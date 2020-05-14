var interactionDiv = "#interactionDiv";
var div4interaction = d3.select(interactionDiv);
var map = L.map('map', {
    //[47.66723703450518, -111.80923461914064]
    // west of Yellowstone: [44.663072, -111.104213];
    //American Prairie: [47.741511, -107.77503];
    //near the river: [47.42065, -108.16167]
    //testing: [-104.04584884643555, 48.003821039657645]
    center: [47.42065, -108.16167],
    minZoom: 4,
    zoom: 10,
    preferCanvas: true
});
///////Wahington:[47.45746758602957, -119.88100469112398]
///////Montana: [45.68942855346543, -111.06143876910212]
var info = L.control();

// Add BaseMap style

var Stamen_Toner = L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
}).addTo(map);


L.Control.MousePosition = L.Control.extend({
    options: {
        position: 'bottomleft',
        separator: ' : ',
        emptyString: 'Unavailable',
        lngFirst: false,
        numDigits: 5,
        lngFormatter: undefined,
        latFormatter: undefined,
        prefix: ""
    },

    onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
        L.DomEvent.disableClickPropagation(this._container);
        map.on('mousemove', this._onMouseMove, this);
        this._container.innerHTML = this.options.emptyString;
        // console.log("I can work mousemove");
        return this._container;
    },

    onRemove: function (map) {
        map.off('mousemove', this._onMouseMove)
    },

    _onMouseMove: function (e) {
        var lng = this.options.lngFormatter ? this.options.lngFormatter(e.latlng.lng) : L.Util.formatNum(e.latlng.lng, this.options.numDigits);
        var lat = this.options.latFormatter ? this.options.latFormatter(e.latlng.lat) : L.Util.formatNum(e.latlng.lat, this.options.numDigits);
        var value = this.options.lngFirst ? lng + this.options.separator + lat : lat + this.options.separator + lng;
        var prefixAndValue = this.options.prefix + ' ' + value;
        this._container.innerHTML = prefixAndValue;
    }

});

L.Map.mergeOptions({
    positionControl: false
});

L.Map.addInitHook(function () {
    if (this.options.positionControl) {
        this.positionControl = new L.Control.MousePosition();
        this.addControl(this.positionControl);
    }
});

L.control.mousePosition = function (options) {
    return new L.Control.MousePosition(options);
};
L.control.mousePosition().addTo(map);

// var marker = L.marker([48.09127933392289,  -115.1701977158002]).addTo(map); //for testing the pa dist data. 

/**************userful functions ***************************** */
function getKeyByValue(object, property, value) {
    return Object.keys(object).find(key => object[key][property] === value);
}

//testing to display protected areas with different categories on the map
////["Ia","Ib", "II","III","IV","V","VI","Other Conservation Area","Unassigned","N/R"]
// {
//     let paCategory = "N/R";
//     $.ajax({
//         type: 'GET',
//         data: JSON.stringify(paCategory),
//         contentType: 'application/json',
//         url: './pAwithdiffCate',
//         success: function (data) {
//             console.log(data);
//             //add filtered protected area on the map
//             L.geoJson(data, {
//                 style: { "fillcolor": "red", "weight": 1, "color": "red", "fillOpacity": 1 }
//             },
//             ).addTo(map);

//             // L.geoJson(data.originalArr, {
//             //     style: { "fillcolor": "red", "weight": 0.5, "color": "red", "fillOpacity": 0.5 }
//             // },
//             // ).addTo(map);

//             ////protected area for bad and good pa
//             // globalTest.pawithdiffcat = L.geoJson(data.badshpArr, {
//             //     style: { "fillcolor": "red", "weight": 1, "color": "red", "fillOpacity": 0.9 }
//             // },
//             // ).addTo(map);
//             // globalTest.pawithdiffcat4good = L.geoJson(data.pashpArr, {
//             //     style: { "fillcolor": "blue", "weight": 1, "color": "blue", "fillOpacity": 0.9 }
//             // },
//             // ).addTo(map);
//         }
//     })
// }




/**********************global varibales!!!!**********************************/
let globalTest = {};
let gridName = "NmileGrid";
let filterPool = {};
let filterPool4grid = {};
let ranking2filter; //addtion for tilerPool4grid
let gridInfo;
let currentGridData;
let userPatchesArr = [];
let operator4sort = {};
let filteredRanking;
let globalDrawnArea;
let color4reverseGreen = [
    "#edf8e9",
    "#c7e9c0",
    "#a1d99b",
    "#74c476",
    "#41ab5d",
    "#238b45",
    "#005a32"
];
let color4reverseBlue = ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'];
let color7 = color4reverseBlue.reverse();
let color4pie = {
    "PA": "#2ca036",
    "MA": "#fd8224",
    "HII": "#ae017e",
    "HW": "#6a3d9a",
    "HY": "#01665e",
    "Tree": "#b2df8a",
    "Bird": "#fb9a99",
    "Fish": "#feb24c",
    "MM": "#cab2d6",
    "RP": "#878787",
    "AM": "AQUA",
    "Cost": "#b15928"
}
let resultsNum = 0;
let resultsArr = [];
let imageSrcs = [];
//layername for optimization 

// [gridName,
// "parcelLayer",
// "allPatchesLayer",
// "filteredgrids",
// "selectedLayerbySlider",
// "suggestedPatches",
// "unselectedLayerbySlider"
// ]

//optiInfo
let currentBudget = { "cost": null, "area": null };

//tile
let waterColor = '#4d91f7';
let paColor = '#377eb8';


let tile4PA;
let tile4paArea;
let tiles4Motana_metro;
let tile4Hii;
let tile4Hydology;
let tile4HydologyDist;
let tile4Highway;
let tile4Amphibian;
let tile4Tree;
let tile4Bird;
let tile4mammal;
let tile4reptile;
let tile4fish;
let tile4cost;

//line chart
let attrlist2show = [];
let abbre2ids = {
    "PA": { sortIcon: "sortIcon4paAver", layerId: "paCheckbox", selectId: "paCheckbox4opti", filterId: "paFilter", unit: "distance(meters)", linechart: null },
    "MA": { sortIcon: "sortIcon4metroAver", layerId: "metroCheckbox", selectId: "metroCheckbox4opti", filterId: "maFilter", unit: "distance(meters)", linechart: null },
    "HII": { sortIcon: "sortIcon4averageHII", layerId: "hiiCheckbox", selectId: "hiiCheckbox4opti", filterId: "hiiFilter", unit: "index", linechart: null },
    "HW": { sortIcon: "sortIcon4roadAver", layerId: "roadCheckbox", selectId: "roadCheckbox4opti", filterId: "roadFilter", unit: "distance(meters)", linechart: null },
    "HY": { sortIcon: "sortIcon4averHyDist", layerId: "hydologyCheckbox", selectId: "hydologyCheckbox4opti", filterId: "hydrologyFilter", unit: "distance(meters)", linechart: null },
    "Tree": { sortIcon: "sortIcon4averagetree", layerId: "treesCheckbox", selectId: "treesCheckbox4opti", filterId: "treeFilter", unit: "index", linechart: null },
    "Bird": { sortIcon: "sortIcon4averagebird", layerId: "birdCheckbox", selectId: "birdCheckbox4opti", filterId: "birdFilter", unit: "index", linechart: null },
    "MM": { sortIcon: "sortIcon4averagemammal", layerId: "mammalCheckbox", selectId: "mammalCheckbox4opti", filterId: "mammalFilter", unit: "index", linechart: null },
    "Fish": { sortIcon: "sortIcon4averagefish", layerId: "fishCheckbox", selectId: "fishCheckbox4opti", filterId: "fishFilter", unit: "index", linechart: null },
    "RP": { sortIcon: "sortIcon4averagereptile", layerId: "reptileCheckbox", selectId: "reptileCheckbox4opti", filterId: "reptileFilter", unit: "index", linechart: null },
    "AM": { sortIcon: "sortIcon4averageamphibian", layerId: "amphibianCheckbox", selectId: "amphibianCheckbox4opti", filterId: "amphibianFilter", unit: "index", linechart: null },
    "Cost": { sortIcon: "sortIcon4costAver", layerId: "costCheckbox", selectId: "costCheckbox4opti", filterId: "costFilter", unit: "$", linechart: null }
};
//palayer type
let paType;
// //testing
// var line = turf.lineString([[-108.25, 47.39], [-108.23, 47.389]]);
// var bbox = turf.bbox(line);
// var bboxPolygon = turf.bboxPolygon(bbox);
// var buffered = turf.buffer(bboxPolygon, 25);
// console.log("buffered ", buffered)
// globalTest.pawithdiffcat = L.geoJson(buffered.geometry, {
//     style: { "fillcolor": "red", "weight": 1, "color": "red", "fillOpacity": 1 }
// },
// ).addTo(map);
// console.log("globalTest ", globalTest)


//choose the pa layer first
d3.selectAll(".custom-control.custom-radio.custom-control-inline")
    .on("mouseover", function () {
        let hovereditem = this;
        let itemName = hovereditem.childNodes[1].id;
        // console.log("itemName ", itemName)
        let string2show;
        switch (itemName) {
            case "totalPA":
                string2show = "<p>PA layer</p>" +
                    "<p> The layer contains 8 categories of protected area, Strict Nature Reserves(Category Ia), Wilderness Areas(Category Ib)," +
                    "National Park protected areas(Category II), Natural Monument or Feature protected areas(Category III)," +
                    "Habitat/species management protected areas(Category IV), Protected landscape/seascape protected areas(Category V)" +
                    "Protected area with sustainable use (community based, non industrial) of natural resources(Category VI), and Other Conservation Areas" +
                    "</p>"
                break;
            case "paLayer1":
                string2show = "<p>PA layer1</p>" +
                    "<p> The layer contains 5 categories of protected area, Strict Nature Reserves(Category Ia), Wilderness Areas(Category Ib)," +
                    "National Park protected areas(Category II), Natural Monument or Feature protected areas(Category III)," +
                    "and Habitat/species management protected areas(Category IV)" +
                    "</p>"
                break;
            case "paLayer2":
                string2show = "<p>PA layer2</p>" +
                    "<p> The layer contains 7 categories of protected area, Strict Nature Reserves(Category Ia), Wilderness Areas(Category Ib)," +
                    "National Park protected areas(Category II), Natural Monument or Feature protected areas(Category III)," +
                    "Habitat/species management protected areas(Category IV), Protected landscape/seascape protected areas(Category V)" +
                    "andProtected area with sustainable use (community based, non industrial) of natural resources(Category VI)" +
                    "</p>"
                break;
            default:
                break;
        }
        d3.select(hovereditem).append('div').attr("class", "tooltipsDiv4palayers").html(string2show);
    })
    .on("mouseout", function () {
        if (d3.select(".tooltipsDiv4palayers")) d3.select(".tooltipsDiv4palayers").remove();
    })
//set the default layer of pa
paType = d3.select(".custom-control.custom-radio.custom-control-inline input:checked").node().id;
d3.selectAll(".custom-control.custom-radio.custom-control-inline")
    .on("click", function () {
        let clickeditem = this;
        let itemName = clickeditem.childNodes[1].id;
        paType = itemName;
        // console.log("globalDrawnArea ", globalDrawnArea);
        //todo
        initailizeAllGlobalInfo(attrlist2show);
        let body = d3.select("body");
        $.ajax({
            type: 'GET',
            data: JSON.stringify({ "rectangle": globalDrawnArea, "paType": paType }),
            contentType: 'application/json',
            url: './storeUserParcel',
            success: function (data) {
                body.classed('loading', false);
                let data2do;
                if (paType == "totalPA") {
                    data2do = data.filter(obj => obj.properties.paAver != -2);
                    if (data2do.length == 0) {
                        console.log("null for the data")
                    }
                } else {
                    data2do = data;
                }
                toDo4data(data2do, attrlist2show);
            }
        })
    })

let parallel_coor_setting = {
    margin: { top: 20, right: 40, bottom: 10, left: 50 }
}
parallel_coor_setting.width = 1200 - parallel_coor_setting.margin.left - parallel_coor_setting.margin.right
parallel_coor_setting.height = 330 - parallel_coor_setting.margin.top - parallel_coor_setting.margin.bottom
parallel_coor_setting.x = d3.scaleBand().rangeRound([0, parallel_coor_setting.width]).padding(0);
let parallel4attributes = new parallelCoor(d3.select(".parallelCoorDiv"));

function drawgeosjon(paCategory) {
    $.ajax({
        type: 'GET',
        data: JSON.stringify(paCategory),
        contentType: 'application/json',
        url: './palayer1and2',
        success: function (data) {
            // console.log(" data for palayer: ", data);
            globalTest.patypeLayer = L.geoJson(data, {
                style: { "fillcolor": "#9dbedb", "weight": 1, "color": "#9dbedb", "fillOpacity": 1 }
            },
            ).addTo(map);
        }
    })
}
function initailizeAllGlobalInfo(attrlist2show, flag4hasData) {
    filterPool = {};
    filterPool4grid = {};
    ranking2filter = null; //addtion for tilerPool4grid
    gridInfo = null;
    if (!flag4hasData) {
        currentGridData = null;
    }
    userPatchesArr = [];
    operator4sort = {};
    filteredRanking = null;

    let allTiles = [
        tile4PA,
        tile4paArea,
        tiles4Motana_metro,
        tile4Hii,
        tile4Hydology,
        tile4HydologyDist,
        tile4Highway,
        tile4Amphibian,
        tile4Tree,
        tile4Bird,
        tile4mammal,
        tile4reptile,
        tile4fish,
        tile4cost
    ];
    allTiles.forEach(tile => {
        if (tile) map.removeLayer(tile);
    })
    Object.keys(globalTest).forEach(layername => {
        if (globalTest[layername]) map.removeLayer(globalTest[layername]);
    })
    d3.selectAll(".resultIcon").style("background-image", "none");
    d3.selectAll(".line4result").selectAll("svg").remove();

    initDIVLinechart(attrlist2show);
    initPosition_lineChart(attrlist2show);
}
function initDIVLinechart(attrlist2show) {
    d3.select(".distributionDiv").html("");
    d3.select(".parallelCoorDiv").html("");
    attrlist2show.forEach(attr => {
        //create div for each attribute
        createDiv4attr(attr);
        //init linechart for each attribute
        let classname = ".attributeController #" + abbre2ids[attr].filterId;
        let linechartName = abbre2ids[attr].sortIcon.slice(9) + "Chart";
        let unit = abbre2ids[attr].unit;
        let brushchart4attr = new BC(d3.select(classname), {
            width: 90,
            height: 60,
            top: 0,
            left: 0,
            Accuracy: 0.1,
            bin: 20,
            xlabel: unit,
            className: linechartName
        });
        abbre2ids[attr].linechart = brushchart4attr
    })
}
function createDiv4attr(attr) {
    let controllerDiv = d3.select(".distributionDiv").append("div")
        .attr("class", "attributeController");

    let guidofAttrDiv = controllerDiv.append("div")
        .attr("class", "guidofAttr");
    let filterDiv = controllerDiv.append("div")
        .attr("class", "filterValue")
        .attr("id", abbre2ids[attr].filterId);

    let sortDiv = guidofAttrDiv.append("div")
        .attr("class", "sortPDiv")
    let twocheckbox = guidofAttrDiv.append("div")
        .attr("class", "twoCheckboxes")

    sortDiv.append("p")
        .attr("class", "attrName")
        .text(attr)
        .on("mouseover", function () {
            let hovereditem = this;
            hover4attrDetail(hovereditem);
        })
        .on("mouseout", function () {
            if (d3.select(".tooltipsDiv")) d3.select(".tooltipsDiv").remove();
        })
    sortDiv.append("div")
        .attr("class", function () {
            let descObj = ["MA", "HW", "Tree", "Bird", "MM", "Fish", "RP", "AM"];
            if (descObj.indexOf(attr) < 0) {
                return "sortIcon";
            } else {
                return "sortIcon desc";
            }
        })
        .attr("id", abbre2ids[attr].sortIcon)
        .on("click", function () {
            let changedIcon = this;
            changeDirection(changedIcon);
        })
    let layerCheckDiv = twocheckbox.append("div")
        .attr("class", "layerCheckbox")
    let filterCheckDiv = twocheckbox.append("div")
        .attr("class", "filterCheckbox")

    layerCheckDiv.append("input")
        .attr("id", abbre2ids[attr].layerId)
        .attr("type", "checkbox")
        .attr("data-toggle", "toggle")
        .attr("data-on", "display")
        .attr("data-off", "none")
        .attr("data-onstyle", "success")
        .attr("data-offstyle", "danger")
    $("#" + abbre2ids[attr].layerId).bootstrapToggle();
    $("#" + abbre2ids[attr].layerId).on("change", function () {
        let clickedItme = this;
        showlayers(clickedItme)
    })


    filterCheckDiv.append("input")
        .attr("id", abbre2ids[attr].selectId)
        .attr("type", "checkbox")
        .attr("data-toggle", "toggle")
        .attr("data-on", "select")
        .attr("data-off", "no select")
        .attr("data-onstyle", "success")
        .attr("data-offstyle", "danger")
        .attr('checked', true)
    $("#" + abbre2ids[attr].selectId).bootstrapToggle();
    $("#" + abbre2ids[attr].selectId).on("change", function () {
        let selectedAttr = this;
        selectAttr2filter(selectedAttr);
    })

}
function showlayers(clickedItme) {
    if (clickedItme.checked == true) {
        var checkedLayer = clickedItme.id;
        switch (checkedLayer) {
            case 'paCheckbox':
                tile4PA = showMetroandPALayer('tile4PA');
                let pa = paType;
                switch (pa) {
                    case "totalPA":
                        tile4paArea = showMetroandPALayer('tile4paArea');
                        break;
                    case "paLayer1":
                        drawgeosjon("paLayer1")
                        break;
                    case "paLayer2":
                        drawgeosjon("paLayer2")
                        break;
                    default:
                        break;
                }
                break;
            case 'metroCheckbox':
                for (var i = 0; i < loadMetropath.length; i++) {
                    var metroitem = loadMetropath[i];
                    loadMetroShapefile(metroitem);
                }
                tiles4Motana_metro = showMetroandPALayer('tiles4Motana_metro');
                break;
            case 'hiiCheckbox':
                tile4Hii = showMetroandPALayer('tile4Hii');
                break;
            case 'hydologyCheckbox':
                tile4Hydology = showMetroandPALayer('tile4Hydology');
                tile4HydologyDist = showMetroandPALayer('tile4HydologyDist');
                break;
            case "roadCheckbox":
                for (var i = 0; i < loadRoadpath.length; i++) {
                    var roaditem = loadRoadpath[i];
                    loadHighwayShapefile(roaditem);
                }
                tile4Highway = showMetroandPALayer('tile4Highway');
                break;
            case 'amphibianCheckbox':
                tile4Amphibian = showMetroandPALayer('tile4Amphibian');
                break;
            case 'treesCheckbox':
                tile4Tree = showMetroandPALayer('tile4Tree');
                break;
            case 'birdCheckbox':
                tile4Bird = showMetroandPALayer('tile4Bird');
                break;
            case 'mammalCheckbox':
                tile4mammal = showMetroandPALayer('tile4mammal');
                break;
            case 'reptileCheckbox':
                tile4reptile = showMetroandPALayer('tile4reptile');
                break;
            case 'fishCheckbox':
                tile4fish = showMetroandPALayer('tile4fish');
                break;
            case 'costCheckbox':
                tile4cost = showMetroandPALayer('tile4cost');
                break;
            default:
                break;
        }
        // console.log("who checked ", clickedItme.id);
    } else if (clickedItme.checked == false) {
        var unchecked = clickedItme.id;
        switch (unchecked) {
            case 'paCheckbox':
                map.removeLayer(tile4PA);
                let pa = paType;
                if (pa == "totalPA") {
                    map.removeLayer(tile4paArea);
                } else {
                    map.removeLayer(globalTest.patypeLayer);
                }
                break;
            case 'metroCheckbox':
                for (var i = 0; i < metroArr.length; i++) {
                    var metroitem = metroArr[i];
                    map.removeLayer(globalTest[metroitem]);
                }
                map.removeLayer(tiles4Motana_metro);
                break;
            case 'hiiCheckbox':
                map.removeLayer(tile4Hii);
                break;
            case 'hydologyCheckbox':
                map.removeLayer(tile4Hydology);
                map.removeLayer(tile4HydologyDist);
                break;
            case 'amphibianCheckbox':
                map.removeLayer(tile4Amphibian);
                break;
            case 'treesCheckbox':
                map.removeLayer(tile4Tree);
                break;
            case 'birdCheckbox':
                map.removeLayer(tile4Bird);
                break;
            case 'mammalCheckbox':
                map.removeLayer(tile4mammal);
                break;
            case 'reptileCheckbox':
                map.removeLayer(tile4reptile);
                break;
            case 'fishCheckbox':
                map.removeLayer(tile4fish);
                break;
            case 'roadCheckbox':
                for (var i = 0; i < roadArr.length; i++) {
                    var roaditem = roadArr[i];
                    map.removeLayer(globalTest[roaditem]);
                }
                map.removeLayer(tile4Highway);
                break;
            case 'costCheckbox':
                map.removeLayer(tile4cost);
                break;
            default:
                break;
        }
        // console.log("who need to delete ", clickedItme);
    }
}
function hover4attrDetail(hovereditem) {
    if (d3.select(".tooltipsDiv")) d3.select(".tooltipsDiv").remove();
    let attrName = hovereditem.childNodes[0].nodeValue;
    let parentofattrName = hovereditem.parentNode;
    // console.log("parentofattrName ",parentofattrName);
    if (d3.select(".tooltipsDiv")) d3.select(".tooltipsDiv").remove();
    switch (attrName) {
        case 'PA':
            d3.select(parentofattrName).append('div').attr("class", "tooltipsDiv").html(
                "<p>Protected Area Layer</p>" +
                "<ul>" +
                "<li>sort Direction for median ranking:" +
                "<ul  class='directionUl'>" +
                "<li><div class='direction4MR'></div><div class='describe4dire'>nondescending sort of the attribute for median ranking</div></li>" +
                "<li><div class='direction4MR desc'></div class='describe4dire'><div>descending sort of the attribute for median ranking</div></li>" +
                "</ul>" +
                "</li>" +
                "<li>The minimum distance from the center of patch to PA is the PA property for each patch, and they will be colored based on the property.</li>" +
                "<li>Resource: <a href='https://gapanalysis.usgs.gov/padus/data/download/'>https://gapanalysis.usgs.gov/" + "<br>" + "padus/data/download/</a></li>" +
                "<li>Legend:" +
                "<ul class='palayerlegend'>" +
                "<li id='palegend'>protected area</li>" +
                "<li id='paGridlegend'>place near by protected area</li>" +
                "</ul>" +
                "</li>" +
                "</ul>");
            break;
        case 'MA':
            d3.select(parentofattrName).append('div').attr("class", "tooltipsDiv").html(
                "<p>Metro Area Layer</p>" +
                "<ul>" +
                "<li>sort Direction for median ranking:" +
                "<ul  class='directionUl'>" +
                "<li><div class='direction4MR'></div><div class='describe4dire'>nondescending sort of the attribute for median ranking</div></li>" +
                "<li><div class='direction4MR desc'></div class='describe4dire'><div>descending sort of the attribute for median ranking</div></li>" +
                "</ul>" +
                "</li>" +
                "<li>The minimum distance from the center of patch to Metro Area is metro area property for each patch, and they will be colored based on the property.</li>" +
                "<li>Resource: <a href='http://geoinfo.msl.mt.gov/Home/msdi/administrative_boundaries'>http://geoinfo.msl.mt.gov/Home/" + "<br>" + "msdi/administrative_boundaries</a></li>" +
                "<li>Legend:" +
                "<ul class='malayerlegend'>" +
                "<li id='malegend'>metro area</li>" +
                "<li id='maGridlegend'>place near by metro area</li>" +
                "</ul>" +
                "</li>" +
                "</ul>");
            break;
        case 'HII':
            d3.select(parentofattrName).append('div').attr("class", "tooltipsDiv").html(
                "<p>HII Layer</p>" +
                "<ul>" +
                "<li>sort Direction for median ranking:" +
                "<ul  class='directionUl'>" +
                "<li><div class='direction4MR'></div><div class='describe4dire'>nondescending sort of the attribute for median ranking</div></li>" +
                "<li><div class='direction4MR desc'></div class='describe4dire'><div>descending sort of the attribute for median ranking</div></li>" +
                "</ul>" +
                "</li>" +
                "<li>The average human influence index in each patch is the hii property of each patch, and they will be colored based on the property.</li>" +
                "<li>Resource: <a href='http://sedac.ciesin.columbia.edu/data/set/wildareas-v2-last-of-the-wild-geographic/data-download'>http://sedac.ciesin.columbia.edu/data/" + "<br>" + "set/wildareas-v2-last-of-the-wild-geographic" + "<br>" + "/data-download</a></li>" +
                "<li>Legend:" +
                "<ul class='hiilayerlegend'>" +
                "<li id='hiilegend'>index from 64 to 0</li>" +
                "</ul>" +
                "</li>" +
                "</ul>");
            break;
        case 'HY':
            d3.select(parentofattrName).append('div').attr("class", "tooltipsDiv").html(
                "<p>Hydology layer</p>" +
                "<ul>" +
                "<li>sort Direction for median ranking:" +
                "<ul  class='directionUl'>" +
                "<li><div class='direction4MR'></div><div class='describe4dire'>nondescending sort of the attribute for median ranking</div></li>" +
                "<li><div class='direction4MR desc'></div class='describe4dire'><div>descending sort of the attribute for median ranking</div></li>" +
                "</ul>" +
                "</li>" +
                "<li>The layer displays the national Hydrography area for WA, ID, OR and MT.</li>" +
                "<li>Resource: <a href='http://prd-tnm.s3-website-us-west-2.amazonaws.com/?prefix=StagedProducts/Hydrography/NHD/State/HighResolution/Shape/'>http://prd-tnm.s3-website-us-west-2.amazonaws.com/" + "<br>" + "?prefix=StagedProducts/Hydrography/" + "<br>" + "NHD/State/HighResolution/Shape/</a></li>" +
                "<li>Legend:" +
                "<ul class='hydologylayerlegend'>" +
                "<li id='hydologylegend'>hydology area</li>" +
                "</ul>" +
                "</li>" +
                "</ul>");
            break;
        case "HW":
            d3.select(parentofattrName).append('div').attr("class", "tooltipsDiv").html(
                "<p>Highway road layer</p>" +
                "<ul>" +
                "<li>sort Direction for median ranking:" +
                "<ul  class='directionUl'>" +
                "<li><div class='direction4MR'></div><div class='describe4dire'>nondescending sort of the attribute for median ranking</div></li>" +
                "<li><div class='direction4MR desc'></div class='describe4dire'><div>descending sort of the attribute for median ranking</div></li>" +
                "</ul>" +
                "</li>" +
                "<li>The minimum distance from the center of patch to highway is the highway property for each patch, and they will be colored based on the property.</li>" +
                "<li>Resource: <a href='https://www.census.gov/cgi-bin/geo/shapefiles/index.php?year=2017&layergroup=Roads'>https://www.census.gov/cgi-bin/" + "<br>" + "geo/shapefiles/" + "<br>" + "index.php?year=2017&layergroup=Roads</a></li>" +
                "<li>Legend:" +
                "<ul class='rdlayerlegend'>" +
                "<li id='rdlegend'>highway</li>" +
                "<li id='rdGridlegend'>place near by highway</li>" +
                "</ul>" +
                "</li>" +
                "</ul>");
            break;
        case 'AM':
            d3.select(parentofattrName).append('div').attr("class", "tooltipsDiv").html(
                "<p>Amphibian layer</p>" +
                "<ul>" +
                "<li>sort Direction for median ranking:" +
                "<ul  class='directionUl'>" +
                "<li><div class='direction4MR'></div><div class='describe4dire'>nondescending sort of the attribute for median ranking</div></li>" +
                "<li><div class='direction4MR desc'></div class='describe4dire'><div>descending sort of the attribute for median ranking</div></li>" +
                "</ul>" +
                "</li>" +
                "<li>The layer displays the total species richness of Amphibian for WA, ID, OR and MT.</li>" +
                "<li>Resource: <a href='http://biodiversitymapping.org/wordpress/index.php/download/'>http://biodiversitymapping.org/wordpress/" + "<br>" + "index.php/download/</a></li>" +
                "<li>Legend:" +
                "<ul class='Amphibianlayerlegend'>" +
                "<li id='Amphibianlegend'>1~17, richness value</li>" +
                "</ul>" +
                "</li>" +
                "</ul>");
            break;
        case 'Tree':
            d3.select(parentofattrName).append('div').attr("class", "tooltipsDiv").html(
                "<p>Tree layer</p>" +
                "<ul>" +
                "<li>sort Direction for median ranking:" +
                "<ul  class='directionUl'>" +
                "<li><div class='direction4MR'></div><div class='describe4dire'>nondescending sort of the attribute for median ranking</div></li>" +
                "<li><div class='direction4MR desc'></div class='describe4dire'><div>descending sort of the attribute for median ranking</div></li>" +
                "</ul>" +
                "</li>" +
                "<li>The layer displays the total species richness of Tree for WA, ID, OR and MT.</li>" +
                "<li>Resource: <a href='http://biodiversitymapping.org/wordpress/index.php/download/'>http://biodiversitymapping.org/" + "<br>" + "wordpress/index.php/download/</a></li>" +
                "<li>Legend:" +
                "<ul class='Treelayerlegend'>" +
                "<li id='Treelegend'>1~57, richness value</li>" +
                "</ul>" +
                "</li>" +
                "</ul>");
            break;
        case 'Bird':
            d3.select(parentofattrName).append('div').attr("class", "tooltipsDiv").html(
                "<p>Bird layer</p>" +
                "<ul>" +
                "<li>sort Direction for median ranking:" +
                "<ul  class='directionUl'>" +
                "<li><div class='direction4MR'></div><div class='describe4dire'>nondescending sort of the attribute for median ranking</div></li>" +
                "<li><div class='direction4MR desc'></div class='describe4dire'><div>descending sort of the attribute for median ranking</div></li>" +
                "</ul>" +
                "</li>" +
                "<li>The layer displays the total species richness of Bird for WA, ID, OR and MT.</li>" +
                "<li>Resource: <a href='http://biodiversitymapping.org/wordpress/index.php/download/'>http://biodiversitymapping.org/" + "<br>" + "wordpress/index.php/download/</a></li>" +
                "<li>Legend:" +
                "<ul class='Birdlayerlegend'>" +
                "<li id='Birdlegend'>22~200, richness value</li>" +
                "</ul>" +
                "</li>" +
                "</ul>");
            break;
        case 'MM':
            d3.select(parentofattrName).append('div').attr("class", "tooltipsDiv").html(
                "<p>mammal layer</p>" +
                "<ul>" +
                "<li>sort Direction for median ranking:" +
                "<ul  class='directionUl'>" +
                "<li><div class='direction4MR'></div><div class='describe4dire'>nondescending sort of the attribute for median ranking</div></li>" +
                "<li><div class='direction4MR desc'></div class='describe4dire'><div>descending sort of the attribute for median ranking</div></li>" +
                "</ul>" +
                "</li>" +
                "<li>The layer displays the total species richness of mammal for WA, ID, OR and MT.</li>" +
                "<li>Resource: <a href='http://biodiversitymapping.org/wordpress/index.php/download/'>http://biodiversitymapping.org/" + "<br>" + "wordpress/index.php/download/</a></li>" +
                "<li>Legend:" +
                "<ul class='mammallayerlegend'>" +
                "<li id='mammallegend'>5~82, richness value</li>" +
                "</ul>" +
                "</li>" +
                "</ul>");
            break;
        case 'RP':
            d3.select(parentofattrName).append('div').attr("class", "tooltipsDiv").html(
                "<p>reptile layer</p>" +
                "<ul>" +
                "<li>sort Direction for median ranking:" +
                "<ul  class='directionUl'>" +
                "<li><div class='direction4MR'></div><div class='describe4dire'>nondescending sort of the attribute for median ranking</div></li>" +
                "<li><div class='direction4MR desc'></div class='describe4dire'><div>descending sort of the attribute for median ranking</div></li>" +
                "</ul>" +
                "</li>" +
                "<li>The layer displays the total species richness of reptile for WA, ID, OR and MT.</li>" +
                "<li>Resource: <a href='http://biodiversitymapping.org/wordpress/index.php/download/'>http://biodiversitymapping.org/" + "<br>" + "wordpress/index.php/download/</a></li>" +
                "<li>Legend:" +
                "<ul class='reptilelayerlegend'>" +
                "<li id='reptilelegend'>1~20, richness value</li>" +
                "</ul>" +
                "</li>" +
                "</ul>");
            break;
        case 'Fish':
            d3.select(parentofattrName).append('div').attr("class", "tooltipsDiv").html(
                "<p>fish layer</p>" +
                "<ul>" +
                "<li>sort Direction for median ranking:" +
                "<ul  class='directionUl'>" +
                "<li><div class='direction4MR'></div><div class='describe4dire'>nondescending sort of the attribute for median ranking</div></li>" +
                "<li><div class='direction4MR desc'></div class='describe4dire'><div>descending sort of the attribute for median ranking</div></li>" +
                "</ul>" +
                "</li>" +
                "<li>The layer displays the total species richness of fish for WA, ID, OR and MT.</li>" +
                "<li>Resource: <a href='http://biodiversitymapping.org/wordpress/index.php/download/'>http://biodiversitymapping.org/" + "<br>" +
                "wordpress/index.php/download/</a></li>" +
                "<li>Legend:" +
                "<ul class='fishlayerlegend'>" +
                "<li id='fishlegend'>9~47, richness value</li>" +
                "</ul>" +
                "</li>" +
                "</ul>");
            break;
        case 'Cost':
            d3.select(parentofattrName).append('div').attr("class", "tooltipsDiv").html(
                "<p>Cost layer</p>" +
                "<ul>" +
                "<li>sort Direction for median ranking:" +
                "<ul  class='directionUl'>" +
                "<li><div class='direction4MR'></div><div class='describe4dire'>nondescending sort of the attribute for median ranking</div></li>" +
                "<li><div class='direction4MR desc'></div class='describe4dire'><div>descending sort of the attribute for median ranking</div></li>" +
                "</ul>" +
                "</li>" +
                "<li>The layer displays the cost per square metre in Montana.</li>" +
                "<li>Resource: <a href='https://makeloveland.com/reports/parcels'>https://makeloveland.com/" + "<br>" + "reports/parcels</a></li>" +
                "<li>Legend:" +
                "<ul class='costlayerlegend'>" +
                "<li id='costlegend'>3.86e-7 ~ 20M, ($)dollar/meter2</li>" +
                "</ul>" +
                "</li>" +
                "</ul>");
            break;
        default:
            break;
    }
}
function changeDirection(changedIcon) {
    let id = changedIcon.id;
    let url = d3.select(changedIcon).style("background-image");
    let url2show = swithURl(url);
    d3.select(changedIcon).style("background-image", `url("${url2show}")`);

    let keys = Object.keys(filterPool4grid);
    if (keys.length == 0) {
        operator4sort = {};
    } else {
        operator4sort = {};
        let targetIcons = keys.map(d => {
            let name = "sortIcon4" + d;
            return name;
        })
        targetIcons.forEach(d => {
            if (d == id) {
                operator4sort[id.slice(9)] = url2show.slice(-8, -4);
            } else {
                let url = d3.select("#" + d).style("background-image");
                operator4sort[d.slice(9)] = url.slice(-10, -6);
            }
        })
    }
    // console.log("operator4sort",operator4sort);
    updateslidersAndfilteredP(currentGridData, filterPool4grid, operator4sort);
}
function selectAttr2filter(selectedAttr) {
    if (globalTest["filteredgrids"]) map.removeLayer(globalTest["filteredgrids"]);
    if (globalTest["allPatchesLayer"]) map.removeLayer(globalTest["allPatchesLayer"]);
    if (globalTest["selectedLayerbySlider"]) map.removeLayer(globalTest["selectedLayerbySlider"]);
    if (globalTest["suggestedPatches"]) map.removeLayer(globalTest["suggestedPatches"]);
    if (globalTest["userSelectedPatches"]) map.removeLayer(globalTest["userSelectedPatches"]);

    function filtergridsBasedonBrush(brushchart4attr, propName) {
        if (brushchart4attr.data != null) {
            filterPool4grid[propName] = {};
            filterPool4grid[propName].range = brushchart4attr.getrange();
            filterPool4grid[propName].maxValue = brushchart4attr.getXMax();
            // console.log(filterPool4grid)
            operaterFromfilterPool4grid(filterPool4grid);
            updateslidersAndfilteredP(currentGridData, filterPool4grid, operator4sort)
        }
    }
    function deletefilteredAttr(brushchart4attr, propName) {
        if (brushchart4attr.data != null) {
            delete filterPool4grid[propName];
            let keys = Object.keys(filterPool4grid);
            if (keys.length == 0) {
                operator4sort = {};
            } else {
                operaterFromfilterPool4grid(filterPool4grid);
            }
            updateslidersAndfilteredP(currentGridData, filterPool4grid, operator4sort)
        }
    }
    if (selectedAttr.checked == true) {
        let checkedAttr = selectedAttr.id;
        let key = getKeyByValue(abbre2ids, "selectId", checkedAttr);
        let propname = abbre2ids[key].sortIcon.slice(9);
        filtergridsBasedonBrush(abbre2ids[key].linechart, propname);
    } else if (selectedAttr.checked == false) {
        let unchecked = selectedAttr.id;
        let key = getKeyByValue(abbre2ids, "selectId", unchecked);
        let propname = abbre2ids[key].sortIcon.slice(9);
        deletefilteredAttr(abbre2ids[key].linechart, propname);
    }
}
function initPosition_lineChart(attrlist2show) {
    let attrs_11 = attrlist2show.map(d => {
        return abbre2ids[d].sortIcon.slice(9);
    })
    parallel_coor_setting.x.domain(attrs_11);
    attrs_11.forEach(d => {
        let idName = "#sortIcon4" + d;
        d3.select(d3.select(idName).node().parentNode.parentNode.parentNode).style("left", `${parallel_coor_setting.x(d)}px`);
    })
}

//initialize the slider
let slider4medianRanking = new slider("#medianSlider");
let slider4cost = new slider("#costSlider");
let slider4area = new slider("#areaSlider");
//initailize constraint input
d3.select("#minInput").property("value", "none");
d3.select("#maxInput").property("value", "none");

//initailize the result line
let line4ResultConstraint = new line4Result("#resultConstraint");
let line4ResultGoal = new line4Result("#resultGoal");

////change data set
let checkedDataset = d3.select(".dataSelection input:checked").node().value;
if (checkedDataset == "gridDataset") {
    d3.select(".gridDiv").style("visibility", "visible");
} else {
    d3.select(".gridDiv").style("visibility", "hidden");
}
let dataType = $(".dataSelection input");
dataType.on('change', function (d) {
    let checked = d3.select(this).node().value;
    if (checked == "gridDataset") {
        d3.select(".gridDiv").style("visibility", "visible");
    } else {
        d3.select(".gridDiv").style("visibility", "hidden");
    }
})

////hidden the selection for pa layers
d3.select(".paLayers").style("visibility", "hidden");

function getAttrValuemap(data) {
    let attrs = {};
    Object.keys(abbre2ids).forEach(attr => {
        let searchKey = abbre2ids[attr].sortIcon.slice(9);
        let attrArr = data.map(a => a.properties[searchKey]);
        attrs[searchKey] = attrArr;
    })
    return attrs;
}
function setDataInitlineChart(attrlist2show, attrs) {
    attrlist2show.forEach(attribute => {
        let attrDataname = abbre2ids[attribute].sortIcon.slice(9);
        abbre2ids[attribute].linechart.setdata(attrs[attrDataname]);
        abbre2ids[attribute].linechart.init();
    })
}
function updateLinechart(attrlist2show, attrs) {
    attrlist2show.forEach(attribute => {
        let attrDataname = abbre2ids[attribute].sortIcon.slice(9);
        abbre2ids[attribute].linechart.update(attrs[attrDataname]);
    })
}

function toDo4data(data, attrlist2show) {
    currentGridData = data;
    // console.log("currentGridData ", currentGridData.length);

    //add original parcels on the map
    if (globalTest["parcelLayer"]) map.removeLayer(globalTest["parcelLayer"]);
    globalTest.parcelLayer = L.geoJson(data, {
        style: { "fillcolor": "transparent", "weight": 1, "color": "#6c757d", "fillOpacity": 0 }
    },
    ).addTo(map);

    let attrs = getAttrValuemap(data);
    function initialFilterAttrAndOperater() {
        d3.selectAll(".filterCheckbox input").each(function (d, i) {
            if (this.checked == true) {
                let filterName = id2filtername(this.id);
                filterPool4grid[filterName] = { range: null, maxValue: Math.max(...attrs[filterName]) };
            }
        });
        operaterFromfilterPool4grid(filterPool4grid)
    }
    initialFilterAttrAndOperater();

    setDataInitlineChart(attrlist2show, attrs);

    ////draw the parallel coordinates
    parallel4attributes.setdata(currentGridData, attrlist2show);
    parallel4attributes.init();

    ////draw the slider
    updateslidersAndfilteredP(currentGridData, filterPool4grid, operator4sort);

    ////initialize result 
    line4ResultConstraint.init();
    line4ResultGoal.init();
}

$(".lengendInfo").hide();
d3.select(".legend2showButton")
    .on("click", function () {
        if ($(".lengendInfo").is(":visible")) {
            $(".lengendInfo").hide();
        } else {
            $(".lengendInfo").show();
        }
    })
$(".resultDiv").hide();

/////////add draw tool on the map
// Initialise the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Initialise the draw control,
// disable unecessary controls,
// and pass it the FeatureGroup of editable layers
var drawControl = new L.Control.Draw({
    draw: {
        polygon: false,
        marker: false,
        circle: false,
        polyline: false,
        circlemarker: false
    },
    edit: {
        featureGroup: drawnItems,
        // edit: false
    }
});

if (map.layerControl != undefined) {
    map.removeLayer(drawControl);
}

let quanjukuang = null
initailizeAllGlobalInfo(attrlist2show);
map.addControl(drawControl);
map.on(L.Draw.Event.CREATED, function (e) {
    var type = e.layerType
    var layer = e.layer;
    // console.log(layer);
    operationsAfterLayer(layer);

    // map.on('draw:edited', function (e) {
    //     console.log("enditLayer")
    //     var layers = e.layers;
    //     let revisedLayer = Object.values(layers._layers)[0];
    //     operationsAfterLayer(revisedLayer);
    //     // console.log("revisedLayer ", revisedLayer)
    // });

    function operationsAfterLayer(layer) {
        drawnItems.removeLayer(quanjukuang)
        quanjukuang = null
        initailizeAllGlobalInfo(attrlist2show);
        ////get the user-drawn rectangel
        let NElat = layer._bounds._northEast.lat;
        let NElong = layer._bounds._northEast.lng;
        let SWlat = layer._bounds._southWest.lat;
        let SWlong = layer._bounds._southWest.lng;
        let rectangle = [[SWlong, NElat], [NElong, NElat], [NElong, SWlat], [SWlong, SWlat], [SWlong, NElat]];
        globalDrawnArea = rectangle;
        // Do whatever else you need to. (save to db, add to map etc)
        /***************(1) generate grid first******************************* */
        //check the dataset
        let body = d3.select("body");
        let dataset = d3.select(".dataSelection input:checked").node().value;
        if (dataset == "gridDataset") {
            let generateGridButton = d3.select(".gridDiv #generateGridButton");
            generateGridButton.on('click', function (d) {
                body.classed('loading', true);
                let cellside = d3.select("#unit4cellsize").property("value");
                d3.select('#currentUnit').text("" + cellside);
                let currentSquarValue = d3.select('#currentUnit').html();
                if (currentSquarValue != "") {
                    let filterValueInputs = d3.select(".distributionDiv").selectAll(".filterCheckbox input");
                    filterValueInputs._groups[0].forEach(node => {
                        node.disabled = false;
                    })
                }
                gridInfo = { "rectangle": rectangle, "cellside": cellside };
                if (globalTest[gridName]) { map.removeLayer(globalTest[gridName]); }
                loadUserDefinedSquareGrid(gridName, cellside, rectangle);
                $.ajax({
                    type: 'GET',
                    data: JSON.stringify(gridInfo),
                    contentType: 'application/json',
                    url: './storeUserGrid',
                    success: function (data) {
                        console.log('success');
                        console.log("data: ", data);
                        body.classed('loading', false);
                        let dataNofarPA = data.filter(obj => obj.properties.paAver != -2);
                        toDo4data(dataNofarPA);
                    }
                })
            })
        } else {
            body.classed('loading', true);
            $.ajax({
                type: 'GET',
                data: JSON.stringify({ "rectangle": rectangle, "paType": paType }),
                contentType: 'application/json',
                url: './storeUserParcel',
                success: function (data) {
                    body.classed('loading', false);
                    let data2do;
                    if (paType == "totalPA") {
                        data2do = data.filter(obj => obj.properties.paAver != -2);
                        if (data2do.length == 0) {
                            console.log("null for the data")
                        }
                    } else {
                        data2do = data;
                    }
                    toDo4data(data2do, attrlist2show);
                }
            })
        }


        quanjukuang = layer;
        quanjukuang.options.fillOpacity = 0;
        quanjukuang.options.opacity = 0
        drawnItems.addLayer(quanjukuang);
    }
});

//function for median ranking
function getMedianRank(currentGridData, filterPool4grid, operator4sort) {
    // console.log(currentGridData, filterPool4grid, operator4sort);
    let flag4mr = 0;
    let filteredDataOnMap = filterData(currentGridData, filterPool4grid);
    if (Object.keys(filterPool4grid).length != 0) {
        flag4mr = 1;
        let attr2filter = Object.keys(operator4sort);
        attr2filter.forEach(attribute => {
            let operator = operator4sort[attribute];
            if (operator == "desc") {
                filteredDataOnMap.sort(function (a, b) { return b.properties[attribute] - a.properties[attribute] }); //descending order for pa
            } else if (operator == "asce") {
                filteredDataOnMap.sort(function (a, b) { return a.properties[attribute] - b.properties[attribute] }); //ascending order for pa
            }
            let indexName = attribute + "Index";
            let count4medianRanking = 0;
            let previousOne = null;
            filteredDataOnMap.map((a, i) => {
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
        filteredDataOnMap.map(d => {
            let rankingsets = d.properties.rankingsets;
            let allrankings = Object.values(rankingsets);
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
    return { "data": filteredDataOnMap, "flag": flag4mr };
} //end of getMedianRank function

function filterData(currentGridData, filterPool) {
    let filteredData = currentGridData.filter((obj) => {
        let condition = true;
        let filters = Object.keys(filterPool);
        filters.forEach(key => {
            let filterrange = filterPool[key].range;
            let filtermaxvalue = filterPool[key].maxValue;
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
function squareGridBasedonPosition(rectangle, cellside) {
    let bbox = rectangle[1].concat(rectangle[3]);
    let polygon = { "type": "Polygon", "coordinates": [rectangle] };
    let options = { units: 'miles', mask: polygon };
    let squareGrid = turf.squareGrid(bbox, cellside, options);
    return squareGrid;
}
function loadUserDefinedSquareGrid(gridname, cellside, rectangle) {
    globalTest[gridname] = L.geoJSON(
        squareGridBasedonPosition(rectangle, cellside),
        {
            style: myStyle4squareGrid,
            // onEachFeature: onEachFeature4squareGrid
        }
    ).addTo(map);
}
function updateDistriBasedonBrush(currentGridData, filterPool) {
    let filteredData = filterData(currentGridData, filterPool);
    let attrs = getAttrValuemap(filteredData);
    updateLinechart(attrlist2show, attrs);
}
function showMedianRankingonMap(currentGridData, filterPool4grid) {
    let filteredData = filterData(currentGridData, filterPool4grid);
    let medianRankingsets = filteredData.map(d => d.properties.medianRanking);
    let maxRanking = Math.max(...medianRankingsets);
    let minRanking = Math.min(...medianRankingsets);
    let scale = (maxRanking - minRanking) / 6;
    if (globalTest.filteredgrids) {
        map.removeLayer(globalTest.filteredgrids);
    }
    if (globalTest.selectedLayerbySlider) {
        map.removeLayer(globalTest.selectedLayerbySlider);
    }
    let legendInfo = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    globalTest.filteredgrids = L.geoJson(filteredData, {
        style: function (d) {
            let level;
            if (scale != 0) {
                level = Math.floor((d.properties.medianRanking - minRanking) / scale);
                legendInfo[level].push(d.properties.medianRanking);
            } else {
                level = 6;
                legendInfo[level].push(d.properties.medianRanking);
            }
            return { "fillColor": color7[level], "fillOpacity": 0.8, "weight": 1, "color": "grey" };
        },
    }).addTo(map);

    Object.keys(legendInfo).map(key => {
        legendInfo[key] = [d3.min(legendInfo[key]), d3.max(legendInfo[key])]
    })
    // console.log("legendInfo ", Object.values(legendInfo));
    if (d3.select(".lengendInfo").select("svg")) d3.select(".lengendInfo").select("svg").remove();
    let svgLegned = d3.select(".lengendInfo").append("svg")
        .attr("width", "100%").attr("height", "100%")
    svgLegned.append("text")
        .attr("x", 3)
        .attr("y", 10)
        //.attr("dy", ".35em")
        .text("Median Ranking Legend")
        .attr("class", "title")
        .style("text-anchor", "start")
        .style("font-size", 11)

    //D3 Vertical Legend//////////////////////////
    let legend = svgLegned.selectAll('.legend')
        .data(Object.values(legendInfo))
        .enter().append('g')
        .attr("class", "legends")
        .attr("transform", function (d, i) {
            {
                return "translate(5," + (15 + i * 15) + ")"
            }
        })

    legend.append('rect')
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function (d, i) {
            return color7[i];
        })

    legend.append('text')
        .attr("x", 20)
        .attr("y", 10)
        //.attr("dy", ".35em")
        .text(function (d, i) {
            let result;
            if (d[0] == undefined | d[1] == undefined) {
                result = ""
            } else if (d[0] == d[1]) {
                result = d[0]
            } else {
                result = d[0] + " - " + d[1];
            }
            return result;
        })
        .attr("class", "textselected")
        .style("text-anchor", "start")
        .style("font-size", 11)
}
function updateslidersAndfilteredP(currentGridData, filterPool4grid, operator4sort) {
    if (globalTest["filteredgrids"]) map.removeLayer(globalTest["filteredgrids"]);
    if (globalTest["allPatchesLayer"]) map.removeLayer(globalTest["allPatchesLayer"]);
    if (globalTest["selectedLayerbySlider"]) map.removeLayer(globalTest["selectedLayerbySlider"]);
    if (globalTest["suggestedPatches"]) map.removeLayer(globalTest["suggestedPatches"]);
    if (globalTest["userSelectedPatches"]) map.removeLayer(globalTest["userSelectedPatches"]);
    if (globalTest["unselectedLayerbySlider"]) map.removeLayer(globalTest["unselectedLayerbySlider"]);
    // console.log(" Object.keys(globalTest) ", Object.keys(globalTest))
    // Object.keys(globalTest).forEach(key => {
    //     if (key != gridName) {
    //     map.removeLayer(globalTest[key]);
    //     }
    // })
    let mrInfo = getMedianRank(currentGridData, filterPool4grid, operator4sort);
    let flag4mr = mrInfo.flag;
    let rankedData = mrInfo.data;
    drawSlider4Constraints(rankedData);
    if (flag4mr != 0) {
        let rankingsets = rankedData.map(d => d.properties.medianRanking);
        slider4medianRanking.update(rankingsets);
        showMedianRankingonMap(currentGridData, filterPool4grid);
    } else {
        //delete seven colored patches on the map
        if (globalTest.filteredgrids) {
            map.removeLayer(globalTest.filteredgrids);
            if (d3.select(".lengendInfo").select("svg")) d3.select(".lengendInfo").select("svg").remove();
        }
        if (globalTest.selectedLayerbySlider) {
            map.removeLayer(globalTest.selectedLayerbySlider);
        }
        //delete median Ranking
        slider4medianRanking.update(null);
    }
    //update the rankingvalue
    ranking2filter = slider4medianRanking.getDragValue();

}
function sliderUpdatesFilteredP(currentGridData, filterPool4grid, operator4sort, ranking2filter) {
    if (globalTest["allPatchesLayer"]) map.removeLayer(globalTest["allPatchesLayer"]);
    if (globalTest["selectedLayerbySlider"]) map.removeLayer(globalTest["selectedLayerbySlider"]);
    if (globalTest["suggestedPatches"]) map.removeLayer(globalTest["suggestedPatches"]);
    if (globalTest["userSelectedPatches"]) map.removeLayer(globalTest["userSelectedPatches"]);
    if (globalTest["unselectedLayerbySlider"]) map.removeLayer(globalTest["unselectedLayerbySlider"]);
    // console.log(" Object.keys(globalTest) ", Object.keys(globalTest))
    // Object.keys(globalTest).forEach(key => {
    //     if (key != "filteredgrids" && key != gridName) {
    //         map.removeLayer(globalTest[key]);
    //     }
    // })
    let filteredDatabyFilterPool = getMedianRank(currentGridData, filterPool4grid, operator4sort).data;
    let rankingsets = filteredDatabyFilterPool.map(d => {
        return d.properties.medianRanking;
    })
    let maxRanking = Math.max(...rankingsets);
    let minRanking = Math.min(...rankingsets);
    let selectedData = filteredDatabyFilterPool.filter((obj) => {
        let ranking = obj.properties.medianRanking;
        return ((ranking < ranking2filter[1]) || (ranking == ranking2filter[1])) && ((ranking > ranking2filter[0]) || (ranking == ranking2filter[0])); ////selectedData
        // return ranking > ranking2filter; //unselectedData
    })
    let unselectedDatabyMedianRanking = filteredDatabyFilterPool.filter((obj) => {
        let ranking = obj.properties.medianRanking;
        // return ((ranking < ranking2filter[1]) || (ranking == ranking2filter[1])) && ((ranking > ranking2filter[0]) || (ranking == ranking2filter[0])); ////selectedData
        return ranking > ranking2filter[1] || ranking < ranking2filter[0]; //unselectedData
    })
    updateLayer("unselectedLayerbySlider", { "fillColor": "#E7E7E7", "fillOpacity": 1, "weight": 1, "color": "white", "dashArray": null, "opacity": 1 }, unselectedDatabyMedianRanking);

    drawSlider4Constraints(selectedData);
    // updateLayer("selectedLayerbySlider", { "fillOpacity": 0, "weight": 1, "color": "white", "dashArray": null, "opacity": 1 }, selectedData)
    // }
}
function drawSlider4Constraints(selectedData) {
    let updateCost = 0;
    let updateArea = 0;
    selectedData.forEach(d => {
        updateCost = updateCost += d.properties.cost;
        updateArea = updateArea += d.properties.area;
    });
    slider4cost.update([0, updateCost]);
    slider4area.update([0, updateArea]);
}
function updateLayer(layername, options, geojsonData) {
    if (globalTest[layername]) {
        map.removeLayer(globalTest[layername]);
    }
    globalTest[layername] = L.geoJson(geojsonData, {
        style: function (d) {
            return options;
        },
    }).addTo(map);
}



/*********************************3.2 update the value of optimization form, such as median ranking, const, and area*************************************************** */
// This loads specified shapefile and returns geojson to callback
// We call L.geoJson(aka. Leaflet create geojson layer) using the specified geojson
// Then we style and add functionality to each of the features contained in the geojson/shapefile
// After styling and adding functionality add it to the map and store this reference for restyling later (see resetHighlight)
// Store reference to geojson incase you need it later

function highlightFeatureTest(e) {
    var layer = e.target;

    var props = layer.feature.properties;
    info.updateTest(layer.feature.properties, layer.feature.geometry);

    layer.setStyle({
        weight: 2,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7

    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
}

function resetHighlightTest(e) {
    globalTest.layer.resetStyle(e.target);
}

function onEachFeatureTest(feature, layer) {
    layer.on({
        mouseover: highlightFeatureTest,
        mouseout: resetHighlightTest
    });
}


info.updateTest = function (props, geo) {
    // this._div.innerHTML = '<h4 style="color:white;">Community Area ID: ' + (props ?
    //     '<b>' + props.WETLAND_TY + '</h4>'
    //     : 'Hover over an area');

    ///////////////////show some information of the hovered the area on the map
    // document.getElementById("testingHover").innerHTML = '<h4>Results for Selected Tract: </h4>'
    //     + (props ? '<p>'
    //         // + 'Properties: ' + JSON.stringify(props) + '<br>'
    //         + 'shape length: ' + props.SHAPE_Leng + '<br>'
    //         + 'shape area: ' + props.Shape_Area + '<br>'
    //         + 'Src Data: ' + props.Src_Date + '<br>'
    //         + 'State name: ' + props.d_State_Nm + '<br>'
    //         + 'Geometry:' + geo.bbox[0] + " " + geo.bbox[1] + '<br>'
    //         : 'Hover over an area');
};

////////////////////////////////////////////////////////
// Reset: take off active layer and show base map layer
////////////////////////////////////////////////////////
function reloadExistingLayers(geojson) {
    map.removeLayer(geojson.layer);
}
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    return this._div;
};

info.addTo(map);

// var ret = {};
// ret.init = init;
// return ret;



// };





//add parcels on the map
// var canvasLayer = new L.CanvasGeojsonLayer({
//     onMouseOver: function (features) {
//         // handle mouseover events
//     },
//     onMouseOut: function (features) {
//         // handle mouseout events
//     },
//     onClick: function (features) {
//         // handle mouse click events
//         console.log("clicked parcel", features);
//     }
// });
// canvasLayer.addTo(map);
// $.ajax({
//     type: 'GET',
//     data: JSON.stringify(gridInfo),
//     contentType: 'application/json',
//     url: './selectedSquare',
//     success: function (data) {
//         console.log("canvas data :", data)
//         canvasLayer.addCanvasFeatures(L.CanvasFeatureFactory({
//             "type": "FeatureCollection",
//             "features": data
//         }));
//         canvasLayer.render();
//     }
// })







