// You have 3 ways of using this interface:
// Note: QS is short for query string, i.e., the <name>=<val> stuff after the
// question mark (?) in the URL.
// 1. Specify an ordered list of existing scene JSON files to initialize with.
//    E.g., QS has sceneJSONFile01=AXOOE_01.json&sceneJSONFile02=AOEUE_11.json
// 2. Specify an ordered list of scene types to go through. E.g., QS has
//    sceneType01=Park&sceneType02=Living&sceneType03=Kitchen
//    Note: Kitchen currently doesn't exist
// 3. Specify the total number of scenes along with which type of scene. E.g.,
//    QS has sceneType=Park&numScene=4
//    If either one of these are blank, some defaults are used.
//    If both are blank, demo mode.
// 4. Demo mode
// In that order (e.g., 1's parameters supercede 3's)

// sceneConfigFile = "abstract_scenes_v002_data_scene_config.json" by default
// but you can pass the filename via the sceneConfig QS parameter

// Current interface location
// var baseURL = "./"
var baseURL = "http://vision.ece.vt.edu/abstract_scenes_v002/site/";
var baseURL = './'
var baseURLInterface = baseURL + "../interface/";
var dataURL = baseURL + "../data/";
var sceneJSONURL = baseURL + "../scenes/json/";

var AVAIL_SCENE_TYPES = ["Living-All", "Park-All"];
var AVAIL_SCENE_TYPES = ["Living", "Park"]; // SA: For Larry integration

// In case forget to update deformTypesUse
var deformTypeDefault = 'nondeformable'; 
var deformTypesUse = { "human": "deformable",
                       "animal": "nondeformable",
                       "largeObject": "nondeformable"
                     };

// Xinlei instruction example related
// Keep for Xinlei's examples
var exampleBaseURL = "http://ladoga.graphics.cs.cmu.edu/xinleic/genSents/Interface/";
var ex_total_options = {
                        "Park": 960,
                        "Living": 930,
                        };
// Some random default numbers...
var NUM_GOOD_EXAMPLES = 5;
// Maybe not good to do...
var ex_total = NUM_GOOD_EXAMPLES+1;

// These come from scene_config.json!
// Will be overwritten in reset_scene()
var minNumObj = 1; // How many clipart objects they need to use.
var maxNumObj = 20; // How many clipart objects they should at most use.
var minPosChange = 10; // How many pixels does object need to move to count as change.
var minSceneChange = 3; // How many things need to change if initializing from JSON.
var minPerCatType = 1; // How many clipart of each type is required (unused).
var imgPadNum; // How many zeros to pad image-related names
var defZSize;
var notUsed;
var numZSize;
var numDepth0;
var numDepth1;
var numFlip;

var NUM_QS_ZEROPAD = 2; // Number of digits for QS parameters
var hitID = '';
var assignmentID = '';
var workerID = '';
var curScene = 0;
// Contain all scene objects, which each will contain all info (and more) 
// needed to render an image or load it back into the interface later
var sceneData;

// By default, require restrictions on input
var restrictInputStr = decode(gup("restrictInput"));
if (restrictInputStr == "") {
    restrictInput = true;
} else {
    if (restrictInputStr != "0") {
        restrictInput = true;
    } else {
        restrictInput = false;
    }
}

var deformHumanStr = decode(gup("deformHuman"));
if (deformHumanStr != "") {
    if (deformHumanStr == "0") {
        deformTypesUse['human'] = 'nondeformable';
    } else {
        deformTypesUse['human'] = 'deformable';
    }
}

// Maybe want to parse list of scene types in the future
var sceneTypeList;
var sceneType = "Living";
var curSceneType = '';
var numScene = 3;

var loadSceneJSON = false;

sceneJSONFile = collect_ordered_QS('sceneJSON', NUM_QS_ZEROPAD);

