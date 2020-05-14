class parallelCoor {
    constructor(container, data) {
        this.data = data;
        this.container = container;
    }
    setdata(currentGridData, attrlist2show) {
        let allProperties = currentGridData.map(d => d.properties);
        let inputdata4parallel = allProperties;
        inputdata4parallel = inputdata4parallel.map(d => {
            let resultObj = {};
            attrlist2show.forEach(attr => {
                let name4obj = abbre2ids[attr].sortIcon.slice(9);
                resultObj[name4obj] = d[name4obj];
            })
            return resultObj;
        }
        );
        this.data = inputdata4parallel;
    }
    init() {
        this.container.selectAll("svg").remove()

        var margin = parallel_coor_setting.margin,
            width = parallel_coor_setting.width,
            height = parallel_coor_setting.height,
            x = parallel_coor_setting.x,
            y = {},
            dragging = {};


        var line = d3.line(),
            //axis = d3.axisLeft(x),
            background,
            foreground,
            extents;

        var svg = this.container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var quant_p = function (v) { return (parseFloat(v) == v) || (v == "") };
        let parallelCoorData = this.data;
        let dimensions = d3.keys(parallelCoorData[0]);
        // console.log(parallelCoorData, dimensions)
        x.domain(dimensions);

        dimensions.forEach(function (d) {
            var vals = parallelCoorData.map(function (p) { return p[d]; });
            if (vals.every(quant_p)) {
                let thisdomain = d3.extent(parallelCoorData, function (p) {
                    return +p[d];
                })
                if (thisdomain[0] == thisdomain[1]) {
                    thisdomain[0]--
                    thisdomain[1]++
                }
                y[d] = d3.scaleLinear()
                    .domain(thisdomain)
                    .range([height, 0])
            }
            else {
                let thisdomain = vals.filter(function (v, i) { return vals.indexOf(v) == i; })
                if (thisdomain[0] == thisdomain[1]) {
                    thisdomain[0]--
                    thisdomain[1]++
                }
                y[d] = d3.scalePoint()
                    .domain(thisdomain)
                    // .domain(d3.min(vals), d3.max(vals))
                    .range([height, 0], 1);
            }
        })


        extents = dimensions.map(function (p) { return [0, 0]; });
        // let extentsofinit =extents

        // Add grey background lines for context.
        background = svg.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(parallelCoorData)
            .enter().append("path")
            .attr("d", path);

        // Add blue foreground lines for focus.
        foreground = svg.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(parallelCoorData)
            .enter().append("path")
            .attr("d", path);

        // Add a group element for each dimension.
        var g = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function (d) { return "translate(" + x(d) + ")"; })
            .call(d3.drag()
                .subject(function (d) { return { x: x(d) }; })
                .on("start", function (d) {
                    // console.log("aaaa")
                    dragging[d] = x(d);
                    background.attr("visibility", "hidden");
                })
                .on("drag", function (d) {
                    dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                    // console.log(dragging[d]);
                    foreground.attr("d", path);
                    dimensions.sort(function (a, b) { return position(a) - position(b); });
                    x.domain(dimensions);
                    dimensions.forEach(attr => {
                        let idName = "#sortIcon4" + attr;
                        d3.select(d3.select(idName).node().parentNode.parentNode.parentNode).style("left", `${x(attr)}px`);
                    })
                    let dragedAttr = "#sortIcon4" + d;
                    d3.select(d3.select(dragedAttr).node().parentNode.parentNode.parentNode).style("left", `${dragging[d]}px`);
                    g.attr("transform", function (d) { return "translate(" + position(d) + ")"; })

                })
                .on("end", function (d) {
                    dimensions.forEach(attr => {
                        let idName = "#sortIcon4" + attr;
                        d3.select(d3.select(idName).node().parentNode.parentNode.parentNode).style("left", `${x(attr)}px`);
                    })
                    // console.log("d at the end od the drag ", d);
                    delete dragging[d];
                    transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                    transition(foreground).attr("d", path);
                    background
                        .attr("d", path)
                        .transition()
                        .delay(500)
                        .duration(0)
                        .attr("visibility", null);
                }));
        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this).call(d3.axisLeft(y[d]).tickValues([d3.quantile(y[d].domain(), 0), d3.quantile(y[d].domain(), 0.2), d3.quantile(y[d].domain(), 0.4), d3.quantile(y[d].domain(), 0.6),
                d3.quantile(y[d].domain(), 0.8), d3.quantile(y[d].domain(), 1)]).tickFormat(d3.format(".4s")));
            })
        //text does not show up because previous line breaks somehow
        // .append("text")
        // .attr("fill", "black")
        // .style("text-anchor", "middle")
        // .attr("y", -9)
        // .text(function (d) { return d; });

        // Add and store a brush for each axis.
        g.append("g")
            .attr("class", "brush")
            .each(function (d) {
                d3.select(this).call(y[d].brush = d3.brushY().extent([[-8, 0], [8, height]]).on("start", brushstart).on("brush", brush_parallel_chart)
                    .on("end", getFinalRangeofBrush));
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
        // });

        function position(d) {
            var v = dragging[d];
            return v == null ? x(d) : v;
        }

        function transition(g) {
            return g.transition().duration(500);
        }

        // Returns the path for a given data point.
        function path(d) {
            return line(dimensions.map(function (p) { return [position(p), y[p](d[p])]; }));
        }

        function brushstart() {
            d3.event.sourceEvent.stopPropagation();
        }


        // Handles a brush event, toggling the display of foreground lines.
        function brush_parallel_chart() {
            for (var i = 0; i < dimensions.length; ++i) {
                if (d3.event.target == y[dimensions[i]].brush) {
                    extents[i] = d3.event.selection.map(y[dimensions[i]].invert, y[dimensions[i]]);
                    // console.log(" brush_parallel_chart ", d3.event.selection, y[dimensions[i]].invert, y[dimensions[i]])
                }
            }

            foreground.style("display", function (d) {
                // console.log("foreground data when brush ", d);
                return dimensions.every(function (p, i) {
                    if (extents[i][0] == 0 && extents[i][0] == 0) {
                        // console.log("brushed data ",p);
                        return true;
                    }
                    return extents[i][1] <= d[p] && d[p] <= extents[i][0];
                }) ? null : "none";
            });
        }

        function getFinalRangeofBrush() {
            // console.log(d3.event.selection)
            if (d3.event.selection == null) {
                // console.log("parallelCoorData ", parallelCoorData, d3.event)
                for (var i = 0; i < dimensions.length; ++i) {
                    if (d3.event.target == y[dimensions[i]].brush) {
                        let filtername = dimensions[i];
                        delete filterPool[filtername];
                        updateDistriBasedonBrush(currentGridData, filterPool);

                        if (filterPool4grid[filtername]) {
                            let maxvalue = d3.max(parallelCoorData.map(d => d[filtername]));
                            // if (maxvalue == undefined) console.log("filtername ", filtername);
                            filterPool4grid[filtername].range = null;
                            filterPool4grid[filtername].maxValue = maxvalue;
                            updateslidersAndfilteredP(currentGridData, filterPool4grid, operator4sort);
                        }

                        let burshinfo = { "brushname": filtername, "brushrange": null };
                        updateADrect(filtername, burshinfo);

                        let brushedInfo = { "attrName": filtername, "burshedrange": null }
                        parallel4attributes.update(brushedInfo)
                    }
                }

            } else {
                for (var i = 0; i < dimensions.length; ++i) {
                    if (d3.event.target == y[dimensions[i]].brush) {
                        extents[i] = d3.event.selection.map(y[dimensions[i]].invert, y[dimensions[i]]);
                        // console.log("this.extents[i] ", dimensions,extents[i], i, dimensions[i]);
                        let filtername = dimensions[i];
                        let maxvalue = d3.max(parallelCoorData.map(d => d[filtername]));
                        // if (maxvalue == undefined) console.log("filtername ", filtername);
                        // console.log("extents[i];", extents[i]);
                        filterPool[filtername] = {};
                        filterPool[filtername].range = extents[i];
                        filterPool[filtername].maxValue = maxvalue;
                        updateDistriBasedonBrush(currentGridData, filterPool);
                        //update the patches on the map
                        if (filterPool4grid[filtername]) {
                            filterPool4grid[filtername].range = extents[i];
                            filterPool4grid[filtername].maxValue = maxvalue;
                            updateslidersAndfilteredP(currentGridData, filterPool4grid, operator4sort);
                        }

                        let burshinfo = { "brushname": filtername, "brushrange": extents[i] };
                        updateADrect(filtername, burshinfo);

                    }
                }
            }



        }
        function updateADrect(filtername, burshinfo) {
            let sorticonid = "sortIcon4" + filtername;
            let key = getKeyByValue(abbre2ids, "sortIcon", sorticonid);
            abbre2ids[key].linechart.ADrect4linechart(burshinfo);
        }
        function addBoxplot(parallelCoorData, dimensions) {
            // console.log(parallelCoorData, dimensions);
            let attrs = {};
            dimensions.forEach(attr => {
                let value = parallelCoorData.map(a => a[attr]);
                attrs[attr] = value;
            })
            // console.log("attrs ", attrs)
            function getboxplotinfo(filtername) {
                let attrArr = attrs[filtername];
                attrArr.sort((a, b) => a - b);
                let boxplotInfo = {
                    min: d3.min(attrArr),
                    max: d3.max(attrArr),
                    median: d3.quantile(attrArr, .5),
                    quarter: d3.quantile(attrArr, .25),
                    threeQuarters: d3.quantile(attrArr, .75)
                }
                return boxplotInfo;
            }

            let boxWidth = 20;
            if (g.selectAll(".quarter2threequarters")) g.selectAll(".quarter2threequarters").remove();
            // console.log("rendering boxplot!")
            //add 1/4 - 3/4
            g.select(".axis").append("rect")
                .attr("class", "quarter2threequarters")
                .attr("x", 0 - boxWidth / 2)
                .attr("y", function (d) {
                    let boxplotInfo = getboxplotinfo(d);
                    return y[d](boxplotInfo.threeQuarters);
                })
                .attr("width", boxWidth)
                .attr("height", function (d) {
                    let boxplotInfo = getboxplotinfo(d);
                    return Math.abs(y[d](boxplotInfo.threeQuarters) - y[d](boxplotInfo.quarter));
                })
                .attr("fill", "transparent")
                .attr('stroke', function (d) {
                    let value = "sortIcon4" + d;
                    let abbre = getKeyByValue(abbre2ids, "sortIcon", value)
                    return color4pie[abbre];
                })
                .attr('stroke-width', '2')
                .attr("opacity", 1)
            //add median
            if (g.selectAll(".medianLine")) g.selectAll(".medianLine").remove();
            g.select(".axis").append("line")
                .attr("class", "medianLine")
                .attr("x1", 0 - boxWidth / 2)
                .attr("x2", boxWidth / 2)
                .attr("y1", function (d) {
                    let boxplotInfo = getboxplotinfo(d);
                    return y[d](boxplotInfo.median);
                })
                .attr("y2", function (d) {
                    let boxplotInfo = getboxplotinfo(d);
                    return y[d](boxplotInfo.median);
                })
                .attr("stroke", function (d) {
                    let value = "sortIcon4" + d;
                    let abbre = getKeyByValue(abbre2ids, "sortIcon", value);
                    return color4pie[abbre];
                })
                .attr("stroke-width", 2)
                .attr("fill", "none");
        }
        addBoxplot(parallelCoorData, dimensions);

        this.extents = extents;
        this.foreground = foreground;
        this.y = y;
        this.margin = margin;
    }
    update(brushedInfo) {
        ////////add rect in parallel
        let brushedProperty = brushedInfo.attrName;
        let brushedRange = brushedInfo.burshedrange;
        let parallelCoorData = this.data
        let dimensions = d3.keys(parallelCoorData[0]);
        let dimensionNodes = this.container.selectAll(".dimension");
        let extents = this.extents;
        let foreground = this.foreground;
        dimensionNodes.append("g")
            .attr("class", "brush")
            .each(function (d, i) {
                if (d == brushedProperty) {
                    d3.select(this).call(function () {
                        if (brushedRange == null) {
                            extents[i] = [0, 0];
                        } else {
                            extents[i] = brushedRange.reverse();
                        }

                        foreground.style("display", function (d) {
                            return dimensions.every(function (p, i) {
                                if (extents[i][0] == 0 && extents[i][0] == 0) {
                                    return true;
                                }
                                return extents[i][1] <= d[p] && d[p] <= extents[i][0];
                            }) ? null : "none";
                        });
                    })
                }
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
        ////draw brushed area for parallel
        let y = this.y;
        let y_scale = y[brushedProperty];
        let margin = this.margin;
        // console.log("range1 ", brushedRange[1], value2pix4parallel(brushedRange[1], y_scale, margin));
        // console.log("range2 ", brushedRange[0], value2pix4parallel(brushedRange[0], y_scale, margin));
        let height, yvaleofmainpart;
        let displayStatus;
        if (brushedRange != null) {
            height = Math.abs(value2pix4parallel(brushedRange[1], y_scale, margin) - value2pix4parallel(brushedRange[0], y_scale, margin));
            yvaleofmainpart = value2pix4parallel(d3.max(brushedRange), y_scale, margin);
            displayStatus = "inline";
        } else {
            height = 0;
            yvaleofmainpart = 0;
            displayStatus = "none";
        }
        //the main part of the brushed area
        this.container.selectAll(".selection").each(function (d, i) {
            if (dimensions[i] == brushedProperty) {
                d3.select(this).style("display", displayStatus)
                    .attr("x", -8)
                    .attr("y", yvaleofmainpart)
                    .attr("width", 16)
                    .attr("height", height)
            }
        })
        //the top of the brushed area
        this.container.selectAll(".handle handle--n").each(function (d, i) {
            if (dimensions[i] == brushedProperty) {
                d3.select(this).style("display", displayStatus)
                    .attr("x", -11)
                    .attr("y", yvaleofmainpart - 3)
                    .attr("width", 22)
                    .attr("height", 6)
            }
        })
        //the bottome of the brushed area
        this.container.selectAll(".handle handle--s").each(function (d, i) {
            if (dimensions[i] == brushedProperty) {
                d3.select(this).style("display", displayStatus)
                    .attr("x", -11)
                    .attr("y", yvaleofmainpart + height - 3)
                    .attr("width", 22)
                    .attr("height", 6)
            }
        })
    }
}

function value2pix4parallel(yvalue, y_scale, margin) {
    let pix = y_scale(yvalue);
    if (pix < y_scale(d3.max(y_scale.domain()))) pix = y_scale(d3.max(y_scale.domain()));
    if (pix > y_scale(d3.min(y_scale.domain()))) pix = y_scale(d3.min(y_scale.domain()));
    return pix;
}
