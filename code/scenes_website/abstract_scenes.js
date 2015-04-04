// You can toggle randomizing the order with randomize, 
// and filter out a list of workers with rmWorkers, and
// change the number of HITs to show with maxHITsShow (0 means all).
// The number of HITs filtering happens AFTER removing workers.
// There are also some dataset-related QS parameters. See the code for that info.
// For example:
// abstract_scenes.html?randomize=1&maxHITsShow=0&rmWorkers=1,2&datasetNames=pilot_lab

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
    } else {
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
    
    if (a == b) {
        return 0;
    } else if (a < b) {
        return -1;
    } else if (a > b) {
        return 1;
    }
}

function zero_pad(num, numZeros) {
    var n = Math.abs(num);
    var zeros = Math.max(0, numZeros - Math.floor(n).toString().length );
    var zeroString = Math.pow(10,zeros).toString().substr(1);
    if(num < 0) {
        zeroString = '-' + zeroString;
    }
    return zeroString+n;
}

function collect_ordered_QS(param_name, pad) {
    
    var array = []; // Store all the data
    var done = false;
    var i = 1;
    var name = '';
    var val = '';
    
    while (done == false) {
        name = param_name + zero_pad(i, pad);
        val = decode(gup(name));

        if (val == "") {
            done = true;
        } else {
            array.push(val);
        }
        i += 1;
    }
    
    return array;
}

// End of misc. JS code
// ***************************************************************************

// Are descriptions available
var descAvail = decode(gup("descAvail"));
if (descAvail == '') {
    descAvail = 1;
} else {
    descAvail = Number(descAvail);
}

// Randomly sort data
var randomize = decode(gup("randomize"));
if (randomize == '') {
    randomize = 1;
} else {
    randomize = Number(randomize);
}

var maxHITsShow = decode(gup("maxHITsShow"));
if (maxHITsShow == '') {
    maxHITsShow = 0; // Show all data
//     maxHITsShow = 100; // Only show 100 imgs
} else {
    maxHITsShow = Number(maxHITsShow);
}

var maxPerWorker = decode(gup("maxPerWorker")); 
if (maxPerWorker == '') {
    maxPerWorker = 0; // Show all data
} else {
    maxPerWorker = Number(maxPerWorker);
}
// Let people remove workers from display by
// specifying QS of rmWorkers=workedid1,workerid2,...
workerFilterStr = decode(gup("rmWorkers"));
workerFilterList = [];
if (workerFilterStr != '') {
    workerFilterList = workerFilterStr.split(",");
}

workersToFilter = workerFilterList.reduce(function(obj, k) {
                            obj[k] = 0; // Value doesn't matter
                            return obj;
                        }, {})

// Let people filter out worker by
// assignmentStatus, e.g., Rejected
assgnStatStr = decode(gup("rmAssgnStat"));
assgnStatFilterList = [];
if (assgnStatStr != '') {
    assgnStatFilterList = assgnStatStr.split(",");
}

assgnStatToFilter = assgnStatFilterList.reduce(function(obj, k) {
                            if (k == 'S') {
                                k = 'Submitted'
                            } else if (k == 'A') {
                                k = 'Approved'
                            } else if (k == 'R') {
                                k = 'Rejected'
                            }
                            obj[k] = true; // Value doesn't matter
                            return obj;
                        }, {})

var datasetIdx = 0;
var datasetIdxStr = decode(gup("datasetIdx"));
if (datasetIdxStr != "") {
    datasetIdx = Number(datasetIdxStr);
}

var base_data_path;
//base_data_path = 'https://vision.ece.vt.edu/abstract_scenes_v002/data/output/';
base_data_path = ['../../data/output/'];
var exp_names_title = ['Abstract Scenes V2'];
var exp_names_internal = ['amt_simple_launch_demo'];
var dataset_names = ['pilot_01'];

baseDataPathStr = decode(gup("baseDataPath"));
if (baseDataPathStr != '') {
    base_data_path = baseDataPathStr.split(",");
}

expNamesTitleStr = decode(gup("expNamesTitle"));
if (expNamesTitleStr != '') {
    exp_names_title = expNamesTitleStr.split(",");
}

expNamesIntStr = decode(gup("expNamesInternal"));
if (expNamesIntStr != '') {
    exp_names_internal = expNamesIntStr.split(",");
}

