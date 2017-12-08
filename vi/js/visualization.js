
// global variables
var selectedNode = null,
    currentLevel = 1,   // defines the deepness we're seeing in the vis (Sport = 1; Discipline = 2; Event = 3)
    countryFilter = "USA",
    sportFilter = "All",
    disciplineFilter = "All",
    eventFilter = "All",
    initialYearFilter = 1896,
    endYearFilter = 2012,
    currentFilterKeyword = "Sport";

// colors used throughout the visualization
var color = d3.scaleOrdinal(d3.schemeSet3),
    colorAlt = d3.scaleOrdinal(d3.schemeCategory20);

// years in which olympics occored
var years = [1896, 1900, 1904, 1908, 1912, 1920, 1924, 1928, 1932, 1936, 1948, 1952, 1956, 1960, 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012]

//set a reload function on window resize
window.onresize = function(){ location.reload(); }

// call first vis drawing
$(document).ready(function() {
    genTimeSlider();
    genBubblechart(false, -1);
    genLinechart();
});

// generates a new bubblechart. 
// the update flag must be set to true if its an update of an old bubblechart, false otherwise
// isGoingLower determines the if we're going in a deeper level (-1), staying on the same level (0)
// or going up a level (1)
function genBubblechart(update, isGoingLower) {

    var width = $("#bubblechart").width(),
        height = $("#bubblechart").height(),
        minBubbleSize = 20,
        maxBubbleSize = 65,
        offsetBetweenBubbles = 5;

    // if its a update callback we don't want to create a new svg, so we just select it
    if(!update){
        var svg = d3.select("#bubblechart")
            .append("svg")
            .attr("height", height)
            .attr("width", width)
            .append("g");
    } else
        var svg = d3.select("#bubblechart g");

    // set a automatic bubble scaler
    var radiusScale = d3.scaleSqrt();
    
    var center_force = d3.forceCenter(width / 2, height / 2);  

    // the simulation is a collection of forces
    // about where we want our circles to go
    // and how we want our circles to react
    var simulation = d3.forceSimulation()
        .force("x", d3.forceX().strength(0.05))
        .force("y", d3.forceY().strength(0.05))
        .force("center_force", center_force)
        .force("collide", d3.forceCollide(function(d){
               return radiusScale(d.TotalMedals) + offsetBetweenBubbles;
                })
            );

    drawBubbles(0);

    // update on click with the DOM information of who clicked it
    // isGoingLower is a bool that defines if we're going into a
    // lower or upper level and node is a variable set on click element
    function drawBubbles(isGoingLower) {
        var datasetToUse;
            
        //update current Level to new wanted level
        switch(isGoingLower){
            case -1:
                currentLevel = currentLevel+1;
                break;
            case 0:
                currentLevel = currentLevel;
                break;
            case 1:
                currentLevel = currentLevel-1;
                break;
        }

        //check if currentLevel is possible [1,3]
        //early exit if not possible, and set the currentLevel to regular values
        if( (1 > currentLevel || currentLevel > 3) ){
            switch(currentLevel){
                case 0:
                    currentLevel = 1;
                    break;
                case 4:
                    currentLevel = 3;
                    break;
            }
            return;
        }

        // select the dataset to use according to the level we're in, 
        // and also update css global variables
        switch(currentLevel) {
            case 1:
                datasetToUse = "csv/summer_year_country_sport.csv";
                sportFilter = "All";
                currentFilterKeyword = "Sport";
                $('#statelabel').html("<strong>" + countryFilter 
                    + "</strong> on <strong> every Event </strong> from <strong>" + initialYearFilter 
                    + "</strong> to <strong>" + endYearFilter + "</strong>");
                $('#back-icon').hide(250);
                break;
            case 2:
                datasetToUse = "csv/summer_year_country_discipline.csv";
                sportFilter = selectedNode.Sport;
                currentFilterKeyword = "Discipline";
                $('#statelabel').html("<strong>" + countryFilter + "</strong> on <strong>" 
                    + sportFilter + "</strong> from <strong>" 
                    + initialYearFilter + "</strong> to <strong>" + endYearFilter+ "</strong>");
                $('#back-icon').show(250);
                break;
            case 3:
                datasetToUse = "csv/summer_year_country_event.csv";
                disciplineFilter = selectedNode.Discipline;
                currentFilterKeyword = "Event";
                $('#statelabel').html("<strong>" + countryFilter + "</strong> on <strong>" 
                    + disciplineFilter + "</strong> from <strong>" + initialYearFilter 
                    + "</strong> to <strong>" + endYearFilter+ "</strong>");
                $('#back-icon').show(250);
                break;
        }

        // cleanup view
        svg.selectAll(".bubble").remove();
        svg.selectAll(".label").remove();

        // create new bubbles as necessary
        d3.csv(datasetToUse, function(error, data) {
            data.forEach(function(d){
                d.Year = +d.Year;
                d.GoldCount = +d.GoldCount;
                d.SilverCount = +d.SilverCount;
                d.BronzeCount = +d.BronzeCount;
                d.TotalMedals = (+d.GoldCount + +d.SilverCount + +d.BronzeCount);
            });

            // filter the data, first by year and then by Country
            var filteredData = data.filter(function(d, i){
                if(d["Country"] == countryFilter && initialYearFilter <= d["Year"] && d["Year"] <= endYearFilter){
                    switch(currentLevel){
                        case 1:
                            return d;
                            break;
                        case 2:
                            if (d["Sport"] == sportFilter)
                                return d;
                            break;
                        case 3:
                            if  (d["Discipline"] == disciplineFilter)
                                return d;
                            break;
                    }
                }
            })

            // create a new array with adding up information from different years of the olympics using a specified filter
            var processedData = [];
            filteredData.forEach(function(d, i, filteredData){
                //if the data doesn't exist in the processed array, create it
                if(processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword]) == -1){
                    processedData[processedData.length] = {
                            "Country" : d.Country, 
                            "Sport" : d.Sport, 
                            "Discipline" : d.Discipline,
                            "Event" : d.Event,
                            "GoldCount" : d.GoldCount, 
                            "SilverCount" : d.SilverCount, 
                            "BronzeCount" : d.BronzeCount, 
                            "TotalMedals" : d.TotalMedals
                        }
                } else {
                    //if it already exists simply update variables
                    processedData[processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword])].GoldCount += d.GoldCount;
                    processedData[processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword])].SilverCount += d.SilverCount;
                    processedData[processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword])].BronzeCount += d.BronzeCount;
                    processedData[processedData.findIndex(x => x[currentFilterKeyword] === d[currentFilterKeyword])].TotalMedals += d.TotalMedals;
                }
            })

            // update radiusScale function to work in accordance to size bubbles
            // we scale the larger range domain by scaling it with accordance of the ammount
            // of bubbles that will be drawn on screen
            radiusScale
                .domain([1, (d3.max(processedData, function(d){ return +d.TotalMedals + 5; }) )])
                .range([minBubbleSize, maxBubbleSize - (processedData.length / 2)]);
            
            // a bubble will be drawn for each datapoint
            var bubble = svg.selectAll(".bubble")
                .data(processedData)
                .enter().append("circle")
                .attr("class", "bubble")
                .attr("r", function(d){
                    return radiusScale(d.TotalMedals);
                })
                .attr("fill", function(d){
                    return color(d[currentFilterKeyword]);
                })
                .attr("stroke", function() { return getCSSColor('--main-dark-color') })
                .attr("stroke-width", "2")
                .on('mouseover', function(d){
                    d3.select(this).transition().duration(500)                  
                        .ease(d3.easeElastic)
                        .attr("stroke", function() { return getCSSColor('--main-white-color') })
                        .attr("r", function(d){
                            return radiusScale(d.TotalMedals) + offsetBetweenBubbles;
                        })
                        .style("cursor", "pointer"); 
                    })
                .on('mouseout', function(d){
                    d3.select(this).transition().duration(300)
                        .ease(d3.easeElastic)    
                        .attr("stroke", function() { return getCSSColor('--main-dark-color') })
                        .attr("r", function(d){
                            return radiusScale(d.TotalMedals);
                        })
                        .style("cursor", "default"); 
                })
                .on("click", function(d){
                    // update global variable
                    selectedNode = d;

                    drawBubbles(-1); //going deeper
                    updateLinechart();
                });

            bubble.append("title")
                .text(function(d){
                    return d.GoldCount + " Gold // " + d.SilverCount + " Silver // " 
                        + d.BronzeCount + " Bronze on " + d[currentFilterKeyword];
                })
                
            // text labels that appear on top of the bubbles
            var labels = svg.selectAll(".label")
                .data(processedData)
                .enter().append("text")
                .attr("class","label unselectable")
                .text(function(d){ 
                    if((radiusScale(d.TotalMedals) < 30 && d[currentFilterKeyword].length > 6) || d[currentFilterKeyword].length > 10){
                        return  d[currentFilterKeyword].substring(0, 4) + "...";
                    } else
                        return d[currentFilterKeyword]; 
                })
                
            //back icon functionality
            d3.select('#back-icon')
                .on('mouseover', function(d){
                    d3.select(this).transition()
                        .style("cursor", "pointer"); 
                })
                .on('mouseout', function(d){
                    d3.select(this).transition()
                        .style("cursor", "default"); 
                })
                .on("click", function(d){
                    drawBubbles(1); //going up
                    updateLinechart();
                })

            //restart the animation with a new alpha value
            simulation.nodes(processedData)
                .alpha(1)
                .on('tick', ticked)
                .restart();

            function ticked()  {
                console.log(width);
                bubble
                    .attr("cx", function(d) { return d.x = Math.max(radiusScale(d.TotalMedals), Math.min(width - radiusScale(d.TotalMedals), d.x)); })
                    .attr("cy", function(d) { return d.y = Math.max(radiusScale(d.TotalMedals), Math.min(height - radiusScale(d.TotalMedals), d.y)); })
                    
                labels
                    .attr("x", function(d) { return d.x; } )
                    .attr("y", function(d) { return d.y; } )
            }
        });
    };
};

