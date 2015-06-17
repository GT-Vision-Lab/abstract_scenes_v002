// HIT-related Info
var init_time;

var NUM_TABS = 0;

// objectType name -> idx for menu stuff
var objectTypeToIdx; 
var numObjTypeShow;
var numObjTypeReqs;

 // Start off on which tab? Set in scene config file.
var selectedTab;
var selectedTabIdx;
var selectedAttrTab;
var selectedAttrTabIdx;

var curLoadAll;
var numAvailableObjects = 0; // Gets updated in store_json_and_init

// Array with start index of different categories
var clipartIdxStart;

// Keeps track of the configurations for all the scene types.
var sceneConfigData;

// Keeps track of the per-category information about the data.
// I.e., what's in the data_<object category>.json files.
var objectData = {};

// Data for the current (rendered) scene
var curSceneData;
var curAvailableObj;
var curAvailableObjInit;
var curUserSequence;
var curClipartImgs;
var curPeopleExprImgs;
var curPeopleExprImgs = [];
var curPaperdollPartImgs = [];
var curDepth0Used;
var curDepth1Used;
var curInitHistory;
var curDeformTypesUse;

// SA: TODO Clean-up these hacks to make viewing work okay
var loadedObjectsAndBG = false;
var firstInit = false;

// global variables for the page
////// MULTIPLE OBJECTS FOR THE CURRENT SCENE ///////
// Various variables setting up the appearence of the interface
var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 400;
var CANVAS_ROW = 30;
var CANVAS_COL = 20;
var TAB_WIDTH = 0;
var TAB_HEIGHT = 0;
var CLIPART_WIDTH = 0;
var CLIPART_HEIGHT = 0;
var CLIPART_ROW = 0;
var CLIPART_COL = 0;
var CLIPART_BUFFER = 10;
// the row of canvas and the buffer, looks like the starting point
var ATTR_ROW = 0; 
var ATTR_COL = 0;
var ATTR_WIDTH = 0;
var ATTR_HEIGHT = 0;
var ATTR_TYPE_COL = 0;
var ATTR_TYPE_ROW = 0;
var ATTR_TYPE_WIDTH = 0;
var ATTR_TYPE_HEIGHT = 0;

// Adding buttons for pages within tabs
var tabPage = 0;
// SA: Added new offsets since Larry changed things
var tabColOffset = 45;
var tabRowOffset = 70;
var tabPageUpRect = {x1: 20 + tabColOffset, x2:155 + tabColOffset,
                     y1: 5 + tabRowOffset,  y2:55 + tabRowOffset};
var tabPageDownRect = {x1: 180 + tabColOffset, x2: 315 + tabColOffset, 
                       y1: 5 + tabRowOffset,   y2: 55 + tabRowOffset};
var tabPageUpImg;
var tabPageDownImg;

// Grid size of shown clipart objects
var NUM_CLIPART_VERT = 5;
var NUM_CLIPART_HORZ = 5;
var CLIPART_SKIP = 80;
var CLIPART_SIZE = CLIPART_SKIP - 2 * CLIPART_BUFFER;
var CLIPART_OBJECT_OFFSET_COL = 0;
var CLIPART_OBJECT_OFFSET_ROW = 70;
var MAX_NUM_ATTR_PER_ROW = 9;
// Number of clip art to show of the other objects
var CLIPART_OBJECT_COL = CLIPART_COL + CLIPART_SKIP * NUM_CLIPART_HORZ + 24;

// Button size
var SCALE_COL = 0;
var SCALE_ROW = 0;
var SCALE_WIDTH = 120;
var SCALE_HEIGHT = 29;
var FLIP_COL = 0;
var FLIP_ROW = 0;
var scaleSliderDown = false;
var flipDown = false;
var attrSelectorDown = false;
var wasOnCanvas = false;

var i, j, k, l, m;
var bgImg;
var selectedImg;
var buttonImg;
var slideBarImg;
var slideMarkImg;
var noLeftImg;
var numBorderImg;
var canvas_fix;
var ctx;
var image_name;
var category_name;
var mouse_offset_X = 0;
var mouse_offset_Y = 0;
var CLIPART_IMG_FORMAT = 'png'
//current location
var cx = 0;
var cy = 0;
var buttonW = 0;
var buttonH = 0;

// Set in reset_scene()
var selectedIdx = -9999;
var selectedIns = -9999;
var selectedPart = 'null';
var lastIdx = -9999;
var lastIns = -9999;
var selectPaperdollPose = false;
var lastX = 0;
var lastY = 0;
var lastZ = 0;
var lastGlobalRot = 0;
var lastLocalRots = [];

var moveClipart = false;
var userChange = false;

// get response from keyboard
var CTRL_DOWN = false;

// Loads the info about what different scenes are like
// and then also loads the object category specific information
// into the interface. This must finish before we can start
// rendering objects.
load_config_json(); 

// SA: TODO Remove this quick hack that makes 
// sure the interface is being displayed,
// even if JSON/image loading is slow.
window.setInterval(function(){
  draw_canvas();
}, 5000);

// ===========================================================
// Top-level initialization of the website and canvas
// ===========================================================
function init() {

    init_time = $.now();
    curScene = 0;
    
    // Setup the HTML canvas that the entire interactive part will be displayed on
    canvas_fix = document.getElementById("scene_canvas");
    ctx = canvas_fix.getContext("2d");

    canvas_fix.onmousemove = mousemove_canvas;
    canvas_fix.onmousedown = mousedown_canvas;
    canvas_fix.onmouseup = mouseup_canvas;
    
    document.onkeydown = handle_key_down;
    document.onkeyup = handle_key_up;

    // Load all of the images for menus
    selectedImg = new Image();
    selectedImg.src = baseURLInterface + 'selected.png';
    buttonImg = new Image();
    buttonImg.src = baseURLInterface + 'buttons.png';
    slideBarImg = new Image();
    slideBarImg.src = baseURLInterface + 'slidebar.png';
    slideMarkImg = new Image();
    slideMarkImg.src = baseURLInterface + 'slidemark.png';
    noLeftImg = new Image();
    noLeftImg.src = baseURLInterface + 'noleft1.png';
    numBorderImg = new Image();
    numBorderImg.src = baseURLInterface + 'num.png';
    
    // Call draw_canvas() when respective img is dled
    buttonImg.onload = draw_canvas;
    slideBarImg.onload = draw_canvas;
    slideMarkImg.onload = draw_canvas;
    
    // Tab page button images
    tabPageUpImg = new Image();
    tabPageUpImg.src = baseURLInterface + 'previous_button.png';
    tabPageUpImg.onload = draw_canvas;
    tabPageDownImg = new Image();
    tabPageDownImg.src = baseURLInterface + 'next_button.png';
    tabPageDownImg.onload = draw_canvas;

    // SA: Removed because of JSON file loading
//     reset_scene();
    draw_canvas();
}

function reset_scene() {
    
    if (sceneTypeList.length > 0 && sceneConfigData != undefined) {
        curSceneData = sceneData[curScene];
        curSceneType = sceneTypeList[curScene];
        curSceneTypeBase = extract_scene_type_base(curSceneType)
        curSceneConfigData = sceneConfigData[curSceneType];
        
        imgPadNum = curSceneConfigData.imgPadNum;
        notUsed = curSceneConfigData.notUsed;
        defZSize = curSceneConfigData.defZSize;
        minNumObj = curSceneConfigData.minNumObj;
        maxNumObj = curSceneConfigData.maxNumObj;
        minAngleThreshRandInit = curSceneConfigData.minAngleThreshRandInit;
        minAnglesChangeRandInit = curSceneConfigData.minAnglesChangeRandInit;
        minAngleThreshJSONInit = curSceneConfigData.minAngleThreshJSONInit;
        minAnglesChangeJSONInit = curSceneConfigData.minAnglesChangeJSONInit;
        minJSONPosChange = curSceneConfigData.minJSONPosChange;
        minJSONSceneChange = curSceneConfigData.minJSONSceneChange;
        minAngleThresh = curSceneConfigData.minAngleThresh;
        minAnglesChange = curSceneConfigData.minAnglesChange;

        numZSize = curSceneConfigData.numZSize;
        numDepth0 = curSceneConfigData.numDepth0;
        numDepth1 = curSceneConfigData.numDepth1;
        numFlip = curSceneConfigData.numFlip;
        
        selectedIdx = notUsed;
        selectedIns = notUsed; 
        lastIdx = notUsed;
        lastIns = notUsed; 
        lastX = 0;
        lastY = 0;
        lastZ = defZSize; 
        lastGlobalRot = notUsed;
        lastLocalRots = [];
        
        // In the html file
        update_instructions();

        load_obj_category_data();
        
        curZScale = Array(numZSize);
        curZScale[0] = 1.0;
        for (i = 1; i < numZSize; i++) {
            curZScale[i] = curZScale[i - 1] * curSceneConfigData.zSizeDecay;
        }
        
        clipartIdxStart = {};
        clipartIdxStart[objectTypeOrder[0]] = 0;

        for (i = 1; i < objectTypeOrder.length; i++) {
            var prevStartObj = objectTypeOrder[i-1];
            var curStartObj = objectTypeOrder[i];
            clipartIdxStart[curStartObj] = numObjTypeShow[prevStartObj] + clipartIdxStart[prevStartObj];
        }

        selectedIdx = notUsed;
        selectedIns = notUsed;
        moveClipart = false;
        mouse_offset_X = 0;
        mouse_offset_Y = 0;
        
        // Load the background of the scene
        bgImg = new Image();
        bgImg.src = baseURLInterface + 
                    curSceneConfigData.baseDir+ "/" 
                    + curSceneConfigData.bgImg;
        bgImg.onload = draw_canvas;
        
        if (curSceneData != undefined) { // Scene exists from current session
            
            curAvailableObj = curSceneData.availableObject;
            curAvailableObjInit = curSceneData.availableObjectInit;
            curClipartImgs = curSceneData.clipartImgs;
            curPeopleExprImgs = curSceneData.peopleExprImgs;
            curPaperdollPartImgs = curSceneData.paperdollPartImgs;
            curUserSequence = curSceneData.userSequence;
            curLoadAll = curSceneData.loadAll;
            curDepth0Used = curSceneData.depth0Used;
            curDepth1Used = curSceneData.depth1Used;
            curSceneType = curSceneData.sceneType;
            curSceneTypeBase = extract_scene_type_base(curSceneType)
            curInitHistory = curSceneData.initHistory;
            curDeformTypesUse = curSceneData.deformTypesUse;
            curReqsOn = curSceneData.reqsOn;
            
        } else { // Randomly or from previous JSON initialization
            
            curLoadAll = Array(numObjTypeShow["human"]); // flag if to have load all
            for (i = 0; i < curLoadAll.length; i++) {
                curLoadAll[i] = 0;
            }
            
            curSceneData = {};
                        
            if (loadSceneJSON == true) { // From previous JSON object
                curSceneFile = sceneJSONFile[curScene];
                if (sceneJSONData[curSceneFile].hasOwnProperty('failed')) {
                    curInitHistory = ['Failed->Random'];
                    console.log("Failed->Random");
                    rand_obj_init();
                    obj_load_first_imgs();
                } else {
                    curInitHistory = sceneJSONData[curSceneFile].initHistory;
                    if (curInitHistory == undefined) {
                        curInitHistory = ['Random'];
                    }
                    curInitHistory.push(curSceneFile);
                    json_obj_init();
                    obj_load_first_imgs();
                }
            } else { // Random initialization of scene
                curInitHistory = ['Random'];
                rand_obj_init();
                obj_load_first_imgs();
            }
            
            // SA: TODO Should probably wrap this in a nice class initialization or something
            curSceneData.availableObject = curAvailableObj;
            curSceneData.availableObjectInit = curAvailableObjInit;
            curSceneData.clipartImgs = curClipartImgs;
            curSceneData.peopleExprImgs = curPeopleExprImgs;
            curSceneData.paperdollPartImgs = curPaperdollPartImgs;
            curSceneData.loadAll = curLoadAll;
            curSceneData.userSequence = curUserSequence;
            curSceneData.depth0Used = curDepth0Used;
            curSceneData.depth1Used = curDepth1Used;
            curSceneData.sceneType = curSceneType;
            curSceneData.initHistory = curInitHistory;
            curSceneData.deformTypesUse = curDeformTypesUse;
            curSceneData.sceneConfigFile = sceneConfigFile;
            curSceneData.reqsOn = curReqsOn;
        }

        loadedObjectsAndBG = true;
    } else {
        console.log('reset_skipped');
    }
    
    draw_scene();
}

function json_obj_init() {
    
    sceneFilename = sceneJSONFile[curScene];
    // Hack to create a new object so we can detect changes
    curSceneData = JSON.parse(JSON.stringify(sceneJSONData[sceneFilename].scene));
    curAvailableObj = curSceneData.availableObject;
    curClipartImgs = Array(numAvailableObjects);
    curPeopleExprImgs = Array(numObjTypeShow['human']);

    // Overwrite old user tracking history
    curUserSequence = { selectedIdx: [],
                        selectedIns: [],
                        present: [],
                        poseID: [],
                        typeID: [],
                        expressionID: [],
                        x: [],
                        y: [],
                        z: [],
                        flip: [],
                        depth1: [],
                        globalRot: [],
                        localRots: []
                      };
//     // Don't overwrite user tracking history
//     curUserSequence = curSceneData.userSequence;

    curDepth0Used = Array(numDepth0);
    curDepth1Used = Array(numDepth1);
    
    for (i = 0; i < numDepth0; i++) {
        curDepth0Used[i] = 0;
    }
    
    for (i = 0; i < numDepth1; i++) {
        curDepth1Used[i] = 0;
    }
    
    var objInstance;
    var curIdx = 0; // Keep track of how many objects are being added
    for (var i = 0; i < curAvailableObj.length; i++) {
        for (var j = 0; j < curAvailableObj[i].numInstance; j++) {
            objInstance = curAvailableObj[i].instance[j];
            curDepth0Used[objInstance.depth0]++; // just the count
            curDepth1Used[objInstance.depth1]++;
        }
    }
}

