let vm = new Vue({
    el: "#map",
    data: {
        taiwanCountry: [],
    },
    mounted() {
        fetch("./COUNTY_MOI_1081121.json", { mode: "no-cors" })
            .then((res) => res.json())
            .then((result) => {
                this.taiwanCountry = result
                this.draw_map(this.taiwanCountry)
                this.draw_mountain(this.taiwanCountry)
                this.drop_down_button(this.taiwanCountry)
                this.slider()
            })
    },
    methods: {
        draw_map(mapData) {
            let projection = d3.geoMercator().center([120.5, 25]).scale(8500)
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
        },
        draw_mountain(mapData) {
            let svg = d3.select("svg")
            let projection = d3.geoMercator().center([120.5, 25]).scale(8500)
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

            let mountain = d3.select("g.mountain")

            mountain
                .selectAll("path")
                .data(cityFeatures)
                .enter()
                .append("path")
                .attr("d", (d) => {
                    var dx = 0
                    var dy = 0
                    if (d.properties.COUNTYNAME == "新北市") {
                        dy += 15
                    }
                    if (d.properties.COUNTYNAME == "嘉義縣") {
                        dx += 15
                    }
                    var center = path.centroid(d)
                    var left = [center[0] - 4 + dx, center[1] + dy]
                    var right = [center[0] + 4 + dx, center[1] + dy]
                    var top = [center[0] + dx, center[1] - (~~(Math.random() * 30) + 10) + dy]

                    return lineGenerator([left, top, right])
                })
                .classed("filled-rentsite", true)

            let tooltip = d3.select("body").append("div").attr("class", "tooltip")

            mountain
                .selectAll("path")
                .on("mouseover", function () {
                    d3.select(this).attr("city", function (d) {
                        label = d.properties.COUNTYNAME
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
        drop_down_button(mapData) {
            var dropdownButton = d3
                .select("div.drop_down_button")
                .append("select")
                .style("font-size", "20px")
                .style("position", "absolute")
                .style("border-radius", "3px")
                .style("border-width", "3px")
                .style("font-family", "Microsoft JhengHei")
                .style("padding", "5px")
                .style("left", "10%")
                .style("bottom", "30%")

            dropdownButton
                .selectAll("myOptions")
                .data(topojson.feature(mapData, mapData.objects["COUNTY_MOI_1081121"]).features)
                .enter()
                .append("option")
                .text(function (d) {
                    return d.properties.COUNTYNAME
                })
                .attr("value", function (d) {
                    return d.properties.COUNTYNAME
                })
        },
        slider() {
            var dataTime = d3.range(0, 10).map(function (d) {
                return new Date(2011 + d, 10, 3)
            })

            var sliderTime = d3
                .sliderBottom()
                .min(d3.min(dataTime))
                .max(d3.max(dataTime))
                .step(1000 * 60 * 60 * 24 * 365)
                .width(300)
                .tickFormat(d3.timeFormat("%Y"))
                .tickValues(dataTime)
                .default(new Date(2020, 10, 3))
                .on("onchange", (val) => {
                    d3.select("p#value-time").text(d3.timeFormat("%Y")(val))
                })

            d3.select("div.row_align-items-center").style("position", "absolute").style("left", "10%").style("bottom", "10%")

            var gTime = d3
                .select("div#slider-time")
                .append("svg")
                .attr("width", 500)
                .attr("height", 100)
                .append("g")
                .attr("transform", "translate(30,30)")

            gTime.call(sliderTime)

            d3.select("p#value-time").text(d3.timeFormat("%Y")(sliderTime.value()))
        },
    },
})
