// ### Changing Interface Behavior via the URL
// (See README.md for additional information.)
// Note: QS is short for query string, i.e., the <name>=<value> stuff after the
// question mark (?) in the URL.
// 
// You have 3 ways of using this interface and 2 demos:
// 
// 1. Load-scene-from-JSON demo mode by jsonDemo=1
// 2. Specify an ordered list of existing scene JSON files to initialize with. 
//    E.g., QS has sceneJSON01=AXOOE_01.json&sceneJSON02=AOEUE_11.json
// 3. Specify an ordered list of scene types to go through. E.g., QS has
//    sceneType01=Park&sceneType02=Living&sceneType03=Kitchen
//    Note: Kitchen currently doesn't exist
// 4. Specify the total number of scenes along with which type of scene. E.g.,
//    QS has sceneType=Park&numScene=4
//    If either one of these are blank, some defaults are used.
//    If both are blank, demo mode.
// 5. Blank-scene demo mode by not having anything in the QS (or everything turned off).
// 
// This order is also the precedence order (e.g., 1's parameters supercede 3's).
// 
// In addition, there are several other QS parameters that you can tweak.
// You only need to specify these when you want to change from the defaults.
// 
// * restrictInput=0 (default is 1) disables checking if 
//    the user work meets our minimum requirements. 
// This is convenient for testing/browing the other parts of the interface.
// * deformHuman=0 uses the original people from Xinlei's version.
//    deformHuman=1 uses the paperdoll/deformable people, which is the default.
// * deformHumanPoseInit=0 uses random poses (for deformable people). 
//    deformHumanPoseInit=1 randomly selects one of the initial poses 
//    that is specified in ...human_deform.json.
//    The other object categories are currently hardcoded in ..._head.js into the
//    deformTypesUse variable. 
//    Adding some code to process the QS and updating
//    this variable (and creating the JSON files) accordingly should be all you 
//    need to do if we add other kinds of deformable categories.
// * sceneConfigFile=abstract_scenes_v002_data_scene_config.json by default,
//    but you can pass the filename via the sceneConfig QS parameter.
//    Note: This is currently only read once at the beginning of the webpage load.
//    Also, if you're loading scenes from JSON files, 
//    all of the scenes that you're loading should come from the same sceneConfigFile.
//    Ideally, we should update the code to be more flexible and 
//    load the correct scene depending on the 
//    sceneConfigFile specified in the sceneJSON data.

// Location of the interface on server--not sure why you'd want this over relative
var baseURL = "https://vision.ece.vt.edu/abstract_scenes_v002/site/";
// Location of the interface -- Easiest to just make it current directory
var baseURL = './'
// Relative location of the image files for the interface
var baseURLInterface = baseURL + "../site_pngs/";
// Use web data location of image files if you don't want to download them locally
// baseURLInterface = "https://vision.ece.vt.edu/abstract_scenes_v002/site_pngs/";
// Location of interface configuration files
var dataURL = baseURL + "../site_data/";
// Location of some demo scenes to load
var sceneJSONURL = baseURL + "../scenes/json/";

// Changing this will affect the non-JSON demo
var AVAIL_SCENE_TYPES = ["Living-All", "Park-All"];

// In case forget to update deformTypesUse
var deformTypeDefault = 'nondeformable'; 
var deformTypesUse = { "human": "deformable",
                       "animal": "nondeformable",
                       "largeObject": "nondeformable",
                       "smallObject": "nondeformable"
                     };

var deformHumanPoseInit; // Whether to init deformable people from set of poses

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

// Names of the object types (e.g., smallObject)
// in a defined order that governs their index
// into availableObject
var objectTypeOrder;

// These come from scene_config.json!
// Will be overwritten in reset_scene()
var minNumObj = 1; // How many clipart objects they need to use.
var maxNumObj = 20; // How many clipart objects they should at most use.
var minJSONPosChange = 10; // How many pixels does object need to move to count as change.
var minJSONSceneChange = 3; // How many things need to change if initializing from JSON.
var minPosChange = 20; // The minimum distance (pixels) to count as change
var minAngleThreshRandInit = 0.05; // The minimum angle (radians) to count as change
var minAnglesChangeRandInit = 3; // How many deformable parts need to change
var minAngleThreshJSONInit = 0.05; // The minimum angle (radians) to count as change
// How many deformable parts need to change.
// In JSON mode, if minAnglesChangeJSONInit == 0, then every angle change of a person
// counts towards minJSONSceneChange. If minAnglesChangeJSONInit > 0, then
// only if the total number of angle changes of a person is greater than minAnglesChangeJSONInit 
// does it count towards one minJSONSceneChange.
var minAnglesChangeJSONInit = 0;
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
var jsonScenesLoaded = false;

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

var deformHumanPoseStr = decode(gup("deformHumanPoseInit"));
if (deformHumanPoseStr != "") {
    if (deformHumanPoseStr == "0") {
        deformHumanPoseInit = false;
    } else {
        deformHumanPoseInit = true;
    }
} else {
    deformHumanPoseInit = true;
}

// Maybe want to parse list of scene types in the future
var sceneTypeList;
var sceneType = "Living";
var curSceneType = '';
var numScene = 3;