datasetNamesStr = decode(gup("datasetNames"));
if (datasetNamesStr != '') {
    dataset_names = datasetNamesStr.split(",");
}

img_paths = []
data_filenames = []

exp_names_internal.forEach( function(name, idxExp) {
    var img_path = base_data_path[idxExp] + name + '/' + dataset_names[idxExp] + '/ills/';
    var data_file = base_data_path[idxExp] + name + '/' + dataset_names[idxExp] + 
                    '/json/' + dataset_names[idxExp] + '_noSceneData.min.json';
    img_paths.push(img_path);
    data_filenames.push(data_file);
})

if (datasetIdx > data_filenames.length) {
    datasetIdx = data_filenames.length;
} else if (datasetIdx < 0) {
    datasetIdx = 0;
}

data_filename = data_filenames[datasetIdx]

var jsonDataAll;
var jsonDataSubset

d3.json(data_filename, 
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

    // Assumes only one element...
    html = "<font face='verdana'><b>" + dp.uniqueIndex + ".</b>" ;
    html += "<img src='" + img_paths[datasetIdx] + dp.imgName + 
            "' class='img-responsive center-block' style='min-height:100px; max-height:400px;'" + 
            "alt='An image from the " + dataset_names[datasetIdx] + " dataset.'" + ">";

    if (descAvail) {
        html += "<div class='description text-center'><p><font face='verdana'><b>" + dp.description + "</font></p></div>";
    }
     
    return html;
}

