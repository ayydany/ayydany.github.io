
//generates the timeSlider in the vis
function genTimeSlider() {
    var margin = {top: 10, right: 50, bottom: 10, left: 50}
        width = $("#timeSlider").width(),
        height = $("#timeSlider").height();

    var xScale = d3.scaleLinear()
        .domain([0, years.length-1])
        .range([0, width - margin.top - margin.left-25])
        .clamp(true);


    // make an SVG Container
    var svg = d3.select("#timeSlider").append("svg")
        .attr("width", width - margin.top - margin.left)
        .attr("height", height);

    var slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(10,15)");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", xScale.range()[0])
        .attr("x2", xScale.range()[1])
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .on("click", function() {
            if (d3.event.shiftKey) {
                moveBothHandles(xScale.invert(d3.mouse(this)[0]));
            }})
        .call(d3.drag()
            .on("drag", function () { moveHandleDumb(xScale.invert(d3.event.x)); })
            .on("end", function () { 
                //update global time variable
                if(Math.round(handle1.attr("cx")) <= Math.round(handle2.attr("cx"))){
                    changeTimeline(xScale.invert(handle1.attr("cx")), xScale.invert(handle2.attr("cx")));
                } else 
                    changeTimeline(xScale.invert(handle2.attr("cx")), xScale.invert(handle1.attr("cx")));
             }));

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(xScale.ticks(years.length-1))
        .enter().append("text")
        .attr("x", xScale)
        .attr("text-anchor", "middle")
        .text(function (d) { return years[d]; });

    var handle1 = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 8)
        .attr("cx", xScale(0))
        .on('mouseover', function(d){
            console.log("HOVERING BOI");
            });

    var handle2 = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 8)
        .attr("cx", xScale(27));

    function moveHandleDumb(h){
        target = round(h);
        //select the closest handle to be the one moving
        if(Math.abs(target - xScale.invert(handle1.attr("cx"))) < Math.abs(target - xScale.invert(handle2.attr("cx")))){
            handle1.transition().duration(5)
                .ease(d3.easeElastic)
                .attr("cx", xScale(target));
        } else {
            handle2.transition().duration(5)
                .ease(d3.easeElastic)
                .attr("cx", xScale(target));
        }
    }

    function moveBothHandles(h){
        target = round(h);
        handle1.transition().duration(200)
            .ease(d3.easeElastic)
            .attr("cx", xScale(target));

        handle2.transition().duration(200)
            .ease(d3.easeElastic)
            .attr("cx", xScale(target));
    }

    function round(xScale) {
        if (xScale % 1 >= 0.5) {
            xScale = Math.ceil(xScale);
        }
        else {
            xScale = Math.floor(xScale);
        }
    return xScale;
    }
};

