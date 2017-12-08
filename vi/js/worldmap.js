var dictionary;

createDictionary();
genWorldMap();

function genWorldMap() {
    // Define size of map group
    // Full world map is 2:1 ratio
    // Using 12:5 because we will crop top and bottom of map

    console.log("drawing world map...");

    var w = 2000;
    var h = 1400;
    var minZoom;
    var maxZoom;
    // Define map projection
    var projection = d3.geoEquirectangular()
        .center([0, 14]) // set centre to further North as we are cropping more off bottom of map
        .scale([w / (2 * Math.PI)]) // scale to fit group width
        .translate([w / 2, h / 2]) // ensure centred in group
        ;
    // Define map path
    var path = d3.geoPath()
        .projection(projection)
        ;
    // Define map zoom behaviour
    var zoom = d3.zoom()
        .on("zoom", zoomed)
        ;
    function initiateZoom() {
        // Define a "minzoom" whereby the "Countries" is as small possible without leaving white space at top/bottom or sides  
        minZoom = Math.max(2 * $("#worldmap").width() / w, 2 * $("#worldmap").height() / h);
        console.log(minZoom);

        maxZoom = 20 * minZoom;
        // define X and Y offset for centre of map to be shown in centre of holder
        midX = ($("#worldmap").width() - (minZoom * w)) / 2;
        midY = ($("#worldmap").height() - (minZoom * h)) / 2;
        console.log(midX);
        console.log(midY);
        zoom
            // set minimum extent of zoom to "minzoom", set max extent to a suitable factor of this value 
            .scaleExtent([minZoom, 5 * minZoom])
            // set translate extent so that panning can't cause map to move out of viewport 
            .translateExtent([[0, 0], [w, h]])
            ;
        console.log(zoom);
        // change zoom transform to min zoom and centre offsets
        svg.call(zoom.transform, d3.zoomIdentity.translate(midX, midY).scale(minZoom));
    }
    // on window resize
    $(window).resize(function () {
        // Resize SVG
        svg
            .attr("width", $("#worldmap").width())
            .attr("height", $("#worldmap").height())
            ;
        initiateZoom();
    });
    // create an SVG
    var svg = d3.select("#worldmap")
        .append("svg")
        // set to the same size as the "map-holder" div
        .attr("width", $("#worldmap").width())
        .attr("height", $("#worldmap").height())
        .attr("fill", "#E5E3E3")
        // add zoom functionality 
        .call(zoom)
        ;
    function getTextBox(selection) {
        selection.each(function (d) { d.bbox = this.getBBox(); })
    }
    // get map data
    d3.json("../maps/custom.geo.json", function (json) {
        console.log(json);
        //Bind data and create one path per GeoJSON feature
        countriesGroup = svg
            .append("g")
            .attr("id", "map")
            ;
        // add a background rectangle
        countriesGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", w)
            .attr("height", h)
            ;
        // draw a path for each feature/country
        countries = countriesGroup
            .selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "country")
            // add a mouseover action to show name label for feature/country
            .on("mouseover", function (d, i) {
                $("#countryLabel" + d.properties.iso_a3).show();
            })
            .on("mouseout", function (d, i) {
                $("#countryLabel" + d.properties.iso_a3).hide();
            })
            .on("click", function (d, i) {
                if (d3.event.shiftKey) {
                    if (d3.select(this).classed("country-on") == true)
                        d3.select(this).classed("country-on", false);
                    else
                        d3.select(this).classed("country-on", true);
                }

                else {
                    d3.selectAll(".country").classed("country-on", false);
                    d3.select(this).classed("country-on", true);
                    boxZoom(path.bounds(d), path.centroid(d), 20);
                    var a = d.properties.adm0_a3;
                    if (!dictionary[a])
                        changeCountry(a);
                    else
                        changeCountry(dictionary[a]);
                }

                
            })
            ;
        // Add a label group to each feature/country. This will contain the country name and a background rectangle
        // Use CSS to have class "countryLabel" initially hidden 
        countryLabels = countriesGroup
            .selectAll("g")
            .data(json.features)
            .enter()
            .append("g")
            .attr("class", "countryLabel")
            .attr("id", function (d) {
                return "countryLabel" + d.properties.iso_a3;
            })
            .attr("transform", function (d) {
                return "translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + ")";
            })
            // add mouseover functionality to the label
            .on("mouseover", function (d, i) {
                $("#countryLabel" + d.properties.iso_a3).show();
            })
            .on("mouseout", function (d, i) {
                $("#countryLabel" + d.properties.iso_a3).hide();
            })
            ;
        // add the text to the label group showing country name
        countryLabels
            .append("text")
            .attr("class", "countryName")
            .style("text-anchor", "middle")
            .attr("dx", 0)
            .attr("dy", 0)
            .text(function (d) {
                return d.properties.name;
            })
            .call(getTextBox)
            ;
        // add a background rectangle the same size as the text
        countryLabels
            .insert("rect", "text")
            .attr("class", "countryBg")
            .attr("transform", function (d) {
                return "translate(" + (d.bbox.x - 2) + "," + (d.bbox.y) + ")";
            })
            .attr("width", function (d) { return (d.bbox.width + 4) })
            .attr("height", function (d) { return d.bbox.height })
            ;
        initiateZoom();
    });
    // apply zoom to countriesGroup
    function zoomed() {
        t = d3
            .event
            .transform
            ;
        console.log(t);
        countriesGroup.attr(
            "transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")"
        );
    }
    // zoom to show a bounding box, with optional additional padding as percentage of box size
    function boxZoom(box, centroid, paddingPerc) {
        minXY = box[0];
        maxXY = box[1];
        // find size of map area defined
        zoomWidth = Math.abs(minXY[0] - maxXY[0]);
        zoomHeight = Math.abs(minXY[1] - maxXY[1]);
        // find midpoint of map area defined
        zoomMidX = centroid[0];
        zoomMidY = centroid[1];
        // increase map area to include padding
        zoomWidth = zoomWidth * (1 + paddingPerc / 100);
        zoomHeight = zoomHeight * (1 + paddingPerc / 100);
        // find scale required for area to fill svg
        maxXscale = $("svg").width() / zoomWidth;
        maxYscale = $("svg").height() / zoomHeight;
        zoomScale = Math.min(maxXscale, maxYscale);
        // handle some edge cases
        // limit to max zoom (handles tiny countries)
        zoomScale = Math.min(zoomScale, maxZoom);
        // limit to min zoom (handles large countries and countries that span the date line)
        zoomScale = Math.max(zoomScale, minZoom);
        // Find screen pixel equivalent once scaled
        offsetX = zoomScale * zoomMidX;
        offsetY = zoomScale * zoomMidY;
        // Find offset to centre, making sure no gap at left or top of holder
        dleft = Math.min(0, $("svg").width() / 2 - offsetX);
        dtop = Math.min(0, $("svg").height() / 2 - offsetY);
        // Make sure no gap at bottom or right of holder
        dleft = Math.max($("svg").width() - w * zoomScale, dleft);
        dtop = Math.max($("svg").height() - h * zoomScale, dtop);
        // set zoom
        svg
            .transition()
            .duration(500)
            .call(
            zoom.transform,
            d3.zoomIdentity.translate(dleft, dtop).scale(zoomScale)
            );
    }
}