function visualizeit(indata) {
    
    jsonDataAll = indata;
    
    // Add uniqueIndex for website for easy reference
    // TODO Remove d.description if it is actually
    // coming from the AMT data. Just proof-of-concept.
    counter = 0;
    jsonDataAll.forEach( function (d) {
        counter += 1;
        d.uniqueIndex = counter;
        if (descAvail) {
            d.description = "Description " + counter;
        }
    });
    
    assignmentIdNestAll = d3.nest()
        .key(function(d) { return d.assignmentId; } )
        .entries(jsonDataAll)
        
    if (randomize) {
        assignmentIdNestAll = d3.shuffle(assignmentIdNestAll)
    }
    
    assignmentIdNestSubset = assignmentIdNestAll.filter(function(d) {
        return !( d.values[0].workerId in workersToFilter ||
                  d.values[0].assignmentStatus in assgnStatToFilter);
    });
    
    // Only use part of the dataset, after filtering out workers
    if (maxHITsShow > 0) {
        assignmentIdNestSubset = assignmentIdNestSubset.slice(0, maxHITsShow);
    } else {
        assignmentIdNestSubset = assignmentIdNestSubset;
    }
    
    jsonDataSubset = [];
    assignmentIdNestSubset.forEach( function(d) {
        d.values.forEach( function(e) {
            jsonDataSubset.push(e);
        });
    });

    workerNestAll = d3.nest()
        .key(function(d) { return d.workerId; } )
        .key(function(d) { return d.assignmentId; } )
        .key(function(d) { return d.hitIdx; } )
        .entries(jsonDataAll);
        
    workerNestSubset = d3.nest()
        .key(function(d) { return d.workerId; } )
        .key(function(d) { return d.assignmentId; } )
        .key(function(d) { return d.hitIdx; } )
        .entries(jsonDataSubset);
        
    if (randomize) {
        workerNestSubset= d3.shuffle(workerNestSubset)
    }
        
// ************ START COMPUTE STATS *****************
        
    var humansInScenesSubset = [];
    var humansInScenesWorkerFractionsSubset = [];
    var unqCommentsSubset = d3.set([]);     
    var numHITsSubset = [];
    var hitDurationsSubset = [];
    var unqCommentsSubsetData = [];
    
    var humansInScenesAll = [];
    var humansInScenesWorkerFractionsAll = [];
    var humansInScenesWorkerAll = {};
    var unqCommentsAll = d3.set([]);    
    var numHITsAll = [];
    var hitDurationsAll = [];
    var unqCommentsAllData = [];
    
    jsonDataSubset.forEach( function(d) {
        // TODO: Fix assumption that humans available as category
        var humanCount = Number(d.counts.human.count);
        var addToArray = 0;
        
        if (humanCount > 0) {
            addToArray = 1;
        }

        humansInScenesSubset.push(addToArray)
    });
    
    jsonDataAll.forEach( function(d) {
        // TODO: Fix assumption that humans available as category
        var humanCount = d.counts.human.count;
        var addToArray = 0;
        var workerId = d.workerId;
        
        if (humanCount > 0) {
            addToArray = 1;
        }

        if (humansInScenesWorkerAll[workerId] == undefined) {
            humansInScenesWorkerAll[workerId] = {'list': [], 'fraction': 0};
        }
        
        humansInScenesWorkerAll[workerId].list.push(addToArray);
        
        humansInScenesAll.push(addToArray)
    });
    
    for (var workerId in humansInScenesWorkerAll) {
        if (humansInScenesWorkerAll.hasOwnProperty(workerId)) {
            var list = humansInScenesWorkerAll[workerId].list
            
            var sum = list.reduce(function(a, b) { return a + b });
            var avg = sum / list.length;
    
            humansInScenesWorkerAll[workerId].fraction = avg;
        }
    }

    workerNestSubset.forEach( function (d) {
            var fraction = humansInScenesWorkerAll[d.key].fraction;
            humansInScenesWorkerFractionsSubset.push(fraction);
            numHITsSubset.push(d.values.length); 
            d.values.forEach( function(e) { 
                var dp = e.values[0].values[0];
                var comment = dp.hitComment.trim();
                if (comment.length > 0) {
                    unqCommentsSubset.add(dp.workerId + ": " + comment);
                }
                hitDurationsSubset.push(Number(dp.hitDuration)); 
        });    
    });

    unqCommentsSubset.forEach(function(d) { unqCommentsSubsetData.push(d); });
    
    workerNestAll.forEach( function (d) {
        var fraction = humansInScenesWorkerAll[d.key].fraction;
        humansInScenesWorkerFractionsAll.push(fraction);
        numHITsAll.push(d.values.length);
        d.values.forEach( function(e) { 
            var dp = e.values[0].values[0];
            var comment = dp.hitComment.trim();
            if (comment.length > 0) {
                unqCommentsAll.add(dp.workerId + ": " + comment);
            }
            hitDurationsAll.push(Number(dp.hitDuration)); 
        });    
    });

    unqCommentsAll.forEach(function(d) { unqCommentsAllData.push(d); });
    
// ************ END COMPUTE STATS *****************
    
    var titleStr = "<h1 align='center'>" + exp_names_title[datasetIdx] + " " + dataset_names[datasetIdx] + "</h1>" + 
                   "<h4 align='right'>Right-click to show or hide descriptions (if available).</h4>";
    cont = d3.select("div.container")
            .append("row")
            .html(titleStr);
    
    cont.selectAll("div.row.worker")
        .data(workerNestSubset)
        .enter()
        .append("div")
        .attr("class", "row worker")
        .attr("style", "border-top: 8px dashed;")
        .html(function(d) {
                var fraction = humansInScenesWorkerAll[d.key].fraction.toFixed(2);
                return "<h4>Worker: " + d.key +"</h4>" +
                        "<h5>Fraction w/ humans: " + fraction + "</h5>";
            })
        .selectAll("div.row.hit")
        .data(function(d) { 
            if (randomize) {
                data = d3.shuffle(d.values);
            } else {
                data = d.values;
            }
            if (maxPerWorker > 0) {
                data = data.slice(0, maxPerWorker);
            }
            return data; 
        })
        .enter()
        .append("div")
        .attr("class", "row hit")
        .attr("style", "border-top: 2px solid;")
        .html(function(d) {
                return "<h4>HIT: " + d.key + "</h4>";
            })
        .selectAll("div.ill")
        .data(function(d) {return d.values;})
        .enter()
        .append("div")
        .attr("style", "margin-top:30px; margin-bottom:30px;")
        .attr("class", function(d) { 
            var row_len; // One hierachy above
            d3.select(this.parentNode).each(function(d) { row_len = d.values.length })
            return "ill " + numElToColType(row_len);
        })
        .on("mouseover", mouseover) // Just proof-of-concept, feel free to comment out
        .on("mousemove", mousemove) // Just proof-of-concept, feel free to comment out
        .on("mouseout", mouseout) // Just proof-of-concept, feel free to comment out
        .html(imgHTML) // TODO Better, more D3/JS way to do this?
    
    if (numHITsSubset.length > 0) {
        cont.append("div")
            .attr("class", "row comments")
            .attr("style", "border-top: 8px solid;")
            .html("<h3>Unique Comments (displayed):</h3>")
            .selectAll("div.comment")
            .data(unqCommentsSubsetData)
            .enter()
            .append("div")
            .attr("class", "col-xs-12 comment")
            .html(function(dp) {return "<p>" + dp + "</p>"; } )
        
        statsStrSubset = createStatsStr(workerNestSubset.length, 
                                        numHITsSubset, hitDurationsSubset,
                                        humansInScenesSubset,
                                        humansInScenesWorkerFractionsSubset);
        cont.append("div")
            .attr("class", "row stats")
            .attr("style", "border-top: 8px solid;")
            .html("<br><h3>HIT Stats (displayed): </h3>" + statsStrSubset)
    }
    
    if (numHITsAll.length > 0) {
        cont.append("div")
            .attr("class", "row comments")
            .attr("style", "border-top: 8px solid;")
            .html("<h3>Unique Comments (All):</h3>")
            .selectAll("div.comment")
            .data(unqCommentsAllData)
            .enter()
            .append("div")
            .attr("class", "col-xs-12 comment")
            .html(function(dp) {return "<p>" + dp + "</p>"; } )

        statsStrAll = createStatsStr(workerNestAll.length, 
                                     numHITsAll, hitDurationsAll, 
                                     humansInScenesAll,
                                     humansInScenesWorkerFractionsAll);
        cont.append("div")
            .attr("class", "row stats")
            .attr("style", "border-top: 8px solid;")
            .html("<br><h3>HIT Stats (All): </h3>" + statsStrAll)
    }
}

