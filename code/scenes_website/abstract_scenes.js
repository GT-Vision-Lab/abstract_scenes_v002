// ***************************************************************************
// Beginning of misc. JS code

function decode(strToDecode) {
    var encoded = strToDecode;
    return unescape(encoded.replace(/\+/g, " "));
}

function gup(name) {
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var tmpURL = window.location.href;
    var results = regex.exec(tmpURL);
    
    if (results == null) {
        return "";
    }
    else {
        return results[1];
    }
}

function isStringInArray(str, strArray) {
    for (var j = 0; j < strArray.length; j++) {
        if (strArray[j].match(str)) {
            return true;
        }
    }
    return false;
}

function compareStrNumbers(a, b) {
    a = Number(a.key);
    b = Number(b.key);
    
    if ( a == b ) {
        return 0;
    }
    else if ( a < b ) {
        return -1;
    }
    else if ( a > b ) {
        return 1;
    }
}

// End of misc. JS code
// ***************************************************************************
var unqComments = d3.set([]);

randomize = decode(gup("randomize"));
if ( randomize == '' ) {
    randomize = 1;
} 
else {
    randomize = Number(randomize);
}

var jsonData; // a global
var exp_names = ['Funny Scenes'];
var dataset_names = ['pilot_01'];
IMG_PATHS = ["http://vision.ece.vt.edu/funny_scenes/data/output/amt_scene_collection/pilot_01/ills/",
            ];
//DATA_PATH must be local (i.e., not a different URL)
DATA_PATH = "../../data/output/amt_scene_collection/pilot_01/json/"
data_filenames = ["pilot_01_noSceneData.min.json",
                 ];
                  
dataset = decode(gup("dataset"));
datasetIdx = 0;

if (dataset == "pilot_01") {
    datasetIdx = 0;
}

if (datasetIdx > data_filenames.length) {
    datasetIdx = data_filenames.length;
} else if ( datasetIdx < 0 ) {
    datasetIdx = 0;
}

data_filename = data_filenames[datasetIdx]

d3.json(DATA_PATH+data_filename, 
        function(error, json) {
            if (error) return console.warn(error);
        visualizeit(json);
        });

// TODO Do this better?
function numElToColType(numEl) {
    switch(numEl) {
        case 1:
            classStr = "col-xs-12"
            break;
        case 2:
            classStr = "col-xs-6"
            break;
        case 3:
            classStr = "col-xs-4"
            break;
        case 4:
            classStr = "col-xs-3"
            break;
        case 6:
            classStr = "col-xs-2"
            break;
        default:
            classStr = "col-xs-1"
    }
    return classStr;
}

function imgHTML(d) {
    dp = d.values[0];
    
    if ( dp.hitComment.trim().length > 0 ) {
        unqComments.add(dp.workerId + ": " + dp.hitComment.trim());
    }

    // Assumes only one element...
     html = "<img src='" + IMG_PATHS[datasetIdx] + dp.imgName + 
     "' class='img-responsive center-block' style='min-height:100px; max-height:400px;'" + 
     "alt='An image from the " + dataset_names[datasetIdx] + " dataset.'" + ">";
    return html;
}

