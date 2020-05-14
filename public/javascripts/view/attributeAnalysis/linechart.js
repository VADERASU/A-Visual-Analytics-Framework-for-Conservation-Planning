class linechart {
    constructor(container, options, data) {
        this.data = data
        this.container = container
        this.options = { width: 600, height: 480, xlabel: "x", ylabel: "y", className: 'linechart' }
        $.each(options, d => this.options[d] = options[d])
        this.x_scale
        this.margin
    }
    init() {
        let width = this.options.width,
            height = this.options.height,
            origindata = this.options.origindata
        this.final_range = null
        let that = this


        this.container.data([this.data])
        this.getmax = d3.max(this.data.x);

        let chartname = this.options.className;
        let brushedProperty = chartname.slice(0, -5);
        //
        // Create the plot. 
        //
        let margin = { top: 2, right: 4, bottom: 20, left: 10 },
            innerwidth = width - margin.left - margin.right,
            innerheight = height - margin.top - margin.bottom;


        var x_scale = d3.scaleLinear()
            .range([0, innerwidth])
            .domain([d3.min([this.data], function (d) {
                return d3.min(d.x);
            }),
            d3.max([this.data], function (d) {
                return d3.max(d.x);
            })
            ]);
        var y_scale = d3.scaleLinear()
            .range([innerheight, 0])
            .domain([d3.min([this.data], function (d) {
                return d3.min(d.y);
            }),
            d3.max([this.data], function (d) {
                return d3.max(d.y);
            })
            ]);
        var color_scale = ["#000000", "#4682b4"];

        //brush
        this.g = this.container.attr("width", width)
            .attr("height", height)
            .call(d3.drag()
                .on("start", function () {
                    d3.select(this).select("#ADRect").remove()
                    d3.select(this).append("rect")
                        // console.log("orginalx in init()",d3.mouse(this)[0])
                        .attr("originalx", pix2roundpix(d3.mouse(this)[0], x_scale, margin))
                        .attr("x", pix2roundpix(d3.mouse(this)[0], x_scale, margin))
                        .attr("y", margin.top)
                        .attr("width", 0)
                        .attr("height", innerheight)
                        .style("fill", "#2323233d")
                        .attr("id", "ADRect")
                })
                .on("drag", function () {
                    let flag = false
                    // console.log("orginalx in dragging", d3.mouse(this)[0], pix2roundpix(d3.mouse(this)[0]), pix2round(d3.mouse(this)[0]), value2pix(pix2round(d3.mouse(this)[0])));
                    let thisx = Math.min(d3.select(this).select("#ADRect").attr("originalx") * 1, pix2roundpix(d3.mouse(this)[0], x_scale, margin))
                    let thiswidth = Math.abs(pix2roundpix(d3.mouse(this)[0], x_scale, margin) - d3.select(this).select("#ADRect").attr("originalx") * 1)

                    if (d3.select(this).select("#ADRect").attr("width") * 1 != thiswidth) {
                        d3.select(this).select("#ADRect").attr("width", thiswidth)
                        flag = true
                    }
                    if (d3.select(this).select("#ADRect").attr("x") * 1 != thisx) {
                        d3.select(this).select("#ADRect").attr("x", thisx)
                        flag = true
                    }
                    if (flag) {
                        let range = [pix2round(d3.select(this).select("#ADRect").attr("x") * 1, x_scale, margin),
                        pix2round(d3.select(this).select("#ADRect").attr("x") * 1 + d3.select(this).select("#ADRect").attr("width") * 1, x_scale, margin)
                        ]
                        // console.log(range)
                    }
                })
                .on("end", function () {
                    //改成小数改pix2round函数
                    let specified_range = [pix2round(d3.select(this).select("#ADRect").attr("x") * 1, x_scale, margin),
                    pix2round(d3.select(this).select("#ADRect").attr("x") * 1 + d3.select(this).select("#ADRect").attr("width") * 1, x_scale, margin)
                    ]
                    // specified_range.push([specified_range[0], specified_range[1]]);
                    that.final_range = [specified_range[0], specified_range[1]];
                    let idname = d3.select(this)._groups[0][0].parentNode.id;
                    let filtername = id2filtername(idname);

                    filterPool[filtername] = {};
                    filterPool[filtername].maxValue = that.getmax;
                    if (that.final_range[0] != that.final_range[1]) {
                        filterPool[filtername].range = that.final_range;

                        if (filterPool4grid[filtername]) {
                            filterPool4grid[filtername].range = that.final_range;
                            filterPool4grid[filtername].maxValue = that.getmax;
                            // console.log("filteredData4gridonmap in update ", filteredData4gridonmap);
                            updateslidersAndfilteredP(currentGridData, filterPool4grid, operator4sort);

                        }

                        let brushedInfo = { "attrName": brushedProperty, "burshedrange": that.final_range }
                        parallel4attributes.update(brushedInfo)
                    }
                    else {
                        delete filterPool[filtername];

                        if (filterPool4grid[filtername]) {
                            filterPool4grid[filtername].range = null;
                            filterPool4grid[filtername].maxValue = that.getmax;
                            updateslidersAndfilteredP(currentGridData, filterPool4grid, operator4sort);
                        }

                        let brushedInfo = { "attrName": brushedProperty, "burshedrange": null }
                        parallel4attributes.update(brushedInfo)

                    }
                    updateDistriBasedonBrush(currentGridData, filterPool);
                }))
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        this.g.append("g")
            .style("font-size", "6px")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + innerheight + ")")
            .call(d3.axisBottom(x_scale).ticks(3).tickSize(3).tickFormat(d3.format(".4s")))
            .append("text")
            .attr("dy", "2.59em")
            .attr("x", innerwidth)
            .style("text-anchor", "end")
            .style("fill", "black")
            .text(this.options.xlabel);

        this.g.append("g")
            .style("font-size", "6px")
            .attr("class", "y axis")
            .call(d3.axisLeft(y_scale).ticks(3).tickSize(3).tickFormat(d3.format(".4s")))
        // .append("text")
        // .attr("transform", "rotate(-90)")
        // .attr("y", 6)
        // .attr("dy", "0.71em")
        // .style("text-anchor", "end")
        // .style("fill", "black")
        // .text(ylabel);

        this.g.select(".y").selectAll(".tick").select("text").text(function () {
            let percent = d3.select(this).text();
            if (percent != "1") percent = percent.substring(1);
            return percent;
        })

        var draw_line = d3.line()
            .curve(d3.curveBundle.beta(0.5))
            .x(function (d) {
                return x_scale(d[0]);
            })
            .y(function (d) {
                return y_scale(d[1]);
            });

        let zhixian = d3.line()
            .x(function (d) {
                return x_scale(d[0]);
            })
            .y(function (d) {
                return y_scale(d[1]);
            });

        let datasets = [this.data]
        // console.log("datasets ", datasets)
        var data_lines = this.g.selectAll(".d3_xy_chart_line")
            .data(datasets.map(function (d) {
                return d3.zip(d.x, d.y);
            }))
            .enter().append("g")
            .attr("class", "d3_xy_chart_line");

        data_lines.append("path")
            .attr("class", "line")
            .attr("d", function (d) {
                if (d.length == 6
                    && d[0][1] == 0 && d[1][1] == 0 && d[2][1] == 1
                    && d[3][1] == 1 && d[4][1] == 0 && d[5][1] == 0) {
                    return zhixian(d);
                }
                // console.log(d)
                // console.log(d)
                return draw_line(d);
            })
            .style("fill", "none")
            .attr("stroke", function (_, i) {
                return color_scale[i];
            });

        this.x_scale = x_scale;
        this.margin = margin;

    }
    update(ob4filtedData) {
        // console.log("i am update the distribution!!!")
        let width = this.options.width,
            height = this.options.height,
            origindata = this.options.origindata
        let that = this

        this.container.data([this.data])
        //
        // Create the plot. 
        //
        let margin = { top: 2, right: 4, bottom: 20, left: 10 },
            innerwidth = width - margin.left - margin.right,
            innerheight = height - margin.top - margin.bottom;


        var x_scale = d3.scaleLinear()
            .range([0, innerwidth])
            .domain([d3.min([this.data], function (d) {
                return d3.min(d.x);
            }),
            d3.max([this.data], function (d) {
                return d3.max(d.x);
            })
            ]);
        var y_scale = d3.scaleLinear()
            .range([innerheight, 0])
            .domain([d3.min(ob4filtedData.y.concat(this.data.y)),
            d3.max(ob4filtedData.y.concat(this.data.y))
            ]);
        var color_scale = ["#ddd","#4682b4"];



        let chartname = this.options.className;
        let brushedProperty = chartname.slice(0, -5);
        //brush
        this.g = this.container.attr("width", width)
            .attr("height", height)
            .call(d3.drag()
                .on("start", function () {
                    // console.log("d3.select(this) ",d3.select(this));
                    d3.select(this).select("#ADRect").remove()
                    d3.select(this).append("rect")
                        .attr("originalx", pix2roundpix(d3.mouse(this)[0], x_scale, margin))
                        .attr("x", pix2roundpix(d3.mouse(this)[0], x_scale, margin))
                        .attr("y", margin.top)
                        .attr("width", 0)
                        .attr("height", innerheight)
                        .style("fill", "#2323233d")
                        .attr("id", "ADRect")
                })
                .on("drag", function () {
                    let flag = false

                    let thisx = Math.min(d3.select(this).select("#ADRect").attr("originalx") * 1, pix2roundpix(d3.mouse(this)[0], x_scale, margin))
                    let thiswidth = Math.abs(pix2roundpix(d3.mouse(this)[0], x_scale, margin) - d3.select(this).select("#ADRect").attr("originalx") * 1)

                    if (d3.select(this).select("#ADRect").attr("width") * 1 != thiswidth) {
                        d3.select(this).select("#ADRect").attr("width", thiswidth)
                        flag = true
                    }
                    if (d3.select(this).select("#ADRect").attr("x") * 1 != thisx) {
                        d3.select(this).select("#ADRect").attr("x", thisx)
                        flag = true
                    }
                    if (flag) {
                        let range = [pix2round(d3.select(this).select("#ADRect").attr("x") * 1, x_scale, margin),
                        pix2round(d3.select(this).select("#ADRect").attr("x") * 1 + d3.select(this).select("#ADRect").attr("width") * 1, x_scale, margin)
                        ]
                        // console.log(range)

                    }

                })
                .on("end", function () {
                    //改成小数改pix2round函数
                    let specified_range = [pix2round(d3.select(this).select("#ADRect").attr("x") * 1, x_scale, margin),
                    pix2round(d3.select(this).select("#ADRect").attr("x") * 1 + d3.select(this).select("#ADRect").attr("width") * 1, x_scale, margin)
                    ]
                    // specified_range.push([specified_range[0], specified_range[1]]);
                    // console.log(" that.final_range after update ", that.final_range)
                    that.final_range = [specified_range[0], specified_range[1]];
                    let idname = d3.select(this)._groups[0][0].parentNode.id;
                    let filtername = id2filtername(idname);
                    //filter distribution!!
                    filterPool[filtername] = {};
                    filterPool[filtername].maxValue = that.getmax;
                    if (that.final_range[0] != that.final_range[1]) {
                        filterPool[filtername].range = that.final_range;

                        if (filterPool4grid[filtername]) {
                            filterPool4grid[filtername].range = that.final_range;
                            filterPool4grid[filtername].maxValue = that.getmax;
                            updateslidersAndfilteredP(currentGridData, filterPool4grid, operator4sort);
                        }

                        let brushedInfo = { "attrName": brushedProperty, "burshedrange": that.final_range }
                        parallel4attributes.update(brushedInfo)
                    }
                    else {
                        delete filterPool[filtername];

                        if (filterPool4grid[filtername]) {
                            filterPool4grid[filtername].range = null;
                            filterPool4grid[filtername].maxValue = that.getmax;
                            updateslidersAndfilteredP(currentGridData, filterPool4grid, operator4sort);
                        }

                        let brushedInfo = { "attrName": brushedProperty, "burshedrange": null }
                        parallel4attributes.update(brushedInfo)

                    }
                    updateDistriBasedonBrush(currentGridData, filterPool);
                }))
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



        this.g.append("g")
            .style("font-size", "6px")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + innerheight + ")")
            .call(d3.axisBottom(x_scale).ticks(3).tickSize(3))
            .append("text")
            .attr("dy", "2.59em")
            .attr("x", innerwidth)
            .style("text-anchor", "end")
            .style("fill", "black")
            .text(this.options.xlabel);

        this.g.append("g")
            .style("font-size", "6px")
            .attr("class", "y axis")
            .call(d3.axisLeft(y_scale).ticks(3).tickSize(3))
        // .append("text")
        // .attr("transform", "rotate(-90)")
        // .attr("y", 6)
        // .attr("dy", "0.71em")
        // .style("text-anchor", "end")
        // .style("fill", "black")
        // .text(ylabel);

        this.g.select(".y").selectAll(".tick").select("text").text(function () {
            let percent = d3.select(this).text();
            if (percent != "1") percent = percent.substring(1);
            return percent;
        })

        var draw_line = d3.line()
            .curve(d3.curveBundle.beta(0.5))
            .x(function (d) {
                return x_scale(d[0]);
            })
            .y(function (d) {
                return y_scale(d[1]);
            });

        let datasets = [this.data];
        let filteredDatasets = [ob4filtedData];
        // console.log("filteredDatasets and datasets ",filteredDatasets,datasets);
        // console.log("#ADRect ",d3.select(this).select("#ADRect"));

        //original line
        var data_lines = this.g.selectAll(".d3_xy_chart_line")
            .data(datasets.map(function (d) {
                return d3.zip(d.x, d.y);
            }))
            .enter().append("g")
            .attr("class", "d3_xy_chart_line");

        data_lines.append("path")
            .attr("class", "line")
            .attr("d", function (d) {
                return draw_line(d);
            })
            .style("fill", "none")
            .attr("stroke", function (_, i) {
                return color_scale[i];
            });
        //for filtered line
        var filteredData_line = this.g.selectAll(".d3_xy_chart_filteredline")
            .data(filteredDatasets.map(function (d) {
                return d3.zip(d.x, d.y);
            }))
            .enter().append("g")
            .attr("class", "d3_xy_chart_filteredline");

        filteredData_line.append("path")
            .attr("class", "filteredline")
            .attr("d", function (d) {
                // console.log(draw_line(d));
                return draw_line(d);
            })
            .style("fill", "none")
            .attr("stroke", "#4682b4");

        this.x_scale = x_scale;
        this.margin = margin;
    }
    getrange() {
        let distriX_scale = this.x_scale;
        let distriMargin = this.margin;
        let result = null;
        if (this.container.select("#ADRect")._groups[0][0] !== undefined) {
            let specified_range = [pix2round(this.container.select("#ADRect").attr("x") * 1, distriX_scale, distriMargin),
            pix2round(this.container.select("#ADRect").attr("x") * 1 + this.container.select("#ADRect").attr("width") * 1, distriX_scale, distriMargin)
            ]
            result = specified_range;
        }
        // console.log("result ", result);
        return result;
    }
    getXMax() {
        return this.getmax;
    }
    ADrect(brushedinfo) {
        //save the brushed area in the distribution line chart when you brush the parallel distribution:
        let distriX_scale = this.x_scale;
        let distriMargin = this.margin;
        let DistriInnerheight = this.options.height - distriMargin.top - distriMargin.bottom;
        let brushedRange = brushedinfo.brushrange;
        if (brushedRange == null) {
            this.container.select("#ADRect").remove();
        } else {
            let widthofrect = Math.abs(value2pix(brushedRange[1], distriX_scale, distriMargin) - value2pix(brushedRange[0], distriX_scale, distriMargin));

            if (this.container.select("#ADRect")._groups[0][0] == undefined) {
                this.container.append("rect").attr("id", "ADRect").style("fill", "#2323233d")
            }

            this.container.select("#ADRect")
                .attr("x", value2pix(d3.min(brushedRange), distriX_scale, distriMargin))
                .attr("y", distriMargin.top)
                .attr("width", widthofrect)
                .attr("height", DistriInnerheight)
        }

    }


}