function rand_obj_init() {
    
    curDeformTypesUse = {};
    var deformType;
    
    for (var idxCOT in objectTypeOrder) {
        var curObjType = objectTypeOrder[idxCOT];
        if (deformTypesUse[curObjType] == undefined) {
            deformType = deformTypeDefault;
        } else {
            deformType = deformTypesUse[curObjType];
        }
        curDeformTypesUse[curObjType] = deformType;
    }

    curAvailableObj = [];
    curClipartImgs = Array(numAvailableObjects);
    curPeopleExprImgs = Array(numObjTypeShow['human']);
    curUserSequence = { selectedIdx: [],
                        selectedIns: [],
                        present: [],
                        poseID: [],
                        typeID: [],
                        expressionID: [],
                        x: [],
                        y: [],
                        z: [],
                        flip: [],
                        depth1: [],
                        globalRot: [],
                        localRots: []
                      };

    curDepth0Used = Array(numDepth0);
    curDepth1Used = Array(numDepth1);
    
    for (i = 0; i < numDepth0; i++) {
        curDepth0Used[i] = 0;
    }
    
    for (i = 0; i < numDepth1; i++) {
        curDepth1Used[i] = 0;
    }
    
    var curIdx = 0; // Keep track of how many objects are being added
    for (var idxOT in objectTypeOrder) {
        var objectType = objectTypeOrder[idxOT];
        if (objectData.hasOwnProperty(objectType)) {
            curObjectType = objectData[objectType][curDeformTypesUse[objectType]];
            var validIdxs = [];
            for (var k = 0; k < curObjectType.type.length; k++) {
                for (var m = 0; m < curObjectType.type[k].availableScene.length; m++) {
                    if (curObjectType.type[k].availableScene[m].scene == curSceneTypeBase) {
                        validIdxs.push([k, m])
                    }
                }
            }

            var numValidTypes = validIdxs.length;
            numSelObj = numObjTypeShow[curObjectType.objectType];

            for (var j = 0; j < numSelObj; j++) {
                var found = true;
                while (found) {
                    idxType = get_random_int(0, numValidTypes);
                    idxValidType = validIdxs[idxType][0];
                    idxScene = validIdxs[idxType][1];
                    
                    found = false;
                    for (var idxFound = 0; idxFound < curIdx; idxFound++) {
                        if (curAvailableObj[idxFound].instance[0].name == curObjectType.type[idxValidType].name 
                            && curAvailableObj[idxFound].instance[0].type == curObjectType.objectType) {
                            found = true;
                            break;
                        }
                    }
                }
                
                var objs = []; // Array of all individual instances
                var numTotalInstance = curObjectType.type[idxValidType].availableScene[idxScene].numInstance;
                idxStyle = get_random_int(0, curObjectType.type[idxValidType].numStyle);
                for (var k = 0; k < numTotalInstance; k++) {

                    var objInstance = {};

                    if (curObjectType.type[idxValidType].deformable == undefined) {
                        // SA: Temporary hack until I update the object config files
                        objInstance.deformable = false;
                    } else {
                        objInstance.deformable = curObjectType.type[idxValidType].deformable;
                    }
                    
                    objInstance.type = curObjectType.objectType;
                    objInstance.name = curObjectType.type[idxValidType].name;
                    objInstance.instanceID = k;
                    objInstance.present = false;
                    objInstance.x = 0;
                    objInstance.y = 0;
                    objInstance.z = defZSize;
                    objInstance.flip = get_random_int(0, numFlip);
                    objInstance.depth0 = curObjectType.type[idxValidType]
                        .availableScene[idxScene].depth0;
                    objInstance.depth1 = curObjectType.type[idxValidType]
                        .availableScene[idxScene].depth1;
                    
                    if (objInstance.deformable == true) {
                        // SA: Have more things for deformable objects
                        objInstance.body = curObjectType.type[idxValidType].body; // No face
                        objInstance.partIdxList = curObjectType.type[idxValidType].partIdxList;
                        objInstance.globalScale = curObjectType.type[idxValidType].globalScale;
                        objInstance.deformableGlobalRot = Array(curObjectType.type[idxValidType].body.length);
                        objInstance.deformableLocalRot = Array(curObjectType.type[idxValidType].body.length);
                        objInstance.deformableX = Array(curObjectType.type[idxValidType].body.length);
                        objInstance.deformableY = Array(curObjectType.type[idxValidType].body.length);
                    } else {
                        // SA: Anything that only non-deformable objects have?
                    }
                    
                    // Object type-specific fields
                    if (curObjectType.objectType == "human") {
                        objInstance.numExpression = curObjectType.type[idxValidType].numExpression;
                        objInstance.expressionID = 0; // No face
                        
                        if (objInstance.deformable == false) {
                            idxPose = get_random_int(0, curObjectType.type[idxValidType].numPose);
                            objInstance.numStyle = curObjectType.type[idxValidType].numStyle;
                            objInstance.styleID = idxStyle;
                            objInstance.numPose = curObjectType.type[idxValidType].numPose;
                            objInstance.poseID = idxPose;
                        } else {
                            // SA: For original paperdolls, only 1 clothing style
                            objInstance.numStyle = 1;
                            objInstance.styleID = 0;
                            
                            if (deformHumanPoseInit == true) {
                                // Randomly init part rotations, based on init set of poses
                                var numRandInitPoses;
                                var randInitPoseIdx;
                                if (objInstance.body[0].initPose != undefined) {
                                    numRandInitPoses = objInstance.body[0].initPose.length;
                                    randInitPoseIdx = get_random_int(0, numRandInitPoses);
                                }
                                
                                for (var idxParts = 0; idxParts < objInstance.body.length; idxParts++) {
                                    randInitPoses = objInstance.body[idxParts].initPose;
                                    
                                    if (objInstance.body[idxParts].initPose != undefined) {
                                        var noise = (Math.random() - 1.0) * 0.15;
                                        
                                        // Don't add noise to certain elements
                                        if (objInstance.body[idxParts].part == 'Head' || 
                                            objInstance.body[idxParts].part == 'Hair' || 
                                            objInstance.body[idxParts].part == 'LeftHand' || 
                                            objInstance.body[idxParts].part == 'RightHand' || 
                                            objInstance.body[idxParts].part == 'LeftFoot' || 
                                            objInstance.body[idxParts].part == 'RightFoot') {
                                            noise = 0;
                                        }
                                        
                                        objInstance.deformableLocalRot[idxParts] = randInitPoses[randInitPoseIdx] + noise;
                                        objInstance.deformableGlobalRot[idxParts] = randInitPoses[randInitPoseIdx] + noise;
                                        objInstance.randInitPoseIdx = randInitPoseIdx;
                                    } else {
                                        // Data format missing poses
                                        objInstance.deformableLocalRot[idxParts] = (2.0 * Math.random() - 1.0) * 0.5;
                                        objInstance.deformableGlobalRot[idxParts] = objInstance.deformableLocalRot[idxParts];
                                        objInstance.randInitPoseIdx = notUsed;
                                        
                                        if (objInstance.body[idxParts].part == 'Head' || 
                                            objInstance.body[idxParts].part == 'Hair' || 
                                            objInstance.body[idxParts].part == 'Torso' ||
                                            objInstance.body[idxParts].part == 'LeftHand' || 
                                            objInstance.body[idxParts].part == 'RightHand' || 
                                            objInstance.body[idxParts].part == 'LeftFoot' || 
                                            objInstance.body[idxParts].part == 'RightFoot') {
                                            objInstance.deformableGlobalRot[idxParts] = 0;
                                            objInstance.deformableLocalRot[idxParts] = 0;
                                        }
                                    }

                                    objInstance.deformableX[idxParts] = 0;
                                    objInstance.deformableY[idxParts] = 0;
                                }
                            } else {
                                // Randomly init part rotations
                                for (var idxParts = 0; idxParts < objInstance.body.length; idxParts++) {
                                    objInstance.deformableGlobalRot[idxParts] = (2.0 * Math.random() - 1.0) * 0.5;
                                    objInstance.deformableLocalRot[idxParts] = (2.0 * Math.random() - 1.0) * 0.5;
                                    objInstance.deformableX[idxParts] = 0;
                                    objInstance.deformableY[idxParts] = 0;
                                    objInstance.randInitPoseIdx = notUsed;
                                    
                                    if (objInstance.body[idxParts].part == 'Head' || 
                                        objInstance.body[idxParts].part == 'Hair' || 
                                        objInstance.body[idxParts].part == 'Torso' ||
                                        objInstance.body[idxParts].part == 'LeftHand' || 
                                        objInstance.body[idxParts].part == 'RightHand' || 
                                        objInstance.body[idxParts].part == 'LeftFoot' || 
                                        objInstance.body[idxParts].part == 'RightFoot') {
                                        objInstance.deformableGlobalRot[idxParts] = 0;
                                        objInstance.deformableLocalRot[idxParts] = 0;
                                    }
                                }
                            }
                        }
                    } else if (curObjectType.objectType == "animal") {
                        idxPose = get_random_int(0, curObjectType.type[idxValidType].numPose);
                        if (objInstance.deformable == false) {
                            objInstance.numPose = curObjectType.type[idxValidType].numPose;
                            objInstance.poseID = idxPose;
                        } else {
                            // TODO Update this when/if deformable animals need something specific
                        }
                    } else if (curObjectType.objectType == "largeObject" || curObjectType.objectType == "smallObject") {
                        idxType = get_random_int(0, curObjectType.type[idxValidType].numType);
                        // SA: Do we want this at instance-level?
                        objInstance.baseDir = curObjectType.type[idxValidType].baseDir;
                        objInstance.numType = curObjectType.type[idxValidType].numType;
                        objInstance.typeID = idxType;
                        
                    }
                    
                    curDepth0Used[objInstance.depth0]++; // just the count
                    curDepth1Used[objInstance.depth1]++;
                    
                    objs.push(objInstance);
                }
                
                var oneObjectType = {};
                // SA: TODO Move numPose/numExpression stuff into here now or keep it on an instance level?
                // We might want the flexibility of per instance later (if other style/pose settings can change).
                oneObjectType.numInstance = numTotalInstance;
                oneObjectType.smallestUnusedInstanceIdx = 0;
                oneObjectType.instance = objs;
                curAvailableObj.push(oneObjectType);
                curIdx++;
            }
        }
    }
    
    // SA: Hack but it works...
    curAvailableObjInit = JSON.parse(JSON.stringify(curAvailableObj));
}

function get_object_attr_types(objType) {
    
    var curAttrTypes = [];
    var curDeformType = curDeformTypesUse[objType];
    var curAttrList = objectData[objType][curDeformType].attributeTypeList;
    for (var i = 0; i < curAttrList.length; i++) {
        var curAttrType = {};
        var curAttrName = curAttrList[i];

        if (curAttrName == 'Type') {
            curAttrType = {'num': 'numType', 'id': 'typeID'};
        } else if (curAttrName == 'Pose') {
            curAttrType = {'num': 'numPose', 'id': 'poseID'};
        } else if (curAttrName == 'Expression') {
            curAttrType = {'num': 'numExpression', 'id': 'expressionID'};
        }
        curAttrTypes.push(curAttrType);
    }

    return curAttrTypes;
}

function obj_load_first_imgs() {
    
    if (loadSceneJSON == true) {
        var curFile = sceneJSONFile[curScene];
        var curLoaded = loadedSceneJSON[curFile];
        if (curLoaded == true) {
            callbackFnc = draw_canvas;
        } else {
            callbackFnc = draw_clipart;
        }
    } else {
        callbackFnc = draw_clipart;
    }
    
    curPaperdollPartImgs = Array(numObjTypeShow['human']);
    
    var curSceneType = sceneTypeList[curScene];
    var startCategory = sceneConfigData[curSceneType].startTab;
    var imgLoadOrderFirst = [];
    var imgLoadOrderLater = [];
    
    // SA: Maybe this will speed up showing the first set of images
    // based on what the start tab is.
    for (var i = 0; i < numAvailableObjects; i++) {
        if (curAvailableObj[i].instance[0].type == startCategory) {
            imgLoadOrderFirst.push(i);
        } else {
            imgLoadOrderLater.push(i);
        }
    }
    
    var imgLoadOrder = imgLoadOrderFirst.concat(imgLoadOrderLater);

    for (var a = 0; a < numAvailableObjects; a++) {
        var i = imgLoadOrder[a];

        if (curAvailableObj[i].instance[0].type == 'human') {
            if (curAvailableObj[i].instance[0].deformable == true) {            
                // Load paperdoll heads/expression
                curClipartImgs[i] = Array(curAvailableObj[i].instance[0].numExpression);
                curPeopleExprImgs[i] = Array(curAvailableObj[i].instance[0].numExpression);
                for (j = 0; j < curAvailableObj[i].instance[0].numExpression; j++) {
                    curClipartImgs[i][j] = new Image();
                    curClipartImgs[i][j].src =
                        deformable_humanl_expr_img_filename_expr(curAvailableObj[i].instance[0], j);

                    curPeopleExprImgs[i][j] = new Image();
                    curPeopleExprImgs[i][j].src =
                        deformable_humanl_expr_img_filename_expr(curAvailableObj[i].instance[0], j);
                }
            
                // Load paperdoll part images
                curPaperdollPartImgs[i] = Array(curAvailableObj[i].instance[0].body.length);
                for (j = 0; j < curAvailableObj[i].instance[0].body.length; j++) {
                    curPaperdollPartImgs[i][j] = new Image();
                    curPaperdollPartImgs[i][j].src =
                        deformable_human_part_img_filename_expr(curAvailableObj[i].instance[0], curAvailableObj[i].instance[0].body[j].part);
                }
            } else {
                curLoadAll[i] = 0; // set the variable to be zero
                curClipartImgsIdx = curAvailableObj[i].instance[0].poseID * 
                                    curAvailableObj[i].instance[0].numExpression + 
                                    curAvailableObj[i].instance[0].expressionID;
                curClipartImgs[i] = Array(curAvailableObj[i].instance[0].numPose * 
                                    curAvailableObj[i].instance[0].numExpression); // two dimensional array
                curClipartImgs[i][curClipartImgsIdx] = new Image();
                curClipartImgs[i][curClipartImgsIdx].src = 
                    obj_img_filename(curAvailableObj[i].instance[0]);

                curPeopleExprImgs[i] = Array(curAvailableObj[i].instance[0].numExpression);
                curPeopleExprImgs[i][curAvailableObj[i].instance[0].expressionID] = new Image();
                curPeopleExprImgs[i][curAvailableObj[i].instance[0].expressionID].src = 
                    expr_img_filename(curAvailableObj[i].instance[0]);
            }
        } else {
            
            var curObjType = curAvailableObj[i].instance[0].type;
            var curAttrTypes = get_object_attr_types(curObjType);
            
            if (curAttrTypes.length == 1) {
                var curAttrType = curAttrTypes[0];
                curClipartImgs[i] = Array(curAvailableObj[i].instance[0][curAttrType['num']]);
                for (j = 0; j < curAvailableObj[i].instance[0][curAttrType['num']]; j++) {
                    curClipartImgs[i][j] = new Image();
                    curClipartImgs[i][j].src =
                        obj_img_filename_attr1(curAvailableObj[i].instance[0], j);
                }

                curClipartImgs[i][curAvailableObj[i].instance[0][curAttrType['id']]].onload = callbackFnc;
                
            } else {
                // Add when necessary?
            }
        }
    }

    for (i = 0; i < numAvailableObjects; i++) {
        if (curAvailableObj[i].instance[0].type == 'human' &&
            curAvailableObj[i].instance[0].deformable == false) {

            curClipartImgsIdx = curAvailableObj[i].instance[0].poseID * 
                            curAvailableObj[i].instance[0].numExpression + 
                            curAvailableObj[i].instance[0].expressionID;
            curClipartImgs[i][curClipartImgsIdx].onload = draw_clipart;
            curPeopleExprImgs[i][curAvailableObj[i].instance[0].expressionID].onload = callbackFnc;
            
        }
    }
    
//     for (i = 0; i < numAvailableObjects; i++) {
//         if (curAvailableObj[i].instance[0].type != 'human' &&
//             curAvailableObj[i].instance[0].deformable == false) {
//             // TODO Fix for types being an array
//             var curObjType = curAvailableObj[i].instance[0].type;
//             var curAttrTypes = get_object_attr_types(curObjType);
//             curClipartImgs[i][curAvailableObj[i].instance[0][curAttrType['id']]].onload = draw_clipart;
//         }
//     }
    
    for (i = 0; i < numAvailableObjects; i++) {
        if (curAvailableObj[i].instance[0].type == 'human' &&
            curAvailableObj[i].instance[0].deformable == false) {

            var s;
            k = 0;
            for (j = 0; j < curAvailableObj[i].instance[0].numPose; j++) {   
                s = j * curAvailableObj[i].instance[0].numExpression;
                
                curClipartImgs[i][s] = new Image(); 
                curClipartImgs[i][s].src = 
                    obj_img_filename_attr2(curAvailableObj[i].instance[0], k, j);
            }

            // also load the expression only images
            for (j = 0; j <  curAvailableObj[i].instance[0].numExpression; j++) {
                if (curPeopleExprImgs[i][j] != undefined) { // already loaded
                    continue;
                }
                curPeopleExprImgs[i][j] = new Image();
                curPeopleExprImgs[i][j].src = 
                    expr_img_filename_expr(curAvailableObj[i].instance[0], j);
            }

            curLoadAll[i] = 1; // set the variable to be true
            
        }
    }
    
    for (i = 0; i < numAvailableObjects; i++) {
        if (curAvailableObj[i].instance[0].type == 'human' &&
            curAvailableObj[i].instance[0].deformable == false) {

            var s;
            k = 0;
            for (j = 0; j <  curAvailableObj[i].instance[0].numPose; j++) {
                if (curClipartImgs[i][s] != undefined) { // already loaded
                    continue;
                }
                s = j * curAvailableObj[i].instance[0].numExpression;
                curClipartImgs[i][s].onload = callbackFnc;
            }
        
            // also load the expression only images
            for (j = 0; j <  curAvailableObj[i].instance[0].numExpression; j++) {
                if (curPeopleExprImgs[i][j] != undefined) { // already loaded
                    continue;
                }
                curPeopleExprImgs[i][j].onload = callbackFnc;
            }
        }
    }
}