function visualizeit(indata) {
    
    jsonData = indata;
// Only experiment with part of the dataset
//     jsonData = indata.slice(0, 6);

    if (randomize) {
        jsonData = d3.shuffle(jsonData)
    }
    
    imgNest = d3.nest()
        .key(function(d) { return d.assignmentId; } )
        .key(function(d) { return d.hitIdx; } )
        .entries(jsonData)
    
    cont = d3.select("div.container")
            .append("row")
            .html(
                "<h1>" + exp_names[datasetIdx] + "</h1>" + 
                "<h2>" + dataset_names[datasetIdx] + "</h2>"
            )
   
    cont.selectAll("div.row.hit")
        .data(imgNest)
        .enter()
        .append("div")
        .attr("class", "row hit")
        .attr("style", "border-top: 2px solid;")
        .selectAll("div.ill")
        .data(function(d) { return d.values;})
        .enter()
        .append("div")
        .attr("style", "margin-top:30px; margin-bottom:30px;")
        .attr("class", function(d) { 
            var row_len; // One hierachy above
            d3.select(this.parentNode).each(function(d) { row_len = d.values.length })
            return "ill " + numElToColType(row_len);
        })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseout", mouseout)
        .html(imgHTML) // TODO Better, more D3/JS way to do this?
    
    // Get the selection of all buttons
    all_checkable_divs = d3.selectAll(".button");
    
    unqCommentsData = [];
    unqComments.forEach(function(d) { unqCommentsData.push(d); });
    cont.append("div")
        .attr("class", "row comments")
        .attr("style", "border-top: 8px solid;")
        .html("<h3>Unique Comments:</h3>")
        .selectAll("div.comment")
        .data(unqCommentsData)
        .enter()
        .append("div")
        .attr("class", "col-xs-12 comment")
        .html(function(dp) {return "<p>" + dp + "</p>"; } )
        
    assignmentIdNest = d3.nest()
        .key(function(d) { return d.assignmentId; } )
        .entries(jsonData)
        
    hitDurations = [];
    assignmentIdNest.forEach(function(d) {
        dp = d.values[0]; // Either HIT idx has same time data
        hitDurations.push(Number(dp.hitDuration)); 
    });
    
    var sumHITDurations = hitDurations.reduce(function(a, b) { return a + b });
    var avgHITDurations = sumHITDurations / hitDurations.length;
    
    workerNest = d3.nest()
        .key(function(d) { return d.workerId; } )
        .key(function(d) { return d.assignmentId; } )
        .entries(jsonData)

    numHITs = []
    workerNest.forEach(function(d) { numHITs.push(d.values.length); });
    var sumHITs = numHITs.reduce(function(a, b) { return a + b });
    var avgHITs = sumHITs / numHITs.length;
    
    statsStr = '';
    statsStr += "<p>Unique workers: " + workerNest.length + "</p>";
    statsStr += "<p>Mean # HITs: " + avgHITs + "</p>";
    statsStr += "<p>Median # HITs: " + d3.median(numHITs) + "</p>";
    statsStr += "<p>Min # HITs: " + d3.min(numHITs) + "</p>";
    statsStr += "<p>Max # HITs: " + d3.max(numHITs) + "</p>";
    statsStr += "<p>HIT # List: " + numHITs.sort(compareNumbers) + "</p>";
    statsStr += "<p>Mean HIT Duration: " + avgHITDurations + "</p>";
    statsStr += "<p>Median HIT Duration: " + d3.median(hitDurations) + "</p>";
    statsStr += "<p>Min HIT Duration: " + d3.min(hitDurations) + "</p>";
    statsStr += "<p>Max HIT Duration: " + d3.max(hitDurations) + "</p>";   
//     statsStr += "<p>HIT Duration List: " + hitDurations.sort(compareNumbers) + "</p>";
    
    cont.append("div")
        .attr("class", "row stats")
        .attr("style", "border-top: 8px solid;")
        .html("<br><h3>HIT Stats:</h3>"+statsStr)

}

function compareNumbers(a, b) {
    a = Number(a);
    b = Number(b);
    
    if ( a == b ) {
        return 0;
    }
    else if ( a < b ) {
        return -1;
    }
    else if ( a > b ) {
        return 1;
    }
}


// ***************************************************************************
// Beginning of hover-over tooltip

var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-8);

function mouseover() {
    div.transition()
    .duration(500)
    .style("opacity", 1);
}

function mousemove(d) {
    dp = d.values[0];
    str = '';
    str += 'worker: ';
    str += dp.workerId;
    if (dp.hitComment.trim().length > 0) {
        str += "<br>"
        str += dp.hitComment.trim();
    }
    div.html(str)
    .style("left", (d3.event.pageX+15) + "px")
    .style("top", (d3.event.pageY-0) + "px");
}

function mouseout() {
    div.transition()
    .duration(500)
    .style("opacity", 1e-6);
}

// End of hover-over tooltip
// ***************************************************************************