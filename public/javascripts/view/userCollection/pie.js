function updatepie(container) {
    let thiscontainerg = container
    let className = thiscontainerg.attr("class")
    let data4pie, radius
    let data = thiscontainerg.data()[0];
    // console.log("data ", className, data);
    let height = data.settingheight
    // console.log(thiscontainerg, thiscontainerg.data())

    function area2scaledR(are, scale) {
        return Math.pow(are / Math.PI, 0.5) * scale;
    }
    switch (className) {
        case "pie4original":
            // radius = area2scaledR(data.optiInput.userDefinedGridInfo.searchArea, data.scale4pie);
            radius = 160;
            data4pie = []
            Object.keys(data.optiInput.originalData).forEach(attr => {
                data4pie.push({
                    color: data.color4pie[attr],
                    percent: 1,
                    sliceInfo: {
                        name: attr,
                        range: data.optiInput.originalData[attr],
                        filtered: data.optiInput.filterInfo[id2filtername(attr)] ?
                            data.optiInput.filterInfo[id2filtername(attr)].filterRange.range : null,
                        boxplotInfo: data.optiInput.boxplotInfo[attr]
                    }
                });
            })
            break;
        case "pie4suggested":
            // radius = area2scaledR(data.suggestedPatches.area, data.scale4pie);
            radius = 160 * 0.8;
            data4pie = []
            Object.keys(data.optiInput.originalData).forEach(attr => {
                data4pie.push({
                    color: data.color4pie[attr],
                    percent: 1,
                    sliceInfo: {
                        name: attr,
                        range: data.optiInput.originalData[attr],
                        filtered: data.suggestedPatches.attrStatus[attr],
                        boxplotInfo: data.suggestedPatches.boxplotInfo[attr]
                    }
                });
            })
            break;
        default:
            // radius = area2scaledR(data.usersPatches.area, data.scale4pie);
            radius = 160 * 0.6;
            data4pie = []
            Object.keys(data.optiInput.originalData).forEach(attr => {
                data4pie.push({
                    color: data.color4pie[attr],
                    percent: 1,
                    sliceInfo: {
                        name: attr,
                        range: data.optiInput.originalData[attr],
                        filtered: data.usersPatches.attrStatus[attr],
                        boxplotInfo: data.usersPatches.boxplotInfo[attr]
                    }
                });
            })
    }

    //to change the data for update the radius of the pie, add the radius to data4pie
    let newData4pie = data4pie.map(d => {
        d.radius = radius;
        return d;
    })
    let translateX = 515;
    let translateY = height / 2;
    let font4comparison = 20;
    let rangeTextSize = 0.08 * radius;
    let attrTextSize = 0.1 * radius;
    let pie = d3.pie()
        .startAngle(-90 * Math.PI / 180)
        .endAngle(-90 * Math.PI / 180 + 2 * Math.PI)
        .value(function (d) { return d.percent; })
        .padAngle(.01)
        .sort(null);
    let arc = d3.arc()
        .outerRadius(radius - 0.05 * radius)
        .innerRadius(0);

    thiscontainerg.attr("transform", `translate(${translateX},${translateY})`);

    // console.log(data4pie)
    let allattrarcslice = thiscontainerg.selectAll(".attrArcSlices")
        .data(pie(newData4pie))
    allattrarcslice.exit().remove()
    let addattrarcslice = allattrarcslice.enter().append("path")
        .attr("class", "attrArcSlices")
    addattrarcslice.merge(allattrarcslice)
        .attr("id", (d, i) => {
            return "perAttr" + data.rank + "_" + i;
        }) //Unique id for each slice
        .attr("d", arc)
        .attr("fill", "transparent")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", function () {
            let dashed;
            switch (className) {
                case "pie4original":
                    dashed = "none";
                    break;
                case "pie4suggested":
                    dashed = "2 2";
                    break;
                case "pie4users":
                    dashed = "3 1 1";
                    break;
                default:
                    break;
            }
            return dashed;
        })
        .each(function (d, i) {
            // console.log(d)
            //draw the filtered ared for the slice
            if (d.data.sliceInfo.filtered != null) {
                // if (d.data.sliceInfo.name == "Cost") {
                //     console.log(d);
                // }
                ////get the angle of the filtered arc
                let color4usersPie = d.data.color;
                let filteredStart = d.data.sliceInfo.filtered[0];
                let filteredEnd = d.data.sliceInfo.filtered[1];
                let rangeStart = d.data.sliceInfo.range[0];
                let rangeEnd = d.data.sliceInfo.range[1];
                let arcStartAngle = d.startAngle;
                let arcEndAngle = d.endAngle;
                if ((rangeEnd - rangeStart != 0) && (d.endAngle - d.startAngle != 0)) {
                    arcStartAngle = (filteredStart - rangeStart) / (rangeEnd - rangeStart) * (d.endAngle - d.startAngle) + d.startAngle;
                    arcEndAngle = (filteredEnd - rangeStart) / (rangeEnd - rangeStart) * (d.endAngle - d.startAngle) + d.startAngle;
                }

                let color4slice = d.data.color;

                let pieGenerator = d3.pie()
                    .startAngle(arcStartAngle)
                    .endAngle(arcEndAngle);
                let data2drawfilteredArc = [1];
                // Create an arc generator with configuration
                let filteredArc = d3.arc()
                    .outerRadius(radius + 0.02 * radius)
                    .innerRadius(radius - 0.12 * radius)

                let filteredPie = d3.arc()
                    .outerRadius(radius - 0.05 * radius)
                    .innerRadius(0)

                let arcData = pieGenerator(data2drawfilteredArc);

                // Create a path element and set its d attribute
                let allfilteredarc = thiscontainerg.selectAll('.filteredArc_' + i)
                    .data(arcData)
                allfilteredarc.exit().remove()
                let addfilteredarc = allfilteredarc.enter()
                    .append('path')
                    .attr("class", "filteredArc_" + i)
                addfilteredarc.merge(allfilteredarc)
                    .attr('d', filteredArc)
                    .attr("fill", function () {
                        let color = color4slice;
                        // if (className == "pie4users") {
                        //     color = "transparent"
                        // }
                        return color;
                    })
                    .attr("opacity", 0.2)
                    .attr("stroke", color4slice)
                    .style("stroke-width", 1)

                thiscontainerg.selectAll('.filteredPie' + "_" + i).remove()
                thiscontainerg.selectAll('.filteredPie' + "_" + i)
                    .data(arcData)
                    .enter()
                    .append('path')
                    .attr('d', filteredPie)
                    .attr("class", "filteredPie" + "_" + i)
                    .attr("fill", "transparent")
                    .attr("opacity", 0.5)
                    .attr("stroke", color4slice)
                    .style("stroke-width", 2)
                    .style("stroke-dasharray", ("1, 1"))
            }
            if (d.data.sliceInfo.boxplotInfo != null) {
                let color4slice = d.data.color;
                let median = d.data.sliceInfo.boxplotInfo.median;
                let min = d.data.sliceInfo.boxplotInfo.min;
                let max = d.data.sliceInfo.boxplotInfo.max;
                let quarterPoint = d.data.sliceInfo.boxplotInfo.quarter;
                let threeQuartersPoint = d.data.sliceInfo.boxplotInfo.threeQuarters;
                // console.log("min,max,median,1/4,3/4", min, max, median, quarterPoint, threeQuartersPoint);
                let rangeStart = d.data.sliceInfo.range[0];
                let rangeEnd = d.data.sliceInfo.range[1];
                let data2drawfilteredArc = [1];
                function angleRange(d, rangeStart, rangeEnd, quarterPoint, threeQuartersPoint) {
                    let arcStart = d.startAngle;
                    let arcEnd = d.endAngle;
                    if ((rangeEnd - rangeStart != 0) && (d.endAngle - d.startAngle != 0)) {
                        arcStart = (quarterPoint - rangeStart) / (rangeEnd - rangeStart) * (d.endAngle - d.startAngle) + d.startAngle;
                        arcEnd = (threeQuartersPoint - rangeStart) / (rangeEnd - rangeStart) * (d.endAngle - d.startAngle) + d.startAngle;
                    }
                    return { start: arcStart, end: arcEnd };
                }
                function drawArc4range(d, rangeStart, rangeEnd, arcStart, arcEnd, arcName) {
                    ///////draw box from 1/4 to 3/4
                    let angleRange4box = angleRange(d, rangeStart, rangeEnd, arcStart, arcEnd);
                    let boxStart = angleRange4box.start;
                    let boxEnd = angleRange4box.end;

                    let pieGenerator = d3.pie()
                        .startAngle(boxStart)
                        .endAngle(boxEnd);

                    // Create an arc generator with configuration
                    let outerradius, innerradius;
                    if (arcName == "min2quarter_" || arcName == "threeQuarters2max_") {
                        outerradius = radius - 0.05 * radius;
                        innerradius = radius - 0.05 * radius;
                    } else {
                        outerradius = radius - 0 * radius;
                        innerradius = radius - 0.1 * radius;
                    }
                    let filteredArc = d3.arc()
                        .outerRadius(outerradius)
                        .innerRadius(innerradius)

                    let arcData = pieGenerator(data2drawfilteredArc);

                    // Create a path element and set its d attribute
                    let allfilteredarc = thiscontainerg.selectAll('.' + arcName + i)
                        .data(arcData)
                    allfilteredarc.exit().remove()
                    let addfilteredarc = allfilteredarc.enter()
                        .append('path')
                        .attr("class", arcName + i)
                    addfilteredarc.merge(allfilteredarc)
                        .attr('d', filteredArc)
                        .attr("fill", "transparent")
                        .attr("opacity", 1)
                        .attr("stroke", color4slice)
                        .style("stroke-width", 1)
                }
                drawArc4range(d, rangeStart, rangeEnd, quarterPoint, threeQuartersPoint, "quarter2threeQuarters_");
                drawArc4range(d, rangeStart, rangeEnd, median, median, "median_");
                drawArc4range(d, rangeStart, rangeEnd, min, min, "min_");
                drawArc4range(d, rangeStart, rangeEnd, max, max, "max_");
                drawArc4range(d, rangeStart, rangeEnd, min, quarterPoint, "min2quarter_");
                drawArc4range(d, rangeStart, rangeEnd, threeQuartersPoint, max, "threeQuarters2max_");
            }
            function addTransparentRect4arc(arcStartAngle, arcEndAngle) {
                let pieGenerator = d3.pie()
                    .startAngle(arcStartAngle)
                    .endAngle(arcEndAngle);
                let data2drawtransparantArc = [1];
                // Create an arc generator with configuration
                let transparantArc = d3.arc()
                    .outerRadius(radius + 0.02 * radius)
                    .innerRadius(radius - 0.12 * radius)

                let arcData = pieGenerator(data2drawtransparantArc);

                // Create a path element and set its d attribute
                let allfilteredarc = thiscontainerg.selectAll('.transparantArc_' + i)
                    .data(arcData)
                allfilteredarc.exit().remove()
                let addfilteredarc = allfilteredarc.enter()
                    .append('path')
                    .attr("class", "transparantArc_" + i)
                addfilteredarc.merge(allfilteredarc)
                    .attr('d', transparantArc)
                    .attr("fill", "transparent")
                    .on("mouseover", function (transprentArcData) {
                        d3.select(this)
                            .attr("fill", "gray")
                            .attr("opacity", 0.2)
                        let classname = d3.select(this).attr("class");
                        let index = Number(classname.slice(15));
                        let baseAverage = newData4pie[index].sliceInfo.boxplotInfo.average;
                        let compareName = newData4pie[index].sliceInfo.name;
                        // console.log("compareName:", compareName, "baseAverage:", baseAverage)
                        let allpaths4mouse = d3.selectAll("." + classname);
                        allpaths4mouse.each(function (pathdata, i) {
                            d3.select(this).attr("id", "pathId" + i);
                            let parentNode4transprentArc = d3.select(this).node().parentNode;
                            let portfolioType = d3.select(parentNode4transprentArc).attr("class");
                            let typeMap = { "pie4original": "optiInput", "pie4suggested": "suggestedPatches", "pie4users": "usersPatches" };
                            let type4average = typeMap[portfolioType];
                            // console.log(portfolioType)
                            d3.select(parentNode4transprentArc).append("text")
                                .attr("class", "comparisonText")
                                .attr("dy", 0)
                                .attr("dx", function () {
                                    if (portfolioType == "pie4original") {
                                        return -65;
                                    } else if (portfolioType == "pie4suggested") {
                                        return -50;
                                    } else {
                                        return -35;
                                    }
                                })
                                .append("textPath")
                                .attr("class", "textpath comparison")
                                .attr('fill', 'gray')
                                .attr("startOffset", "55.76%")
                                .style("text-anchor", "end")
                                .attr("xlink:href", "#pathId" + i)
                                .text(function (data, index) {
                                    // console.log(data);
                                    let average = data[type4average].boxplotInfo[compareName].average;
                                    // console.log("average:", average, "baseAverage:", baseAverage);
                                    if (average > baseAverage) {
                                        return "+";
                                    } else if (average < baseAverage) {
                                        return "-";
                                    } else {
                                        return "=";
                                    }
                                })
                                .attr("font-size", font4comparison)
                        })

                    })
                    .on("mouseout", function (transprentArcData) {
                        d3.select(this).attr("fill", "transparent");
                        let classname = d3.select(this).attr("class");
                        d3.selectAll(".comparisonText").remove();
                        let allpaths4mose = d3.selectAll("." + classname);
                        allpaths4mose.each(function (pathdata, i) {
                            d3.select(this).attr("id", "none" + i);
                        })

                    })
            }
            let arcStartAngle = d.startAngle;
            let arcEndAngle = d.endAngle;
            addTransparentRect4arc(arcStartAngle, arcEndAngle);

        });

    if (className == "pie4original") {
        let allhiddenDonutArcs = thiscontainerg.selectAll(".hiddenDonutArcs")
            .data(pie(newData4pie))
        allhiddenDonutArcs.exit().remove()
        let addhiddenDonutArcs = allhiddenDonutArcs.enter().append("path")
            .attr("class", "hiddenDonutArcs")
        addhiddenDonutArcs.merge(allhiddenDonutArcs)
            .attr("id", function (d, i) {
                return "hiddenArc" + data.rank + "_" + i;
            }) //Unique id for each slice
            .style("fill", "none")
            .attr("d", arc)
            .attr("d", function () {
                //A regular expression that captures all in between the start of a string
                //(denoted by ^) and the first capital letter L
                let firstArcSection = /(^.+?)L/;
                //The [1] gives back the expression between the () (thus not the L as well)
                //which is exactly the arc statement
                let newArc = firstArcSection.exec(d3.select(this).attr("d"))[1];
                // console.log(d)
                //Replace all the comma's so that IE can handle it -_-
                //The g after the / is a modifier that "find all matches rather than
                //stopping after the first match"
                newArc = newArc.replace(/,/g, " ");
                //Create a new invisible arc that the text can flow along
                return newArc
            })
    }
    if (className == "pie4original") {
        //Append the start and end Value to each slice
        thiscontainerg.selectAll(".startText").remove()
        thiscontainerg.selectAll(".startText")
            .data(newData4pie)
            .enter().append("text")
            .attr("class", "startText")
            .attr("dy", -0.06 * radius) //Move the text down
            .append("textPath")
            .attr("xlink:href", function (d, i) { return "#perAttr" + data.rank + "_" + i; })
            .text(function (d) {
                let text = d.sliceInfo.range[0];
                // return num2text(text);
                return d3.format(".2s")(text)
            })
            .attr("font-size", rangeTextSize);
        thiscontainerg.selectAll('.endText').remove()
        thiscontainerg.selectAll(".endText")
            .data(newData4pie)
            .enter().append("text")
            .attr("class", "endText")
            .attr("x", function (d, i) {
                let result = Math.PI * radius * 2 / newData4pie.length;
                let num2show = d3.format(".2s")(d.sliceInfo.range[1]);
                thiscontainerg.append("text")
                    .attr("class", "getWidth4text")
                    .attr("x", 0)
                    .attr("y", 0)
                    .text(num2show)
                let width4word = thiscontainerg.select(".getWidth4text").node().getComputedTextLength();
                // console.log(width4word)
                thiscontainerg.select(".getWidth4text").remove();
                // console.log(d3.format(".2s")(d.sliceInfo.range[1]));
                // let width4word = (d3.format(".2s")(d.sliceInfo.range[1])).toString().length;
                // return result - width4word * rangeTextSize * 0.9;
                return result - width4word - 7;
            })   //Move the text from the start angle of the arc
            .attr("dy", -0.06 * radius) //Move the text down
            .append("textPath")
            .attr("xlink:href", function (d, i) { return "#perAttr" + data.rank + "_" + i; })
            .text(function (d) {
                let text = d.sliceInfo.range[1];
                // return num2text(text);
                return d3.format(".2s")(text)
            })
            .attr("font-size", rangeTextSize);
        //Append the attribute Name in the middle of the arc
        thiscontainerg.selectAll('.centerText').remove()
        thiscontainerg.selectAll(".centerText")
            .data(newData4pie)
            .enter().append("text")
            .attr("class", "centerText")
            .attr("dy", -0.15 * radius)
            .append("textPath")
            .attr("startOffset", "50%")
            .style("text-anchor", "middle")
            .attr("xlink:href", function (d, i) { return "#hiddenArc" + data.rank + "_" + i; })
            .text(function (d) { return d.sliceInfo.name; })
            .attr("font-size", attrTextSize);
    }
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

