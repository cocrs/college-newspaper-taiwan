let vm = new Vue({
    el: "#map",
    data: {
        taiwanCountry: [],
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
    },
    mounted() {
        fetch("./COUNTY_MOI_1081121.json", { mode: "no-cors" })
            .then((res) => res.json())
            .then((result) => {
                this.taiwanCountry = result
                this.draw_map(this.taiwanCountry)
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
                            this.draw_mountain(this.taiwanCountry, this.rentSiteData, this.realData)
                            this.drop_down_button(this.taiwanCountry, this.rentSiteData, this.realData)
                            this.slider(this.taiwanCountry)
                            this.button(this.taiwanCountry)
                        })
                    })
            })
    },
    methods: {
        update(mapData) {
            let projection = d3.geoMercator().center([118, 25]).scale(8500)
            let path = d3.geoPath(projection)
            let cityFeatures = topojson.feature(mapData, mapData.objects["COUNTY_MOI_1081121"]).features
            var lineGenerator = d3.line()
            let linear = d3.scaleLinear().range([0, 200]).domain([0, this.max])

            this.mountain
                .selectAll("path")
                .data(cityFeatures)
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
                .data(cityFeatures)
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
        draw_map(mapData) {
            let cityFeatures = topojson.feature(mapData, mapData.objects["COUNTY_MOI_1081121"]).features
            let projection = d3.geoMercator().center([118, 25]).scale(8500)
            let path = d3.geoPath(projection)

            d3.select("g.counties")
                .selectAll("path")
                .data(topojson.feature(mapData, mapData.objects["COUNTY_MOI_1081121"]).features)
                .enter()
                .append("path")
                .attr("d", path)

            d3.select("path.county-borders").attr(
                "d",
                path(
                    topojson.mesh(mapData, mapData.objects["COUNTY_MOI_1081121"], function (a, b) {
                        return a !== b
                    })
                )
            )

            const zoom = d3.zoom().scaleExtent([1, 40]).on("zoom", zoomed)

            svg = d3.select("svg") //.on("click", reset)

            counties = d3.select("g.counties")
            mountains = d3.select("g.mountain")
            borders = d3.select("path.county-borders")

            svg.call(zoom)
            // function random() {
            //     console.log(d3.select(this))
            //     .on("mouseover", function () {
            //         d3.select(this).attr("city", function (d) {
            //             label = d.properties.COUNTYNAME + "</br>成交量：" + vm.curData[d.properties.COUNTYNAME].counts[vm.curYear]
            //         })
            //     })
            //     const [x, y] = path.centroid()
            //     console.log([x, y])
            //     d3.event.stopPropagation()
            //     svg.transition()
            //         .duration(2500)
            //         .call(
            //             zoom.transform,
            //             d3.zoomIdentity
            //                 .translate(50, 50)
            //                 .scale(5)
            //                 .translate(-x, -y)
            //         )
            // }
            // var width = 0, height =  0;
            // function reset() {
            //     svg.transition()
            //         .duration(750)
            //         .call(zoom.transform, d3.zoomIdentity, d3.zoomTransform(svg.node()).invert([0, 0]))
            // }

            function zoomed() {
                counties.attr("transform", d3.event.transform)
                mountains.attr("transform", d3.event.transform)
                borders.attr("transform", d3.event.transform)
            }
        },
        draw_mountain(mapData, rentSiteData, realData) {
            this.rentSiteSum = {}
            for (key in rentSiteData) {
                let cur = rentSiteData[key]

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
            realData.forEach((year, index) => {
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

            let svg = d3.select("svg")
            let projection = d3.geoMercator().center([118, 25]).scale(8500)
            let path = d3.geoPath(projection)

            let cityFeatures = topojson.feature(mapData, mapData.objects["COUNTY_MOI_1081121"]).features

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
                .data(cityFeatures)
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
                .data(cityFeatures)
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
        drop_down_button(mapData, rentSiteData, realData) {
            let projection = d3.geoMercator().center([120, 25]).scale(8500)
            let path = d3.geoPath(projection)
            let cityFeatures = topojson.feature(mapData, mapData.objects["COUNTY_MOI_1081121"]).features
            var lineGenerator = d3.line()
            let sixCity = ["請選擇縣市", "臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"]
            
            this.rentSiteSix = {}
            for (key in rentSiteData) {
                let cur = rentSiteData[key]
                if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(cur.city)) {
                    if (typeof this.rentSiteSix[cur.city] == "undefined") this.rentSiteSix[cur.city] = [{ area: cur.area, counts: cur.counts }]
                    else this.rentSiteSix[cur.city].push({ area: cur.area, counts: cur.counts })
                }
            }
            console.log(this.rentSiteSix)

            this.realSix = {}
            realData.forEach((year, index) => {
                year.forEach((cur) => {
                    if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(cur.city)) {
                        if (typeof this.realSix[cur.city] == "undefined") {
                            this.realSix[cur.city] = [{ area: cur.area, counts: {} }]
                            this.realSix[cur.city][0].counts[index + 2016] = parseInt(cur.value)
                        } else {
                            var curIndex = -1
                            for (i = 0; i < this.realSix[cur.city].length; i++) {
                                if (this.realSix[cur.city][i].area == cur.area) {
                                    curIndex = i
                                    break
                                }
                            }
                            if (curIndex == -1) {
                                curIndex = this.realSix[cur.city].length
                                this.realSix[cur.city].push({ area: cur.area, counts: {} })
                            } else {
                                this.realSix[cur.city][curIndex].counts[index + 2016] = parseInt(cur.value)
                            }
                        }
                    }
                })
            })
            console.log(this.realSix)

            var dropdownButton = d3
                .select("div.drop_down_button")
                .append("select")
                .style("font-size", "20px")
                .style("position", "absolute")
                .style("border-radius", "3px")
                .style("border-width", "3px")
                .style("font-family", "Microsoft JhengHei")
                .style("padding", "5px")
                .style("left", "150px")
                .style("bottom", "300px")

            dropdownButton
                .selectAll("myOptions")
                .data(sixCity)
                .enter()
                .append("option")
                .text(function (d) {
                    return d
                })
                .attr("value", function (d) {
                    return d
                })
                
            dropdownButton.on("change", function (d) {
                    var selectedOption = d3.select(this).property("value")
                    console.log(selectedOption)
                })
        },
        slider(mapData) {

            var dataTime = d3.range(0, 4).map(function (d) {
                return new Date(2016 + d, 1, 1)
            })

            var sliderTime = d3
                .sliderBottom()
                .min(d3.min(dataTime))
                .max(d3.max(dataTime))
                .step(1000 * 60 * 60 * 24 * 365)
                .width(200)
                .tickFormat(d3.timeFormat("%Y"))
                .tickValues(dataTime)
                .default(new Date(2011, 1, 1))
                .on("onchange", (val) => {
                    d3.select("h1#value-time").text(d3.timeFormat("%Y")(val))
                    // console.log(d3.timeFormat("%Y")(val))
                    this.curYear = d3.timeFormat("%Y")(val)
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

            d3.select("h1#value-time").text(d3.timeFormat("%Y")(sliderTime.value()))
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
        },
    },
})
