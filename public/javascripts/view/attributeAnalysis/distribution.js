class BC {
    constructor(container, options, data) {
        this.data = data
        this.container = container
        this.options = {
            width: 50, height: 50, top: 0, left: 0, className: 'timeaxle',
            slideColor: 'rgb(156, 156, 156)', focusColor: 'rgb(243, 243, 243)',
            bin: 20,
            xlabel: "xx",
            ylabel: "yy"
        }
        $.each(options, d => this.options[d] = options[d]);
        this.svg = this.container.append("svg")
    }
    setdata(data) {
        this.data = data
    }
    init() {
        //cal distribution
        this.statisticval = calstep(this.data, this.options.bin)
        // console.log("aaaa", this.statisticval, this.data)
        let ob = caldistribution(this.statisticval, this.data, this.options.bin)
        // console.log("bbb")
        // console.log(ob)

        this.container.selectAll("g").remove();
        this.container.selectAll("rect").remove();
        this.chart = new linechart(this.svg, {
            width: this.options.width,
            height: this.options.height,
            xlabel: this.options.xlabel,
            ylabel: this.options.ylabel,
            className: this.options.className,
            origindata: this.data,
        }, ob);
        this.chart.init()
    }
    update(filteredData) {
        this.statisticval4filteredData = calstep(filteredData, this.options.bin);
        let ob4filtedData = caldistribution(this.statisticval4filteredData, filteredData, this.options.bin);
        // console.log(ob, ob4filtedData);

        //draw the two lines
        this.container.selectAll("g").remove();
        this.chart.update(ob4filtedData);
    }
    getrange() {
        return this.chart.getrange();
    }
    getXMax() {
        return this.chart.getXMax();
    }
    ADrect4linechart(brushedinfo) {
        this.chart.ADrect(brushedinfo);
    }
}

function caldistribution(sta, data, bin) {
    let result = []

    if (sta.step == 0) {
        return {
            label: "Data Set 1",
            x: [sta.min - 1, sta.min - 0.1, sta.min - 0.09, sta.min + 0.09, sta.min+0.1, sta.min+1],
            y: [0,  0, 1, 1, 0,  0]
        }
    }

    for (let i = sta.min; i <= sta.max; i += sta.step) {
        result.push(0)
    }
    for (let i = 0; i < data.length; i++) {
        result[Math.floor((data[i] - sta.min) / sta.step)]++;
    }

    let ob = {
        label: "Data Set 1",
        x: [],
        y: []
    }
    for (let i = sta.min; i <= sta.max; i += sta.step) {
        ob.x.push(i)
        ob.y.push(result[Math.floor((i - sta.min) / sta.step)] / data.length)
    }
    return ob
}

function calstep(data, bin) {
    let max = Math.max(...data),
        min = Math.min(...data);
    return {
        max: max,
        min: min,
        step: (max - min) / bin
    }
}

