let vm = new Vue({
    el: "#map",
    data: {
        taiwanCounty: [],
        taiwanArea: [],
        rentSiteData: [],
        rentSiteSum: [],
        rentSiteSix: [],
        realData: [],
        realSum: [],
        realSix: [],
        mountain: [],
        curData: [],
        curYear: [],
        max: [],
        curFeature: [],
    },
    mounted() {
        fetch("./COUNTY_MOI_1081121.json", { mode: "no-cors" })
            .then((res) => res.json())
            .then((result) => {
                this.taiwanCounty = result
                fetch("./TOWN_MOI_1090324.json", { mode: "no-cors" })
                    .then((res) => res.json())
                    .then((result) => {
                        this.taiwanArea = result
                    })
                fetch("./data/output591Merged.json", { mode: "no-cors" })
                    .then((res) => res.json())
                    .then((result) => {
                        this.rentSiteData = result
                        Promise.all(
                            ["./data/105.csv", "./data/106.csv", "./data/107.csv", "./data/108.csv", "./data/109.csv"].map(function (url) {
                                return fetch(url)
                                    .then(function (response) {
                                        return response.ok ? response.text() : Promise.reject(response.status)
                                    })
                                    .then(function (text) {
                                        return d3.csvParse(text)
                                    })
                            })
                        ).then((value) => {
                            this.realData = value
                            this.rentSiteSum = {}
                            for (key in this.rentSiteData) {
                                let cur = this.rentSiteData[key]
                
                                if (cur.city in this.rentSiteSum) {
                                    for (key2 in cur.counts) {
                                        if (key2 in this.rentSiteSum[cur.city].counts) this.rentSiteSum[cur.city].counts[key2] += cur.counts[key2]
                                        else this.rentSiteSum[cur.city].counts[key2] = cur.counts[key2]
                                    }
                                } else {
                                    this.rentSiteSum[cur.city] = { counts: cur.counts }
                                }
                            }
                            console.log(this.rentSiteSum)
                
                            this.realSum = {}
                            this.realData.forEach((year, index) => {
                                var flag = 0
                                year.forEach((cur) => {
                                    if (typeof this.realSum[cur.city] == "undefined") {
                                        this.realSum[cur.city] = { counts: {} }
                                        this.realSum[cur.city].counts[index + 2016] = 0
                                    }
                                    if (flag == 0) {
                                        for (key in this.realSum) {
                                            this.realSum[key].counts[index + 2016] = 0
                                        }
                                        flag = 1
                                    }
                                    this.realSum[cur.city].counts[index + 2016] += parseInt(cur.value)
                                })
                            })
                            console.log(this.realSum)

                            this.draw_map(this.taiwanCounty, this.taiwanArea, false)
                            this.draw_mountain(this.taiwanCounty)
                            //this.drop_down_button(this.taiwanCounty, this.rentSiteData, this.realData)
                            this.slider(this.taiwanCounty)
                            this.button(this.taiwanCounty)
                        })
                    })
            })
    },
    methods: {
        update(mapData) {
            let projection = d3.geoMercator().center([118, 25]).scale(8500)
            let path = d3.geoPath(projection)
            var lineGenerator = d3.line()
            let linear = d3.scaleLinear().range([0, 200]).domain([0, this.max])

            this.mountain
                .selectAll("path")
                .data(this.curFeature)
                .transition()
                .duration(2000)
                .attr("d", (d) => {
                    var dx = 0
                    var dy = 0
                    if (d.properties.COUNTYNAME == "新北市") {
                        dy += 15
                    }
                    if (d.properties.COUNTYNAME == "嘉義縣") {
                        dx += 15
                    }
                    if (d.properties.COUNTYNAME == "苗栗縣") {
                        dx += 10
                    }
                    //console.log(d.properties.COUNTYNAME, this.curData[d.properties.COUNTYNAME])
                    height = linear(this.curData[d.properties.COUNTYNAME].counts[this.curYear])

                    var center = path.centroid(d)
                    var left = [center[0] - 4 + dx, center[1] + dy]
                    var right = [center[0] + 4 + dx, center[1] + dy]
                    var top = [center[0] + dx, center[1] - height + dy]

                    return lineGenerator([left, top, right])
                })

            this.mountain
                .selectAll("text")
                .data(this.curFeature)
                .transition()
                .duration(2000)
                .attr("x", function (d) {
                    var dx = 0
                    if (d.properties.COUNTYNAME == "新北市") {
                        dx += 40
                    }
                    if (d.properties.COUNTYNAME == "臺北市") {
                        dx -= 40
                    }
                    if (d.properties.COUNTYNAME == "臺南市") {
                        dx -= 25
                    }
                    if (d.properties.COUNTYNAME == "高雄市") {
                        dx += 25
                    }
                    if (d.properties.COUNTYNAME == "桃園市") {
                        dx -= 15
                    }
                    return path.centroid(d)[0] + dx
                })
                .attr("y", function (d) {
                    height = linear(vm.curData[d.properties.COUNTYNAME].counts[vm.curYear])
                    var dy = -5
                    if (d.properties.COUNTYNAME == "新北市") {
                        dy += 15
                    }
                    return path.centroid(d)[1] - height + dy
                })
                .text((d) => {
                    if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(d.properties.COUNTYNAME)) {
                        return d.properties.COUNTYNAME + " " + this.curData[d.properties.COUNTYNAME].counts[this.curYear].toLocaleString()
                    }
                    return ""
                })
        },
        draw_map(mapData, areaData, isZoomed) {
            //console.log("here", mapData)
            this.curFeature = topojson.feature(mapData, mapData.objects[Object.keys(mapData.objects)[0]]).features
            let projection = d3.geoMercator().center([118, 25]).scale(8500)
            let path = d3.geoPath(projection)

            // this.rentSiteSix = {}
            // for (key in rentSiteData) {
            //     let cur = rentSiteData[key]
            //     if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(cur.city)) {
            //         if (typeof this.rentSiteSix[cur.city] == "undefined") this.rentSiteSix[cur.city] = [{ area: cur.area, counts: cur.counts }]
            //         else this.rentSiteSix[cur.city].push({ area: cur.area, counts: cur.counts })
            //     }
            // }
            // console.log(this.rentSiteSix)

            // this.realSix = {}
            // realData.forEach((year, index) => {
            //     year.forEach((cur) => {
            //         if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(cur.city)) {
            //             if (typeof this.realSix[cur.city] == "undefined") {
            //                 this.realSix[cur.city] = [{ area: cur.area, counts: {} }]
            //                 this.realSix[cur.city][0].counts[index + 2016] = parseInt(cur.value)
            //             } else {
            //                 var curIndex = -1
            //                 for (i = 0; i < this.realSix[cur.city].length; i++) {
            //                     if (this.realSix[cur.city][i].area == cur.area) {
            //                         curIndex = i
            //                         break
            //                     }
            //                 }
            //                 if (curIndex == -1) {
            //                     curIndex = this.realSix[cur.city].length
            //                     this.realSix[cur.city].push({ area: cur.area, counts: {} })
            //                 } else {
            //                     this.realSix[cur.city][curIndex].counts[index + 2016] = parseInt(cur.value)
            //                 }
            //             }
            //         }
            //     })
            // })
            // console.log(this.realSix)

            d3.select("g.counties")
                .selectAll("path")
                .data(this.curFeature)
                .enter()
                .append("path")
                .attr("d", path)
                // .on("mouseover", function () {
                //     d3.select(this).attr("city", function (d) {
                //         let label = d.properties.COUNTYNAME
                //     })
                // })
                .on("click", function () {
                    d3.select(this).attr("city", function (d) {
                        if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(d.properties.COUNTYNAME)) {
                            var curIndex
                            for (i = 0; i < vm.curFeature.length; i++) {
                                if (d.properties.COUNTYNAME == vm.curFeature[i].properties.COUNTYNAME) curIndex = i
                            }
                            console.log(curIndex, vm.curFeature[curIndex])
                            dx = 0
                            dy = 0
                            curScale = 4
                            if (d.properties.COUNTYNAME == "臺北市") {
                                curScale = 7
                                dx += -60
                                dy += -20
                            }
                            if (d.properties.COUNTYNAME == "新北市") {
                                dx += 40
                                dy += 40
                            }
                            const [x, y] = [path.centroid(vm.curFeature[curIndex])[0] - 180 - dx, path.centroid(vm.curFeature[curIndex])[1] - 80 - dy]
                            console.log([x, y])
                            d3.event.stopPropagation()
                            svg.transition().duration(2500).call(zoom.transform, d3.zoomIdentity.translate(50, 50).scale(curScale).translate(-x, -y))
                            vm.draw_map(vm.taiwanCounty, vm.taiwanArea, true)
                            vm.mountain.selectAll("path").remove()
                            vm.mountain.selectAll("text").remove()
                        }
                    })
                })
            
            if(isZoomed){
                //console.log("y")
                d3.select("g.areas")
                .selectAll("path")
                .data(topojson.feature(areaData, areaData.objects[Object.keys(areaData.objects)[0]]).features)
                .enter()
                .append("path")
                .attr("d", path)

                d3.select("path.area-borders").attr(
                    "d",
                    path(
                        topojson.mesh(areaData, areaData.objects[Object.keys(areaData.objects)[0]], function (a, b) {
                            return a !== b
                        })
                    )
                )
            }
            d3.select("path.county-borders").attr(
                "d",
                path(
                    topojson.mesh(mapData, mapData.objects[Object.keys(mapData.objects)[0]], function (a, b) {
                        return a !== b
                    })
                )
            )

            const zoom = d3.zoom().scaleExtent([1, 40]).on("zoom", zoomed)

            svg = d3.select("svg") //.on("click", reset)

            counties = d3.select("g.counties")
            areas = d3.select("g.areas")
            mountains = d3.select("g.mountain")
            borders = d3.select("path.county-borders")
            areaborders = d3.select("path.area-borders")

            svg.call(zoom)
            // var width = 0, height =  0;
            // function reset() {
            //     svg.transition()
            //         .duration(750)
            //         .call(zoom.transform, d3.zoomIdentity, d3.zoomTransform(svg.node()).invert([0, 0]))
            // }

            function zoomed() {
                counties.attr("transform", d3.event.transform)
                areas.attr("transform", d3.event.transform)
                mountains.attr("transform", d3.event.transform)
                borders.attr("transform", d3.event.transform)
                areaborders.attr("transform", d3.event.transform)
            }
        },
        draw_mountain(mapData) {

            let svg = d3.select("svg")
            let projection = d3.geoMercator().center([118, 25]).scale(8500)
            let path = d3.geoPath(projection)

            var svgDefsRentSite = svg.append("defs")

            var rentSiteGradient = svgDefsRentSite
                .append("linearGradient")
                .attr("gradientTransform", "rotate(" + 90 + ")")
                .attr("id", "rentSiteGradient")

            rentSiteGradient.append("stop").attr("class", "stop-top-rentsite").attr("offset", "0")

            rentSiteGradient.append("stop").attr("class", "stop-bottom-rentsite").attr("offset", "1")

            var svgDefsReal = svg.append("defs")

            var realGradient = svgDefsReal
                .append("linearGradient")
                .attr("gradientTransform", "rotate(" + 90 + ")")
                .attr("id", "realGradient")

            realGradient.append("stop").attr("class", "stop-top-real").attr("offset", "0")

            realGradient.append("stop").attr("class", "stop-bottom-real").attr("offset", "1")

            var lineGenerator = d3.line()

            this.mountain = d3.select("g.mountain")

            // select data
            this.curData = this.rentSiteSum
            this.curYear = 2016

            var rentSiteMax = 0
            for (key in this.rentSiteSum) {
                for (key2 in this.rentSiteSum[key].counts) {
                    if (this.rentSiteSum[key].counts[key2] > rentSiteMax) {
                        rentSiteMax = this.rentSiteSum[key].counts[key2]
                    }
                }
            }

            this.max = rentSiteMax

            let linear = d3.scaleLinear().range([0, 200]).domain([0, this.max])

            this.mountain
                .selectAll("path")
                .data(this.curFeature)
                .enter()
                .append("path")
                .classed("filled-rentsite", true)
                .attr("d", (d) => {
                    var dx = 0
                    var dy = 0
                    if (d.properties.COUNTYNAME == "新北市") {
                        dy += 15
                    }
                    if (d.properties.COUNTYNAME == "嘉義縣") {
                        dx += 15
                    }
                    if (d.properties.COUNTYNAME == "苗栗縣") {
                        dx += 10
                    }
                    //console.log(height)
                    var center = path.centroid(d)
                    var left = [center[0] - 4 + dx, center[1] + dy]
                    var right = [center[0] + 4 + dx, center[1] + dy]
                    var top = [center[0] + dx, center[1] + dy]

                    return lineGenerator([left, top, right])
                })

            this.update(mapData)

            this.mountain
                .selectAll("text")
                .data(this.curFeature)
                .enter()
                .append("text")
                .attr("x", function (d) {
                    var dx = 0
                    if (d.properties.COUNTYNAME == "新北市") {
                        dx += 40
                    }
                    if (d.properties.COUNTYNAME == "臺北市") {
                        dx -= 40
                    }
                    if (d.properties.COUNTYNAME == "臺南市") {
                        dx -= 25
                    }
                    if (d.properties.COUNTYNAME == "高雄市") {
                        dx += 25
                    }
                    if (d.properties.COUNTYNAME == "桃園市") {
                        dx -= 15
                    }
                    return path.centroid(d)[0] + dx
                })
                .attr("y", function (d) {
                    height = linear(vm.curData[d.properties.COUNTYNAME].counts[vm.curYear])
                    var dy = -5
                    if (d.properties.COUNTYNAME == "新北市") {
                        dy += 15
                    }
                    return path.centroid(d)[1] - height + dy
                })
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .style("stroke", "black")
                .style("font-weight", "100")
                .text((d) => {
                    if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(d.properties.COUNTYNAME)) {
                        return d.properties.COUNTYNAME + " " + this.curData[d.properties.COUNTYNAME].counts[this.curYear].toLocaleString()
                    }
                    return ""
                })

            let tooltip = d3.select("body").append("div").attr("class", "tooltip")

            this.mountain
                .selectAll("path")
                .on("mouseover", function () {
                    d3.select(this).attr("city", function (d) {
                        label = d.properties.COUNTYNAME + "</br>成交量：" + vm.curData[d.properties.COUNTYNAME].counts[vm.curYear].toLocaleString()
                    })
                })
                .on("mousemove", function () {
                    tooltip
                        .html(label)
                        .style("left", d3.event.pageX - 20 + "px")
                        .style("top", d3.event.pageY + 20 + "px")
                        .style("visibility", "visible")
                })
                .on("mouseout", function () {
                    tooltip.style("visibility", "hidden")
                })
        },
        // drop_down_button(mapData, rentSiteData, realData) {
        //     let projection = d3.geoMercator().center([120, 25]).scale(8500)
        //     let path = d3.geoPath(projection)
        //     let this.curFeature = topojson.feature(mapData, mapData.objects[Object.keys(mapData.objects)[0]]).features
        //     var lineGenerator = d3.line()

        //     var dropdownButton = d3
        //         .select("div.drop_down_button")
        //         .append("select")
        //         .style("font-size", "20px")
        //         .style("position", "absolute")
        //         .style("border-radius", "3px")
        //         .style("border-width", "3px")
        //         .style("font-family", "Microsoft JhengHei")
        //         .style("padding", "5px")
        //         .style("left", "150px")
        //         .style("bottom", "300px")

        //     dropdownButton
        //         .selectAll("myOptions")
        //         .data(sixCity)
        //         .enter()
        //         .append("option")
        //         .text(function (d) {
        //             return d
        //         })
        //         .attr("value", function (d) {
        //             return d
        //         })

        //     dropdownButton.on("change", function (d) {
        //             var selectedOption = d3.select(this).property("value")
        //             console.log(selectedOption)
        //         })
        // },
        slider(mapData) {
            var dataTime = d3.range(0, 4).map(function (d) {
                return 105 + d
            })

            var sliderTime = d3
                .sliderBottom()
                .min(d3.min(dataTime))
                .max(d3.max(dataTime))
                .width(200)
                .step(1)
                .tickFormat(d3.format(""))
                .tickValues(dataTime)
                .default(105)
                .on("onchange", (val) => {
                    d3.select("h1#value-time").text(d3.format("")(val))
                    // console.log(d3.timeFormat("%Y")(val))
                    this.curYear = val + 1911
                    this.update(mapData)
                })

            d3.select("div.row_align-items-center").style("position", "absolute").style("left", "150px").style("bottom", "100px")

            var gTime = d3
                .select("div#slider-time")
                .append("svg")
                .attr("width", 250)
                .attr("height", 100)
                .append("g")
                .attr("transform", "translate(30,30)")

            gTime.call(sliderTime)

            d3.select("h1#value-time").text(d3.format("")(sliderTime.value()))
        },
        button(mapData) {
            var button = d3.select("div.button_div")

            button
                .append("button")
                .attr("id", "rent")
                .text("租屋網")
                .classed("button", true)
                .classed("active", true)
                .on("click", () => {
                    this.curData = this.rentSiteSum
                    this.update(mapData)
                    button.select("#rent").classed("active", true)
                    button.select("#real").classed("active", false)
                })

            button
                .append("button")
                .attr("id", "real")
                .text("實價登錄")
                .classed("button", true)
                .on("click", () => {
                    this.curData = this.realSum
                    this.update(mapData)
                    button.select("#real").classed("active", true)
                    button.select("#rent").classed("active", false)
                })

            const zoom = d3.zoom().scaleExtent([1, 40]).on("zoom", zoomed)

            function zoomed() {
                counties.attr("transform", d3.event.transform)
                mountains.attr("transform", d3.event.transform)
                borders.attr("transform", d3.event.transform)
            }

            button
                .append("button")
                .attr("id", "top")
                .text("top")
                .style("position", "absolute")
                .style("top", "100px")
                .style("border-radius", "3px")
                .classed("button", true)
                .on("click", () => {
                    svg = d3.select("svg")
                    svg.transition()
                        .duration(1500)
                        .call(zoom.transform, d3.zoomIdentity, d3.zoomTransform(svg.node()).invert([0, 0]))
                    d3.select("path.area-borders").attr("d", "")
                    d3.select("g.areas").selectAll("path").remove()
                    vm.draw_mountain(vm.taiwanCounty, vm.rentSiteData, vm.realData)
                    vm.draw_map(vm.taiwanCounty, vm.taiwanArea, false)
                })
        },
    },
})
