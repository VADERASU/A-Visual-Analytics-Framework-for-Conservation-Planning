class slider {
    constructor(container) {
        this.container = container;
    }
    update(data) {
        this.data = data;
        let rangevalue;
        if (data != null) {
            let container = this.container;
            let slider2store = container.slice(1).slice(0, -6);
            let maxvalue = Math.max(...this.data);
            let minvalue = Math.min(...this.data);
            let step = 1;
            if (container == "#medianSlider") {
                step = 0.5;
            }
            let defaultValue = [minvalue, maxvalue];
            if (currentBudget[slider2store] && (container == "#costSlider" || container == "#areaSlider")) {
                defaultValue = [d3.max([currentBudget[slider2store][0], minvalue]), d3.min([currentBudget[slider2store][1], maxvalue])];
                setValue4consInputbox();
                // console.log(currentBudget, defaultValue)
            }
            function setValue4consInputbox() {
                let checkedRadio = d3.select(".constraintsform input:checked").node().id;
                let checkedCons = checkedRadio.slice(0, -5);
                d3.select("#minInput").property("value", d3.max([currentBudget[checkedCons][0], minvalue]));
                d3.select("#maxInput").property("value", d3.min([currentBudget[checkedCons][1], maxvalue]));
            }
            let range4slider = "#range4" + this.container.slice(1, -6);
            let valueMax = "#" + this.container.slice(1, -6) + "_Max";
            d3.select(valueMax).text(d3.format(".4s")(maxvalue) + "");
            let that = this;
            $(function () {
                $(container).slider({
                    range: true,
                    min: minvalue,
                    max: maxvalue,
                    values: defaultValue,
                    step: step,
                    create: attachSlider,
                    slide: attachSlider,
                    stop: attachSlider
                });

                function attachSlider() {
                    $(range4slider).val($(container).slider("values", 0) + " - " + $(container).slider("values", 1));
                    that.rangevalue = $(container).slider("values");
                    currentBudget[slider2store] = that.rangevalue;
                    if (currentBudget[slider2store] && (container == "#costSlider" || container == "#areaSlider")) {
                        setValue4consInputbox();
                    }
                    if (container == "#medianSlider") {
                        sliderUpdatesFilteredP(currentGridData, filterPool4grid, operator4sort, that.rangevalue)
                    }
                }

                rangevalue = $(container).slider("values");
                $(range4slider).val(rangevalue[0].toLocaleString() + " - " + rangevalue[1].toLocaleString());
                that.rangevalue = rangevalue;
                //container costSlider, areaSlider 
                currentBudget[slider2store] = rangevalue;
                if (currentBudget[slider2store] && (container == "#costSlider" || container == "#areaSlider")) {
                    setValue4consInputbox();
                }

                //add the input to the handler of slider
                $('.constrainInput input').change(function (e) {
                    let setIndex = (this.id == "maxInput") ? 1 : 0;
                    let setValue = $(this).val();
                    let checkedRadio = d3.select(".constraintsform input:checked").node().id;
                    let checkedCons = checkedRadio.slice(0, -5);
                    let text4checked = "#range4" + checkedCons;
                    let slider4cheked = "#" + checkedCons + "Slider";
                    let oldRangeText = $(text4checked).val();
                    let newRangeText = oldRangeText.split('-');
                    // console.log(newRangeText, Number(newRangeText[1]));

                    if (setIndex == 0) {
                        $(text4checked).val(Number(setValue).toLocaleString() + " - " + newRangeText[1].replace(/ /g, ""));
                    } else {
                        $(text4checked).val(newRangeText[0].replace(/ /g, "") + " - " + Number(setValue).toLocaleString());
                    }
                    $(slider4cheked).slider("values", setIndex, setValue);
                    currentBudget[checkedCons][setIndex] = setValue;
                })
            });
            // that.rangevalue = rangevalue;      
        } else {
            // console.log(data)
        }
    }
    getDragValue() {
        return this.rangevalue;
    }
}

// ranking2filter



/***************************************slider using d3.js****************************************** */
// class slider {
//     constructor(container, data) {
//         this.data = data;
//         this.container = container;
//         // this.extents = null;
//         // this.foreground = null;
//         // this.options = { width: 570, height: 480, xlabel: "x", ylabel: "y" }
//         // $.each(options, d => this.options[d] = options[d]);
//     }
//     init() {
//         let margin = { top: 10, right: 25, bottom: 10, left: 25 },
//             width = 190 - margin.left - margin.right,
//             height = 25 - margin.top - margin.bottom;

