let vm = new Vue({
    el: "#app",
    data: {
        taiwanCountry: [],
    },
    mounted() {
        fetch("./COUNTY_MOI_1081121.json", { mode: "no-cors" })
            .then((res) => res.json())
            .then((result) => {
                this.taiwanCountry = result
                this.draw(this.taiwanCountry)
            })
    },
    methods: {
        draw(mapData) {
            let svg = d3.select("svg")
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

            let tooltip = d3
                .select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("background-color", "white")
                .style("border", "solid")
                .style("position", "center")
                .style("padding", "4px")
                .style("border-width", "2px")
                .style("border-radius", "3px")
                .style("display", "block")
                .style("position", "absolute")
                .style("text-align", "center")
                .style("font-family", "Microsoft JhengHei")
                .style("font-size", "15px")

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

            // mountain
            //     .selectAll("text")
            //     .data(cityFeatures)
            //     .enter()
            //     .append("text")
            //     .attr("x", function (d) {
            //         return path.centroid(d)[0]
            //     })
            //     .attr("y", function (d) {
            //         return path.centroid(d)[1]
            //     })
            //     .attr("text-anchor", "middle")
            //     .attr("font-size", "10px")
            //     .text((d) => {
            //         return d.properties.COUNTYNAME
            //     })
            // mountain
            //     .selectAll("path")
            //     .data(data)
            //     .enter()
            //     .append("path")
            //     .classed("filled", true)
            //     .attr("d", (d) => {
            //         return lineGenerator(d)
            //     })
        },
    },
})