var loadSceneJSON = false;
var loadedSceneJSON = {};

var jsonDemoStr = decode(gup("jsonDemo"));
if (jsonDemoStr == "") {
    jsonDemo = false;
} else {
    if (jsonDemoStr != "0") {
        jsonDemo = true;
    } else {
        jsonDemo = false;
    }
}

// Let users specify the URL of the previous scenes
var sceneJSONURLStr = decode(gup('sceneJSONURL'));
if (sceneJSONURLStr != '') {
    sceneJSONURL = sceneJSONURLStr;
}

// Enable load-from-JSON demo
if (jsonDemo) {
    sceneJSONFile = ['35H6S234SA0H5UPSZN4KBGWKULZ65Q_00.min.json',
                     '35H6S234SA0H5UPSZN4KBGWKULZ65Q_01.min.json',
                     '3YOH7BII097523PW7IGYPXV184KVKQ_00.min.json',
                     '3YOH7BII097523PW7IGYPXV184KVKQ_01.min.json'
                    ];

} else {
    // Check if URL has any scenes to load
    sceneJSONFile = collect_ordered_QS('sceneJSON', NUM_QS_ZEROPAD);
}

if (sceneJSONFile.length > 0) {
    // If loading scenes from JSON,
    // must call load_scene_json()
    sceneTypeList = [];
    loadSceneJSON = true;
    numScene = sceneJSONFile.length;
    var sceneJSONIdx = 0;
    var sceneJSONData = {};
    load_scene_json(null, null); // Initially null since recursive call
} else {
    // First try collecting numbered sceneTypes mode
    sceneTypeList = collect_ordered_QS('sceneType', NUM_QS_ZEROPAD);
    numScene = sceneTypeList.length;
    // If none specified, check the sceneType and numScene mode.
    if (numScene == 0) {
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
    } 

    curSceneType = sceneTypeList[0];
    sceneData = Array(numScene);
}

// Splits scene type on hyphens.
// This is so you don't need to add a bunch of stuff to the
// availableScene list in the data_<>.json files for minor 
// tweaks of the same sceneType.
// For example, Living-All is the Living Room scene with
// all possible objects. Living-XinleiSubset has the same
// available objects, but only shows a random subset of 
// each category type. The number of random subsets is 
// consistent with Xinlei's data collection.
// You're free to add new modified versions to data_scene_config.json
// in a similar fashion.
var curSceneTypeBase = extract_scene_type_base(curSceneType)

// Affects what's in the instructions
var titleStr;
if (curSceneTypeBase == "Living") {
    titleStr = "Living/Dining Room";
} else {
    titleStr = curSceneTypeBase;
}

// The scene configuration (for different scene types)
// MUST come from a JSON file. By default,
// it is "abstract_scenes_v002_data_scene_config.json",
// but for your experiments, you probably want to create
// a new one specific to your project.
// The sceneConfigFile gets saved into the sceneData
// that get send back via AMT. The Python script that
// processes the AMT results file will need those files
// to exist in the same folder that the interface expects.
var sceneConfigFile;
var sceneConfigStr = decode(gup("sceneConfig"));

if (sceneConfigStr == "") {
    sceneConfigFile = "abstract_scenes_v002_data_scene_config.json"
} else {
    sceneConfigFile = sceneConfigStr;
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
    if (num < 0) {
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

// Recursively load all JSON files
// Store them in object since can't guarantee
// one finishing loading right after another one.
function load_scene_json(loaded_data, filename) {

    var curSceneFile;

    if (sceneJSONIdx < sceneJSONFile.length) {
        curSceneFile = sceneJSONFile[sceneJSONIdx];
        loadedSceneJSON[curSceneFile] = true;
        sceneJSONIdx += 1;
        if (loaded_data != null) {
            sceneJSONData[filename] = loaded_data;
        }
        
        $.getJSON(sceneJSONURL+curSceneFile).done( 
            function(data) {  console.log("Loading scene JSON " + 
                            curSceneFile +" succeeded.");
                load_scene_json(data, curSceneFile); } )
                        .fail( function(d) {
                            loadedSceneJSON[curSceneFile] = false;
                            console.log("Loading scene JSON " + 
                            curSceneFile +" failed.");
                            randSceneType = get_random_int(0, AVAIL_SCENE_TYPES.length);
                            load_scene_json({"scene": {"sceneType": AVAIL_SCENE_TYPES[randSceneType]},
                                             "failed": true}, curSceneFile);
                        } );
    } else {
        
        sceneJSONData[filename] = loaded_data;
        if (sceneJSONData[filename].hasOwnProperty('failed')) {
            loadedSceneJSON[filename] = false;
        } else {
            loadedSceneJSON[filename] = true;
        }
        for (var i = 0; i < sceneJSONFile.length; i++) {
            sceneTypeList.push(
                sceneJSONData[sceneJSONFile[i]].scene.sceneType
            );
        }
        
        curSceneType = sceneTypeList[0];
        sceneData = Array(sceneJSONFile.length);
        update_instructions();
        jsonScenesLoaded = true;
    }
}

function extract_scene_type_base(sceneName) {
        nameParts = sceneName.split('-');
        return nameParts[0];
}