function expr_img_filename(obj) {
    return expr_img_filename_expr(obj, null);
}

function expr_img_filename_expr(obj, exprID) {
    
    var filename;
    var curDeformType = curDeformTypesUse[obj['type']];
        
    if (exprID == null) {
        exprID = obj['expressionID'];
    }
    
    if (obj['type'] == 'human') {
        humanFolder = objectData['human'][curDeformType]['baseDirectory'];
        name = obj['name'] + 
               zero_pad((exprID+1), imgPadNum) +
               '.' + CLIPART_IMG_FORMAT; 
            
        filename = baseURLInterface + 
                    humanFolder + '/Expressions/' + name;
    } else {
        filename = null;
    }
    
    return filename;
}

function deformable_humanl_expr_img_filename_expr(obj, exprID) {

    var filename;
    var curDeformType = curDeformTypesUse[obj['type']];
    
    if (exprID == null) {
        exprID = obj['expressionID'];
    }

    // SA TODO Update to be more flexible
    if (obj['type'] == 'human') {
        humanFolder = objectData['human'][curDeformType]['baseDirectory'];
        name = obj['name'] +
               zero_pad((exprID + 1), imgPadNum) +
               '.' + CLIPART_IMG_FORMAT;

        filename = baseURLInterface +
                    humanFolder + '/Expressions/'  + name;
    } else {
        filename = null;
    }

    return filename;
}

function deformable_human_part_img_filename_expr(obj, partName) {

    var filename;
    var curDeformType = curDeformTypesUse[obj['type']];

    if (obj['type'] == 'human') {
        humanFolder = objectData['human'][curDeformType]['baseDirectory'];
        name = obj['name'] + '/' + 
               partName +
               '.' + CLIPART_IMG_FORMAT;

        filename = baseURLInterface +
                    humanFolder + '/' + name;
    } else {
        filename = null;
    }

    return filename;
}

// SA: TODO Good way of doing this in JS?
// Probably method on self on something...
function obj_img_filename(obj) {
    return obj_img_filename_general(obj, null, null, null);
}

function obj_img_filename_attr1(obj, attr1) {
    return obj_img_filename_general(obj, attr1, null, null);
} 

function obj_img_filename_attr2(obj, attr1, attr2) {
    return obj_img_filename_general(obj, attr1, attr2, null);
}

// You can ask for a specific style, pose, or expression ID image
// instead of the one that the object currently has.
function obj_img_filename_general(obj, attr1, attr2, attr3) {
    var curObjType = obj.type;
    var curAttrTypes = get_object_attr_types(curObjType);
    var curDeformType = curDeformTypesUse[curObjType];
    
    if (attr1 == null) {
        attr1 = obj[curAttrTypes[0]['id']];
    }
        
    if (curObjType == 'largeObject' || curObjType == 'smallObject') {
        sceneFolder = sceneConfigData['baseDirectory'][obj['baseDir']];
        name = obj['name'] + zero_pad((attr1+1), imgPadNum) +
               '.' + CLIPART_IMG_FORMAT; 
        filename = baseURLInterface + 
                   sceneFolder + '/' + name;
    } else if (curObjType == 'animal') {
        animalFolder = objectData['animal'][curDeformType]['baseDirectory'];
        name = obj['name'] + zero_pad((attr1+1), imgPadNum) +
               '.' + CLIPART_IMG_FORMAT; 
        filename = baseURLInterface + 
                   animalFolder + '/' + name;
    } else if (curObjType == 'human') {
        // SA: TODO Remove hardcodedness
        if (attr2 == null) {
            attr2 = obj[curAttrTypes[1]['id']]; // poseID
        }
        if (attr3 == null) {
            attr3 = obj['styleID'];
        }
        
        humanFolder = objectData['human'][curDeformType]['baseDirectory'];
        styleFolder = obj['name'] + zero_pad((attr3+1), imgPadNum);
        
        name = zero_pad((attr2+1), imgPadNum) +
               zero_pad((attr1+1), imgPadNum) +
               '.' + CLIPART_IMG_FORMAT; 
        filename = baseURLInterface + 
                   humanFolder + '/' + styleFolder + '/' + name;  
    } else {
        filename = null
    }

    return filename
}

// Store current work and go to previous task (if applicable)
function prev() {

    // Store current scene before going to previous scene
    sceneData[curScene] = curSceneData;
    
    if (curScene > 0) {
        curScene -= 1;
    }
    // SA: TODO Is necessary?
    curSceneData = sceneData[curScene];
    
    log_user_data("prev"); // SA: TODO Add?
    reset_scene();
    draw_canvas();   

}

// Grab the results and go to next task/submit
function next() {

    // Make sure scene meets requirements
    if (!validate_scene()) {
        return -1;
    }
    
    sceneData[curScene] = curSceneData;
    curScene++;

    if (curScene == numScene) {
        curScene = numScene-1; // Cap to not create new scene
        $("#dialog-confirm").dialog('open');
        // Put cursor in comment box for convenience :)
        $("#hit_comment").each( function(idx) { 
            if (idx == 0) {
                $(this).focus();
            }
        });
    } else {
        // SA: TODO Is necessary?
        curSceneData = sceneData[curScene];
        log_user_data("next"); // SA: TODO Add?
        reset_scene();
        draw_canvas();
    }
}


function num_differences_instance(originalInst, currentInst) {
    var isDiff = 0;
    
    // Check if certain properties are different
    if (originalInst.present != currentInst.present) {
        console.log("Presence changed");
        isDiff += 1;
    }
    
    if (originalInst.flip != currentInst.flip) {
        console.log("Flip changed");
        isDiff += 1;
    }
    
    if (originalInst.z != currentInst.z) {
        console.log("Z changed");
        isDiff += 1;
    }
    
    if (originalInst.type == 'human') {
        if (originalInst.expressionID != currentInst.expressionID) {
            console.log("Expression changed");
            isDiff += 1;
        }
    }
    
    if (originalInst.poseID != currentInst.poseID) {
        console.log("poseID changed");
        isDiff += 1;
    }
    
    if (originalInst.typeID != currentInst.typeID) {
        console.log("typeID changed");
        isDiff += 1;
    }

//     // depth0 currently can't change
//     if (originalInst.depth0 != currentInst.depth0) {
//         isDiff += 1;
//         return isDiff;
//     }
    
    // SA: I don't think depth1 changing is very reliable
    // as an indicator of change and might be too exploitable.
    // I'm not sure which situations changing it would
    // significantly change the scene.
//     if (originalInst.depth1 != currentInst.depth1) {
//         console.log("Depth1 changed");
//         isDiff += 1;
//         return isDiff;
//     }

    // Check x and y positions for both deformable and nondeformable
    var distChange = euclidean_dist(originalInst.x, currentInst.x,
                                    originalInst.y, currentInst.y);
    
    if (distChange > minJSONPosChange) {
        console.log("Position changed by " + distChange);
        isDiff += 1;
    }
    
    // Check angles just for deformable
    if (originalInst.deformable == true) {
        var anglesChange = check_deformable_person_change(currentInst,
                                                          originalInst,
                                                          minAngleThreshJSONInit,
                                                          minAnglesChangeJSONInit);
        if (anglesChange >= 0) {
            isDiff += anglesChange;
        }
    }

    return isDiff;
}

function euclidean_dist(x1, x2, y1, y2) {
    return dist = Math.sqrt(Math.pow((x2 - x1), 2) + 
                            Math.pow((y2 - y1), 2));
}

function num_different_object(originalObj, currentObj) {
    var numObjChanges = 0;
    
    for (var i = 0; i < originalObj.instance.length; i++) {
        numObjChanges += num_differences_instance(originalObj.instance[i],
                                                  currentObj.instance[i]);
    }
    
    return numObjChanges;
}

function is_different_from_init_scene() {
    var isDiff = false;
    var numChanges = 0;
    
    var curSceneFile = sceneJSONFile[curScene];
    var origAvailObj = sceneJSONData[curSceneFile].scene.availableObject;
    for (var i = 0; i < origAvailObj.length; i++) {
        numChanges += num_different_object(origAvailObj[i], 
                                           curAvailableObj[i]);
    }
    
    if (numChanges >= minJSONSceneChange) {
        isDiff = true;
    }

    return isDiff;
}

function check_deformable_people_change(curObj, curObjInit,
                                        minAngleThresh, minAnglesChange) {

    for (var i = 0; i < curObj.length; i++) {
        if (curObj[i].instance[0].type == "human") {
            for (var j = 0; j < curObj[i].numInstance; j++) {
                if (curObj[i].instance[j].present == true) {
                    
                    var paperdoll = curObj[i].instance[j];
                    var paperdollInit = curObjInit[i].instance[j];
                    
                    var anglesChanged = 
                            check_deformable_person_change(paperdoll, 
                                                           paperdollInit,
                                                           minAngleThresh, 
                                                           minAnglesChange);
                            
                    if (anglesChanged == 0) {
                        return -1;
                    }
                }
            }
        }
    }
    
    return 0;
}

function check_deformable_person_change(paperdoll, paperdollInit, 
                                        minAngleThresh, minAnglesChange) {
    
    var numBodyParts = paperdoll.body.length;
    var anglesChange = 0;
    var change;
    
    var mainBodyIdx = paperdoll.partIdxList['Torso'];
    var globalRot = paperdoll.deformableGlobalRot[mainBodyIdx];
    var globalRotInit = paperdollInit.deformableGlobalRot[mainBodyIdx];
    change = Math.abs(globalRotInit - globalRot);
    
    if (change >= minAngleThresh) {
        anglesChange += 1;
    }
    
    for (var k = 0; k < numBodyParts; k++) {
        change = Math.abs(paperdollInit.deformableLocalRot[k] -
                            paperdoll.deformableLocalRot[k]);
        if (change >= minAngleThresh) {
            anglesChange += 1;
        }
    }
    
    if (minAnglesChange == 0) {
        return anglesChange;
    } else if (minAnglesChange > 0) {
            
        if (anglesChange < minAnglesChange) {
            return 0;
        } else {
            return 1;
        }
    }
}

function validate_scene() {
    
    var numAvailableObjectsUsed;
    var validScene = true;
    
    if (!restrictInput) {
        return validScene;
    }
    
    // Separate validation when loading from 
    // previous json scene
    if (loadSceneJSON == true) {
        var curFile = sceneJSONFile[curScene];
        var curLoaded = loadedSceneJSON[curFile];
        if (curLoaded == true) {
            if (!is_different_from_init_scene()) {
                render_dialog("loadedScene");
                validScene = false;
            } else {
                validScene = true;
            }
            return validScene;
        }
    }
    
    // Counts number of present objects per category and total.
    // And also makes sure that humans have expressions.
    // Then, if the requirement is (randomly) on
    // it enforces a category to have a certain 
    // number of objects present for a given category.
    var objTypeCounts = {};
    for (i = 0; i < objectTypeOrder.length; i++) {
        objTypeCounts[objectTypeOrder[i]] = 0;
    }
    
    for (i = 0; i < numAvailableObjects; i++) {
        for (m = 0; m < curAvailableObj[i].numInstance; m++) {
            var curObj = curAvailableObj[i].instance[m];
            if (curObj.present) {
                objTypeCounts[curObj.type] += 1
                if (curObj.type == 'human') {
                    if (curObj.expressionID == 0) {
                        render_dialog("expression");
                        validScene = false;
                        return validScene;
                    }
                }
            }
        }
    }
    
    var curType;
    var curCount;
    var curReq;
    var randVal;
    numAvailableObjectsUsed = 0;
    for (i = 0; i < objectTypeOrder.length; i++) {
        var curType = objectTypeOrder[i];
        curCount = objTypeCounts[curType];
        numAvailableObjectsUsed += curCount;
        curReq = numObjTypeReqs[curType];
        curReqOn = curReqsOn[curType];
        if (curReqOn) {
            if (curCount < curReq) {
                render_dialog("minCat", curType, curReq);
                validScene = false;
                return validScene;
            }
        }
    }
    
    // Deformable objects have different checks
    if (deformTypesUse["human"] == "deformable") {
        var defPerChange = check_deformable_people_change(curAvailableObj,
                                                        curAvailableObjInit,
                                                        minAngleThreshRandInit, 
                                                        minAnglesChangeRandInit);
        if (defPerChange < 0) {
            render_dialog("deformHuman");
            validScene = false;
            return validScene;
        }
    }
    
    // Check to see if the minimum number of objects present
    if (numAvailableObjectsUsed < minNumObj) {
        render_dialog("minClipart");
        validScene = false;
        return validScene;
    }
    
    // Check to see if more than the maximum number of objects present
    if (numAvailableObjectsUsed > maxNumObj) {
        render_dialog("maxClipart");
        validScene = false;
        return validScene;
    }
    
    return validScene;
}

function log_user_data(msg) {

    if (curUserSequence != undefined) {
        // TODO Safety here in case of things not being loaded yet?
        curUserSequence.selectedIdx.push(selectedIdx);
        curUserSequence.selectedIns.push(selectedIns);
        // SA: TODO Verify that this is correct/reasonable
        if (selectedIdx != notUsed && selectedIns != notUsed) {
            curUserSequence.poseID.push(curAvailableObj[selectedIdx].instance[selectedIns].poseID);
            curUserSequence.typeID.push(curAvailableObj[selectedIdx].instance[selectedIns].typeID); // Fix?
            curUserSequence.expressionID.push(curAvailableObj[selectedIdx].instance[selectedIns].expressionID);
            curUserSequence.present.push(curAvailableObj[selectedIdx].instance[selectedIns].present);
            curUserSequence.x.push(curAvailableObj[selectedIdx].instance[selectedIns].x);
            curUserSequence.y.push(curAvailableObj[selectedIdx].instance[selectedIns].y);
            curUserSequence.z.push(curAvailableObj[selectedIdx].instance[selectedIns].z);
            curUserSequence.flip.push(curAvailableObj[selectedIdx].instance[selectedIns].flip);
            curUserSequence.depth1.push(curAvailableObj[selectedIdx].instance[selectedIns].depth1);
            curUserSequence.globalRot.push(lastGlobalRot);
            curUserSequence.localRots.push(lastLocalRots);
        } else {
            curUserSequence.poseID.push(notUsed);
            curUserSequence.typeID.push(notUsed);
            curUserSequence.expressionID.push(notUsed);
            curUserSequence.present.push(notUsed);
            curUserSequence.x.push(notUsed);
            curUserSequence.y.push(notUsed);
            curUserSequence.z.push(notUsed);
            curUserSequence.flip.push(notUsed);
            curUserSequence.depth1.push(notUsed);
            curUserSequence.globalRot.push(notUsed);
            curUserSequence.localRots.push([]);
        }
//         if (msg != undefined) {
//             console.log(msg);
//         }
    }
}

// ================================================================
// Function to submit form to the server
// The form is submitted to AMT after server successfully process the submission
// The HIT is completed after AMT server receives the submission
// ================================================================
function submit_form() {

    var duration = ($.now()-init_time)/1000;
    duration = duration.toString();
    var comment;
    $('#dialog-confirm textarea').each( function() { comment = this.value; });
    
    // process answers
    // pack user's response in a dictionary structure and send to the server in JSON format
    var answers = [];
    for (i = 0; i < sceneData.length; i++) {
        answers.push( {
                // Don't need the image files
                // TODO Add new scene data here.
                availableObject: sceneData[i].availableObject,
                userSequence: sceneData[i].userSequence,
                sceneType: sceneData[i].sceneType,
                initHistory: sceneData[i].initHistory,
                deformTypesUse: sceneData[i].deformTypesUse,
                sceneConfigFile: sceneData[i].sceneConfigFile,
                reqsOn: sceneData[i].reqsOn
            }
        );
    }
    var ans = JSON.stringify(answers);

    // Append any additional data you want to send back
    $("input[name='hitDuration']").val(duration);
    $("input[name='hitResult']").val(ans);
    $("input[name='hitComment']").val(comment);
    
    // set the resp to send back to the server here
    // the values to send to MTurk has already defined inside #mturk_form
    // if you don't need to bother to set value here
    var resp =
    {
    // TODO: set the data to be submitted back to server
    };
    
    // post ajax request to server
    // if there's no backend to process the request, form can be directly submitted to MTurk
    
    debugger;
    // If running local, don't bother submitting
    if (submitAction) {
        $.ajax({
                type: "POST",
                // "TODO: set the url of server to process the data",
                url: "",
                data: {'resp': JSON.stringify(resp)}
            }).done(function(data) {
                $('#mturk_form').submit();
            });
    }
}