function createDictionary() {
    dictionary["DZA"] = "ALG";
    dictionary["ASM"] = "ASA";
    dictionary["AGO"] = "ANG";
    dictionary["ATG"] = "ANT";
    dictionary["ABW"] = "ARU";
    dictionary["BHS"] = "BAH";
    dictionary["BHR"] = "BRN";
    dictionary["BGD"] = "BAN";
    dictionary["BRB"] = "BAR";
    dictionary["BLZ"] = "BIZ";
    dictionary["BMU"] = "BER";
    dictionary["BTN"] = "BHU";
    dictionary["BWA"] = "BOT";
    dictionary["VGB"] = "IVB";
    dictionary["BRN"] = "BRU";
    dictionary["BGR"] = "BUL";
    dictionary["BFA"] = "BUR";
    dictionary["KHM"] = "CAM";
    dictionary["CYM"] = "CAY";
    dictionary["TCD"] = "CHA";
    dictionary["CHL"] = "CHI";
    dictionary["COG"] = "CGO";
    dictionary["CRI"] = "CRC";
    dictionary["HRV"] = "CRO";
    dictionary["DNK"] = "DEN";
    dictionary["SLV"] = "ESA";
    dictionary["GNQ"] = "GEQ";
    dictionary["FJI"] = "FIJ";
    dictionary["GMB"] = "GAM";
    dictionary["DEU"] = "GER";
    dictionary["GRC"] = "GRE";
    dictionary["GRD"] = "GRN";
    dictionary["GTM"] = "GUA";
    dictionary["GIN"] = "GUI";
    dictionary["GNB"] = "GBS";
    dictionary["HTI"] = "HAI";
    dictionary["HND"] = "HON";
    dictionary["IDN"] = "INA";
    dictionary["IRN"] = "IRI";
    dictionary["KWT"] = "KUW";
    dictionary["LVA"] = "LAT";
    dictionary["LBN"] = "LIB";
    dictionary["LSO"] = "LES";
    dictionary["LBY"] = "LBA";
    dictionary["MDG"] = "MAD";
    dictionary["MWI"] = "MAW";
    dictionary["MYS"] = "MAS";
    dictionary["MRT"] = "MTN";
    dictionary["MUS"] = "MRI";
    dictionary["MCO"] = "MON";
    dictionary["MNG"] = "MGL";
    dictionary["MMR"] = "MYA";
    dictionary["NPL"] = "NEP";
    dictionary["NLD"] = "NED";
    dictionary["NIC"] = "NCA";
    dictionary["NER"] = "NIG";
    dictionary["NGA"] = "NGR";
    dictionary["OMN"] = "OMA";
    dictionary["PSE"] = "PLE";
    dictionary["PRY"] = "PAR";
    dictionary["PHL"] = "PHI";
    dictionary["PRT"] = "POR";
    dictionary["PRI"] = "PUR";
    dictionary["KNA"] = "SKN";
    dictionary["VCT"] = "VIN";
    dictionary["WSM"] = "SAM";
    dictionary["SAU"] = "KSA";
    dictionary["SYC"] = "SEY";
    dictionary["SGP"] = "SIN";
    dictionary["SVN"] = "SLO";
    dictionary["SLB"] = "SOL";
    dictionary["ZAF"] = "RSA";
    dictionary["LKA"] = "SRI";
    dictionary["SDN"] = "SUD";
    dictionary["CHE"] = "SUI";
    dictionary["TWN"] = "TPE";
    dictionary["TZA"] = "TAN";
    dictionary["TGO"] = "TOG";
    dictionary["TON"] = "TGA";
    dictionary["TTO"] = "TRI";
    dictionary["ARE"] = "UAE";
    dictionary["VIR"] = "ISV";
    dictionary["URY"] = "URU";

    dictionary["ZWE"] = "ZIM";
    dictionary["ZMB"] = "ZAM";
    dictionary["VNM"] = "VIE";
    dictionary["VUT"] = "VAN";
}