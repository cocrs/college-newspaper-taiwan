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
        areaMountain: [],
        curData: [],
        curAreaData: [],
        curYear: [],
        max: [],
        curFeature: [],
        curAreaFeature: [],
        isZoomed: [],
        selectedCounty: [],
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

                            this.rentSiteSix = {}
                            for (key in this.rentSiteData) {
                                let cur = this.rentSiteData[key]
                                if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(cur.city)) {
                                    if (typeof this.rentSiteSix[cur.city] == "undefined")
                                        this.rentSiteSix[cur.city] = [{ area: cur.area, counts: cur.counts }]
                                    else this.rentSiteSix[cur.city].push({ area: cur.area, counts: cur.counts })
                                }
                            }
                            console.log(this.rentSiteSix)

                            this.realSix = {}
                            this.realData.forEach((year, index) => {
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

                            // select data
                            this.curData = this.rentSiteSum
                            this.curYear = 2016
                            this.isZoomed = false

                            this.draw_map(this.taiwanCounty, this.taiwanArea)
                            this.draw_mountain(this.taiwanCounty)
                            //this.drop_down_button(this.taiwanCounty, this.rentSiteData, this.realData)
                            this.slider(this.taiwanCounty)
                            this.button(this.taiwanCounty)
                        })
                    })
            })
    },
    methods: {
        update() {
            let projection = d3.geoMercator().center([118, 25]).scale(8500)
            let path = d3.geoPath(projection)
            var lineGenerator = d3.line()
            let linear = d3.scaleLinear().range([0, 200]).domain([0, this.max])

            if (this.isZoomed) {
                //console.log("1")
                this.areaMountain
                    .selectAll("path")
                    .data(this.curAreaFeature)
                    .transition()
                    .duration(1000)
                    .attr("d", (d) => {
                        if (this.selectedCounty == d.properties.COUNTYNAME) {
                            //console.log(this.selectedCounty, d.properties.COUNTYNAME)
                            var dx = 0
                            var dy = 0
                            //console.log(height)
                            curIndex = -1
                            for (i = 0; i < vm.curAreaData[d.properties.COUNTYNAME].length; i++) {
                                if (d.properties.TOWNNAME == vm.curAreaData[d.properties.COUNTYNAME][i].area) {
                                    //console.log(d.properties.TOWNNAME, vm.curAreaData[d.properties.COUNTYNAME][i].area)
                                    curIndex = i
                                    break
                                }
                            }
                            //console.log(this.curAreaData[d.properties.COUNTYNAME][curIndex].counts[this.curYear])
                            if (typeof this.curAreaData[d.properties.COUNTYNAME][curIndex] == "undefined") {
                                height = 0
                            } else if (typeof this.curAreaData[d.properties.COUNTYNAME][curIndex].counts[this.curYear] == "undefined") {
                                height = 0
                            } else {
                                height = linear(this.curAreaData[d.properties.COUNTYNAME][curIndex].counts[this.curYear])
                            }
                            var center = path.centroid(d)
                            //console.log(d.properties.TOWNNAME ,center)
                            var left = [center[0] - 1 + dx, center[1] + dy]
                            var right = [center[0] + 1 + dx, center[1] + dy]
                            var top = [center[0] + dx, center[1] - height + dy]

                            return lineGenerator([left, top, right])
                        }
                    })
            } else {
                //console.log("2")
                this.mountain
                    .selectAll("path")
                    .data(this.curFeature)
                    .transition()
                    .duration(1000)
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
                    .duration(1000)
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
                        console.log(this.curData)
                        return d.properties.COUNTYNAME + " " + this.curData[d.properties.COUNTYNAME].counts[this.curYear].toLocaleString()
                    })
                    .style('opacity', function (d) {
                        if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(d.properties.COUNTYNAME)) {
                            return '100%'
                        }
                        return '0%'
                    })
            }
        },
        draw_map(mapData, areaData) {
            //console.log("here", mapData)
            this.curFeature = topojson.feature(mapData, mapData.objects[Object.keys(mapData.objects)[0]]).features
            let projection = d3.geoMercator().center([118, 25]).scale(8500)
            let path = d3.geoPath(projection)

            d3.select("g.counties")
                .selectAll("path")
                .data(this.curFeature)
                .enter()
                .append("path")
                .attr("d", path)
                .attr('class', 'county-path')
                .on('mouseover', function (a) {
                    if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(a.properties.COUNTYNAME)) {
                        d3.select(this).transition().style('fill', '#434A42')
                    }
                    vm.mountain.selectAll('text')
                        .transition()
                        .style('opacity', 0)
                        .transition()
                        .style('opacity', function (m) {
                            if (m.properties.COUNTYNAME == a.properties.COUNTYNAME) {
                                return 1
                            }
                            return 0
                        })
                        .style('display', function (m) {
                            if (m.properties.COUNTYNAME == a.properties.COUNTYNAME) {
                                return 'block'
                            }
                            return 'none'
                        })
                })
                .on('mouseout', function (a) {
                    d3.select(this).transition().style('fill', '#5F7470')
                    vm.mountain.selectAll('text')
                        .transition()
                        .style('opacity', 0)
                        .transition()
                        .style('opacity', function (m) {
                            if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(m.properties.COUNTYNAME)) {
                                return 1
                            }
                            return 0
                        })
                        .style('display', function (m) {
                            if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(m.properties.COUNTYNAME)) {
                                return 'block'
                            }
                            return 'none'
                        })
                })
                .on("click", function () {
                    d3.select(this).attr("city", function (d) {
                        if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(d.properties.COUNTYNAME)) {
                            var curIndex
                            for (i = 0; i < vm.curFeature.length; i++) {
                                if (d.properties.COUNTYNAME == vm.curFeature[i].properties.COUNTYNAME) curIndex = i
                            }
                            //console.log(curIndex, vm.curFeature[curIndex])
                            dx = 0
                            dy = 0
                            curScale = 5.5
                            if (d.properties.COUNTYNAME == "臺北市") {
                                curScale = 7
                                dx += -60
                                dy += 0
                            }
                            if (d.properties.COUNTYNAME == "新北市") {
                                curScale = 4.0
                                dx += 40
                                dy += 40
                            }
                            if (d.properties.COUNTYNAME == "臺中市") {
                                curScale = 4.8
                            }
                            if (d.properties.COUNTYNAME == "高雄市") {
                                curScale = 4.3
                                dx += 40
                            }
                            const [x, y] = [path.centroid(vm.curFeature[curIndex])[0] - 180 - dx, path.centroid(vm.curFeature[curIndex])[1] - 80 - dy]
                            //console.log(d.properties.COUNTYNAME)
                            d3.event.stopPropagation()
                            svg.transition().duration(1500).call(zoom.transform, d3.zoomIdentity.translate(50, 50).scale(curScale).translate(-x, -y))
                            vm.isZoomed = true
                            vm.selectedCounty = d.properties.COUNTYNAME
                            vm.draw_map(vm.taiwanCounty, vm.taiwanArea)
                            d3.select('g.counties').selectAll('path')
                                .transition()
                                .duration(1000)
                                .style('fill', '#b3b3b3')
                            d3.select("g.areas").selectAll('path')
                                .style('opacity', function (a) {
                                    if (a.properties.COUNTYNAME == d.properties.COUNTYNAME) {
                                        return 1
                                    }
                                    return 0
                                })
                            vm.draw_area_mountain(vm.taiwanArea)
                            vm.mountain.selectAll("path").remove()
                            vm.mountain.selectAll("text").remove()
                        }
                    })
                })

            if (this.isZoomed) {
                //console.log("y")
                d3.select("g.areas")
                    .selectAll("path")
                    .data(topojson.feature(areaData, areaData.objects[Object.keys(areaData.objects)[0]]).features)
                    .enter()
                    .append("path")
                    .attr("d", path)
                    .style('fill', '#5F7470')
                    .style('opacity', 0)

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
            areamoutains = d3.select("g.area-mountain")
            borders = d3.select("path.county-borders")
            areaborders = d3.select("path.area-borders")

            //svg.call(zoom)

            function zoomed() {
                counties.attr("transform", d3.event.transform)
                areas.attr("transform", d3.event.transform)
                mountains.attr("transform", d3.event.transform)
                areamoutains.attr("transform", d3.event.transform)
                borders.attr("transform", d3.event.transform)
                areaborders.attr("transform", d3.event.transform)
            }
        },
        draw_area_mountain(areaData) {
            let projection = d3.geoMercator().center([118, 25]).scale(8500)
            let path = d3.geoPath(projection)
            var lineGenerator = d3.line()
            this.curAreaFeature = topojson.feature(areaData, areaData.objects[Object.keys(areaData.objects)[0]]).features

            if (this.curData == this.rentSiteSum) {
                //console.log("rent")
                this.curAreaData = this.rentSiteSix
            } else {
                //console.log("real")
                this.curAreaData = this.realSix
            }

            //console.log(topojson.feature(areaData, areaData.objects[Object.keys(areaData.objects)[0]]))
            this.areaMountain = d3.select("g.area-mountain")
            this.areaMountain
                .selectAll("path")
                .data(this.curAreaFeature)
                .enter()
                .append("path")
                .classed("filled-rentsite", true)
                .attr("d", (d) => {
                    if (this.selectedCounty == d.properties.COUNTYNAME) {
                        //console.log(this.selectedCounty, d.properties.COUNTYNAME)
                        var dx = 0
                        var dy = 0
                        //console.log(height)
                        var center = path.centroid(d)
                        //console.log(d.properties.TOWNNAME ,center)
                        var left = [center[0] - 1 + dx, center[1] + dy]
                        var right = [center[0] + 1 + dx, center[1] + dy]
                        var top = [center[0] + dx, center[1] + dy]

                        return lineGenerator([left, top, right])
                    }
                })
            this.update(this.selectedCounty)

            let tooltip = d3.select("body").append("div").attr("class", "tooltip")

            this.areaMountain
                .selectAll("path")
                .on("mouseover", function () {
                    d3.select(this).attr("city", function (d) {
                        curIndex = -1
                        for (i = 0; i < vm.curAreaData[d.properties.COUNTYNAME].length; i++) {
                            if (d.properties.TOWNNAME == vm.curAreaData[d.properties.COUNTYNAME][i].area) {
                                //console.log(d.properties.TOWNNAME, vm.curAreaData[d.properties.COUNTYNAME][i].area)
                                curIndex = i
                                break
                            }
                        }
                        if (typeof vm.curAreaData[d.properties.COUNTYNAME][curIndex] == "undefined") {
                            value = 0
                        }
                        else if (typeof vm.curAreaData[d.properties.COUNTYNAME][curIndex].counts[vm.curYear] == "undefined") {
                            value = 0
                        } else {
                            value = vm.curAreaData[d.properties.COUNTYNAME][curIndex].counts[vm.curYear]
                        }
                        label = d.properties.TOWNNAME + "</br>成交量：" + value.toLocaleString()
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
                .style('pointer-events', 'none')
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
                .style('fill', '#DC851F')
                .style("stroke", "none")
                .style('background', 'gray')
                .style("font-weight", "600")
                .text((d) => {
                    return d.properties.COUNTYNAME + " " + this.curData[d.properties.COUNTYNAME].counts[this.curYear].toLocaleString()
                }).style('opacity', function (d) {
                    if (["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"].includes(d.properties.COUNTYNAME)) {
                        return '100%'
                    }
                    return '0%'
                })

            let tooltip = d3.select("body").append("div").attr("class", "tooltip")

            this.mountain
                .selectAll("path")
                .style('pointer-events', 'none')
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
        slider(mapData) {
            var dataTime = d3.range(0, 4).map(function (d) {
                return 105 + d
            })

            var sliderTime = d3.sliderBottom()
                .min(d3.min(dataTime))
                .max(d3.max(dataTime))
                .width(200)
                .step(1)
                .tickFormat(d3.format(""))
                .tickValues(dataTime)
                .default(105)
                .on("onchange", (val) => {
                    d3.select("h1#value-time").text(d3.format("")(val) + '年')
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

            d3.select("h1#value-time").text(d3.format("")(sliderTime.value()) + '年')
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
                    this.curAreaData = this.rentSiteSix
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
                    this.curAreaData = this.realSix
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
                .text("回到最上層")
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
                    d3.select("g.area-mountain").selectAll("path").remove()
                    d3.select('g.counties').selectAll('path')
                        .transition()
                        .duration(1000)
                        .style('fill', '#5F7470')
                    vm.isZoomed = false
                    vm.draw_mountain(vm.taiwanCounty, vm.rentSiteData, vm.realData)
                    vm.draw_map(vm.taiwanCounty, vm.taiwanArea)
                })
        },
    },
})