//         let slider = d3.select(this.container).append("svg")
//             .attr("class", "slider")
//             .attr("width", width + margin.left + margin.right)
//             .attr("height", height + margin.top + margin.bottom)
//             .append("g")
//             .attr("class", "gclass")
//             .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//         this.slider = slider;
//         this.margin = margin;
//         this.width = width;
//         this.height = height;
//     }
//     updateData(data) {
//         this.data = data;
//     }
//     render() {
//         let data2use = this.data;
//         let slider2draw = this.slider;
//         let width2draw = this.width;
//         let margin2draw = this.margin;
//         let height2draw = this.height;
//         let container2draw = this.container;
//         let that = this;
//         let dragValue;
//         if (slider2draw.selectAll("line")) slider2draw.selectAll("line").remove();
//         if (slider2draw.selectAll("text")) slider2draw.selectAll("text").remove();
//         if (slider2draw.selectAll("circle")) slider2draw.selectAll("circle").remove();
//         if (data2use != null) {
//             let x = d3.scaleLinear()
//                 .domain([d3.min(data2use), d3.max(data2use)])
//                 .range([0, width2draw - margin2draw.left])
//                 .clamp(true);

//             let line = slider2draw.append("line")
//                 .attr("class", "track4slider")
//                 .attr("x1", x.range()[0])
//                 .attr("x2", x.range()[1])
//                 .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
//                 .attr("class", "track4slider-inset")
//                 .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
//                 .attr("class", "track4slider-overlay")
//                 .call(d3.drag()
//                     .on("start.interrupt", function () { slider2draw.interrupt(); })
//                     .on("start drag", function () {
//                         handlePosition(x.invert(d3.event.x));
//                     })
//                     .on("end", function () {
//                         dragValue = x.invert(d3.event.x);
//                         that.dragValue = Math.round(dragValue);
//                         // console.log("dragValue ",dragValue, that.dragValue);
//                         if (container2draw == "#medianSlider") {
//                             ranking2filter = dragValue;
//                             let revisedRanking;
//                             let difference = Math.round(ranking2filter) - Math.floor(ranking2filter);
//                             if(difference > 0) {
//                                 revisedRanking = Math.floor(ranking2filter) + 0.5;
//                             } else {
//                                 revisedRanking =  Math.floor(ranking2filter);
//                             }
//                             sliderUpdatesFilteredP(currentGridData, filterPool4grid, operator4sort, revisedRanking);
//                         }

//                     })
//                 )
//             /////////add min value and max value in the line
//             let text = slider2draw.selectAll("text")
//                 .data([d3.min(data2use), d3.max(data2use)])
//                 .enter()
//                 .append("text")
//                 .attr("x", function (d, i) {
//                     if (i == 0) {
//                         return x(d) - 20;
//                     } else {
//                         return x(d) + 5;
//                     }

//                 })
//                 .attr("y", height2draw / 2)
//                 .text(function (d) {
//                     return d;
//                 })

//             ///////text for the draged value
//             function update(data) {
//                 // JOIN new data with old elements.
//                 let text = slider2draw.selectAll(".text4testing")
//                     .data(data, function (d) { return d; });

//                 // EXIT old elements not present in new data.
//                 text.exit()
//                     .attr("class", "exit")
//                     .remove();

//                 // ENTER new elements present in new data.
//                 text.enter().append("text")
//                     .attr("class", "text4testing")
//                     .attr("y", height2draw + margin2draw.top)
//                     .attr("x", function (d) { return x(d); })
//                     .style("fill-opacity", 1)
//                     .text(function (d) { 
//                         if (container2draw == "#medianSlider") {
//                             let difference = Math.round(d) - Math.floor(d);
//                             if(difference > 0) {
//                                 return Math.floor(d) + 0.5;
//                             } else {
//                                 return Math.floor(d);
//                             }
//                         } else {
//                             return Math.round(d); 
//                         }
//                     })
//             }

//             ///////brush the area for median ranking
//             function updateline(data) {
//                 // JOIN new data with old elements.
//                 let line4update = slider2draw.selectAll(".brushedline-inset")
//                     .data(data, function (d) { return d; });

//                 // EXIT old elements not present in new data.
//                 line4update.exit()
//                     .attr("class", "exitline")
//                     .remove();

//                 // ENTER new elements present in new data.
//                 line4update.enter().append("line")
//                     .attr("class", "brushedline")
//                     .attr("x1", x.range()[0])
//                     .attr("x2", function (d) { return x(d) - 8; })
//                     .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
//                     .attr("class", "brushedline-inset")
//                     .style("fill-opacity", 1)
//             }

//             let handle = slider2draw.insert("circle", ".track4slider-overlay")
//                 .attr("class", "handle4slider")
//                 .attr("r", 7);

//             function handlePosition(h) {
//                 handle.attr("cx", x(h));
//                 update([h]);
//                 if (container2draw == "#medianSlider") updateline([h]);
//             }

//         }
//     }
//     /////the getDragValue doesn't work, I use the global ranking2filter to get the draged information
//     getDragValue() {
//         return this.dragValue;
//     }
// }