class line4Result {
    constructor(container, data) {
        this.data = data;
        this.container = container;
        this.consRange;
        this.suggestedgoal;
    }
    init() {
        d3.select(this.container).selectAll("svg").remove();
        let margin = { top: 0, right: 5, bottom: 0, left: 5 },
            width = 100 - margin.left - margin.right,
            height = 50 - margin.top - margin.bottom;

        let svg = d3.select(this.container).append("svg")
            .attr("class", "svg4result")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + 0 + ")");

        this.svg = svg;
        this.margin = margin;
        this.width = width;
        this.height = height;
    }
    setOriginalData(data) {
        this.orginalData = data;
    }
    renderLine() {
        let data2use = this.orginalData;
        let svg2draw = this.svg;
        let width2draw = this.width;
        let margin2draw = this.margin;
        let height2draw = this.height;
        let container2draw = this.container;
        let that = this;
        if (svg2draw.selectAll("line")) svg2draw.selectAll("line").remove();
        if (svg2draw.selectAll("text")) svg2draw.selectAll("text").remove();
        if (svg2draw.selectAll("rect")) svg2draw.selectAll("rect").remove();
        if (data2use != null) {
            let x = d3.scaleLinear()
                .domain([d3.min(data2use), d3.max(data2use)])
                .range([0, width2draw - margin2draw.left])
                .clamp(true);

            let mainline = svg2draw.append("line")
                .attr("class", "mainline")
                .attr("x1", x.range()[0])
                .attr("x2", x.range()[1])
                .attr("y1", height2draw / 1.7)
                .attr("y2", height2draw / 1.7)
                .attr("stroke", "#5B9BD5")
                .attr("stroke-width", 2)
                .attr("fill", "none");

            let startTick = svg2draw.append("line")
                .attr("class", "startTick")
                .attr("x1", x.range()[0])
                .attr("x2", x.range()[0])
                .attr("y1", height2draw / 1.7 - 5)
                .attr("y2", height2draw / 1.7)
                .attr("stroke", "#5B9BD5")
                .attr("stroke-width", 2)
                .attr("fill", "none");

            let endTick = svg2draw.append("line")
                .attr("class", "endTick")
                .attr("x1", x.range()[1])
                .attr("x2", x.range()[1])
                .attr("y1", height2draw / 1.7 - 5)
                .attr("y2", height2draw / 1.7)
                .attr("stroke", "#5B9BD5")
                .attr("stroke-width", 2)
                .attr("fill", "none");

            let text4minmax = svg2draw.selectAll("text")
                .data([d3.max(data2use)])
                .enter()
                .append("text")
                .attr("x", function (d, i) {
                    let string2show = formartNumber(d);
                    return x(d) - string2show.length * 4;
                })
                .attr("y", height2draw / 2.2)
                .text(function (d) {
                    let string2show = formartNumber(d);
                    return string2show;
                })
                .style("font-size", "10px");
            this.xScale = x;
        }
    }
    setRectData(data) {
        this.rectData = data;
    }
    renderRect() {
        let svg2draw = this.svg;
        let height2draw = this.height;
        let data4Rect = this.rectData;
        let x = this.xScale;
        let rectWidth = 5;
        let rectHeight = 20;
        let circleR = 2;
        let constraintV = (this.consRange) ? d3.max(this.consRange) : null;
        let classname = (data4Rect.color == "#FC8271") ? "rect4suggested" : "rect4user";
        if (classname == "rect4suggested" && data4Rect.type == "goal") {
            this.suggestedgoal = data4Rect.data;
        }
        let suggestedGoal = this.suggestedgoal;
        updateRect(data4Rect, classname);
        function updateRect(data, classname) {
            if (svg2draw.selectAll("." + classname)) svg2draw.selectAll("." + classname).remove();
            if (svg2draw.selectAll(".rect4uservalue2notice")) svg2draw.selectAll(".rect4uservalue2notice").remove();
            if (svg2draw.selectAll(".rect4usercircle2notice")) svg2draw.selectAll(".rect4usercircle2notice").remove();
            let rect2Update = svg2draw.selectAll("." + classname)
                .data([data], function (d) { return d; });
            rect2Update.enter().append("rect")
                .attr("class", classname)
                .attr("x", function (d) {
                    return x(d.data) - 1;
                })
                .attr("y", height2draw / 1.7 - rectHeight / 2)
                .attr("width", rectWidth)
                .attr("height", rectHeight)
                .attr("fill", function (d) {
                    if (classname == "rect4suggested") {
                        return d.color;
                    } else {
                        return "none";
                    }
                })
                .attr('stroke', function (d) {
                    return d.color;
                })
                .attr('stroke-width', '1')
            ////add exact circle value of patches
            rect2Update.enter().append("circle").attr("class", classname + "circle2notice")
                .attr("cx", 0)
                .attr("cy", function () {
                    if (classname == "rect4suggested") {
                        return height2draw / 4 - circleR;
                    } else {
                        return height2draw / 1.7 + rectHeight/2 + circleR + 5;
                    }
                })
                .attr("r", circleR)
                .attr("fill", function () {
                    if (classname == "rect4suggested") {
                        return "rgb(252, 130, 113)";
                    } else {
                        return "transparent";
                    }
                })
                .attr('stroke', function () {
                    if (classname == "rect4suggested") {
                        return "rgb(252, 130, 113)";
                    } else {
                        return "rgb(192, 0, 0)";
                    }
                })
                .attr('stroke-width', 1)
            //////add text for the circle
            rect2Update.enter().append("text").attr("class", classname + "value2notice")
                .attr("x", circleR * 2)
                .attr("y", function () {
                    if (classname == "rect4suggested") {
                        return height2draw / 4;
                    } else {
                        return height2draw / 1.7 + rectHeight;
                    }
                })
                .text(function (d) {
                    // console.log("data is ", d);
                    // let endValue = d.optiInput.constraints.range[1];
                    if (d.type == "constraint") {
                        let diff = constraintV - d.data ;
                        let sign = (diff > 0) ? "-" : "+";
                        return "(" + sign + Math.abs(diff).toLocaleString() + ")";
                    } else {
                        if (classname == "rect4suggested") {
                            return Number((d.data).toFixed(1)).toLocaleString();
                        } else {
                            let diff = suggestedGoal - d.data;
                            let sign = (diff > 0) ? "-" : "+";
                            return "(" + sign + Number(Math.abs(diff).toFixed(1)).toLocaleString() + ")";
                        }
                    }

                })
                .style("font-size", 10);
        }
    }
    setConsRangeData(data) {
        this.consRange = data;
    }
    renderConsRange() {
        let svg2draw = this.svg;
        let height2draw = this.height;
        let data4ConsRange = [{ start: d3.min(this.consRange), end: d3.max(this.consRange) }];
        let x = this.xScale;
        let rectHeight = 8;
        let classname = "consRange"
        updateRect(data4ConsRange, classname);
        function updateRect(data, classname) {
            if (svg2draw.selectAll("." + classname)) svg2draw.selectAll("." + classname).remove();
            let rect2Update = svg2draw.selectAll("." + classname)
                .data(data);
            rect2Update.enter().append("rect")
                .attr("class", classname)
                .attr("x", function (d) {
                    return x(d.start);
                })
                .attr("y", height2draw / 1.7 - rectHeight / 2)
                .attr("width", function (d) {
                    return x(d.end) - x(d.start);
                })
                .attr("height", rectHeight)
                .attr("fill", "rgb(233, 233, 233)")
                .attr("fillOpacity", 0.5)
                .attr('stroke', "rgb(233, 233, 233)")
                .attr('stroke-width', '1')
                .attr("opacity", 0.5)
        }
    }
}

function formartNumber(d) {
    let string2show;
    if (d.toString().length > 5) {
        if (d.toString().length > 8) {
            string2show = (d / 1000000).toFixed(1) + "M";
        } else {
            string2show = (d / 1000).toFixed(1) + "K";
        }
    } else {
        string2show = d.toFixed(1);
    }
    return string2show;
}