let optimiazationButton = d3.select("#optiButtion");
let options4suggestedLayer = { "fillcolor": "#FC8271", "fillOpacity": 0.8, "weight": 1, "color": "#FC8271", "dashArray": "2,2", "opacity": 1 };
let style4users = { "fillOpacity": 0, "weight": 2, "color": "#C00000", "opacity": 0.8 };
////interaction with constraint part and objective part
function swithname(attr) {
    if (attr == "cost") {
        return "area";
    } else if (attr == "area") {
        return "cost";
    }
}
let constraintRadios = d3.selectAll(".constraintsform input");
constraintRadios.on("click", function () {
    let checkedvalue = this.id.slice(0, -5);
    d3.select("#minInput").property("value", currentBudget[checkedvalue][0]);
    d3.select("#maxInput").property("value", currentBudget[checkedvalue][1]);
    $('#goalAttr').val(swithname(checkedvalue));
})
$('#goalAttr').on('change', function (e) {
    let checkedValue = $(this).val();
    let changeId = "#" + swithname(checkedValue) + "Radio";
    $(changeId).prop('checked', true);
});

d3.select("#maxInput").property("value", "none");

let circledata = []

optimiazationButton.on('click', function (d) {
    $(".resultDiv").show();
    ////Preprocessing part
    let optiInput = {};
    let filterInfo = {};

    let userDefinedGridInfo = currentGridData[0].properties.userDefinedGridInfo;
    optiInput.originalData = attrRange(currentGridData);
    optiInput.boxplotInfo = boxloptData4origin(currentGridData, filterPool4grid)

    // optiInput.boxplot = 
    optiInput.userDefinedGridInfo = userDefinedGridInfo;
    let keysofFilterPool4grid = Object.keys(filterPool4grid);
    keysofFilterPool4grid.forEach(key => {
        let range = null;
        if (filterPool4grid[key].range != null) {
            range = [filterPool4grid[key].range[0] * 1, filterPool4grid[key].range[1] * 1];
        }
        let maxValue = filterPool4grid[key].maxValue * 1;
        let objContent = { "filterRange": { "range": range, "maxValue": maxValue }, "sortDirection": operator4sort[key] };
        filterInfo[key] = objContent;
    })
    optiInput.filterInfo = filterInfo;
    optiInput.ranking2filter = slider4medianRanking.getDragValue();

    ////constrints part
    let constraintId = d3.select(".constraintsform input:checked").node().id;
    let constraintValue;
    switch (constraintId) {
        case "costRadio":
            constraintValue = slider4cost.getDragValue();
            break;
        case "areaRadio":
            constraintValue = slider4area.getDragValue();
            break;
        default:
            break;
    }
    optiInput.constraints = { id: constraintId.slice(0, 4), range: constraintValue };

    ////objective function part
    let goal = d3.select("#goalAttr")._groups[0][0].value;
    let goalDirection = d3.select("#goalDirection")._groups[0][0].value;
    optiInput.objFun = { goal: goal, goalDirection: goalDirection };

    ////total cost and area
    let totalCost = 0;
    currentGridData.map(d => {
        totalCost += d.properties.cost;
    })
    let totalArea = 0;
    currentGridData.map(d => {
        totalArea += d.properties.area;
    })
    let costAreaObj = { "totalCost": totalCost, "totalArea": totalArea };
    optiInput.costArea = costAreaObj;
    optiInput.paType = paType;

    // console.log(optiInput);
    $.ajax({
        type: 'GET',
        data: JSON.stringify(optiInput),
        contentType: 'application/json',
        url: './optimization',
        success: function (data) {
            // console.log('to optimize');
            // console.log("bestPatches: ", data);
            userPatchesArr = data;

            if (globalTest["userSelectedPatches"]) map.removeLayer(globalTest["userSelectedPatches"]);
            if (globalTest["allPatchesLayer"]) map.removeLayer(globalTest["allPatchesLayer"]);
            if (globalTest["suggestedPatches"]) map.removeLayer(globalTest["suggestedPatches"]);

            updateLayer("suggestedPatches", options4suggestedLayer, data);

            addLayerAfterOpti("userSelectedPatches", data, style4users);

            let iconUrl4cons = "./stylesheets/legend/" + constraintId.slice(0, 4) + ".png";
            let iconUrl4goal = "./stylesheets/legend/" + goal + ".png";
            d3.select(".constraintLine .resultIcon").style("background-image", `url("${iconUrl4cons}")`);
            d3.select(".goalLine .resultIcon").style("background-image", `url("${iconUrl4goal}")`);
            let rangeOfConstraint = 0;
            let rangeOfGoal = 0;
            currentGridData.map(d => {
                rangeOfConstraint += d.properties[constraintId.slice(0, 4)];
                rangeOfGoal += d.properties[goal];
            })
            line4ResultConstraint.setOriginalData([0, rangeOfConstraint]);
            line4ResultGoal.setOriginalData([0, rangeOfGoal]);
            line4ResultConstraint.renderLine();
            line4ResultGoal.renderLine();
            //add constraintRange
            line4ResultConstraint.setConsRangeData(constraintValue);
            line4ResultConstraint.renderConsRange();

            ////get the suggested info
            let suggestedInfo = suggestedAndusersInfo(data);

            /////render the suggested patches
            let gcResult = goalConstraint4Result(data, goal, constraintId.slice(0, 4));
            let goalofSuggestedResult = gcResult.goalValue;
            let constraintofSuggestedResult = gcResult.constraintValue;
            let constraintData = { data: constraintofSuggestedResult, color: "#FC8271", type: "constraint" };
            let goalData = { data: goalofSuggestedResult, color: "#FC8271", type: "goal" };
            line4ResultConstraint.setRectData(constraintData);
            line4ResultGoal.setRectData(goalData);
            line4ResultConstraint.renderRect();
            line4ResultGoal.renderRect();



            ////interaction with the user's selected patches
            let definedStyle = { "fillOpacity": 0.1, "weight": 2, "color": "white", "dashArray": null, "opacity": 0.1 };
            addLayerAfterOpti("allPatchesLayer", currentGridData, definedStyle);

            /////click save button
            d3.select("#saveButton").on('click', function () {
                let screenshotId = 'screenshots' + resultsNum;
                resultsNum++;
                // console.log("screenshotId ",screenshotId);
                let imageInfo = {};
                imageInfo.screenshotId = screenshotId;
                imageInfo.optiInput = optiInput;
                imageInfo.suggestedPatches = suggestedInfo;
                // if (userPatchesArr.length == 0) userPatchesArr = data;
                imageInfo.usersPatches = suggestedAndusersInfo(userPatchesArr);
                imageInfo.optiResult = gcResult;
                imageInfo.rank = resultsArr.length * 1
                resultsArr.push(imageInfo);
                let thisg = rerendering(resultsArr);
                leafletImage(map, function (err, canvas) {
                    var img = document.createElement('img');
                    var dimensions = map.getSize();
                    imgRatio = dimensions.x / dimensions.y;
                    img.width = 265;
                    img.height = 265 / imgRatio;
                    img.src = canvas.toDataURL();
                    ////add image
                    thisg.addelement.append("image")
                        .attr("xlink:href", img.src)
                        .attr("height", img.height)
                        .attr("width", img.width)
                        .attr("x", 40)
                        .attr("y", 55)
                    thisg.addelement.append("rect")
                        .attr("class", "imageBorder")
                        .attr("x", 40)
                        .attr("y", 55)
                        .attr("height", img.height)
                        .attr("width", img.width)
                        .attr("style", "fill: transparent; stroke: #1b1e21; ")

                    // $.ajax({
                    //     type: 'GET',
                    //     data: JSON.stringify(imageInfo),
                    //     contentType: 'application/json',
                    //     url: './saveOptiRuserR',
                    //     success: function (data) {
                    //         console.log("saved");
                    //     }
                    // })
                })
            })

        }
    })
    function addLayerAfterOpti(layname, geoJsonData, definedStyle) {
        if (globalTest[layname]) {
            map.removeLayer(globalTest[layname]);
        }
        globalTest[layname] = L.geoJSON(
            geoJsonData,
            {
                style: definedStyle,
                onEachFeature: onEachFeature4optiResult
            }
        ).addTo(map);
    }
    function onEachFeature4optiResult(feature, layer) {
        layer.on({
            click: userSelectedPatches,
            add: function () {
                layer.bringToFront()
            }
        });
    }
    function userSelectedPatches(e) {
        let clickedFeature = e.target.feature;
        let center = clickedFeature.properties.center;
        let flag = findCenterInUsersArr(center, userPatchesArr);
        if (flag[0] == 0) {
            userPatchesArr.push(clickedFeature);
        } else {
            userPatchesArr.splice(flag[1], 1);
        }
        // console.log("userPatchesArr ", userPatchesArr);
        addLayerAfterOpti("userSelectedPatches", userPatchesArr, style4users);
        ////draw the rect for user's patches
        let userResult = goalConstraint4Result(userPatchesArr, goal, constraintId.slice(0, 4));
        let userGoal = userResult.goalValue;
        let userConstraint = userResult.constraintValue;
        let constraintInfo = { data: userConstraint, color: "#C00000", type: "constraint" };
        let goalInfo = { data: userGoal, color: "#C00000", type: "goal" };
        line4ResultConstraint.setRectData(constraintInfo);
        line4ResultGoal.setRectData(goalInfo);
        line4ResultConstraint.renderRect();
        line4ResultGoal.renderRect();
    }
    function findCenterInUsersArr(center, userPatchesArr) {
        let flag = [0, 0];
        userPatchesArr.map((d, i) => {
            if ((d.properties.center[0] == center[0]) && (d.properties.center[1] == center[1])) {
                flag = [1, i];
            }
        })
        return flag;
    }
    function goalConstraint4Result(data, goalId, constraintId) {
        let goalValue = 0;
        let constraintValue = 0;
        data.forEach(d => {
            goalValue += d.properties[goalId];
            constraintValue += d.properties[constraintId];
        })
        return { goalValue: goalValue, constraintValue: constraintValue };
    }

    function rerendering(data) {
        // console.log("data in rerendering ", data);
        let allRadiuses = data.map(d => {
            let area = d.optiInput.userDefinedGridInfo.searchArea;
            let radius = Math.pow(area / Math.PI, 0.5);
            return radius;
        });
        let maxRadius = Math.max(...allRadiuses);

        let maxR = 140;
        let scale4pie = maxR / maxRadius;

        let setting = { height: maxR * 2 + 110 }
        let screenshotHeight = 115;
        let topRectSize = 40, deleteCircleR = 10, iconSize = 20, circleIcon4value = 3;;
        let xy_topRect = { x: topRectSize, y: (setting.height / 2 - 40) - 10 - screenshotHeight / 2 - 10 - topRectSize };
        let middleLineLong = 225 + iconSize;
        let resultRectSize = { "width": 6, "height": 40 };
        let titleBorder4Result = {
            x: topRectSize,
            y: setting.height / 2 +10,
            width: 20,
            height: resultRectSize.height * 4

        }
        let border4Result = {
            x: titleBorder4Result.x + titleBorder4Result.width - 1,
            y: titleBorder4Result.y + 1,
            width: middleLineLong,
            height: titleBorder4Result.height - 2
        }
        let outerBorderTitle4g = {
            x: 0,
            y: 0,
            width: 30,
            height: setting.height - 5
        }
        let outerBorder4g = {
            x: outerBorderTitle4g.width - 1,
            y: 0,
            width: 680,
            height: outerBorderTitle4g.height
        }

        let xy_deleteCircle = {
            x: outerBorder4g.x + outerBorder4g.width - deleteCircleR - 10,
            y: outerBorder4g.y + deleteCircleR + 10
        };
        let xy_middleLine = {
            x1: border4Result.x,
            y1: border4Result.y + border4Result.height / 2,
            x2: border4Result.x + middleLineLong,
            y2: border4Result.y + border4Result.height / 2
        }
        let xy_mainline = {
            x: border4Result.x + iconSize + 10,
            y4cons: border4Result.y + (border4Result.height / 2) / 2,
            y4goal: border4Result.y + border4Result.height / 2 + (border4Result.height / 2) / 2,
            mainline_length: middleLineLong - iconSize * 5.5
        }
        let xy_icon = {
            x: border4Result.x + 5,
            y4cons: xy_mainline.y4cons - iconSize / 2,
            y4goal: xy_mainline.y4goal - iconSize / 2
        }
        let circleIcon = {
            x: xy_icon.x + iconSize / 2,
            x4constraintValue: xy_mainline.x + xy_mainline.mainline_length,
            y4suggestedCons: xy_mainline.y4cons - iconSize * 1.5,
            y4suggestedGoal: xy_mainline.y4goal - iconSize * 1.5,
            y4UserCons: xy_mainline.y4cons + iconSize * 1.5,
            y4UserGoal: xy_mainline.y4goal + iconSize * 1.5
        }
        let resultRectY = {
            y4cons: xy_mainline.y4cons,
            y4goal: xy_mainline.y4goal
        }
        let constraintRangeH = 10;
        let fontsize_value = 10;

        let containter = d3.select("#screenshotsDiv").select("svg")
        containter.style("height", `${data.length * setting.height}px`)
            .style("min-height", "100%")
            .style("width", "100%")


        let allelement = containter.selectAll(".saveplan")
            .data(function () {
                for (let d of data) {
                    d.scale4pie = scale4pie
                    d.color4pie = color4pie
                    d.settingheight = setting.height
                }
                return data
            })
        let addelement = allelement.enter().append("g")
            .classed("saveplan", true)
            .style("transition-duration", "1s")
        allelement.exit().remove()
        let mergeelement = addelement.merge(allelement)
            .attr("transform", d => `translate(0 ${d.rank * setting.height})`)



        { ////write the outer border for each g
            //add border for the result part
            addelement.append("rect").attr("class", "border4outer")
            mergeelement.select(".border4outer")
                .attr("x", outerBorder4g.x)
                .attr("y", outerBorder4g.y)
                .attr("width", outerBorder4g.width)
                .attr("height", outerBorder4g.height)
                .attr("fill", "transparent")
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "2 2")

            let g4outerBorder = addelement.append("g").attr("class", "g4outerBorder")
                .attr("transform", "translate(" + (outerBorderTitle4g.x) + "," + (outerBorderTitle4g.y) + ")")

            g4outerBorder.append("rect").attr("class", "border4title")
                .attr("width", outerBorderTitle4g.width)
                .attr("height", outerBorderTitle4g.height)
                .attr("fill", "#a6a6a6")
                .attr("stroke", "#a6a6a6")
                .attr("stroke-width", 1)

            // // //add text lable for the view
            g4outerBorder.append("text")
                .attr("dy", "1.75em")
                .attr("dx", "-17.35em")
                .text(function (d, i) {
                    // console.log(d, i)
                    return "Plan";
                })
                .style("font-size", "12px")
                .style("font-weight", 700)
                .attr("fill", "white")
                .attr("transform", "rotate(-90)");

            ////add top button to top the row
            g4outerBorder.append("image").attr("class", "topRect")
                .attr("xlink:href", function (d, i) {
                    let iconUrl4cons = "./stylesheets/legend/toTop.png";
                    return iconUrl4cons;
                })
                .attr("width", iconSize)
                .attr("height", iconSize)
                .attr("transform", "translate(" + (outerBorderTitle4g.width / 2 - iconSize / 2) + "," + 10 + ")");
            mergeelement.selectAll(".topRect")
                .attr("id", (d, i) => i).on("click", function (d) {
                    if (d.rank != 0) {
                        for (let saveel of resultsArr) {
                            if (saveel.rank < d.rank) {
                                saveel.rank++
                            }
                        }
                        d.rank = 0
                        rerendering(resultsArr)
                    }
                })
        }
        {

            //// add delete button for the row
            addelement.append("circle")
                .attr("class", "deleteCircle")
                .attr("cx", xy_deleteCircle.x)
                .attr("cy", xy_deleteCircle.y)
                .attr("r", deleteCircleR)
                .style("fill", "#a6a6a6")
            mergeelement.selectAll(".deleteCircle")
                .on("click", function (d, i) {
                    // console.log(resultsArr[i].screenshotId , d.screenshotId)
                    for (let saveel of resultsArr) {
                        // console.log(saveel.rank, d.rank)
                        if (saveel.rank > d.rank) {
                            saveel.rank = saveel.rank - 1;
                        }
                        // console.log(saveel.rank, d.rank)
                    }
                    for (let i = 0; i < resultsArr.length; i++) {
                        if (resultsArr[i].screenshotId == d.screenshotId) {
                            resultsArr.splice(i, 1);
                            this.parentNode.remove()
                        }
                    }
                    // console.log(resultsArr)
                    rerendering(resultsArr);
                })
            addelement.append("line")
                .attr("class", "line4DeleteCircle")
                .attr("x1", xy_deleteCircle.x - (deleteCircleR / 2 - 2))
                .attr("y1", xy_deleteCircle.y + (deleteCircleR / 2 - 2))
                .attr("x2", xy_deleteCircle.x + (deleteCircleR / 2 - 2))
                .attr("y2", xy_deleteCircle.y - (deleteCircleR / 2 - 2))
                .style("stroke", "white")
                .style("stroke-width", 2);
            addelement.append("line")
                .attr("class", "line4DeleteCircle")
                .attr("x1", xy_deleteCircle.x - (deleteCircleR / 2 - 2))
                .attr("y1", xy_deleteCircle.y - (deleteCircleR / 2 - 2))
                .attr("x2", xy_deleteCircle.x + (deleteCircleR / 2 - 2))
                .attr("y2", xy_deleteCircle.y + (deleteCircleR / 2 - 2))
                .style("stroke", "white")
                .style("stroke-width", 2);

        }
        ///add pie
        addelement.append('g').attr("class", "pie4original")
        addelement.append('g').attr("class", "pie4suggested")
        addelement.append('g').attr("class", "pie4users")

        mergeelement.each(function (d, i) {
            // console.log("each mergeElement",d)
            updatepie(d3.select(this).select(".pie4original"))
            updatepie(d3.select(this).select(".pie4suggested"))
            updatepie(d3.select(this).select(".pie4users"))
        })

        ///////opti Result
        {
            //add border for the result part
            addelement.append("rect").attr("class", "borderRect")
            mergeelement.select(".borderRect")
                .attr("x", border4Result.x)
                .attr("y", border4Result.y)
                .attr("width", border4Result.width)
                .attr("height", border4Result.height)
                .attr("fill", "transparent")
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "2 2")
            //add icon for constraints
            addelement.append("image").attr("class", "consIcon")
            addelement.append("image").attr("class", "goalIcon")
            mergeelement.select(".consIcon")
                .attr("xlink:href", function (d, i) {
                    let iconUrl4cons = "./stylesheets/legend/" + d.optiInput.constraints.id + ".png";
                    return iconUrl4cons;
                })
                .attr("height", iconSize)
                .attr("width", iconSize)
                .attr("x", xy_icon.x)
                .attr("y", xy_icon.y4cons)
            //add icon for goal
            mergeelement.select(".goalIcon")
                .attr("xlink:href", function (d, i) {
                    let iconUrl4cons = "./stylesheets/legend/" + d.optiInput.objFun.goal + ".png";
                    return iconUrl4cons;
                })
                .attr("height", iconSize)
                .attr("width", iconSize)
                .attr("x", xy_icon.x)
                .attr("y", xy_icon.y4goal)
            //add middle line for the result view
            addelement.append("line").attr("class", "middleLine4result")
            mergeelement.select(".middleLine4result")
                .attr("x1", xy_middleLine.x1)
                .attr("y1", xy_middleLine.y1)
                .attr("x2", xy_middleLine.x2)
                .attr("y2", xy_middleLine.y2)
                .style("stroke", "black")
                .style("stroke-width", 1)
                .attr("stroke-dasharray", "2 2")
            ////add constraint line and goal line
            let totalCostArr = data.map(d => {
                return d.optiInput.costArea.totalCost;
            });
            let totalAreaArr = data.map(d => {
                return d.optiInput.costArea.totalArea;
            })

            let x_cost = d3.scaleLinear()
                .domain([0, d3.max(totalCostArr)])
                .range([xy_mainline.x, xy_mainline.x + xy_mainline.mainline_length])
                .clamp(true);
            let x_area = d3.scaleLinear()
                .domain([0, d3.max(totalAreaArr)])
                .range([xy_mainline.x, xy_mainline.x + xy_mainline.mainline_length])
                .clamp(true);
            let xMap = { "area": x_area, "cost": x_cost };

            function getConsX(d, index) {
                let consId = d.optiInput.constraints.id;
                let value;
                if (consId == "cost") {
                    if (index == 0) {
                        value = 0;
                    } else {
                        value = d.optiInput.costArea.totalCost;
                    }
                    return x_cost(value);
                } else {
                    if (index == 0) {
                        value = 0;
                    } else {
                        value = d.optiInput.costArea.totalArea;
                    }
                    return x_area(value);
                }
            }
            function getGoalX(d, index) {
                let goalId = d.optiInput.objFun.goal;
                let value;
                if (goalId == "area") {
                    if (index == 0) {
                        value = 0;
                    } else {
                        value = d.optiInput.costArea.totalArea;
                    }
                    return x_area(value);
                } else {
                    if (index == 0) {
                        value = 0;
                    } else {
                        value = d.optiInput.costArea.totalCost;
                    }
                    return x_cost(value);
                }
            }
            function maxOfGoalandCons(d, type) {
                let id;
                if (type == "goal") {
                    id = d.optiInput.objFun.goal;
                } else {
                    id = d.optiInput.constraints.id;
                }
                let xScale;
                let num2show;
                let unit;
                if (id == "area") {
                    num2show = d.optiInput.costArea.totalArea;
                    xScale = x_area;
                    unit = "(m2)";
                } else {
                    num2show = d.optiInput.costArea.totalCost;
                    xScale = x_cost;
                    unit = "($)";
                }
                let string2show = d3.format(".4s")(num2show);
                return { "string2show": string2show, "num2show": num2show, "xScale": xScale, "unit": unit };
            }

            /************************constraints part*********************************** */
            let constraint_mainline = addelement.append("line").attr("class", "constraint_mainline");
            mergeelement.select(".constraint_mainline")
                .attr("x1", function (d) {
                    return getConsX(d, 0);
                })
                .attr("x2", function (d) {
                    return getConsX(d, 1)
                })
                .attr("y1", xy_mainline.y4cons)
                .attr("y2", xy_mainline.y4cons)
                .attr("stroke", "#5B9BD5")
                .attr("stroke-width", 2)
                .attr("fill", "none");
            let consStartTick = addelement.append("line").attr("class", "consStartTick")
            mergeelement.select(".consStartTick")
                .attr("x1", function (d) {
                    return getConsX(d, 0);
                })
                .attr("x2", function (d) {
                    return getConsX(d, 0);
                })
                .attr("y1", xy_mainline.y4cons - 5)
                .attr("y2", xy_mainline.y4cons)
                .attr("stroke", "#5B9BD5")
                .attr("stroke-width", 2)
                .attr("fill", "none");

            let consEndTick = addelement.append("line").attr("class", "consEndTick")
            mergeelement.select(".consEndTick")
                .attr("x1", function (d) {
                    return getConsX(d, 1)
                })
                .attr("x2", function (d) {
                    return getConsX(d, 1)
                })
                .attr("y1", xy_mainline.y4cons - 5)
                .attr("y2", xy_mainline.y4cons)
                .attr("stroke", "#5B9BD5")
                .attr("stroke-width", 2)
                .attr("fill", "none");

            let test4Max_cons = addelement.append("text").attr("class", "maxConsText")
            mergeelement.select(".maxConsText")
                .attr("x", function (d) {
                    let num2show = maxOfGoalandCons(d, "constraint").num2show
                    return maxOfGoalandCons(d, "constraint").xScale(num2show) + 5;
                })
                .attr("y", xy_mainline.y4cons)
                .text(function (d) {
                    let string2show = maxOfGoalandCons(d, "constraint").string2show + maxOfGoalandCons(d, "constraint").unit;
                    return string2show;
                })
                .style("font-size", "12px");
            //add constraint value in constraint line
            let constraintValueLine = addelement.append("rect").attr("class", "constraintValueLine")
            mergeelement.select(".constraintValueLine")
                .attr("height", constraintRangeH)
                .attr("width", function (d, i) {
                    let startValue = d.optiInput.constraints.range[0];
                    let endValue = d.optiInput.constraints.range[1];
                    let id = d.optiInput.constraints.id;
                    if (id == "area") {
                        return x_area(endValue) - x_area(startValue);
                    } else {
                        return x_cost(endValue) - x_cost(startValue);
                    }
                })
                .attr("x", function (d) {
                    let startValue = d.optiInput.constraints.range[0];
                    let id = d.optiInput.constraints.id;
                    if (id == "area") {
                        return x_area(startValue);
                    } else {
                        return x_cost(startValue);
                    }
                })
                .attr("y", resultRectY.y4cons - constraintRangeH / 2)
                .style("fill", "#e9e9e9")
                .style("opacity", 0.7)

            {//add constraint for each plan
                ////add exact value of suggested patches for constraints
                addelement.append("circle").attr("class", "constrainInfo4plan")
                mergeelement.select(".constrainInfo4plan")
                    .attr("cx", circleIcon.x4constraintValue)
                    .attr("cy", circleIcon.y4suggestedCons)
                    .attr("r", circleIcon4value)
                    .attr("fill", "#efefef")
                    .attr('stroke', "#efefef")
                    .attr('stroke-width', 1)
                //////add text for the circle
                addelement.append("text").attr("class", "consV")
                mergeelement.select(".consV")
                    .attr("x", circleIcon.x4constraintValue + 3 * circleIcon4value)
                    .attr("y", circleIcon.y4suggestedCons + circleIcon4value * 1.5)
                    .text(function (d) {
                        let endValue = d.optiInput.constraints.range[1];
                        return endValue.toLocaleString();
                    })
                    .style("font-size", fontsize_value);
            }
            {
                /************suggested rect ,circle ,text for constraints************/
                //add rect for suggested patches for constraints
                let suggestedCons = addelement.append("rect").attr("class", "suggestedCons")
                mergeelement.select(".suggestedCons")
                    .attr("x", function (d) {
                        let consId = d.optiInput.constraints.id;
                        value = d.suggestedPatches[consId];
                        return xMap[consId](value) - resultRectSize.width / 2;
                    })
                    .attr("y", resultRectY.y4cons - resultRectSize.height / 2)
                    .attr("width", resultRectSize.width)
                    .attr("height", resultRectSize.height)
                    .attr("fill", "rgb(252, 130, 113)")
                    .attr('stroke', "rgb(252, 130, 113)")
                    .attr('stroke-width', 1)
                    .on('mouseover', function (d) {
                        // console.log(d)
                        let id = d.optiInput.constraints.id;
                        let value = d.suggestedPatches[id];
                        let xLocation = xMap[id](value);
                        containter.append("line").attr("class", "compareLine")
                            .attr("x1", xLocation)
                            .attr("x2", xLocation)
                            .attr("y1", 0)
                            .attr("y2", data.length * setting.height)
                            .attr("stroke", "#000000c7")
                            .attr("stroke-width", 1)
                            .attr("fill", "none")
                            .attr("pointer-events", "none")

                    })
                    .on("mouseout", function (d) {
                        d3.select(".compareLine").remove()
                    });
                ////add exact value of suggested patches for constraints
                addelement.append("circle").attr("class", "suggestedCircle4cons")
                mergeelement.select(".suggestedCircle4cons")
                    .attr("cx", circleIcon.x)
                    .attr("cy", circleIcon.y4suggestedCons)
                    .attr("r", circleIcon4value)
                    .attr("fill", "rgb(252, 130, 113)")
                    .attr('stroke', "rgb(252, 130, 113)")
                    .attr('stroke-width', 1)
                //////add text for the circle
                addelement.append("text").attr("class", "suggestedVCons")
                mergeelement.select(".suggestedVCons")
                    .attr("x", circleIcon.x + 3 * circleIcon4value)
                    .attr("y", circleIcon.y4suggestedCons + circleIcon4value * 1.5)
                    .text(function (d) {
                        let consId = d.optiInput.constraints.id;
                        value = d.suggestedPatches[consId];
                        let startValue = d.optiInput.constraints.range[0];
                        let endValue = d.optiInput.constraints.range[1];
                        let diff = endValue - value;
                        let sign = (diff > 0) ? "-" : "+";
                        return value.toLocaleString() + " (" + sign + Math.abs(diff).toLocaleString() + ")";
                    })
                    .style("font-size", fontsize_value);
            }
            {
                /*******user circle, text, rect for constraints */
                //add rect for users patches for constraints
                let usersCons = addelement.append("rect").attr("class", "usersCons")
                mergeelement.select(".usersCons")
                    .attr("x", function (d) {
                        let consId = d.optiInput.constraints.id;
                        value = d.usersPatches[consId];
                        return xMap[consId](value) - resultRectSize.width / 2;
                    })
                    .attr("y", resultRectY.y4cons - resultRectSize.height / 2)
                    .attr("width", resultRectSize.width)
                    .attr("height", resultRectSize.height)
                    .attr("fill", "transparent")
                    .attr("stroke", "rgb(192, 0, 0)")
                    .attr("stroke-width", 1)
                    .on('mouseover', function (d) {
                        let id = d.optiInput.constraints.id;
                        let value = d.usersPatches[id];
                        let xLocation = xMap[id](value);
                        containter.append("line").attr("class", "compareLine")
                            .attr("x1", xLocation)
                            .attr("x2", xLocation)
                            .attr("y1", 0)
                            .attr("y2", data.length * setting.height)
                            .attr("stroke", "#000000c7")
                            .attr("stroke-width", 1)
                            .attr("fill", "none")
                            .attr("pointer-events", "none")
                    })
                    .on("mouseout", function (d) {
                        d3.select(".compareLine").remove()
                    });
                ////add exact value of user patches for constraints
                addelement.append("circle").attr("class", "userCircle4cons")
                mergeelement.select(".userCircle4cons")
                    .attr("cx", circleIcon.x)
                    .attr("cy", circleIcon.y4UserCons)
                    .attr("r", circleIcon4value)
                    .attr("fill", "transparent")
                    .attr("stroke", "rgb(192, 0, 0)")
                    .attr("stroke-width", 1)
                //////add text for the circle
                addelement.append("text").attr("class", "userVCons")
                mergeelement.select(".userVCons")
                    .attr("x", circleIcon.x + 3 * circleIcon4value)
                    .attr("y", circleIcon.y4UserCons + circleIcon4value * 1.5)
                    .text(function (d) {
                        let consId = d.optiInput.constraints.id;
                        value = d.usersPatches[consId];
                        let startValue = d.optiInput.constraints.range[0];
                        let endValue = d.optiInput.constraints.range[1];
                        let diff = endValue - value;
                        let sign = (diff > 0) ? "-" : "+";
                        return value.toLocaleString() + " (" + sign + Math.abs(diff).toLocaleString() + ")";
                    })
                    .style("font-size", fontsize_value);
            }

            /********************************goal part************************************************ */
            let goal_mainline = addelement.append("line").attr("class", "goal_mainline");
            mergeelement.select(".goal_mainline")
                .attr("x1", function (d) {
                    return getGoalX(d, 0);
                })
                .attr("x2", function (d) {
                    return getGoalX(d, 1)
                })
                .attr("y1", xy_mainline.y4goal)
                .attr("y2", xy_mainline.y4goal)
                .attr("stroke", "#5B9BD5")
                .attr("stroke-width", 2)
                .attr("fill", "none");

            let goal_startTick = addelement.append("line").attr("class", "goalStartTick")
            mergeelement.select(".goalStartTick")
                .attr("x1", function (d) {
                    return getGoalX(d, 0);
                })
                .attr("x2", function (d) {
                    return getGoalX(d, 0);
                })
                .attr("y1", xy_mainline.y4goal - 5)
                .attr("y2", xy_mainline.y4goal)
                .attr("stroke", "#5B9BD5")
                .attr("stroke-width", 2)
                .attr("fill", "none");

            let goal_endTick = addelement.append("line").attr("class", "goalEndTick")
            mergeelement.select(".goalEndTick")
                .attr("x1", function (d) {
                    return getGoalX(d, 1)
                })
                .attr("x2", function (d) {
                    return getGoalX(d, 1)
                })
                .attr("y1", xy_mainline.y4goal - 5)
                .attr("y2", xy_mainline.y4goal)
                .attr("stroke", "#5B9BD5")
                .attr("stroke-width", 2)
                .attr("fill", "none");

            let test4Max_goal = addelement.append("text").attr("class", "maxGoalText")
            mergeelement.select(".maxGoalText")
                .attr("x", function (d) {
                    let num2show = maxOfGoalandCons(d, "goal").num2show
                    return maxOfGoalandCons(d, "goal").xScale(num2show) + 5;
                })
                .attr("y", xy_mainline.y4goal)
                .text(function (d) {
                    let string2show = maxOfGoalandCons(d, "goal").string2show + maxOfGoalandCons(d, "goal").unit;
                    return string2show;
                })
                .style("font-size", "12px");
            {
                /**********suggested rect, circle, text for goal */
                //add rect for suggested patches for goal
                let suggestedGoal = addelement.append("rect").attr("class", "suggestedGoal")
                mergeelement.select(".suggestedGoal")
                    .attr("x", function (d) {
                        let id = d.optiInput.objFun.goal;
                        value = d.suggestedPatches[id];
                        return xMap[id](value) - resultRectSize.width / 2;
                    })
                    .attr("y", xy_mainline.y4goal - resultRectSize.height / 2)
                    .attr("width", resultRectSize.width)
                    .attr("height", resultRectSize.height)
                    .attr("fill", "rgb(252, 130, 113)")
                    .attr('stroke', "rgb(252, 130, 113)")
                    .attr('stroke-width', 1)
                    .on('mouseover', function (d) {
                        let id = d.optiInput.objFun.goal;
                        let value = d.suggestedPatches[id];
                        let xLocation = xMap[id](value);
                        containter.append("line").attr("class", "compareLine")
                            .attr("x1", xLocation)
                            .attr("x2", xLocation)
                            .attr("y1", 0)
                            .attr("y2", data.length * setting.height)
                            .attr("stroke", "#000000c7")
                            .attr("stroke-width", 1)
                            .attr("fill", "none")
                            .attr("pointer-events", "none")
                    })
                    .on("mouseout", function (d) {
                        d3.select(".compareLine").remove()
                    });
                ////add exact value of user patches for goal
                addelement.append("circle").attr("class", "suggestedCircle4goal")
                mergeelement.select(".suggestedCircle4goal")
                    .attr("cx", circleIcon.x)
                    .attr("cy", circleIcon.y4suggestedGoal)
                    .attr("r", circleIcon4value)
                    .attr("fill", "rgb(252, 130, 113)")
                    .attr('stroke', "rgb(252, 130, 113)")
                    .attr('stroke-width', 1)
                //////add text for the circle
                addelement.append("text").attr("class", "suggestedVgoal")
                mergeelement.select(".suggestedVgoal")
                    .attr("x", circleIcon.x + 3 * circleIcon4value)
                    .attr("y", circleIcon.y4suggestedGoal + circleIcon4value * 1.5)
                    .text(function (d) {
                        let id = d.optiInput.objFun.goal;
                        value = d.suggestedPatches[id];
                        return value.toLocaleString();
                    })
                    .style("font-size", fontsize_value);
            }

            {
                /**********user rect, circle, text for goal */
                //add rect for users patches for goal
                let usersGoal = addelement.append("rect").attr("class", "usersGoal")
                mergeelement.select(".usersGoal")
                    .attr("x", function (d) {
                        let id = d.optiInput.objFun.goal;
                        value = d.usersPatches[id];
                        return xMap[id](value) - resultRectSize.width / 2;
                    })
                    .attr("y", xy_mainline.y4goal - resultRectSize.height / 2)
                    .attr("width", resultRectSize.width)
                    .attr("height", resultRectSize.height)
                    .attr("fill", "transparent")
                    .attr("stroke", "rgb(192, 0, 0)")
                    .attr("stroke-width", 1)
                    .on('mouseover', function (d) {
                        let id = d.optiInput.objFun.goal;
                        let value = d.usersPatches[id];
                        let xLocation = xMap[id](value);
                        containter.append("line").attr("class", "compareLine")
                            .attr("x1", xLocation)
                            .attr("x2", xLocation)
                            .attr("y1", 0)
                            .attr("y2", data.length * setting.height)
                            .attr("stroke", "#000000c7")
                            .attr("stroke-width", 1)
                            .attr("fill", "none")
                            .attr("pointer-events", "none")
                    })
                    .on("mouseout", function (d) {
                        d3.select(".compareLine").remove()
                    });
                ////add exact value of user patches for goal
                addelement.append("circle").attr("class", "userCircle4goal")
                mergeelement.select(".userCircle4goal")
                    .attr("cx", circleIcon.x)
                    .attr("cy", circleIcon.y4UserGoal)
                    .attr("r", circleIcon4value)
                    .attr("fill", "transparent")
                    .attr("stroke", "rgb(192, 0, 0)")
                    .attr("stroke-width", 1)
                //////add text for the circle
                addelement.append("text").attr("class", "userVgoal")
                mergeelement.select(".userVgoal")
                    .attr("x", circleIcon.x + 3 * circleIcon4value)
                    .attr("y", circleIcon.y4UserGoal + circleIcon4value * 1.5)
                    .text(function (d) {
                        let id = d.optiInput.objFun.goal;
                        let value4users = d.usersPatches[id];
                        let value4suggested = d.suggestedPatches[id];
                        let diff = value4suggested - value4users;
                        let sign = (diff > 0) ? "-" : "+";
                        return value4users.toLocaleString() + " (" + sign + Math.abs(diff).toLocaleString() + ")";
                    })
                    .style("font-size", fontsize_value);
            }

            //add title border for result part 
            let g4title = addelement.append("g").attr("class", "g4title")
                .attr("transform", "translate(" + (titleBorder4Result.x) + "," + (titleBorder4Result.y) + ")")

            g4title.append("rect").attr("class", "border4title")
                .attr("width", titleBorder4Result.width)
                .attr("height", titleBorder4Result.height)
                .attr("fill", "#a6a6a6")
                .attr("stroke", "#a6a6a6")
                .attr("stroke-width", 1)

            // // //add text lable for the view
            g4title.append("text")
                .attr("dy", "1.25em")
                .attr("dx", "-5.35em")
                .text("Constraint")
                .style("font-size", "12px")
                .style("font-weight", 700)
                .attr("transform", "rotate(-90)");
            g4title.append("text")
                .attr("dy", "1.25em")
                .attr("dx", "-10.35em")
                .text("Goal")
                .style("font-size", "12px")
                .style("font-weight", 700)
                .attr("transform", "rotate(-90)");

        }
        {
            //add editable box for svg
            let frm = addelement.append("foreignObject");
            let inp = frm
                .attr("x", titleBorder4Result.x)
                .attr("y", 20)
                .attr("width", 266)
                .attr("height", 22)
                .append("xhtml:form")
                .append("input")
                .attr("placeholder", function () {
                    return "name your plan";
                })
                .attr("style", "width: 266px;border-color:#e9e9e9;")
        }



        return { addelement: addelement, mergeelement: mergeelement }
    }

    function attrRange(data) {
        let attrs = {};
        Object.keys(abbre2ids).forEach(attr => {
            let searchKey = abbre2ids[attr].sortIcon.slice(9);
            let attrArr = data.map(a => a.properties[searchKey]);
            attrs[attr] = attrArr;
        })

        let attrRange = {};
        let attrKeys = Object.keys(attrs);
        attrKeys.forEach(d => {
            attrRange[d] = [Math.min(...attrs[d]), Math.max(...attrs[d])];
        })
        return attrRange;
    }
    function boxloptData4origin(data, filterPool4grid) {
        let filteredData = filterData(data, filterPool4grid);
        let boxplotObj = {};
        boxplotData(boxplotObj, filteredData)
        return boxplotObj;
    }
    function boxplotData(boxplotObj, data) {
        Object.keys(abbre2ids).forEach(attr => {
            let searchKey = abbre2ids[attr].sortIcon.slice(9);
            let attrArr = data.map(d => {
                return d.properties[searchKey];
            })
            getboxplot(boxplotObj, attr, attrArr);
        })
    }
    function getboxplot(boxplotObj, attr, attrArr) {
        attrArr.sort((a, b) => a - b);
        boxplotObj[attr] = {
            min: d3.min(attrArr),
            max: d3.max(attrArr),
            median: d3.quantile(attrArr, .5),
            quarter: d3.quantile(attrArr, .25),
            threeQuarters: d3.quantile(attrArr, .75),
            average: d3.mean(attrArr)
        }
    }
    function area2scaledR(are, scale) {
        return Math.pow(are / Math.PI, 0.5) * scale;
    }
    function attrStatus(data) {
        let attrs = {};
        Object.keys(abbre2ids).forEach(attr => {
            let searchKey = abbre2ids[attr].sortIcon.slice(9);
            let attrArr = data.map(a => a.properties[searchKey]);
            attrs[attr] = [d3.min(attrArr), d3.max(attrArr)];
        })
        return attrs;
    }
    function suggestedAndusersInfo(data) {
        let boxplotObj = {};
        let locations = data.map(d => {
            return d.properties.center;
        });
        let Area = 0;
        let cost = 0;
        data.map(d => {
            Area += d.properties.area;
            cost += d.properties.cost;
        })
        let attrs = attrStatus(data);
        boxplotData(boxplotObj, data);
        return { "location": locations, "area": Area, "attrStatus": attrs, "cost": cost, "boxplotInfo": boxplotObj };
    }
    function num2text(text) {
        let text2show;
        if (text.toString().length > 3) {
            if (text.toString().length > 6) {
                text2show = (text / 1000000).toFixed(2) + "M";
            } else {
                text2show = (text / 1000).toFixed(2) + "k";
            }
        } else {
            text2show = text.toString();
        }
        return text2show;
    }


})