function genLinechart() {
    var margin = {top: 50, right: 50, bottom: 50, left: 50}
        width = $("#linechart").width() - margin.left - margin.right,
        height = $("#linechart").height() - margin.left - margin.right;

    // The number of olympics
    var n = years.length;
    
    // linear xScale to position the dots (not the axis)
    var xScale = d3.scaleLinear()
        .domain([0, n-1]) // input
        .range([0, width]); // output

    // point scale to draw the X axis
    var xScaleAxis = d3.scalePoint()
        .domain(years) // input
        .range([0, width]); // output

    // Yscale will use the max number of medals possible
    var yScale = d3.scaleLinear()
        .range([height, 0]); // output

    var xAxis = d3.axisBottom(xScaleAxis)
        .tickValues(xScaleAxis.domain().filter(function(d, i) { return !(i % 2); }))

    var line = d3.line()
        .x(function(d, i) { return xScale(i); }) // set the x values for the line generator
        .y(function(d) { return yScale(d.value.TotalMedals); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line

    // start drawing the Linechart from the csv
    d3.csv("csv/summer_year_country_event.csv", function(error, data) {
        data.forEach(function(d){
            d.Year = +d.Year;
            d.TotalMedals = (+d.GoldCount + +d.SilverCount + +d.BronzeCount);
        });

        // Create a nested type data to sort the csv by country and year
        var processedData = d3.nest()
            .key(function(d) {return d.Country})
            .key(function(d) {return d.Year})
            .rollup(function(values) {
                return { 
                    "TotalMedals" : d3.sum(values, function(d) { 
                        return parseFloat(d.TotalMedals);
                    }) 
                };
            })
            .map(data);

            //fill blank spaces in array with zeroes (for years in which a country didn't won any medals)
            for(var i = 0; i < years.length; i++){
                if(!(processedData.get(countryFilter).has(years[i]))){
                    processedData.get(countryFilter).set(years[i], { TotalMedals:0 });
                }
            }

        // automatically resize yScale according to max value of linechart
        yScale.domain([0, (d3.max(processedData.get(countryFilter).entries(), function (d) { return d.value.TotalMedals + 10; }))]);

        var svg = d3.select("#linechart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    
        // Call the x axis in a group tag
        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis); // Create an axis component with d3.axisBottom

        svg.append("g")
            .attr("class", "yAxis")
            .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft
        
        svg.append("path")
            .datum(processedData.get(countryFilter).entries().sort(descending)) // Binds data to the line 
            .attr("class", "line") // Assign a class for styling 
            .attr("d", line); // Calls the line generator 

        // Appends a circle for each datapoint 
        svg.selectAll(".dot")
            .data(processedData.get(countryFilter).entries().sort(descending))
            .enter().append("circle") // Uses the enter().append() method
            .attr("class", "dot") // Assign a class for styling
            .attr("fill", function() { return getCSSColor('--linechart-dot-color') })
            .attr("cx", function(d, i) { return xScale(i) })
            .attr("cy", function(d) { 
                return yScale(d.value.TotalMedals) })
            .attr("r", 5)
            .attr("opacity",1)
            .on('mouseover', function(d){
                d3.select(this).transition()
                    .ease(d3.easeElastic)
                    .duration("500")
                    .attr("r", 10)
                    .attr("stroke-width", 2)
                    .style("cursor", "pointer");
                })
            .on('mouseout', function(d){
                d3.select(this).transition()
                    .ease(d3.easeElastic)
                    .duration("500")
                    .attr("r", function(d){
                        return (checkIfYearInInterval(d.key) ? 8 : 4);
                    })
                    .attr("stroke-width", 1)
                    .style("cursor", "default"); 
            })
            .on("click", function(d){
                initialYearFilter = d.key;
                endYearFilter = d.key;
                genBubblechart(true, 0);
                updateLinechart();
            })
            .append("title")
            .attr("class", "label")
            .text(function(d){
                return d.value.TotalMedals + " Medals in "
                + d.key;
            });
    });
    updateLinechart();

}

//updates linechart dots with a transition when called
function updateLinechart(){
    var margin = {top: 50, right: 50, bottom: 50, left: 50}
        width = $("#linechart").width() - margin.left - margin.right,
        height = $("#linechart").height() - margin.left - margin.right;

    // The number of olympics
    var n = 27;

    // linear xScale to draw the dots
    var xScale = d3.scaleLinear()
        .domain([0, n-1]) // input
        .range([0, width]); // output
  
    d3.csv("csv/summer_year_country_event.csv", function(error, data) {
        data.forEach(function(d){
            d.Year = +d.Year;
            d.TotalMedals = (+d.GoldCount + +d.SilverCount + +d.BronzeCount);
        });

        var processedData = d3.nest()
            .key(function(d) {return d.Country})
            .key(function(d) {return d.Year})
            .rollup(function(values) {
                return { 
                    "TotalMedals" : d3.sum(values, function(d) {
                        switch(currentLevel){
                            case 1:
                                return parseFloat(d.TotalMedals);
                                break;
                            case 2:
                                if (d.Sport == sportFilter) { 
                                    return parseFloat(d.TotalMedals);
                                }
                                    return parseFloat(0);
                                break;
                            case 3:
                                if (d.Discipline == disciplineFilter) {
                                    return parseFloat(d.TotalMedals);
                                }
                                    return parseFloat(0);
                                break;
                        }
                     })
                };
            })
            .map(data);
            
            //fill blank spaces in array with zeroes (for years in which a country didn't won any medals)
            for(var i = 0; i < years.length; i++){
                if(!(processedData.get(countryFilter).has(years[i]))){
                    processedData.get(countryFilter).set(years[i], { TotalMedals:0 });
                }
            }

        // adjust y axis component
        var YScale = d3.scaleLinear()
            .domain([0, (d3.max(processedData.get(countryFilter).entries(), function (d) { return d.value.TotalMedals + 10; }))]) // input 
            .range([height, 0]); // output

        // update line generator for new values
        var lineGenerator = d3.line()
            .x(function(d, i) { return xScale(i); }) // set the x values for the line generator
            .y(function(d) { return YScale(d.value.TotalMedals); }) // set the y values for the line generator 
            .curve(d3.curveMonotoneX) // apply smoothing to the line

        //update linechart in vis
        var svg = d3.select("#linechart");
            
        svg.select(".yAxis")
            .transition()
            .duration(750)
            .call(d3.axisLeft(YScale)); // Create an axis component with d3.axisLeft

        svg.select(".line")
            .datum(processedData.get(countryFilter).entries().sort(descending)) // Binds data to the line
            .transition()
            .duration(750)
            .attr("d", lineGenerator); // Calls the line generator 

        var dots = svg.selectAll(".dot")
            .data(processedData.get(countryFilter).entries().sort(descending));
        
        dots.selectAll("title.label").remove();

        dots.transition()
            .duration(750)
            .attr("cy", function(d) {
                return YScale(d.value.TotalMedals)
            })
            .attr("fill", function(d){
                return (checkIfYearInInterval(d.key) ? getCSSColor('--linechart-dot-highlight-color') 
                    : getCSSColor('--linechart-dot-color'));
            })
            .attr("opacity",function(d){
                return (checkIfYearInInterval(d.key) ? 1 : 0.6);
            })
            .attr("r", function(d){
                return (checkIfYearInInterval(d.key) ? 8 : 4);
            });

        dots.append("title")
            .attr("class", "label")
            .text(function(d){
                return d.value.TotalMedals + " Medals in "
                + d.key;
            })
            
    });
}

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
        .attr("cx", xScale(0));

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
}

// AUXILIARY FUNCTIONS //

//function assumes we never use a year outside of year array
function checkIfYearInInterval(year){
    return (year >= initialYearFilter && year <= endYearFilter);
}

//function to get a CSS variable from the CSS
function getCSSColor(variable){
    return getComputedStyle(document.body).getPropertyValue(variable);
}

// descending filter compararation function
function descending(a,b) { return a.key - b.key };

//DELETEME Debug stuff//
function changeCountry(country){
    countryFilter = String(country);

    genBubblechart(true, 0);
    updateLinechart();
}

function changeTimeline(begin, end){
    //check if a update is necessary
    if(initialYearFilter != years[Math.round(begin)] || endYearFilter != years[Math.round(end)] ){
        initialYearFilter = years[Math.round(begin)];
        endYearFilter = years[Math.round(end)];
    
        genBubblechart(true, 0);
        updateLinechart();
    }

}