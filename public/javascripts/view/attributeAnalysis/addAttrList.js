//div of attributes list  to add
let attrListContainer = d3.select(".dropdown4attributes .attrList").style("display", "none").classed("isshow", false);
let attrsArrShort4 = {
    "Protected Area": "PA", "Metro Area": "MA", "Hii": "HII", "Highway": "HW",
    "Hydrology": "HY", "Tree": "Tree", "Bird": "Bird", "Mammal": "MM", "Amphibian": "AM", "Reptile": "RP", "Fish": "Fish", "Cost": "Cost"
};
Object.keys(attrsArrShort4).forEach(attr => {
    attrListContainer.append("div")
        .attr("class", "attrOption")
        .attr("id", attrsArrShort4[attr] + "option")
        .attr("value", attrsArrShort4[attr])
        .text(attr)
        .on("click", function () {
            if (d3.select(this).classed("isselected")) {
                d3.select(this).classed("isselected", false)
            } else {
                d3.select(this).classed("isselected", true)
            }
            attrlist2show = getselectedattr();
            if (currentGridData) {
                initailizeAllGlobalInfo(attrlist2show, "true");
                toDo4data(currentGridData, attrlist2show);
            } else {
                initailizeAllGlobalInfo(attrlist2show);
            }

        })
})

d3.select(".dropdown4attributes").on("mouseover", function () {
    attrListContainer.style("display", "block").classed("isshow", true)
})
d3.select(".dropdown4attributes").on("mouseout", function () {
    attrListContainer.style("display", "none").classed("isshow", false)
})

function getselectedattr() {
    let thislist = []
    attrListContainer.selectAll(".attrOption").each(function () {
        if (d3.select(this).classed("isselected")) {
            thislist.push(d3.select(this).attr("value") + "")
        }
    })
    return thislist
}