//range arc 
// if (d.data.sliceInfo.filtered != null) {
//     ////get the angle of the filtered arc
//     // console.log("sliceInfo ", className, d.data.sliceInfo)
//     let color4usersPie = d.data.color;
//     let filteredStart = d.data.sliceInfo.filtered[0];
//     let filteredEnd = d.data.sliceInfo.filtered[1];
//     let rangeStart = d.data.sliceInfo.range[0];
//     let rangeEnd = d.data.sliceInfo.range[1];
//     let arcStartAngle = d.startAngle;
//     let arcEndAngle = d.endAngle;
//     if ((rangeEnd - rangeStart != 0) && (d.endAngle - d.startAngle != 0)) {
//         arcStartAngle = (filteredStart - rangeStart) / (rangeEnd - rangeStart) * (d.endAngle - d.startAngle) + d.startAngle;
//         arcEndAngle = (filteredEnd - rangeStart) / (rangeEnd - rangeStart) * (d.endAngle - d.startAngle) + d.startAngle;
//     }


//     let color4slice = d.data.color;

//     let pieGenerator = d3.pie()
//         .startAngle(arcStartAngle)
//         .endAngle(arcEndAngle);
//     let data2drawfilteredArc = [1];
//     // Create an arc generator with configuration
//     let filteredArc = d3.arc()
//         .outerRadius(radius - 0 * radius)
//         .innerRadius(radius - 0.1 * radius)