if (sceneJSONFile.length > 0) {
    sceneTypeList = [];
    loadSceneJSON = true;
    numScene = sceneJSONFile.length;
    var sceneJSONIdx = 0;
    var sceneJSONData = {};
    load_scene_json(null, null); // Initially null since recursive call
} else {
    
    sceneTypeList = collect_ordered_QS('sceneType', NUM_QS_ZEROPAD);
    
    if (sceneTypeList.length == 0) {
        var sceneTypeStr = decode(gup("sceneType"));
        var numSceneStr = decode(gup("numScene"));

        if (sceneTypeStr == "" && numSceneStr == "") {
            // Default "demo" settings
            sceneTypeList = AVAIL_SCENE_TYPES;
            numScene = sceneTypeList.length;
        } else {
            if (sceneTypeStr != "") {
                sceneType = sceneTypeStr;
            }

            if (numSceneStr != "") {
                numScene = Number(numSceneStr);
            }
    
            sceneTypeList = []
            for (var i = 0; i < numScene; i++) {
                sceneTypeList.push(sceneType);
            }
        }
    } else {
        numScene = sceneTypeList.length;
    }
    
    curSceneType = sceneTypeList[0];
    sceneData = Array(numScene);
}

var curSceneTypeBase = extract_scene_type_base(curSceneType)

var titleStr;
if (curSceneTypeBase == "Living") {
    titleStr = "Living/Diving Room";
} else {
    titleStr = curSceneTypeBase;
}

var sceneConfigFile;
var sceneConfigStr = decode(gup("sceneConfig"));

if (sceneConfigStr == "") {
    sceneConfigFile = "abstract_scenes_v002_data_scene_config.json"
} else {
    sceneConfigFile = sceneConfig;
}

// ===========================================================
// Functions to help parse the URL query string for AMT data
// ===========================================================
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

function decode(strToDecode) {
    return unescape(strToDecode.replace(/\+/g, " "));
}

function get_random_int(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function zero_pad(num, numZeros) {
    var n = Math.abs(num);
    var zeros = Math.max(0, numZeros - Math.floor(n).toString().length );
    var zeroString = Math.pow(10,zeros).toString().substr(1);
    if( num < 0 ) {
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

        if ( val == "") {
            done = true;
        } else {
            array.push(val);
        }
        i += 1;
    }
    
    return array;
}

// Recursively load all JSON files
// Store them in object since can't guarantee
// one finishing loading right after another one.
function load_scene_json(loaded_data, filename) {

    var curSceneFile;

    if (sceneJSONIdx < sceneJSONFile.length) {
        curSceneFile = sceneJSONFile[sceneJSONIdx];
        sceneJSONIdx += 1;
        if (loaded_data != null) {
            console.log(loaded_data);
            sceneJSONData[filename] = loaded_data;
        }
        
        $.getJSON(sceneJSONURL+curSceneFile).done( 
            function(data) {  console.log("Loading scene JSON " + 
                            curSceneFile +" succeeded.");
                load_scene_json(data, curSceneFile); } )
                        .fail( function(d) { 
                            console.log(curSceneFile);
                            console.log("Loading scene JSON " + 
                            curSceneFile +" failed.");
                            randSceneType = get_random_int(0, AVAIL_SCENE_TYPES.length);
                            load_scene_json({"scene": {"sceneType": AVAIL_SCENE_TYPES[randSceneType]},
                                             "failed": true}, curSceneFile);
//                             sceneJSONData[curSceneFile] = null;
                        } );    
    } else {
        sceneJSONData[filename] = loaded_data;
        for (var i = 0; i < sceneJSONFile.length; i++) {
            sceneTypeList.push(
                sceneJSONData[sceneJSONFile[i]].scene.sceneType
            );
        }
        
        sceneData = Array(numScene);
        curSceneType = sceneTypeList[0];
//         load_obj_category_data();
        update_instructions();
    }
}

function extract_scene_type_base(sceneName) {
        nameParts = sceneName.split('-');
        return nameParts[0];
}