//
//
var jsonIdx = -1; // Start with -1 because of config

// SA: TODO Update this so it gets called if you're 
// loading scenes from JSON files.
function load_config_json() {
    $.getJSON(dataURL+sceneConfigFile).done( function(data) { 
        load_object_config(data, null); 
    }).fail( function() { 
        console.log("Loading JSON " + sceneConfigFile + " failed.");  
    });
}

function load_object_config(data, deformType) {
    
    var curFile;
    
    if (jsonIdx == -1) {
        sceneConfigData = data;
        objectData = {};
        jsonIdx += 1;
    } else {
        var deformTypeUse;
        
        if (deformTypesUse[data.objectType] == undefined) {
            deformTypeUse = deformTypeDefault;
        } else {
            deformTypeUse = deformTypesUse[data.objectType];
        }

        if (objectData[data.objectType] == undefined) {
            objectData[data.objectType] = {}
        }
        
        objectData[data.objectType][deformType] = data;
        
        jsonIdx += 1;
    }

    if (jsonIdx < sceneConfigData.clipartObjJSONFile.length) {
        var curObjFiles = sceneConfigData.clipartObjJSONFile[jsonIdx].file;
        for (var deformType in curObjFiles) {
            curFile = sceneConfigData.clipartObjJSONFile[jsonIdx].file[deformType];
            
            $.getJSON(dataURL+curFile).done( function(data) { 
                load_object_config(data, deformType); 
            }).fail( function() { 
                console.log("Loading JSON " + curFile + " failed.");  
            });
        }
    } else {
        load_obj_category_data();
    }
}

function load_obj_category_data() {

    if ((loadSceneJSON == true && jsonScenesLoaded == true) ||
        (loadSceneJSON == false)) {
        // Make sure the sceneTypeList is all valid scene types
        if (sceneTypeList.length > 0 && sceneConfigData != undefined) {
            
            var validSceneTypeList = [];
            sceneTypeList.forEach( function(d) {
                if (sceneConfigData.hasOwnProperty(d)) {
                    validSceneTypeList.push(d);
                }
            })
            sceneTypeList = validSceneTypeList;
            numScene = sceneTypeList.length;
            
            if (numScene == 0) {
                var sceneTypeListIdx = get_random_int(0, AVAIL_SCENE_TYPES.length);
                sceneTypeList = [AVAIL_SCENE_TYPES[sceneTypeListIdx]]
                numScene = sceneTypeList.length;
                console.log('Invalid scene type entered. ' +
                            'Defaulting to one scene of ' +
                            sceneTypeList[0] + '.');
            }
            
            update_instructions();
        }
        
        if (sceneTypeList.length > 0 && sceneConfigData != undefined) {
            var numSelObj;
            
            if (loadSceneJSON == true) {
                curSceneDataFile = sceneJSONFile[curScene];
                var curLoaded = loadedSceneJSON[curSceneDataFile];
                if (curLoaded == true) {
                    var curSceneData = sceneJSONData[curSceneDataFile];
                    curDeformTypesUse = curSceneData.scene.deformTypesUse;
                } else {
                    curDeformTypesUse = deformTypesUse;
                }
            } else {
                curDeformTypesUse = deformTypesUse;
            }
            
            curSceneType = sceneTypeList[curScene];
            curSceneTypeBase = extract_scene_type_base(curSceneType)
            
            var objectTypeData = sceneConfigData[curSceneType].objectTypeData;
            objectTypeOrder = [];
            numObjTypeShow = {};
            numObjTypeReqs = {};
            curReqsOn = {}; // This is technically getting calculated
                            // multiple times (for a given scene)
                            // but only one of them is being stored
                            // and propogated across prev/next.
            for (var idxObjT in objectTypeData) {
                var curName = objectTypeData[idxObjT].nameType;
                objectTypeOrder.push(curName);
                numObjTypeShow[curName] = objectTypeData[idxObjT].numShow;
               
                curReqsOn[curName] = (Math.random() < objectTypeData[idxObjT].reqProb);
                numObjTypeReqs[curName] = objectTypeData[idxObjT].reqNum;
            }
            
            // In case scene config is bad, we overwrite values
            // that suggest putting more objects than available for
            // that category and prevents an infinite loop
            
            for (var objectType in objectData) {
                if (objectData.hasOwnProperty(objectType)) {
                    curObjectType = objectData[objectType][curDeformTypesUse[objectType]];
                    var validIdxs = [];
                    for (var k = 0; k < curObjectType.type.length; k++) {
                        for (var m = 0; m < curObjectType.type[k].availableScene.length; m++) {
                            if (curObjectType.type[k].availableScene[m].scene == curSceneTypeBase) {
                                validIdxs.push([k, m])
                            }
                        }
                    }
                    var numValidTypes = validIdxs.length;
                    numSelObj = numObjTypeShow[curObjectType.objectType];
                    if (numSelObj > numValidTypes) {
                        console.log(curSceneType + " asked for too many " + 
                                    curObjectType.objectType + 
                                    " objects. Overwriting with the max.")
                    }
                    numSelObj = Math.min(numSelObj, numValidTypes);
                    numObjTypeShow[curObjectType.objectType] = numSelObj;
                }
            }
            
            // Need to initialize this otherwise interface won't load properly
            numAvailableObjects = 0;
            objectTypeToIdx = {};
            for (var i = 0; i < objectTypeOrder.length; i++) {
                numAvailableObjects += numObjTypeShow[objectTypeOrder[i]];
                objectTypeToIdx[objectTypeOrder[i]] = i;
            }
            
            selectedTab = sceneConfigData[curSceneType].startTab;
            selectedTabIdx = objectTypeToIdx[selectedTab];
            selectedAttrTabIdx = 0;
            selectedAttrTab = objectData[selectedTab][curDeformTypesUse[selectedTab]].attributeTypeList[selectedAttrTabIdx];
            tabPage = 0;
            NUM_TABS = objectTypeOrder.length;
            if (firstInit == false) {
                firstInit = true;
                reset_scene();
            }
        } else {
            numAvailableObjects = 0;
            selectedTab = 'animals';
            selectedTabIdx = 0; // SA: Maybe not right if sceneConfigFile broken...
            selectedAttrTabIdx = 0;
            selectedAttrTab = 'Type';
            tabPage = 0;
            NUM_TABS = 4;
        }
    } else if (loadSceneJSON == true && jsonScenesLoaded == false) {
        // Keep trying until data is loaded
        setTimeout(function(){ load_obj_category_data();}, 300);
    }

}

// ===========================================================
// Functions to render the abstract scenes
// ===========================================================
// draw canvas
function draw_canvas() {
    
    if (loadedObjectsAndBG == true) {
        CANVAS_WIDTH = bgImg.width;
        CANVAS_HEIGHT = bgImg.height;
    }
    
    ATTR_PADDING = 30; // SA: Hack to get 9 attribute items
    SCALE_ROW = CANVAS_ROW + CANVAS_HEIGHT + 1.5*CLIPART_BUFFER;
    SCALE_COL = CANVAS_COL + 340 + CLIPART_BUFFER;
    FLIP_ROW = SCALE_ROW - 8;
    FLIP_COL = SCALE_COL + 200;
    ATTR_ROW = SCALE_ROW + 38 + CLIPART_BUFFER;
    ATTR_COL = CANVAS_COL;
    ATTR_WIDTH = CANVAS_WIDTH + ATTR_PADDING;
    ATTR_HEIGHT = CLIPART_SKIP + 2 * CLIPART_BUFFER;

    ATTR_TYPE_WIDTH = 100;
    ATTR_TYPE_HEIGHT = 30;
    ATTR_TYPE_COL = ATTR_COL;
    ATTR_TYPE_ROW = ATTR_ROW - ATTR_TYPE_HEIGHT;

    CLIPART_COL = CANVAS_COL + CANVAS_WIDTH + ATTR_PADDING + CLIPART_BUFFER;
    CLIPART_ROW = CANVAS_ROW;
    CLIPART_WIDTH = CLIPART_SKIP * NUM_CLIPART_HORZ + 2 * CLIPART_BUFFER;
    TAB_WIDTH = CLIPART_WIDTH / NUM_TABS;
    TAB_HEIGHT = 60;
    CLIPART_HEIGHT = ATTR_ROW + ATTR_HEIGHT - (CLIPART_ROW + TAB_HEIGHT);
    
    //draw the image
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    draw_scene();
    draw_clipart();
    draw_buttons();
}