//     let filteredPie = d3.arc()
//         .outerRadius(radius - 0.075 * radius)
//         .innerRadius(0)

//     let arcData = pieGenerator(data2drawfilteredArc);

//     // Create a path element and set its d attribute
//     let allfilteredarc = thiscontainerg.selectAll('.filteredArc_' + i)
//         .data(arcData)
//     allfilteredarc.exit().remove()
//     let addfilteredarc = allfilteredarc.enter()
//         .append('path')
//         .attr("class", "filteredArc_" + i)
//     addfilteredarc.merge(allfilteredarc)
//         .attr('d', filteredArc)
//         .attr("fill", function () {
//             let color = color4slice;
//             if (className == "pie4users") {
//                 color = "transparent"
//             }
//             return color;
//         })
//         .attr("opacity", 0.8)
//         .attr("stroke", color4slice)
//         .style("stroke-width", 1)

//     thiscontainerg.selectAll('.filteredPie' + "_" + i).remove()
//     thiscontainerg.selectAll('.filteredPie' + "_" + i)
//         .data(arcData)
//         .enter()
//         .append('path')
//         .attr('d', filteredPie)
//         .attr("class", "filteredPie" + "_" + i)
//         .attr("fill", "transparent")
//         .attr("opacity", 0.5)
//         .attr("stroke", color4slice)
//         .style("stroke-width", 2)
//         .style("stroke-dasharray", ("1, 1"))
// }