function id2filtername(idname) {
    let filtername;
    switch (idname) {
        case "paFilter":
        case "PA":
        case "paCheckbox4opti":
            filtername = "paAver";
            break;
        case "maFilter":
        case "MA":
        case "metroCheckbox4opti":
            filtername = "metroAver";
            break;
        case "hiiFilter":
        case "HII":
        case "hiiCheckbox4opti":
            filtername = "averageHII";
            break;
        case "roadFilter":
        case "HW":
        case "roadCheckbox4opti":
            filtername = "roadAver";
            break;
        case "hydrologyFilter":
        case "HY":
        case "hydologyCheckbox4opti":
            filtername = "averHyDist";
            break;
        case "treeFilter":
        case "Tree":
        case "treesCheckbox4opti":
            filtername = "averagetree";
            break;
        case "birdFilter":
        case "Bird":
        case "birdCheckbox4opti":
            filtername = "averagebird";
            break;
        case "mammalFilter":
        case "MM":
        case "mammalCheckbox4opti":
            filtername = "averagemammal";
            break;
        case "amphibianFilter":
        case "AM":
        case "amphibianCheckbox4opti":
            filtername = "averageamphibian";
            break;
        case "reptileFilter":
        case "RP":
        case "reptileCheckbox4opti":
            filtername = "averagereptile";
            break;
        case "fishFilter":
        case "Fish":
        case "fishCheckbox4opti":
            filtername = "averagefish";
            break;
        case "costFilter":
        case "Cost":
        case "costCheckbox4opti":
            filtername = "costAver";
            break;
        default:
            break;
    }
    return filtername;
}
function pix2roundpix(positionX, x_scale, margin) {
    let round = Math.round(x_scale.invert(positionX - margin.left))
    if (round < x_scale.domain()[0])
        round = x_scale.domain()[0]

    if (round > x_scale.domain()[1])
        round = x_scale.domain()[1]

    round = x_scale(round) + margin.left
    return round
}

function pix2round(positionX, x_scale, margin) {
    let round = Math.round(x_scale.invert(positionX - margin.left))
    if (round < x_scale.domain()[0])
        round = x_scale.domain()[0]
    if (round > x_scale.domain()[1])
        round = x_scale.domain()[1]
    return round
}

function value2pix(xvalue, x_scale, margin) {
    let pix = Math.round(x_scale(xvalue));
    if (pix < x_scale(x_scale.domain()[0])) pix = x_scale(x_scale.domain()[0]);
    if (pix > x_scale(x_scale.domain()[1])) pix = x_scale(x_scale.domain()[1]);
    return pix + margin.left;
}