function draw_nondeformable_obj(objIdx, instIdx) {

    var curObjType = curAvailableObj[objIdx].instance[instIdx].type;
    var curAttrTypes = get_object_attr_types(curObjType);
    
    if (curAttrTypes.length == 1) {
    
        var scale = curZScale[curAvailableObj[objIdx].instance[instIdx].z];

        var w = curClipartImgs[objIdx][curAvailableObj[objIdx].instance[instIdx][curAttrTypes[0]['id']]].width;
        var h = curClipartImgs[objIdx][curAvailableObj[objIdx].instance[instIdx][curAttrTypes[0]['id']]].height;

        var rowOffset = -h / 2;
        var colOffset = -w / 2;
        rowOffset *= scale;
        colOffset *= scale;

        if (curAvailableObj[objIdx].instance[instIdx].flip == 0) {
            ctx.drawImage(curClipartImgs[objIdx][curAvailableObj[objIdx].instance[instIdx][curAttrTypes[0]['id']]], 
                            0, 0, w, h, 
                            curAvailableObj[objIdx].instance[instIdx].x + colOffset + CANVAS_COL, 
                            curAvailableObj[objIdx].instance[instIdx].y + rowOffset + CANVAS_ROW, 
                            w * scale, h * scale);
        } else if (curAvailableObj[objIdx].instance[instIdx].flip == 1) {
            ctx.setTransform(-1, 0, 0, 1, 0, 0);
            ctx.drawImage(curClipartImgs[objIdx][curAvailableObj[objIdx].instance[instIdx][curAttrTypes[0]['id']]], 
                            0, 0, w, h, 
                            -curAvailableObj[objIdx].instance[instIdx].x + colOffset - CANVAS_COL, 
                            curAvailableObj[objIdx].instance[instIdx].y + rowOffset + CANVAS_ROW, 
                            w * scale, h * scale);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    } else {
        // TODO Figure out what to do with multiple attributes
    }
}
                                    
function draw_nondeformable_person(objIdx, instIdx) {
    
    var scale = curZScale[curAvailableObj[objIdx].instance[instIdx].z];
    var indexP = curAvailableObj[objIdx].instance[instIdx].poseID*curAvailableObj[objIdx].instance[instIdx].numExpression +
                 curAvailableObj[objIdx].instance[instIdx].expressionID;
            
    if (curClipartImgs[objIdx][indexP] == undefined) {
        curClipartImgs[objIdx][indexP] = new Image();
        curClipartImgs[objIdx][indexP].src = 
            obj_img_filename_pose_expr(curAvailableObj[objIdx].instance[instIdx]);
        curClipartImgs[objIdx][indexP].onload = draw_canvas;
        return -1;
    }

    var w = curClipartImgs[objIdx][indexP].width;
    var h = curClipartImgs[objIdx][indexP].height;

    var rowOffset = -h / 2;
    var colOffset = -w / 2;
    rowOffset *= scale;
    colOffset *= scale;

    if (curAvailableObj[objIdx].instance[instIdx].flip == 0) {
        ctx.drawImage(curClipartImgs[objIdx][indexP], 
                      0, 0, w, h, 
                      curAvailableObj[objIdx].instance[instIdx].x + colOffset + CANVAS_COL, 
                      curAvailableObj[objIdx].instance[instIdx].y + rowOffset + CANVAS_ROW, 
                      w * scale, h * scale);
    } else if (curAvailableObj[objIdx].instance[instIdx].flip == 1) {
        ctx.setTransform(-1, 0, 0, 1, 0, 0);
        ctx.drawImage(curClipartImgs[objIdx][indexP], 
                      0, 0, w, h, 
                      -curAvailableObj[objIdx].instance[instIdx].x + colOffset - CANVAS_COL, 
                      curAvailableObj[objIdx].instance[instIdx].y + rowOffset + CANVAS_ROW, 
                      w * scale, h * scale);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    return 0;
}

function draw_deformable_person(objIdx, instIdx) {
    var paperdoll = curAvailableObj[objIdx].instance[instIdx];
    var numBodyParts = paperdoll.body.length;
    var scale = paperdoll.globalScale * curZScale[paperdoll.z];

    for (partIdx = 0; partIdx < numBodyParts; partIdx++) {
        var parent = paperdoll.body[partIdx].parent;
        var parentIdx = paperdoll.partIdxList[parent];

        var w = curPaperdollPartImgs[objIdx][partIdx].width;
        var h = curPaperdollPartImgs[objIdx][partIdx].height;

        paperdoll.deformableX[partIdx] = paperdoll.x / scale;
        paperdoll.deformableY[partIdx] = paperdoll.y / scale;

        if (parentIdx >= 0) {
            var wp = curPaperdollPartImgs[objIdx][parentIdx].width;
            var hp = curPaperdollPartImgs[objIdx][parentIdx].height;
            var prevR = paperdoll.deformableGlobalRot[parentIdx];
            if (paperdoll.flip == 1) {
                var rotMatrix = [];
                rotMatrix.push(Math.cos(prevR));
                rotMatrix.push(-Math.sin(prevR));
                rotMatrix.push(Math.sin(prevR));
                rotMatrix.push(Math.cos(prevR));

                var x = (wp - paperdoll.body[partIdx].parentX) - (wp - paperdoll.body[parentIdx].childX);
                var y = paperdoll.body[partIdx].parentY - paperdoll.body[parentIdx].childY;
                paperdoll.deformableX[partIdx] = rotMatrix[0] * x + rotMatrix[1] * y + paperdoll.deformableX[parentIdx];
                paperdoll.deformableY[partIdx] = rotMatrix[2] * x + rotMatrix[3] * y + paperdoll.deformableY[parentIdx];
                paperdoll.deformableGlobalRot[partIdx] = prevR - paperdoll.deformableLocalRot[partIdx];
            } else {
                var rotMatrix = [];
                rotMatrix.push(Math.cos(prevR));
                rotMatrix.push(-Math.sin(prevR));
                rotMatrix.push(Math.sin(prevR));
                rotMatrix.push(Math.cos(prevR));

                var x = paperdoll.body[partIdx].parentX - paperdoll.body[parentIdx].childX;
                var y = paperdoll.body[partIdx].parentY - paperdoll.body[parentIdx].childY;
                paperdoll.deformableX[partIdx] = rotMatrix[0] * x + rotMatrix[1] * y + paperdoll.deformableX[parentIdx];
                paperdoll.deformableY[partIdx] = rotMatrix[2] * x + rotMatrix[3] * y + paperdoll.deformableY[parentIdx];
                paperdoll.deformableGlobalRot[partIdx] = prevR + paperdoll.deformableLocalRot[partIdx];
            }
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (paperdoll.flip == 1) {
            ctx.setTransform(-1, 0, 0, 1, 0, 0);

            ctx.translate(-CANVAS_COL, CANVAS_ROW);
            ctx.scale(scale, scale);
            ctx.translate(-paperdoll.deformableX[partIdx], paperdoll.deformableY[partIdx]);
            ctx.rotate(-paperdoll.deformableGlobalRot[partIdx]);
            ctx.translate(-paperdoll.body[partIdx].childX, -paperdoll.body[partIdx].childY);
        } else {
            ctx.translate(CANVAS_COL, CANVAS_ROW);
            ctx.scale(scale, scale);
            ctx.translate(paperdoll.deformableX[partIdx], paperdoll.deformableY[partIdx]);
            ctx.rotate(paperdoll.deformableGlobalRot[partIdx]);
            ctx.translate(-paperdoll.body[partIdx].childX, -paperdoll.body[partIdx].childY);
        }

        if (paperdoll.body[partIdx].part == 'Head') {
            // SA: Bug fix: Expression images sometimes are different size!
            // Thus can't use 0 index.
            w = curPeopleExprImgs[objIdx][paperdoll.expressionID].width;
            h = curPeopleExprImgs[objIdx][paperdoll.expressionID].height;
            ctx.drawImage(curPeopleExprImgs[objIdx][paperdoll.expressionID], 0, 0, w, h, 0, 0, w, h);
        } else {
            ctx.drawImage(curPaperdollPartImgs[objIdx][partIdx], 0, 0, w, h, 0, 0, w, h);
        }
        
        if(objIdx == selectedIdx && instIdx == selectedIns && selectPaperdollPose) {
            if (paperdoll.body[partIdx].handleRadius > 0) {
                ctx.lineWidth = 4;
                ctx.fillStyle = "rgba(50, 255, 50, 0.5)";;
                ctx.beginPath();
                ctx.arc(w/2, h/2, paperdoll.body[partIdx].handleRadius, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.fill();
            }
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}

function draw_scene() {
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas_fix.width, canvas_fix.height);

    if (bgImg != undefined) {
        ctx.drawImage(bgImg, CANVAS_COL, CANVAS_ROW, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    if (loadedObjectsAndBG == true) {
        // Make sure we get the depth ordering correct (render the objects using their depth order)
        for (k = numDepth0 - 1; k >= 0; k--) {
            if (curDepth0Used[k] <= 0) { // not used, just to accelerate the process
                continue;
            }
            for (j = numZSize - 1; j >= 0; j--) {
                // for people, choose both the expression and the pose
                for (l = numDepth1 - 1; l >= 0; l--) {
                    if (curDepth1Used[l] <= 0) { // not used, just to accelerate the process
                        continue;
                    }
                    
                    // SA: TODO Update to be compatible with both
                    for (i = 0; i < numAvailableObjects; i++) {
                        if (curAvailableObj[i].instance[0].depth0 == k) {
                            for (m = 0; m < curAvailableObj[i].numInstance; m++) {
                                if (curAvailableObj[i].instance[m].present == true && 
                                    curAvailableObj[i].instance[m].z == j && 
                                    curAvailableObj[i].instance[m].depth1 == l) {
                                    
                                    if (curAvailableObj[i].instance[m].type == 'human') {
                                    
                                            if (curAvailableObj[i].instance[m].deformable == true) {
                                                draw_deformable_person(i, m);
                                            } else {
                                                success = draw_nondeformable_person(i, m);
                                                if (success < 0) {
                                                    continue;
                                                }
                                            }
                                    } else {
                                        draw_nondeformable_obj(i, m);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, CANVAS_COL, canvas_fix.height);
    ctx.fillRect(0, 0, CANVAS_COL + CANVAS_WIDTH, CANVAS_ROW);
    ctx.fillRect(CANVAS_COL + CANVAS_WIDTH, 0, CLIPART_COL, canvas_fix.height);
    ctx.fillRect(0, CANVAS_ROW + CANVAS_HEIGHT, CLIPART_COL, canvas_fix.height);

    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 10, canvas_fix.width, 5);

}

function draw_tab(x, y, w, h, rad) {
    
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + h);           // Create a starting point
    ctx.lineTo(x, y + rad);          // Create a horizontal line
    ctx.arcTo(x, y, x + rad, y, rad); // Create an arc
    ctx.lineTo(x + w - rad, y);         // Continue with vertical line
    ctx.arcTo(x + w, y, x + w, y + rad, rad); // Create an arc
    ctx.lineTo(x + w, y + h);         // Continue with vertical line
    ctx.fill();
    ctx.stroke();

}

function draw_clipart() {
    
    var w = TAB_WIDTH * NUM_TABS;
    var h = TAB_HEIGHT;

    // Draw the clipart tabs
    ctx.fillStyle = "#B4B4B4";    
    for (var i = 0; i < NUM_TABS; i++) {
        draw_tab(CLIPART_COL + i * TAB_WIDTH, CLIPART_ROW, TAB_WIDTH, TAB_HEIGHT, 8);
    }

    ctx.lineWidth = 2;
    ctx.fillStyle = "#D9D9D9";
    ctx.fillRect(CLIPART_COL, CLIPART_ROW + TAB_HEIGHT, CLIPART_WIDTH, CLIPART_HEIGHT);
    ctx.fillStyle = "#494646";
    ctx.strokeRect(CLIPART_COL, CLIPART_ROW + TAB_HEIGHT + 1, CLIPART_WIDTH, CLIPART_HEIGHT - 1);

    // Draw the selected tab
    ctx.fillStyle = "#D9D9D9";
    draw_tab(CLIPART_COL + selectedTabIdx * TAB_WIDTH, CLIPART_ROW, TAB_WIDTH, TAB_HEIGHT + 2, 8);

    // Add the tab labels
    ctx.font = "18px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    
    var tabCounter = 1;
    for (var idxOT in objectTypeOrder) {
        var curTabObjType = objectData[objectTypeOrder[idxOT]][curDeformTypesUse[objectTypeOrder[idxOT]]].objectType;
        if (curTabObjType == 'human') {
            ctx.fillText("People",  CLIPART_COL + tabCounter * TAB_WIDTH / 2, CLIPART_ROW + TAB_HEIGHT / 2 + 8);
        } else if (curTabObjType == 'animal') {
            ctx.fillText("Animals", CLIPART_COL + tabCounter * TAB_WIDTH / 2, CLIPART_ROW + TAB_HEIGHT / 2 + 8);
        } else if (curTabObjType == 'largeObject') {
            ctx.fillText("Large",   CLIPART_COL + tabCounter * TAB_WIDTH / 2, CLIPART_ROW + TAB_HEIGHT / 2 - 3);
            ctx.fillText("objects", CLIPART_COL + tabCounter * TAB_WIDTH / 2, CLIPART_ROW + TAB_HEIGHT / 2 + 17);
        } else if (curTabObjType == 'smallObject') {
            ctx.fillText("Small",   CLIPART_COL + tabCounter * TAB_WIDTH / 2, CLIPART_ROW + TAB_HEIGHT / 2  - 3);
            ctx.fillText("objects", CLIPART_COL + tabCounter * TAB_WIDTH / 2, CLIPART_ROW + TAB_HEIGHT / 2 + 17);
        }
        tabCounter += 2;
    }

    if (loadedObjectsAndBG == true) {

        curType = objectData[selectedTab][curDeformTypesUse[selectedTab]].objectType;
        curSelectedType = curType;

        if (selectedIdx >= 0) {
            curSelectedType = curAvailableObj[selectedIdx].instance[selectedIns].type;
        }

        // Draw the attribute tabs
        ctx.fillStyle = "#B4B4B4";    
        for (var i = 0; i < objectData[curSelectedType][curDeformTypesUse[curSelectedType]].attributeTypeList.length; i++) {
            draw_tab(ATTR_TYPE_COL + i * ATTR_TYPE_WIDTH, ATTR_TYPE_ROW, ATTR_TYPE_WIDTH, ATTR_TYPE_HEIGHT + 1, 8);
        }
        
        ctx.lineWidth = 2;
        ctx.fillStyle = "#D9D9D9";
        ctx.fillRect(ATTR_COL, ATTR_ROW, ATTR_WIDTH, ATTR_HEIGHT);
        ctx.lineWidth = 2;
        ctx.fillStyle = "#494646";
        ctx.strokeRect(ATTR_COL, ATTR_ROW, ATTR_WIDTH, ATTR_HEIGHT);
        
        // Draw the selected attribute tab
        ctx.fillStyle = "#D9D9D9";
        draw_tab(ATTR_TYPE_COL + selectedAttrTabIdx * ATTR_TYPE_WIDTH, ATTR_TYPE_ROW, ATTR_TYPE_WIDTH, ATTR_TYPE_HEIGHT + 1, 8);
        
        // Add the attribute labels
        ctx.fillStyle = "#000000";
        ctx.font = "18px Arial";
        ctx.textAlign = "center";
        
        ctx.lineWidth = 0;
        var attrLabel = "Type";
        
        var attributeCounter = 1;
        curAttrList = objectData[curSelectedType][curDeformTypesUse[curSelectedType]].attributeTypeList;
        for (var i = 0; i < curAttrList.length; i++) {
            attrLabel = curAttrList[i];
            ctx.fillText(attrLabel, ATTR_TYPE_COL + attributeCounter * ATTR_TYPE_WIDTH/2, ATTR_TYPE_ROW + 24);
            attributeCounter += 2;
        }
    
        for (r = 0; r < NUM_CLIPART_VERT; r++) {
            for (c = 0; c < NUM_CLIPART_HORZ; c++) {
                var idx = r * NUM_CLIPART_HORZ + c + tabPage;

                // Only do something if there is an object of that type for selected idx 
                if (idx < numObjTypeShow[curType]) {
                    idx += clipartIdxStart[selectedTab]; // to that page
                    if (selectedIdx == idx) { // Draws the "select" box background
                        ctx.drawImage(selectedImg, 
                                      CLIPART_COL + c * CLIPART_SKIP +
                                      (CLIPART_BUFFER / 2) + CLIPART_OBJECT_OFFSET_COL, 
                                      CLIPART_ROW + TAB_HEIGHT + r * CLIPART_SKIP +
                                      (CLIPART_BUFFER / 2) + CLIPART_OBJECT_OFFSET_ROW, 
                                      CLIPART_SKIP, CLIPART_SKIP);
                    }
                    
                    var idxAttr;
                    var left = 1;
                    var Size = 13;
                    var locationOffset = 11;
                    var idxInst = curAvailableObj[idx].smallestUnusedInstanceIdx;
                    var objInst = curAvailableObj[idx].instance[idxInst];

                    if (curType == "human") {

                        if (idxInst < curAvailableObj[idx].numInstance) {
//                             idxAttr = objInst.expressionID;
                            idxAttr = 1; // Neutral instead of blank for menu
                        } else {
                            ctx.drawImage(noLeftImg, 
                                          CLIPART_COL + c * CLIPART_SKIP +
                                          (CLIPART_BUFFER / 2) + CLIPART_OBJECT_OFFSET_COL, 
                                          CLIPART_ROW + TAB_HEIGHT + r * CLIPART_SKIP +
                                          (CLIPART_BUFFER / 2) + CLIPART_OBJECT_OFFSET_ROW, 
                                          CLIPART_SKIP, CLIPART_SKIP);
                            continue;
                        }
                        
                        if (typeof curPeopleExprImgs[idx] == "undefined") { // just sometimes it is not even loaded yet...
                            continue;
                        }

                        for (i = curAvailableObj[idx].smallestUnusedInstanceIdx + 1; i < curAvailableObj[idx].numInstance; i++) {
                            if (curAvailableObj[idx].instance[i].present == false) {
                                left++;
                            }
                        }

                        var exprImg = curPeopleExprImgs[idx][idxAttr];
                        var w = exprImg.width;
                        var h = exprImg.height;
                        
                        var ratioHead = CLIPART_SIZE/Math.max(w, h);

                        var newW = Math.min(w, ratioHead * w);
                        var newH = Math.min(h, ratioHead * h);

                        // Deformable and not hairless baby and hair loaded if there
                        if (objInst.deformable == true) {
                            
                            var hairIdx = objInst.partIdxList['Hair'];  
                            var hairOffset = objInst.body[hairIdx];
                            var hairImg = curPaperdollPartImgs[idx][hairIdx];
                        
                            if (hairIdx != undefined && 
                                hairImg != undefined) {
                                
                                var wHair = hairImg.width;
                                var hHair = hairImg.height;
                                
                                var curName = objInst.name;
                                var dollNo = Number(curName.slice(-2));
                                var scaleFactor;
                                
                                // SA: Hack to make women larger
                                if (dollNo % 2 == 0) {
                                    scaleFactor = 1.15;
                                } else {
                                    scaleFactor = 1.0;
                                }
                                var ratioHair = scaleFactor * CLIPART_SIZE / Math.max(wHair, hHair);
                                
                                newW = Math.min(w, ratioHair * w);
                                newH = Math.min(h, ratioHair * h);
                        
                                var newWHair = Math.min(wHair, ratioHair*wHair);
                                var newHHair = Math.min(hHair, ratioHair*hHair);
                                
                                var rowOffsetHair = (CLIPART_SIZE - newHHair) / 2 + CLIPART_BUFFER / 2;
                                var colOffsetHair = (CLIPART_SIZE - newWHair) / 2 + CLIPART_BUFFER / 2;
                                var xoHair = CLIPART_COL + c * CLIPART_SKIP + CLIPART_BUFFER + colOffsetHair;
                                var yoHair = CLIPART_ROW + TAB_HEIGHT + r * CLIPART_SKIP + CLIPART_BUFFER + rowOffsetHair;

                                var xx = ratioHair * (hairOffset.parentX - hairOffset.childX);
                                var yy = ratioHair * (hairOffset.parentY - hairOffset.childY);
                                
                                // SA: Hacky to get positioning decent...
                                ctx.drawImage(exprImg, 0, 0, w, h, 
                                              Math.floor(xoHair - xx) + CLIPART_OBJECT_OFFSET_COL, 
                                              Math.floor(yoHair - 0.25*yy) + CLIPART_OBJECT_OFFSET_ROW, 
                                              newW, newH);    
                                                 
                                ctx.drawImage(hairImg, 0, 0, wHair, hHair, 
                                              Math.floor(xoHair) + CLIPART_OBJECT_OFFSET_COL,
                                              Math.floor(yoHair + 0.75*yy) + CLIPART_OBJECT_OFFSET_ROW,
                                              newWHair, newHHair);
                            } else { // Baby Head / Hair not loaded
                                
                                var rowOffset = (CLIPART_SIZE -newH) / 2 + CLIPART_BUFFER / 2;
                                var colOffset = (CLIPART_SIZE - newW) / 2 + CLIPART_BUFFER / 2;
                                var xo = CLIPART_COL + c * CLIPART_SKIP + CLIPART_BUFFER + colOffset;
                                var yo = CLIPART_ROW + TAB_HEIGHT + r * CLIPART_SKIP + CLIPART_BUFFER + rowOffset;
                                
                                ctx.drawImage(exprImg, 0, 0, w, h, 
                                                Math.floor(xo) + CLIPART_OBJECT_OFFSET_COL, 
                                                Math.floor(yo) + CLIPART_OBJECT_OFFSET_ROW, 
                                                newW, newH);
                                
                            }

                        } else { // Nondeformable

                            var rowOffset = (CLIPART_SIZE -newH) / 2 + CLIPART_BUFFER / 2;
                            var colOffset = (CLIPART_SIZE - newW) / 2 + CLIPART_BUFFER / 2;
                            var xo = CLIPART_COL + c * CLIPART_SKIP + CLIPART_BUFFER + colOffset;
                            var yo = CLIPART_ROW + TAB_HEIGHT + r * CLIPART_SKIP + CLIPART_BUFFER + rowOffset;
                            
                            ctx.drawImage(exprImg, 0, 0, w, h, 
                                          Math.floor(xo) + CLIPART_OBJECT_OFFSET_COL, 
                                          Math.floor(yo) + CLIPART_OBJECT_OFFSET_ROW, 
                                          newW, newH);
                        }
                        
                        xo = CLIPART_COL + (c + 1) * CLIPART_SKIP - 1;
                        yo = CLIPART_ROW + TAB_HEIGHT + (r + 1) * CLIPART_SKIP - locationOffset;
                        ctx.drawImage(numBorderImg,
                                      Math.floor(xo - Size + 1) + CLIPART_OBJECT_OFFSET_COL, 
                                      Math.floor(yo - Size + 1) + CLIPART_OBJECT_OFFSET_ROW, 
                                      Size, Size);

                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.font = '10pt Calibri';
                        ctx.fillStyle = "#444444";
                        var optionsW = ctx.measureText("0").width;
                        var optionsH = Size;
                        xo = CLIPART_COL + (c + 1) * CLIPART_SKIP;
                        yo = CLIPART_ROW + TAB_HEIGHT + (r + 1) * CLIPART_SKIP;
                        ctx.fillText(left, 
                                     Math.floor(xo - optionsW) + CLIPART_OBJECT_OFFSET_COL, 
                                     Math.floor(yo - optionsH) + CLIPART_OBJECT_OFFSET_ROW);
                        ctx.restore();
                        
                    } else {
                        if (curAvailableObj[idx].smallestUnusedInstanceIdx < curAvailableObj[idx].numInstance) {
                            var curAttrTypes = get_object_attr_types(curType);
                            if (curAttrTypes.length == 1) {
                                idxAttr = curAvailableObj[idx].instance[curAvailableObj[idx].smallestUnusedInstanceIdx][curAttrTypes[0]['id']];
                            } else {
                                // TODO Figure out what do do if this happens
                            }
                        } else {
                            ctx.drawImage(noLeftImg, 
                                          CLIPART_COL + c * CLIPART_SKIP +
                                          (CLIPART_BUFFER / 2) + CLIPART_OBJECT_OFFSET_COL, 
                                          CLIPART_ROW + TAB_HEIGHT + r * CLIPART_SKIP +
                                          (CLIPART_BUFFER / 2) + CLIPART_OBJECT_OFFSET_ROW, 
                                          CLIPART_SKIP, CLIPART_SKIP);
                            continue;
                        }

                        if (typeof curClipartImgs[idx] == "undefined") { // just sometimes it is not even loaded yet...
                            continue;
                        }

                        for (i = curAvailableObj[idx].smallestUnusedInstanceIdx + 1; i < curAvailableObj[idx].numInstance; i++) {
                            if (curAvailableObj[idx].instance[i].present == false) {
                                left++
                            }
                        }

                        var w = curClipartImgs[idx][idxAttr].width;
                        var h = curClipartImgs[idx][idxAttr].height;
                        
                        var newW = Math.min(w, CLIPART_SIZE * w / Math.max(w, h));
                        var newH = Math.min(h, CLIPART_SIZE * h / Math.max(w, h));

                        var rowOffset = (CLIPART_SIZE - newH) / 2 + CLIPART_BUFFER / 2;
                        var colOffset = (CLIPART_SIZE - newW) / 2 + CLIPART_BUFFER / 2;
                        var xo = CLIPART_COL + c * CLIPART_SKIP + CLIPART_BUFFER + colOffset;
                        var yo = CLIPART_ROW + TAB_HEIGHT + r * CLIPART_SKIP + CLIPART_BUFFER + rowOffset;

                        ctx.drawImage(curClipartImgs[idx][idxAttr], 0, 0, w, h, 
                                      Math.floor(xo) + CLIPART_OBJECT_OFFSET_COL, 
                                      Math.floor(yo) + CLIPART_OBJECT_OFFSET_ROW, 
                                      newW, newH);
                        
                        xo = CLIPART_COL + (c + 1) * CLIPART_SKIP - 1;
                        yo = CLIPART_ROW + TAB_HEIGHT + (r + 1) * CLIPART_SKIP - locationOffset;
                        ctx.drawImage(numBorderImg, 
                                      Math.floor(xo - Size + 1) + CLIPART_OBJECT_OFFSET_COL, 
                                      Math.floor(yo - Size + 1) + CLIPART_OBJECT_OFFSET_ROW, 
                                      Size, Size);

                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.font = '10pt Calibri';
                        ctx.fillStyle = "#444444";
                        var optionsW = ctx.measureText("0").width;
                        var optionsH = Size;
                        xo = CLIPART_COL + (c + 1) * CLIPART_SKIP;
                        yo = CLIPART_ROW + TAB_HEIGHT + (r + 1) * CLIPART_SKIP;
                        ctx.fillText(left, 
                                     Math.floor(xo - optionsW) + CLIPART_OBJECT_OFFSET_COL, 
                                     Math.floor(yo - optionsH) + CLIPART_OBJECT_OFFSET_ROW);
                        ctx.restore();
                    }
                }
            }
        }
        
        // Draw tab page buttons
        if (tabPage_more_above()) {
            ctx.drawImage(tabPageUpImg, 
                          tabPageUpRect.x1 + CLIPART_COL, 
                          tabPageUpRect.y1 + CLIPART_ROW, 
                          rect_width(tabPageUpRect), 
                          rect_height(tabPageUpRect));
        }
        
        if (tabPage_more_below()) {
            ctx.drawImage(tabPageDownImg, 
                          tabPageDownRect.x1 + CLIPART_COL, 
                          tabPageDownRect.y1 + CLIPART_ROW, 
                          rect_width(tabPageDownRect), 
                          rect_height(tabPageDownRect));
        }
        
        if (selectedIdx != notUsed) {
            var curSelectedObjType = curAvailableObj[selectedIdx].instance[selectedIns].type;
            
            if (curSelectedObjType == 'human' ) {
                if (selectedAttrTab == 'Expression') {
                    for (i = 1; i < curAvailableObj[selectedIdx].instance[0].numExpression; i++) {
                        // just to show it is selected
                        if (i == curAvailableObj[selectedIdx].instance[selectedIns].expressionID) {
                            ctx.drawImage(selectedImg, 
                                          ATTR_COL + (i - 1) * CLIPART_SKIP + CLIPART_BUFFER / 2, 
                                          ATTR_ROW + CLIPART_BUFFER, 
                                          CLIPART_SKIP, CLIPART_SKIP);
                        }

                        var w = curPeopleExprImgs[selectedIdx][i].width;
                        var h = curPeopleExprImgs[selectedIdx][i].height;

                        var newW = Math.min(w, CLIPART_SIZE * w / Math.max(w, h));
                        var newH = Math.min(h, CLIPART_SIZE * h / Math.max(w, h));

                        var rowOffset = (CLIPART_SIZE - newH) / 2 + CLIPART_BUFFER / 2;
                        var colOffset = (CLIPART_SIZE - newW) / 2 + CLIPART_BUFFER / 2;

                        var xo = ATTR_COL + (i - 1) * CLIPART_SKIP + CLIPART_BUFFER + colOffset;
                        var yo = ATTR_ROW + CLIPART_BUFFER + rowOffset;

                        // only draw the first one
                        ctx.drawImage(curPeopleExprImgs[selectedIdx][i], 
                                      0, 0, w, h, 
                                      Math.floor(xo), Math.floor(yo), newW, newH);
                    }
                } else if (selectedAttrTab == 'Pose' &&
                           curAvailableObj[selectedIdx].instance[selectedIns].deformable == false) {
                    for (i = 0; i < curAvailableObj[selectedIdx].instance[0].numPose; i++) {
                        // just to show it is selected
                        if (i == curAvailableObj[selectedIdx].instance[selectedIns].poseID) {
                            ctx.drawImage(selectedImg, 
                                          ATTR_COL + i * CLIPART_SKIP + CLIPART_BUFFER / 2, 
                                          ATTR_ROW + CLIPART_BUFFER, 
                                          CLIPART_SKIP, CLIPART_SKIP);
                        }

                        // Only draw the blank face poses
                        var indexP = i * curAvailableObj[selectedIdx].instance[0].numExpression;

                        var w = curClipartImgs[selectedIdx][indexP].width;
                        var h = curClipartImgs[selectedIdx][indexP].height;

                        var newW = Math.min(w, CLIPART_SIZE * w / Math.max(w, h));
                        var newH = Math.min(h, CLIPART_SIZE * h / Math.max(w, h));

                        var rowOffset = (CLIPART_SIZE - newH) / 2 + CLIPART_BUFFER / 2;
                        var colOffset = (CLIPART_SIZE - newW) / 2 + CLIPART_BUFFER / 2;

                        var xo = ATTR_COL + i * CLIPART_SKIP + CLIPART_BUFFER + colOffset;
                        var yo = ATTR_ROW + CLIPART_BUFFER + rowOffset;

                        
                        ctx.drawImage(curClipartImgs[selectedIdx][indexP], 
                                      0, 0, w, h, 
                                      Math.floor(xo), Math.floor(yo), newW, newH);
                    }
                }
            } else { // Not nondeformable human

                var curObjType = curAvailableObj[selectedIdx].instance[0].type;
                var curAttrTypes = get_object_attr_types(curObjType);
                if (curAttrTypes.length == 1) {
                    for (i = 0; i < curAvailableObj[selectedIdx].instance[0][curAttrTypes[0]['num']]; i++) {
                        if (i == curAvailableObj[selectedIdx].instance[selectedIns][curAttrTypes[0]['id']]) {
                            ctx.drawImage(selectedImg, 
                                        ATTR_COL + i * CLIPART_SKIP + CLIPART_BUFFER / 2, 
                                        ATTR_ROW + CLIPART_BUFFER, 
                                        CLIPART_SKIP, CLIPART_SKIP);
                        }

                        var w = curClipartImgs[selectedIdx][i].width;
                        var h = curClipartImgs[selectedIdx][i].height;
                        
                        var newW = Math.min(w, CLIPART_SIZE * w / Math.max(w, h));
                        var newH = Math.min(h, CLIPART_SIZE * h / Math.max(w, h));

                        var rowOffset = (CLIPART_SIZE - newH) / 2 + CLIPART_BUFFER / 2;
                        var colOffset = (CLIPART_SIZE - newW) / 2 + CLIPART_BUFFER / 2;

                        var xo = ATTR_COL + i * CLIPART_SKIP + CLIPART_BUFFER + colOffset;
                        var yo = ATTR_ROW + CLIPART_BUFFER + rowOffset;

                        ctx.drawImage(curClipartImgs[selectedIdx][i], 0, 0, w, h, 
                                    Math.floor(xo), Math.floor(yo), newW, newH);
                    }
                } else {
                    // TODO Figure this out if needed
                }
            }
        }
    }
}

function draw_buttons() {
    
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 10, canvas_fix.width, 5);


    ctx.fillStyle = "#000000";
    ctx.font = "20px Arial";
    ctx.fillText("Scene Depth", SCALE_COL - 80, SCALE_ROW + 20);
    ctx.fillText("Flip", FLIP_COL - 30, SCALE_ROW + 20);
    
    buttonW = buttonImg.width / 2;
    buttonH = buttonImg.height / 5;
    w = buttonW;
    h = buttonH;

    if (w > 0 && h > 0) {
        var wMark = slideMarkImg.width;
        var hMark = slideMarkImg.height;
        var wSlide = slideBarImg.width;
        var hSlide = slideBarImg.height;

        ctx.drawImage(slideBarImg, 0, 0, wSlide, hSlide, 
                      SCALE_COL, 
                      SCALE_ROW + (SCALE_HEIGHT - hSlide) / 2, 
                      SCALE_WIDTH, hSlide);
        if (selectedIdx != notUsed && loadedObjectsAndBG == true) {
            ctx.drawImage(slideMarkImg, 0, 0, wMark, hMark, 
                          SCALE_COL + 
                          curAvailableObj[selectedIdx].instance[selectedIns].z * (SCALE_WIDTH / (numZSize - 1)) - 
                          wMark / 2, 
                          SCALE_ROW, wMark, SCALE_HEIGHT);
        }

        for (i = 0; i < 2; i++) {
            if (selectedIdx != notUsed && loadedObjectsAndBG == true) {
                if (i == curAvailableObj[selectedIdx].instance[selectedIns].flip) {
                    ctx.drawImage(buttonImg, w, (i + 3) * h, w, h, 
                                  i * w + FLIP_COL, 
                                  FLIP_ROW, w, h);
                } else {
                    ctx.drawImage(buttonImg, 0, (i + 3) * h, w, h, 
                                  i * w + FLIP_COL, 
                                  FLIP_ROW, w, h);
                }
            } else {
                ctx.drawImage(buttonImg, 0, (i + 3) * h, w, h, 
                              i * w + FLIP_COL, 
                              FLIP_ROW, w, h);
            }
        }
    }
}

// ===========================================================
// Code to allow for mouse-based user interaction.
// Let's users drag-and-drop objects in/onto the scene,
// select object size, flip, pose, expression (for humans).
// ===========================================================
function mouseup_canvas(event) {

    if (selectedIdx != notUsed &&
        loadedObjectsAndBG == true) {
        // record the movement data
        if (selectedIdx != lastIdx || selectedIns != lastIns || userChange || 
                curAvailableObj[selectedIdx].instance[selectedIns].x != lastX || 
                curAvailableObj[selectedIdx].instance[selectedIns].y != lastY || 
                curAvailableObj[selectedIdx].instance[selectedIns].z != lastZ) {
            
            lastIdx = selectedIdx;
            lastIns = selectedIns;
            lastX = curAvailableObj[selectedIdx].instance[selectedIns].x;
            lastY = curAvailableObj[selectedIdx].instance[selectedIns].y;
            lastZ = curAvailableObj[selectedIdx].instance[selectedIns].z;
            
            if (curAvailableObj[selectedIdx].instance[selectedIns].deformable == true) {
                // TODO Fix if deformable object not human?
                var mainBodyIdx = curAvailableObj[selectedIdx].instance[selectedIns].partIdxList['Torso'];
                lastGlobalRot = curAvailableObj[selectedIdx].instance[selectedIns].deformableGlobalRot[mainBodyIdx];
                lastLocalRots = curAvailableObj[selectedIdx].instance[selectedIns].deformableLocalRot;
            }
            
            log_user_data("mouseup1");
        }

        if (curAvailableObj[selectedIdx].instance[selectedIns].present == false) {
            // should find a smart way to deal with the pointer
            if (selectedIns < curAvailableObj[selectedIdx].smallestUnusedInstanceIdx) {
                if (curAvailableObj[selectedIdx].instance[selectedIns].type == 'human') {
                    curAvailableObj[selectedIdx].instance[selectedIns].expressionID = 0;
                }
                curAvailableObj[selectedIdx].smallestUnusedInstanceIdx = selectedIns;
            }

            selectedIdx = notUsed;
            selectedIns = notUsed;
            log_user_data("mouseup2");

            draw_canvas();
        }
    }
    
    wasOnCanvas = false;
    attrSelectorDown = false;
    flipDown = false;
    scaleSliderDown = false;
    userChange = false;
    moveClipart = false;
}

function mousedown_canvas(event) {
    
    var redrawCanvas = false;
        
    // XL: Handle bug related to user moving outside of canvas
    // and letting object be lost to the void.
    if (moveClipart == true) {
        mouseup_canvas(event);
    }
    
    if (selectPaperdollPose == true) {
        selectPaperdollPose = false;
        redrawCanvas = true;
    }

    var ev = event || window.event;

    scaleSliderDown = false;

    if (ev.pageX) {
        cx = ev.pageX;
    } else if (ev.clientX) {
        cx = ev.clientX;
        if (document.documentElement.scrollLeft) {
            cx += document.documentElement.scrollLeft;
        } else {
            cx += document.body.scrollLeft;
        }
    }
    
    if (ev.pageY) {
        cy = ev.pageY;
    } else if (ev.clientY) {
        cy = ev.clientY;
        if (document.documentElement.scrollTop) {
            cy += document.documentElement.scrollTop;
        } else {
            cy += document.body.scrollTop;
        }
    }
    
    // Select clipart object type using tabs
    var tabsX = cx - CLIPART_COL - canvas_fix.offsetLeft;
    var tabsY = cy - (CLIPART_ROW) - canvas_fix.offsetTop;

    if (tabsX < CLIPART_WIDTH && tabsX > 0 && 
        tabsY < TAB_HEIGHT && tabsY > 0 &&
        loadedObjectsAndBG == true) {
        
        selectedTabIdx = Math.floor(tabsX / Math.floor(CLIPART_WIDTH / NUM_TABS));
        selectedTab = objectTypeOrder[selectedTabIdx];
        tabPage = 0;
        if (selectedIdx == notUsed) {
            selectedAttrTabIdx = 0;
            selectedAttrTab = objectData[selectedTab][curDeformTypesUse[selectedTab]].attributeTypeList[selectedAttrTabIdx];
        }
        //log_user_data("tab"); // SA: TODO Add?
        redrawCanvas = true;
    }
    
    // Select clipart objects to add to canvas
    var clipartX = cx - CLIPART_COL - 
                   canvas_fix.offsetLeft - 
                   CLIPART_OBJECT_OFFSET_COL;
    var clipartY = cy - CLIPART_ROW - 
                   canvas_fix.offsetTop - TAB_HEIGHT - 
                   CLIPART_OBJECT_OFFSET_ROW;

    if (clipartX < CLIPART_SKIP * NUM_CLIPART_HORZ && clipartX > 0 && 
            clipartY < CLIPART_SKIP * NUM_CLIPART_VERT && clipartY > 0 &&
            loadedObjectsAndBG == true) {
        
        var prevSelectedIdx = selectedIdx;
        selectedIdx = Math.floor(clipartY / CLIPART_SKIP);
        selectedIdx *= NUM_CLIPART_HORZ;
        selectedIdx += Math.floor(clipartX / CLIPART_SKIP) + tabPage;
    
        if (selectedIdx < numObjTypeShow[selectedTab]) {
            selectedIdx += clipartIdxStart[selectedTab];
            
            // SA: Should instance be 0?
            var curSelectedObjType = curAvailableObj[selectedIdx].instance[0].type;
            
            if (curSelectedObjType == 'human' && 
                curAvailableObj[selectedIdx].instance[0].deformable == true) {
                
                selectPaperdollPose = true;
                selectedPart = 'Torso';
            }

            if (curAvailableObj[selectedIdx].smallestUnusedInstanceIdx == curAvailableObj[selectedIdx].numInstance) {
                // deselect it
                selectedIdx = notUsed;
                selectedIns = notUsed;
            } else {
                for (i = curAvailableObj[selectedIdx].smallestUnusedInstanceIdx; i < curAvailableObj[selectedIdx].numInstance; i++) {
                    if (curAvailableObj[selectedIdx].instance[i].present == false) {
                        selectedIns = i;
                        // Find smallest unused instance index
                        for (j = i + 1; j < curAvailableObj[selectedIdx].numInstance && 
                                curAvailableObj[selectedIdx].instance[j].present == true; j++)
                            ;
                        curAvailableObj[selectedIdx].smallestUnusedInstanceIdx = j;
                        break;
                    }
                }

                mouse_offset_X = 0;
                mouse_offset_Y = 0;
                wasOnCanvas = false;
                moveClipart = true;
                // log_user_data("Transition to scene?"); // SA: TODO Add?
                redrawCanvas = true;
            }
            
            // Update attribute tab if the user selects a new clipart object
            // SA: TODO Maybe make it remember the 
            // previous clipart object type's attribute tab?
            if (selectedIdx != prevSelectedIdx && selectedIdx != notUsed) {
                var curSelectedObjType = curAvailableObj[selectedIdx].instance[0].type;

                attributes = objectData[curSelectedObjType][curDeformTypesUse[curSelectedObjType]].attributeTypeList;

                selectedAttrTabIdx = 0;
                selectedAttrTab = attributes[selectedAttrTabIdx];
                redrawCanvas = true;
            }
        } else {
            // If the user clicks in the select object part of menu
            // but it's not a valid object, then leave selectedIdx
            // at it's previous value. Much better UX, since a
            // selected object (in the scene) stays selected.
            selectedIdx = prevSelectedIdx;
        }

        if (selectedIdx != notUsed && curLoadAll[selectedIdx] == 1 &&
            (selectedTab == 'human' && curDeformTypesUse['human'] == 'nondeformable')) {
            // should do some loading
            var s = 0;
            for (j = 0; j < curAvailableObj[selectedIdx].instance[0].numPose; j++) {
                s++; // for the first one
                for (k = 1; k < curAvailableObj[selectedIdx].instance[0].numExpression; k++) { // start with the first one
                    
                    if (j == curAvailableObj[selectedIdx].instance[selectedIns].poseID && 
                            curAvailableObj[selectedIdx].instance[selectedIns].expressionID == k) { // already loaded
                        s++;
                        continue;
                    }
                    curClipartImgs[selectedIdx][s] = new Image();
                    curClipartImgs[selectedIdx][s].src = 
                        obj_img_filename_attr2(curAvailableObj[selectedIdx].instance[selectedIns], k, j);   
                    curClipartImgs[selectedIdx][s].onload = draw_canvas;
                    s++;
                }
            }
            curLoadAll[selectedIdx] = 2; // all loaded
            redrawCanvas = true;
        }
    }

    var clipartX = cx - CLIPART_COL - canvas_fix.offsetLeft;
    var clipartY = cy - CLIPART_ROW - canvas_fix.offsetTop;
    
    // Check if it's interacting with tab page buttons
    if (is_in_rect(clipartX, clipartY, tabPageUpRect) && 
        tabPage_more_above()) {
        
        tabPage = tabPage - NUM_CLIPART_VERT * NUM_CLIPART_HORZ;
        draw_canvas();
    }
    
    if (is_in_rect(clipartX, clipartY, tabPageDownRect) && 
        tabPage_more_below()) {
        
        tabPage = tabPage + NUM_CLIPART_VERT * NUM_CLIPART_HORZ;
        draw_canvas();
    }

    // Select attribute type
    var attrTypeX = cx - ATTR_TYPE_COL - canvas_fix.offsetLeft;
    var attrTypeY = cy - ATTR_TYPE_ROW - canvas_fix.offsetTop;

    if (attrTypeY > 0 && attrTypeY < ATTR_TYPE_HEIGHT && loadedObjectsAndBG == true) {
        var attrSelectedIdx = Math.floor(attrTypeX / ATTR_TYPE_WIDTH);
        
        var curSelectedObjType;
        if (selectedIdx != notUsed) {
            curSelectedObjType = curAvailableObj[selectedIdx].instance[0].type;
        } else {
            curSelectedObjType = selectedTab;
        }
        attributes = objectData[curSelectedObjType][curDeformTypesUse[curSelectedObjType]].attributeTypeList;
        
        if (attrSelectedIdx >= 0 && attrSelectedIdx < attributes.length) {
            selectedAttrTabIdx = attrSelectedIdx;
            selectedAttrTab = attributes[selectedAttrTabIdx];
            redrawCanvas = true;
        }
    }
    
    // Select clipart attributes
    var attrX = cx - ATTR_COL - canvas_fix.offsetLeft;
    var attrY = cy - ATTR_ROW - canvas_fix.offsetTop;

    if (selectedIdx != notUsed &&
            loadedObjectsAndBG == true) {
        
        var curObjType = curAvailableObj[selectedIdx].instance[selectedIns].type;
        var curAttrTypes = get_object_attr_types(curObjType);
        var curAttrType = curAttrTypes[selectedAttrTabIdx];
        var numAttr = curAvailableObj[selectedIdx].instance[0][curAttrType['num']];
        
        if (curObjType == 'human' && curAttrType['id'] == 'expressionID') {
            numAttr -= 1; // Remove one due to (unselected) blank expression
        }
        
        if (numAttr > MAX_NUM_ATTR_PER_ROW) {
            numAttr = MAX_NUM_ATTR_PER_ROW;
        }
        
        if (attrX < CLIPART_SKIP * numAttr && attrX > 0 && 
            attrY < CLIPART_SKIP && attrY > 0) {
            
            curAvailableObj[selectedIdx].instance[selectedIns][curAttrType['id']] = Math.floor(attrX / CLIPART_SKIP);
            if (curObjType == 'human' && curAttrType['id'] == 'expressionID') {
                curAvailableObj[selectedIdx].instance[selectedIns][curAttrType['id']] += 1;
            }
            //log_user_data(curAttrType['id']);
            userChange = true;
            redrawCanvas = true;
            attrSelectorDown = true;
        }
    }

    // Select clipart on the canvas
    var canvasX = cx - CANVAS_COL - canvas_fix.offsetLeft;
    var canvasY = cy - CANVAS_ROW - canvas_fix.offsetTop;

    if (loadedObjectsAndBG == true) {
        if (canvasX < CANVAS_WIDTH && canvasX > 0 && 
            canvasY < CANVAS_HEIGHT && canvasY > 0) {

            if (selectedIdx != notUsed) {
                redrawCanvas = true;
            }
            
            selectedIdx = notUsed;
            selectedIns = notUsed;

            // Make sure we get the depth ordering correct
            for (k = numDepth0 - 1; k >= 0; k--) {
                if (curDepth0Used[k] <= 0) { // not used, just to accelerate the process
                    continue;
                }
                
                for (j = numZSize - 1; j >= 0; j--) {
                    for (l = numDepth1 - 1; l >= 0; l--) {
                        if (curDepth1Used[l] <= 0) {// not used, just to accelerate the process
                            continue;
                        }
                        for (i = 0; i < numAvailableObjects; i++) {
                            if (curAvailableObj[i].instance[0].depth0 == k && curAvailableObj[i].instance[0].depth1 == l) {
                                for (m = 0; m < curAvailableObj[i].numInstance; m++) {
                                    if (curAvailableObj[i].instance[m].present == true && curAvailableObj[i].instance[m].z == j) {
                                        if (curAvailableObj[i].instance[m].type == 'human') {
                                            
                                            if (curAvailableObj[i].instance[m].deformable == true) {
                                                // Handle the deformable people in a separate function
                                                check_deformable_person_selection(canvasX, canvasY, i, m);
                                            } else {
                                                check_nondeformable_person_selection(canvasX, canvasY, i, m);
                                            }
                                        } else {
                                            // Handle the nondeformable objects in a separate function
                                            check_nondeformable_object_selection(canvasX, canvasY, i, m);
                                        }
                                    } 
                                }
                            }
                        }
                    }
                }
            }
            
            // Update attribute tab if the user selects an old clipart object
            // SA: TODO Maybe make it remember the 
            // previous clipart object type's attribute tab?
            if (selectedIdx != notUsed) {
                var curSelectedObjType = curAvailableObj[selectedIdx].instance[0].type;

                attributes = objectData[curSelectedObjType][curDeformTypesUse[curSelectedObjType]].attributeTypeList;

                // Don't switch to default if same object selected
                if (selectedIdx != lastIdx) {
                    selectedAttrTabIdx = 0;
                }
                
                selectedAttrTab = attributes[selectedAttrTabIdx];
                redrawCanvas = true;
            }
            
            if (selectedIdx >= 0) {
                if (moveClipart === true) {
                    curAvailableObj[selectedIdx].instance[selectedIns].x = canvasX + mouse_offset_X;
                    curAvailableObj[selectedIdx].instance[selectedIns].y = canvasY + mouse_offset_Y;
                    // log_user_data("mousedown_if"); // Doesn't seem necessary?, Also, never seems to happen.
                    moveClipart = false;
                } else {
                    curAvailableObj[selectedIdx].instance[selectedIns].x = canvasX + mouse_offset_X;
                    curAvailableObj[selectedIdx].instance[selectedIns].y = canvasY + mouse_offset_Y;
                    // log_user_data("mousedown_else"); // Doesn't seem necessary?
                    moveClipart = true;
                }
                redrawCanvas = true;
            }
        }

        // Scale clipart objects
        var scaleSliderX = cx - canvas_fix.offsetLeft - SCALE_COL;
        var scaleSliderY = cy - canvas_fix.offsetTop - SCALE_ROW;

        if (scaleSliderX >= 0 && scaleSliderX < SCALE_WIDTH && scaleSliderY >= 0 && scaleSliderY < SCALE_HEIGHT) {
            if (selectedIdx != notUsed) {
                var position = Math.floor(scaleSliderX / (SCALE_WIDTH / (2 * (numZSize - 1))));
                position += 1;
                position /= 2;
                position = Math.floor(position);
                curAvailableObj[selectedIdx].instance[selectedIns].z = Math.max(0, Math.min(numZSize - 1, position));
    //             log_user_data("scale"); // Isn't needed, gets logged via mouse-up
                redrawCanvas = true;
                scaleSliderDown = true;
            }
        }

        // Flip clipart objects
        var flipButtonX = cx - canvas_fix.offsetLeft - FLIP_COL;
        var flipButtonY = cy - canvas_fix.offsetTop - FLIP_ROW;

        if (flipButtonX >= 0 && flipButtonX < buttonW * 2 && flipButtonY >= 0 && flipButtonY < buttonH) {
            if (selectedIdx != notUsed) {
                var newFlip = Math.floor(flipButtonX / buttonW);
                var oldFlip = curAvailableObj[selectedIdx].instance[selectedIns].flip;
                
                // Toggles flip - Assumes binary 0/1 values
                if (oldFlip == newFlip) {
                    curAvailableObj[selectedIdx].instance[selectedIns].flip = newFlip ? newFlip-1 :newFlip + 1;
                } else {
                    curAvailableObj[selectedIdx].instance[selectedIns].flip = newFlip;
                }

//                 log_user_data("flip");
                userChange = true;
                redrawCanvas = true;
                flipDown = true;
            }
        }
    } else {
        console.log("Should I be here?");
        load_obj_category_data();
    }

    if (redrawCanvas == true) {
        draw_canvas();
    }
}

function check_nondeformable_object_selection(canvasX, canvasY, objIdx, instIdx) {
    
    var curObjType = curAvailableObj[objIdx].instance[instIdx].type;
    var curAttrTypes = get_object_attr_types(curObjType);
    
    if (curAttrTypes.length == 1) {
        var curAttrType = curAttrTypes[0];
    
        var scale = curZScale[curAvailableObj[objIdx].instance[instIdx].z];
        var w0 = curClipartImgs[objIdx][curAvailableObj[objIdx].instance[instIdx][curAttrType['id']]].width;
        var h0 = curClipartImgs[objIdx][curAvailableObj[objIdx].instance[instIdx][curAttrType['id']]].height;
        var w = Math.floor(scale * w0);
        var h = Math.floor(scale * h0);

        var rowOffset = -h / 2;
        var colOffset = -w / 2;

        var x = curAvailableObj[objIdx].instance[instIdx].x + colOffset;
        var y = curAvailableObj[objIdx].instance[instIdx].y + rowOffset;

        if (canvasX >= x && canvasX < x + w && 
            canvasY >= y && canvasY < y + h) {

            // Make sure the piece of clipart is actually visible below the mouse click
            var newCanvas = document.createElement('canvas');
            newCanvas.width = w;
            newCanvas.height = h;
            var c = newCanvas.getContext("2d");
            c.drawImage(curClipartImgs[objIdx][curAvailableObj[objIdx].instance[instIdx][curAttrType['id']]],
                0, 0, curClipartImgs[objIdx][curAvailableObj[objIdx].instance[instIdx][curAttrType['id']]].width, 
                curClipartImgs[objIdx][curAvailableObj[objIdx].instance[instIdx][curAttrType['id']]].height,
                0, 0, w, h);

            // create a new pixel array
            imageData = c.getImageData(0, 0, w, h);
            var imgX = Math.floor(canvasX - x);
            if (curAvailableObj[objIdx].instance[instIdx].flip == 1) {
                imgX = w - 1 - imgX;
            }
            var imgY = Math.floor(canvasY - y);
            var alpha = imageData.data[(imgX + imgY * w) * 4 + 3];

            // Is the clipart visible?
            if (alpha > 0) {
                mouse_offset_X = (x + w / 2) - canvasX;
                mouse_offset_Y = (y + h / 2) - canvasY;

                selectedIdx = i;
                selectedIns = m;
            }
            // log_user_data("mousedown_selected"); // Doesn't seem necessary

            // SA: TODO Should clicking on a selected object (on canvas) change tab?
            // Uncommenting below will enable that feature.
            // selectedTab = curAvailableObj[selectedIdx].instance[selectedIns].type;
            // selectedTabIdx = objectTypeToIdx[selectedTab];
            // log_user_data("tab"); // SA: TODO Add?
        }
    } else {
        // TODO Figure out what to do in this case
    }
}

function flip_image_data(canvas, context, input) {

   // Create output image data temporary buffer
   var output = context.createImageData(canvas.width, canvas.height);
   // Get imagedata size
   var w = input.width, h = input.height;
   var inputData = input.data;
   var outputData = output.data
   // loop
   for (var y = 1; y < h-1; y += 1) {
       for (var x = 1; x < w-1; x += 1) {
           // RGBA
           var i = (y*w + x)*4;
           var flip = (y*w + (w - x))*4;
           for (var c = 0; c < 4; c += 1) {
                outputData[i+c] = inputData[flip+c];
           }
       }
   }
   
   return output;
}

function check_deformable_person_selection(canvasX, canvasY, objIdx, instIdx) {

    var paperdoll = curAvailableObj[objIdx].instance[instIdx];
    var numBodyParts = paperdoll.body.length;
    var scale = paperdoll.globalScale * curZScale[paperdoll.z];

    for (partIdx = 0; partIdx < numBodyParts; partIdx++) {
        var w = curPaperdollPartImgs[objIdx][partIdx].width;
        var h = curPaperdollPartImgs[objIdx][partIdx].height;
        var ws = Math.floor(scale * curPaperdollPartImgs[objIdx][partIdx].width);
        var hs = Math.floor(scale * curPaperdollPartImgs[objIdx][partIdx].height);

        var x1 = 0;
        var y1 = 0;
        var x00 = 0;
        x00 = paperdoll.deformableX[partIdx] * scale

        var x0 = canvasX / scale - paperdoll.deformableX[partIdx];
        var y0 = canvasY / scale - paperdoll.deformableY[partIdx];

        var rotMatrix = [];

        rotMatrix.push(Math.cos(-paperdoll.deformableGlobalRot[partIdx]));
        rotMatrix.push(-Math.sin(-paperdoll.deformableGlobalRot[partIdx]));
        rotMatrix.push(Math.sin(-paperdoll.deformableGlobalRot[partIdx]));
        rotMatrix.push(Math.cos(-paperdoll.deformableGlobalRot[partIdx]));

        var x1 = rotMatrix[0] * x0 + rotMatrix[1] * y0;
        var y1 = rotMatrix[2] * x0 + rotMatrix[3] * y0;

        if (paperdoll.flip == 1) {
            x1 += w - 1 - paperdoll.body[partIdx].childX;
        } else {
            x1 += paperdoll.body[partIdx].childX;
        }

        y1 += paperdoll.body[partIdx].childY;

        x1 *= scale;
        y1 *= scale;
       
        if (x1 >= 0 && x1 < ws && y1 >= 0 && y1 < hs) {
            // Make sure the piece of clipart is actually visible below the mouse click
            var newCanvas = document.createElement('canvas');
            newCanvas.width = ws;
            newCanvas.height = hs;
            var c = newCanvas.getContext("2d");

            c.drawImage(curPaperdollPartImgs[objIdx][partIdx],
                        0, 0, w, h,
                        0, 0, ws, hs);

            // create a new pixel array
            imageData = c.getImageData(0, 0, ws, hs);
            
            var imgX = Math.floor(x1);
            if (paperdoll.flip == 1) {
                imgX = ws - 1 - imgX;
            }
            
            var imgY = Math.floor(y1);
            var alpha = imageData.data[(imgX + imgY * ws) * 4 + 3];

            // If the piece of clipart visible?
            if (alpha > 0) {
                
                selectedIdx = objIdx;
                selectedIns = instIdx;
                if (paperdoll.body[partIdx].clickTransfer == 'null') {
                    selectedPart = paperdoll.body[partIdx].part;
                } else {
                    selectedPart = paperdoll.body[partIdx].clickTransfer;
                }

                mouse_offset_X = (curAvailableObj[objIdx].instance[instIdx].x) - canvasX;
                mouse_offset_Y = (curAvailableObj[objIdx].instance[instIdx].y) - canvasY;
                selectPaperdollPose = true;
            }
        }
    }
}

function check_nondeformable_person_selection(canvasX, canvasY, objIdx, instIdx) {
    
    var scale = curZScale[curAvailableObj[objIdx].instance[instIdx].z];
    var indexP = curAvailableObj[objIdx].instance[instIdx].poseID*curAvailableObj[objIdx].instance[instIdx].numExpression +
                 curAvailableObj[objIdx].instance[instIdx].expressionID;

    var w = Math.floor(scale * curClipartImgs[objIdx][indexP].width);
    var h = Math.floor(scale * curClipartImgs[objIdx][indexP].height);

    var rowOffset = -h / 2;
    var colOffset = -w / 2;

    var x = curAvailableObj[objIdx].instance[instIdx].x + colOffset;
    var y = curAvailableObj[objIdx].instance[instIdx].y + rowOffset;

    if (canvasX >= x && canvasX < x + w && 
        canvasY >= y && canvasY < y + h) {

        // Make sure the piece of clipart is actually visible below the mouse click
        var newCanvas = document.createElement('canvas');
        newCanvas.width = w;
        newCanvas.height = h;
        var c = newCanvas.getContext("2d");
        c.drawImage(curClipartImgs[objIdx][indexP],
            0, 0, 
            curClipartImgs[objIdx][indexP].width, 
            curClipartImgs[objIdx][indexP].height,
            0, 0, w, h);

        // create a new pixel array
        imageData = c.getImageData(0, 0, w, h);
        var imgX = Math.floor(canvasX - x);
        if (curAvailableObj[objIdx].instance[instIdx].flip == 1) {
            imgX = w - 1 - imgX;
        }
        var imgY = Math.floor(canvasY - y);
        var alpha = imageData.data[(imgX + imgY * w) * 4 + 3];

        // Is the clipart visible?
        if (alpha > 0) {
            mouse_offset_X = (x + w / 2) - canvasX;
            mouse_offset_Y = (y + h / 2) - canvasY;

            selectedIdx = i;
            selectedIns = m;
        }
        // log_user_data("mousedown_selected"); // Doesn't seem necessary

        // SA: TODO Should clicking on a selected object (on canvas) change tab?
        // Uncommenting below will enable that feature.
        // selectedTab = curAvailableObj[selectedIdx].instance[selectedIns].type;
        // selectedTabIdx = objectTypeToIdx[selectedTab];
        // log_user_data("tab"); // SA: TODO Add?
    }
}

//update the current location of the keypoint
function mousemove_canvas(event) {
    
    var ev = event || window.event;

    if (ev.pageX) {
        cx = ev.pageX;
    } else if (ev.clientX) {
        cx = ev.clientX;
        if (document.documentElement.scrollLeft) {
            cx += document.documentElement.scrollLeft;
        } else {
            cx += document.body.scrollLeft;
        }
    }
    
    if (ev.pageY) {
        cy = ev.pageY;
    } else if (ev.clientY) {
        cy = ev.clientY;
        if (document.documentElement.scrollTop) {
            cy += document.documentElement.scrollTop;
        } else {
            cy += document.body.scrollTop;
        }
    }
    
    if (selectedIdx != notUsed && 
        moveClipart == true && 
        wasOnCanvas === true &&
        loadedObjectsAndBG == true) {

        curAvailableObj[selectedIdx].instance[selectedIns].present = false;
        //log_user_data("mousemove_unselect"); // Changes too frequently with mouse movement
        draw_canvas();
    }

    var canvasX = cx - CANVAS_COL - canvas_fix.offsetLeft;
    var canvasY = cy - CANVAS_ROW - canvas_fix.offsetTop;

    if (canvasX < CANVAS_WIDTH && 
        canvasX > 0 && 
        canvasY < CANVAS_HEIGHT && 
        canvasY > 0 &&
        loadedObjectsAndBG == true) {
        
        wasOnCanvas = true;

        if (selectedIdx != notUsed && moveClipart === true) {   
            if (curAvailableObj[selectedIdx].instance[selectedIns].type == 'human' &&
                curAvailableObj[selectedIdx].instance[selectedIns].deformable == true) {
                    
                curAvailableObj[selectedIdx].instance[selectedIns].present = true;
                var paperdollInst = curAvailableObj[selectedIdx].instance[selectedIns];
                
                userChange = true;
                if (selectedPart == 'Torso') {
                    paperdollInst.x = canvasX + mouse_offset_X;
                    paperdollInst.y = canvasY + mouse_offset_Y;
                    paperdollInst.present = true;
                } else {
                    if (selectedPart == 'Head') {
                        var x0 = canvasX - paperdollInst.x;
                        var y0 = canvasY - paperdollInst.y;

                        paperdollInst.deformableGlobalRot[0] = Math.atan2(x0, -y0);
                    } else {
                        selectedPartIdx = paperdollInst.partIdxList[selectedPart];
                        selectedParentIdx = paperdollInst.partIdxList[paperdollInst.body[selectedPartIdx].parent];

                        var scale = paperdollInst.globalScale * curZScale[paperdollInst.z];
                        var x0 = canvasX / scale - paperdollInst.deformableX[selectedPartIdx];
                        var y0 = canvasY / scale - paperdollInst.deformableY[selectedPartIdx];

                        if (paperdollInst.flip == 1) {
                            paperdollInst.deformableLocalRot[selectedPartIdx] = -Math.atan2(-x0, y0);

                            if (paperdollInst.parent != 'null') {
                                paperdollInst.deformableLocalRot[selectedPartIdx] += paperdollInst.deformableGlobalRot[selectedParentIdx];
                            }
                        } else {
                            paperdollInst.deformableLocalRot[selectedPartIdx] = Math.atan2(-x0, y0);

                            if (paperdollInst.parent != 'null') {
                                paperdollInst.deformableLocalRot[selectedPartIdx] -= paperdollInst.deformableGlobalRot[selectedParentIdx];
                            }
                        }
                    }
                }
                draw_canvas();
            } else {
                curAvailableObj[selectedIdx].instance[selectedIns].x = canvasX + mouse_offset_X;
                curAvailableObj[selectedIdx].instance[selectedIns].y = canvasY + mouse_offset_Y;
                curAvailableObj[selectedIdx].instance[selectedIns].present = true;
//                 log_user_data("mousemove_select"); // Changes too frequently with mouse movement
                draw_canvas();
            }
        }
    }

    if (attrSelectorDown == true) {
        var attrX = cx - ATTR_COL - canvas_fix.offsetLeft;
        var attrY = cy - ATTR_ROW - canvas_fix.offsetTop;

        if (selectedIdx != notUsed &&
                loadedObjectsAndBG == true) {
            
            var curObjType = curAvailableObj[selectedIdx].instance[0].type;
            var curAttrTypes = get_object_attr_types(curObjType);
            var curAttrType = curAttrTypes[selectedAttrTabIdx];

            var numAttr = curAvailableObj[selectedIdx].instance[0][curAttrType['num']];
        
            if (curObjType == 'human' && curAttrType['id'] == 'expressionID') {
                numAttr -= 1; // Remove one due to (unselected) blank expression
            }
            
            // SA: TODO Update interface to support more than 9 attribute possibilites
            if (numAttr > MAX_NUM_ATTR_PER_ROW) {
                numAttr = MAX_NUM_ATTR_PER_ROW;
            }

            if (attrX < CLIPART_SKIP * numAttr && attrX > 0 && attrY < CLIPART_SKIP && attrY > 0) {
                curAvailableObj[selectedIdx].instance[selectedIns][curAttrType['id']] = Math.floor(attrX / CLIPART_SKIP);
                if (curObjType == 'human' && curAttrType['id'] == 'expressionID') {
                    curAvailableObj[selectedIdx].instance[selectedIns][curAttrType['id']] += 1;
                }
//                 log_user_data(curAttrType['id']);
                draw_canvas();
            }
            
        }
    }

    if (scaleSliderDown == true) {
        var scaleSliderX = cx - canvas_fix.offsetLeft - SCALE_COL;
        var scaleSliderY = cy - canvas_fix.offsetTop - SCALE_ROW;

        if (selectedIdx != notUsed && loadedObjectsAndBG == true) {
            var position = Math.floor(scaleSliderX / (SCALE_WIDTH / (2 * (numZSize - 1))));
            position += 1;
            position /= 2;
            position = Math.floor(position);
            curAvailableObj[selectedIdx].instance[selectedIns].z = Math.max(0, Math.min(numZSize - 1, position));
            // log_user_data("zScale slider movement"); // Doesn't seem necessary
            draw_canvas();
        }
    }

    if (flipDown == true) {
        var flipButtonX = cx - canvas_fix.offsetLeft - FLIP_COL;
        var flipButtonY = cy - canvas_fix.offsetTop - FLIP_ROW;

        if (flipButtonX >= 0 && flipButtonX < buttonW * 2 && 
            flipButtonY >= 0 && flipButtonY < buttonH) {
            
            if (selectedIdx != notUsed) {
                var newFlip = Math.floor(flipButtonX / buttonW);
//                 var oldFlip = curAvailableObj[selectedIdx].instance[selectedIns].flip;
                curAvailableObj[selectedIdx].instance[selectedIns].flip = newFlip;
//                 log_user_data("flip");
                userChange = true;
                draw_canvas();
            }
        }
    }
}

// Check if possible to change tab page
function tabPage_more_above() {
    return ((tabPage - 
            NUM_CLIPART_VERT*NUM_CLIPART_HORZ) >= 0);
}

function tabPage_more_below() {
    return ((tabPage + 
             NUM_CLIPART_VERT*NUM_CLIPART_HORZ) < numObjTypeShow[selectedTab]);
}

// rect functions
// A general function to check if (x,y) is in rect
function is_in_rect(x, y, rect) {
    return (x >= rect.x1 && 
            x < rect.x2 && 
            y >= rect.y1 && 
            y < rect.y2);
}

// A general function to get rect relative to another rect
function relative_to_rect(rect1, rect) {
    return {x1: rect1.x1 - rect.x1,
            x2: rect1.x2 - rect.x1,
            y1: rect1.y1 - rect.y1,
            y2: rect1.y2 - rect.y2};
}

function rect_height(rect) {
    return (rect.y2 - rect.y1)
}

function rect_width(rect) {
    return (rect.x2 - rect.x1);
}

// ===========================================================
// Let users use keyboard shortcuts for certain features.
// Selected can be shrunk/enlarged (CTRL + a/CTRL + z), 
// sent backward/forward like PPT (CTRL + s/ CTRL + x),
// and its flip toggled (CTRL + c).
// ===========================================================
function handle_key_down(event) {
    
    var e = window.event || event;
    
    // "17" == control key
    if (e.keyCode == "17") {
        CTRL_DOWN = true;
    } else if (CTRL_DOWN == true && loadedObjectsAndBG == true) {
        
        if (e.keyCode == "83") {// s
            e.preventDefault();
            //alert("Move object back.");
            if (selectedIdx != notUsed) {
                curDepth1Used[curAvailableObj[selectedIdx].instance[selectedIns].depth1]--;
                curAvailableObj[selectedIdx].instance[selectedIns].depth1 = Math.min(curAvailableObj[selectedIdx].instance[selectedIns].depth1+1, numDepth1-1);
                curDepth1Used[curAvailableObj[selectedIdx].instance[selectedIns].depth1]++;
                log_user_data("key press");
                draw_canvas();
            }
        } else if (e.keyCode == "88") { // x
            e.preventDefault();
            //alert("Move object forward.");
            if (selectedIdx != notUsed) {
                curDepth1Used[curAvailableObj[selectedIdx].instance[selectedIns].depth1]--;
                curAvailableObj[selectedIdx].instance[selectedIns].depth1 = Math.max(curAvailableObj[selectedIdx].instance[selectedIns].depth1-1, 0);
                curDepth1Used[curAvailableObj[selectedIdx].instance[selectedIns].depth1]++;
                log_user_data("key press");
                draw_canvas();
            }
        } else if (e.keyCode == "90") { // z
            e.preventDefault();
            //alert("Increase object size.");
            if (selectedIdx != notUsed) {
                curAvailableObj[selectedIdx].instance[selectedIns].z = Math.max(curAvailableObj[selectedIdx].instance[selectedIns].z-1, 0);
                log_user_data("key press");
                draw_canvas();
            }
        } else if (e.keyCode == "65") { // a
            e.preventDefault();
            //alert("Decrease object size.");
            if (selectedIdx != notUsed) {
                curAvailableObj[selectedIdx].instance[selectedIns].z = Math.min(curAvailableObj[selectedIdx].instance[selectedIns].z+1, numZSize-1);
                log_user_data("key press");
                draw_canvas();
            }
        } else if (e.keyCode == "67") { // c
            e.preventDefault();
            //alert("Change flip.");
            if (selectedIdx != notUsed) {
                /// Flip is 0 or 1, so this is a clever way to flip
                curAvailableObj[selectedIdx].instance[selectedIns].flip = 1 - curAvailableObj[selectedIdx].instance[selectedIns].flip;
                log_user_data("key press");
                draw_canvas();
            }
        }
    }
}

function handle_key_up(event) {
    
    var e = window.event || event;
    // "17" == control key
    if (e.keyCode == "17") {
        CTRL_DOWN = false;
    }
}