function createStatsStr(numWorkers, numHITs, hitDurations, humansInScenes, humansInScenesWorkerFractions) {

    var sumHITDurations = hitDurations.reduce(function(a, b) { return a + b });
    var avgHITDurations = sumHITDurations / hitDurations.length;

    var sumHITs = numHITs.reduce(function(a, b) { return a + b });
    var avgHITs = sumHITs / numHITs.length;
    
    var sumHumansInScene = humansInScenes.reduce(function(a, b) { return a + b });
    var avgHumansInScene = sumHumansInScene / humansInScenes.length;
    humansInScenesWorkerFractions[0] = 0.3333333;
    
    humansInScenesWorkerFractions.sort(compareNumbers);
    var humansInScenesWorkerFractionsStrs = [];
    humansInScenesWorkerFractions.forEach(function(d) {
        humansInScenesWorkerFractionsStrs.push(d.toFixed(2));
    });
    
    statsStr = '';
    statsStr += "<p>Total Scenes: " + humansInScenes.length + "</p>";
    statsStr += "<p>Fraction with humans: " + avgHumansInScene.toFixed(2) + "</p>";
    statsStr += "<p>Unique workers: " + numWorkers + "</p>";
    statsStr += "<div class='row'><div class='col-xs-10'><p>Fraction with Humans List: " + 
                humansInScenesWorkerFractionsStrs.join(', ') + "</p></div></div>";
    statsStr += "<p>Mean # HITs: " + avgHITs + "</p>";
    statsStr += "<p>Median # HITs: " + d3.median(numHITs) + "</p>";
    statsStr += "<p>Min # HITs: " + d3.min(numHITs) + "</p>";
    statsStr += "<p>Max # HITs: " + d3.max(numHITs) + "</p>";
    statsStr += "<div class='row'><div class='col-xs-10'><p>HIT # List: " + 
                numHITs.sort(compareNumbers).join(', ') + "</p></div></div>";
    statsStr += "<p>Mean HIT Duration: " + avgHITDurations + "</p>";
    statsStr += "<p>Median HIT Duration: " + d3.median(hitDurations) + "</p>";
    statsStr += "<p>Min HIT Duration: " + d3.min(hitDurations) + "</p>";
    statsStr += "<p>Max HIT Duration: " + d3.max(hitDurations) + "</p>";
    
    return statsStr;
}

function compareNumbers(a, b) {
    a = Number(a);
    b = Number(b);
    
    if (a == b) {
        return 0;
    } else if (a < b){
        return -1;
    } else if (a > b) {
        return 1;
    }
}

// For current right-clicking to hide text
var color = "#3D3D3D";
window.oncontextmenu = function() {
    if (color == "#3D3D3D") {
        color = "white";
    } else {
        color = "#3D3D3D";
    }
    $(".description").css('color', color);
    return false;  // cancel default menu
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
    if (dp.hitComment.trim().length > 0) {
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