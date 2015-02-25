// HIT-related Info
var init_time;

var NUM_TABS;
// Names of the object types (e.g., smallObject)
// in a defined order that governs their index
// into availableObject
var objectTypeOrder;
// objectType name -> idx for menu stuff
var objectTypeToIdx; 
var numObjTypeShow;

 // Start off on which tab? Set in scene config file.
var selectedTab;
var selectedTabIdx;

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
var curUserSequence = {};
var curClipartImgs = [];
var curPeopleExprImgs = [];
var curDepth0Used;
var curDepth1Used;
var curInitHistory;

var loadedObjectsAndBG = false;

// global variables for the page
////// MULTIPLE OBJECTS FOR THE CURRENT SCENE ///////
// Various variables setting up the appearence of the interface
var CANVAS_WIDTH = 700;
var CANVAS_HEIGHT = 400;
var CANVAS_ROW = 106;
var CANVAS_COL = 20;
var TAB_WIDTH = 334;
var TAB_HEIGHT = 62;
var CLIPART_WIDTH = TAB_WIDTH;
var CLIPART_HEIGHT = CANVAS_HEIGHT;
var CLIPART_ROW = CANVAS_ROW;
var CLIPART_COL = CANVAS_WIDTH + 50;
var CLIPART_BUFFER = 10;
// the row of canvas and the buffer, looks like the starting point
var ATTR_ROW = CANVAS_ROW + CANVAS_HEIGHT + CLIPART_BUFFER; 
var ATTR_COL = CANVAS_COL; // so row should be the vertial direction
var ATTR_WIDTH = 700;
var ATTR_HEIGHT = 82;
var ATTR2_ROW = ATTR_ROW + ATTR_HEIGHT + CLIPART_BUFFER;
var ATTR2_COL = CANVAS_COL;
var ATTR2_WIDTH = 700;
var ATTR2_HEIGHT = 82;

// Adding buttons for pages within tabs
var tabPage = 0;
var tabPageUpRect = {x1: 20, x2:155,
                     y1: 5,  y2:55};
var tabPageDownRect = {x1: 180, x2: 315, 
                       y1: 5,   y2: 55};
var tabPageUpImg;
var tabPageDownImg;

// Grid size of shown clipart objects
var NUM_CLIPART_VERT = 5;
var NUM_CLIPART_HORZ = 5;
var CLIPART_SKIP = (CLIPART_WIDTH - CLIPART_BUFFER) / NUM_CLIPART_HORZ;
var CLIPART_SIZE = CLIPART_SKIP - 2 * CLIPART_BUFFER;
var CLIPART_OBJECT_OFFSET_COL = 0;
var CLIPART_OBJECT_OFFSET_ROW = 50;
// Number of clip art to show of the other objects
var CLIPART_OBJECT_COL = CLIPART_COL + CLIPART_SKIP * NUM_CLIPART_HORZ + 24;
// Button size
var SCALE_COL = 97;
var SCALE_ROW = 65;
var SCALE_WIDTH = 170;
var SCALE_HEIGHT = 29;
var FLIP_COL = 350;
var FLIP_ROW = 54;
var ScaleSliderDown = false;
var wasOnCanvas = false;

var i, j, k, l, m;
var bgImg;
var selectedImg;
var buttonImg;
var tabsImg;
var objectBoxImg;
var titleImg;
var attrBoxImg;
var attr2BoxImg;
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
var lastIdx = -9999;
var lastIns = -9999; 
var lastX = 0;
var lastY = 0;
var lastZ = 0; 
var moveClipart = false;

// get response from keyboard
var CTRL_DOWN = false;

// Loads the info about what different scenes are like
// and then also loads the object category specific information
// into the interface. This must finish before we can start
// rendering objects.
load_config_json(); 

// ===========================================================
// Top-level initialization of the website and canvas
// ===========================================================
function init() {
    
    init_time = $.now();
    curScene = 0;
    
    // Load the background of the scene
//     bgImg = new Image();
//     bgImg.src = baseURLInterface + 'Living' + '/' + "BG1.png"
//     bgImg.onload = draw_canvas;
    
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
    titleImg = new Image();
    titleImg.src = baseURLInterface + 'title.png';
    tabsImg = new Image();
    tabsImg.src = baseURLInterface + 'tabs.png';
    objectBoxImg = new Image();
    objectBoxImg.src = baseURLInterface + 'objectBox.png';
    attrBoxImg = new Image();
    attrBoxImg.src = baseURLInterface + 'attrBox.png';
    attr2BoxImg = new Image();
    attr2BoxImg.src = baseURLInterface + 'attrBox.png';
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
    // selectedImg.onload = draw_canvas;
    titleImg.onload = draw_canvas;
    tabsImg.onload = draw_canvas;
    objectBoxImg.onload = draw_canvas;
    attrBoxImg.onload = draw_canvas;
    attr2BoxImg.onload = draw_canvas;
    slideBarImg.onload = draw_canvas;
    slideMarkImg.onload = draw_canvas;
    // noLeftImg.onload = draw_canvas;
    // numBorderImg.onload = draw_canvas;
    
    // Tab page button images
    tabPageUpImg=new Image();
    tabPageUpImg.src = baseURLInterface + 'previous_button.png';
    tabPageUpImg.onload=draw_canvas;
    tabPageDownImg=new Image();
    tabPageDownImg.src = baseURLInterface + 'next_button.png';
    tabPageDownImg.onload=draw_canvas;

    reset_scene();
    draw_canvas();
}

function reset_scene() {
    
    if ( sceneTypeList.length > 0 && sceneConfigData != undefined) {
        curSceneData = sceneData[curScene];
        curSceneType = sceneTypeList[curScene];
        
        imgPadNum = sceneConfigData[curSceneType].imgPadNum;
        notUsed = sceneConfigData[curSceneType].notUsed;
        defZSize = sceneConfigData[curSceneType].defZSize;
        minNumObj = sceneConfigData[curSceneType].minNumObj;
        minPerCatType = sceneConfigData[curSceneType].minPerCatType;
        numZSize = sceneConfigData[curSceneType].numZSize;
        numDepth0 = sceneConfigData[curSceneType].numDepth0;
        numDepth1 = sceneConfigData[curSceneType].numDepth1;
        numFlip = sceneConfigData[curSceneType].numFlip;
        
        selectedIdx = notUsed;
        selectedIns = notUsed; 
        lastIdx = notUsed;
        lastIns = notUsed; 
        lastX = 0;
        lastY = 0;
        lastZ = defZSize; 
        
        // In the html file
        update_instructions();

        load_obj_category_data();
        
        curZScale = Array(numZSize);
        curZScale[0] = 1.0;
        for (i = 1; i < numZSize; i++) {
            curZScale[i] = curZScale[i - 1] * sceneConfigData[curSceneType].zSizeDecay;
        }
        
        clipartIdxStart = []
        clipartIdxStart.push(0);
        for (i = 1; i < objectTypeOrder.length; i++) {
            clipartIdxStart.push(numObjTypeShow[objectTypeOrder[i-1]] + clipartIdxStart[i - 1]); // just for indexing, mark the starting point of each
        }

        selectedIdx = notUsed;
        selectedIns = notUsed;
        moveClipart = false;
        mouse_offset_X = 0;
        mouse_offset_Y = 0;
        
        // Load the background of the scene
        bgImg = new Image();
        bgImg.src = baseURLInterface + 
                    sceneConfigData[curSceneType].baseDir+ "/" 
                    + sceneConfigData[curSceneType].bgImg;
        bgImg.onload = draw_canvas;
        
        if (curSceneData != undefined) { // Scene exists from current session
            
            curAvailableObj = curSceneData.availableObject;
            curClipartImgs = curSceneData.clipartImgs;
            curPeopleExprImgs = curSceneData.peopleExprImgs;
            curUserSequence = curSceneData.userSequence;
            curLoadAll = curSceneData.loadAll;
            curDepth0Used = curSceneData.depth0Used;
            curDepth1Used = curSceneData.depth1Used;
            curSceneType = curSceneData.sceneType;
            curInitHistory = curSceneData.initHistory;
            
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
                    rand_obj_init();
                    rand_obj_load_first_imgs();
                } else {
                    curInitHistory = sceneJSONData[curSceneFile].initHistory;
                    if (curInitHistory == undefined) {
                        curInitHistory = ['Random'];
                    }
                    curInitHistory.push(curSceneFile);
                    json_obj_init();
                    json_obj_load_first_imgs();
                }
            } else { // Random initialization of scene
                curInitHistory = ['Failed->Random'];
                rand_obj_init();
                rand_obj_load_first_imgs();
            }
            
            // SA: TODO Should probably wrap this in a nice class initialization or something
            curSceneData.availableObject = curAvailableObj;
            curSceneData.clipartImgs = curClipartImgs;
            curSceneData.peopleExprImgs = curPeopleExprImgs;
            curSceneData.loadAll = curLoadAll;
            curSceneData.userSequence = curUserSequence;
            curSceneData.depth0Used = curDepth0Used;
            curSceneData.depth1Used = curDepth1Used;
            curSceneData.sceneType = curSceneType;
            curSceneData.initHistory = curInitHistory;
        }
        loadedObjectsAndBG = true;
    }
    draw_scene();
}

function json_obj_init() {
    
    sceneFilename = sceneJSONFile[curScene];
    curSceneData = sceneJSONData[sceneFilename].scene;
    curAvailableObj = curSceneData.availableObject;
    curClipartImgs = Array(numAvailableObjects);
    curPeopleExprImgs = Array(numObjTypeShow['human']);
    
//     // Don't overwrite user tracking history
//     curUserSequence = curSceneData.userSequence;
    // Overwrite old user tracking history
    curUserSequence = { selectedIdx: [],
                        selectedIns: [],
                        present: [],
                        poseID: [],
                        expressionID: [],
                        x: [],
                        y: [],
                        z: [],
                        flip: [],
                        depth1: []
                      };

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

function rand_obj_init(histStr) {

    curAvailableObj = [];
    curClipartImgs = Array(numAvailableObjects);
    curPeopleExprImgs = Array(numObjTypeShow['human']);
    curUserSequence = { selectedIdx: [],
                        selectedIns: [],
                        present: [],
                        poseID: [],
                        expressionID: [],
                        x: [],
                        y: [],
                        z: [],
                        flip: [],
                        depth1: []
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
    for (var objectType in objectData) {
        if (objectData.hasOwnProperty(objectType)) {
            curObjectType = objectData[objectType];
            numSelObj = numObjTypeShow[curObjectType.objectType];
            var validIdxs = [];
            for ( var k = 0; k < curObjectType.type.length; k++ ) {
                for ( var m = 0; m < curObjectType.type[k].availableScene.length; m++ ) {
                    if ( curObjectType.type[k].availableScene[m].scene == curSceneType ) {
                        validIdxs.push([k, m])
                    }
                }
            }
            var numValidTypes = validIdxs.length;
            
            for ( var j = 0; j < numSelObj; j++ ) {
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
                for ( var k = 0; k < numTotalInstance; k++ ) {
                    
                    idxPose = get_random_int(0, curObjectType.type[idxValidType].numPose);
                    var objInstance = {};
                    if (curObjectType.deformable == undefined) {
                        // SA: Temporary hack until I update the object config files
                        objInstance.deformable = false;
                    } else {
                        objInstance.deformable = curObjectType.deformable;
                    }
                    
                    if (objInstance.deformable == true) {
                        // TODO Add additional fields for deformable/paperdoll types
                    }
                    objInstance.type = curObjectType.objectType;
                    objInstance.name = curObjectType.type[idxValidType].name;
                    objInstance.numPose = curObjectType.type[idxValidType].numPose;
                    objInstance.poseID = idxPose;
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
                    
                    // Currently, only humans have additional fields/aren't consistent with others
                    if ( curObjectType.objectType == "human" ) {
                        objInstance.numStyle = curObjectType.type[idxValidType].numStyle;
                        objInstance.styleID = idxStyle;
                        objInstance.numExpression = curObjectType.type[idxValidType].numExpression;
                        objInstance.expressionID = 0; // No face
                    } else if (curObjectType.objectType == "largeObject" || curObjectType.objectType == "smallObject") {
                        // SA: Do we want this at instance-level?
                        objInstance.baseDir = curObjectType.type[idxValidType].baseDir;
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
}

function json_obj_load_first_imgs() {
    // SA: Switch from draw_clipart to draw_canvas is fairly hacky.
    // Otherwise it wouldn't always render all of the objects
    // (until user menu action) since some hadn't loaded yet.
    // There could also be a bug with curInst. 
    
    // Load the clip art images
    var curInst;
    var i;
    for (i = 0; i < numObjTypeShow['human']; i++) {
//         curInst = curAvailableObj[i].smallestUnusedInstanceIdx;
        curInst = 0;
        curLoadAll[i] = 0; // set the variable to be zero
        curClipartImgsIdx = curAvailableObj[i].instance[curInst].poseID * 
                            curAvailableObj[i].instance[curInst].numExpression + 
                            curAvailableObj[i].instance[curInst].expressionID;
        curClipartImgs[i] = Array(curAvailableObj[i].instance[curInst].numPose * 
                                  curAvailableObj[i].instance[curInst].numExpression); // two dimensional array
        curClipartImgs[i][curClipartImgsIdx] = new Image();
        curClipartImgs[i][curClipartImgsIdx].src = 
            obj_img_filename(curAvailableObj[i].instance[curInst]);
            
        curPeopleExprImgs[i] = Array(curAvailableObj[i].instance[curInst].numExpression);
        curPeopleExprImgs[i][curAvailableObj[i].instance[curInst].expressionID] = new Image();
        curPeopleExprImgs[i][curAvailableObj[i].instance[curInst].expressionID].src = 
            expr_img_filename(curAvailableObj[i].instance[curInst]);
    }

    // now for the rest of the objects
    // SA: TODO Fix this so it doesn't assume order on human/animal/etc.
    for (i = numObjTypeShow['human']; i < numAvailableObjects; i++) {
//         curInst = curAvailableObj[i].smallestUnusedInstanceIdx;
        curInst = 0;
        curClipartImgs[i] = Array(curAvailableObj[i].instance[curInst].numPose);
        
        for (j = 0; j < curAvailableObj[i].instance[curInst].numPose; j++) {
            curClipartImgs[i][j] = new Image();
            curClipartImgs[i][j].src =
                obj_img_filename_pose(curAvailableObj[i].instance[curInst], j);
        }
    }
    
    // Update the canvas once the images are loaded
    for (i = 0; i < numObjTypeShow['human']; i++) {
        curInst = curAvailableObj[i].smallestUnusedInstanceIdx;
        curInst = 0;
        curClipartImgsIdx = curAvailableObj[i].instance[curInst].poseID*curAvailableObj[i].instance[curInst].numExpression + 
                            curAvailableObj[i].instance[curInst].expressionID;
        curClipartImgs[i][curClipartImgsIdx].onload = draw_canvas;
        curPeopleExprImgs[i][curAvailableObj[i].instance[curInst].expressionID].onload = draw_canvas;
    }

    for (i = numObjTypeShow['human']; i < numAvailableObjects; i++) {
        curInst = curAvailableObj[i].smallestUnusedInstanceIdx;
        curInst = 0;
        curClipartImgs[i][curAvailableObj[i].instance[curInst].poseID].onload = draw_canvas;
    }

   // then load all the images to be possibly displayed ?
    for (i = 0; i < numObjTypeShow['human']; i++) {
        curInst = curAvailableObj[i].smallestUnusedInstanceIdx;
        curInst = 0;
        var s;
        k = 0;
        for (j = 0; j < curAvailableObj[i].instance[curInst].numPose; j++) {   
            s = j * curAvailableObj[i].instance[curInst].numExpression;
            
            curClipartImgs[i][s] = new Image();
            curClipartImgs[i][s].src = 
                obj_img_filename_pose_expr(curAvailableObj[i].instance[curInst], j, k);
        }

        // also load the expression only images
        for (j = 0; j <  curAvailableObj[i].instance[0].numExpression; j++) {
            if (curPeopleExprImgs[i][j] != undefined) { // already loaded
                continue;
            }
            curPeopleExprImgs[i][j] = new Image();
            curPeopleExprImgs[i][j].src = 
                expr_img_filename_expr(curAvailableObj[i].instance[curInst], j);
        }

        curLoadAll[i] = 1; // set the variable to be true
    }
    // do not need for curPeopleExprImgs because they are displayed later

    // set onload
    for (i = 0; i < numObjTypeShow['human']; i++) {
        curInst = curAvailableObj[i].smallestUnusedInstanceIdx;
        curInst = 0;
        var s;
        k = 0;
        for (j = 0; j <  curAvailableObj[i].instance[curInst].numPose; j++) {
            if (curClipartImgs[i][s] != undefined) { // already loaded
                continue;
            }
            s = j * curAvailableObj[i].instance[curInst].numExpression;
            curClipartImgs[i][s].onload = draw_canvas;
        }
    
        // also load the expression only images
        for (j = 0; j <  curAvailableObj[i].instance[curInst].numExpression; j++) {
            if (curPeopleExprImgs[i][j] != undefined) { // already loaded
                continue;
            }
            curPeopleExprImgs[i][j].onload = draw_canvas;
        }
    }
}

function rand_obj_load_first_imgs() {
    // Load the clip art images
    for (i = 0; i < numObjTypeShow['human']; i++) {
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

    // now for the rest of the objects
    // SA: TODO Fix this so it doesn't assume order on human/animal/etc.
    for (i = numObjTypeShow['human']; i < numAvailableObjects; i++) {
        curClipartImgs[i] = Array(curAvailableObj[i].instance[0].numPose);
        for (j = 0; j < curAvailableObj[i].instance[0].numPose; j++) {
            curClipartImgs[i][j] = new Image();
            curClipartImgs[i][j].src = 
                obj_img_filename_pose(curAvailableObj[i].instance[0], j);
        }
    }

    // Update the canvas once the images are loaded
    for (i = 0; i < numObjTypeShow['human']; i++) {
        curClipartImgsIdx = curAvailableObj[i].instance[0].poseID * 
                            curAvailableObj[i].instance[0].numExpression + 
                            curAvailableObj[i].instance[0].expressionID;
        curClipartImgs[i][curClipartImgsIdx].onload = draw_clipart;
        curPeopleExprImgs[i][curAvailableObj[i].instance[0].expressionID].onload = draw_clipart;
    }

    for (i = numObjTypeShow['human']; i < numAvailableObjects; i++) {
        curClipartImgs[i][curAvailableObj[i].instance[0].poseID].onload = draw_clipart;
    }

    // then load all the images to be possibly displayed ?
    for (i = 0; i < numObjTypeShow['human']; i++) {
        var s;
        k = 0;
        for (j = 0; j < curAvailableObj[i].instance[0].numPose; j++) {   
            s = j * curAvailableObj[i].instance[0].numExpression;
            
            curClipartImgs[i][s] = new Image(); 
            curClipartImgs[i][s].src = 
                obj_img_filename_pose_expr(curAvailableObj[i].instance[0], j, k);
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

    // do not need for curPeopleExprImgs because they are displayed later

    // set onload
    for (i = 0; i < numObjTypeShow['human']; i++) {
        var s;
        k = 0;
        for (j = 0; j <  curAvailableObj[i].instance[0].numPose; j++) {
            if (curClipartImgs[i][s] != undefined) { // already loaded
                continue;
            }
            s = j * curAvailableObj[i].instance[0].numExpression;
            curClipartImgs[i][s].onload = draw_clipart;
        }
    
        // also load the expression only images
        for (j = 0; j <  curAvailableObj[i].instance[0].numExpression; j++) {
            if (curPeopleExprImgs[i][j] != undefined) { // already loaded
                continue;
            }
            curPeopleExprImgs[i][j].onload = draw_clipart;
        }
    }
}


function expr_img_filename(obj) {
    return expr_img_filename_expr(obj, null);
}

function expr_img_filename_expr(obj, exprID) {
    
    var filename;
    
    if (exprID == null) {
        exprID = obj['expressionID'];
    }
    
    if (obj['type'] == 'human') {
        humanFolder = objectData['human']['baseDirectory'];
        name = obj['name'] + 
               zero_pad((exprID+1), imgPadNum) +
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

function obj_img_filename_pose(obj, poseID) {
    return obj_img_filename_general(obj, poseID, null, null);
} 

function obj_img_filename_pose_expr(obj, poseID, exprID) {
    return obj_img_filename_general(obj, poseID, exprID, null);
}

// You can ask for a specific style, pose, or expression ID image
// instead of the one that the object currently has.
function obj_img_filename_general(obj, poseID, exprID, styleID) {
    
    if (poseID == null) {
        poseID = obj['poseID'];
    }
        
    if (obj['type'] == 'human') {
        if (exprID == null) {
            exprID = obj['expressionID'];
        }
        if (styleID == null) {
            styleID = obj['styleID'];
        }
        
        humanFolder = objectData['human']['baseDirectory'];
        styleFolder = obj['name'] + zero_pad((styleID+1), imgPadNum);
        
        name = zero_pad((poseID+1), imgPadNum) +
               zero_pad((exprID+1), imgPadNum) +
               '.' + CLIPART_IMG_FORMAT; 
        filename = baseURLInterface + 
                   humanFolder + '/' + styleFolder + '/' + name;
    } else if (obj['type'] == 'animal') {
        animalFolder = objectData['animal']['baseDirectory'];
        name = obj['name'] + zero_pad((poseID+1), imgPadNum) +
               '.' + CLIPART_IMG_FORMAT; 
        filename = baseURLInterface + 
                   animalFolder + '/' + name;
    } else if (obj['type'] == 'largeObject' || obj['type'] == 'smallObject') {
        sceneFolder = sceneConfigData['baseDirectory'][obj['baseDir']];
        name = obj['name'] + zero_pad((poseID+1), imgPadNum) +
               '.' + CLIPART_IMG_FORMAT; 
        filename = baseURLInterface + 
                   sceneFolder + '/' + name;
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

// grab the results and go to next task/submit
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
            if ( idx == 0 ) {
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

function validate_scene() {
    
    var numAvailableObjectsUsed;
    var validScene = true;
    
    if (!restrictInput) {
        return validScene;
    }

//     ////////////////////// NO REQUIREMENT FOR CATEGORY //////////////////////
//     for (i = 0; i < objectTypeOrder.length; i++) {
//         numAvailableObjectsUsed = 0;
//         for (j = 0; j < numObjTypeShow[objectTypeOrder[i]]; j++) {
//                 curObjIdx = clipartIdxStart[i] + j;
//             for (m = 0; m < curAvailableObj[curObjIdx].numInstance; m++) {
//                 if (curAvailableObj[curObjIdx].instance[m].present == true) {
//                     numAvailableObjectsUsed++;
//                     break;
//                 }
//             }
//             if (numAvailableObjectsUsed > minPerCatType) {
//                 break;
//             }
//         }
//         if (numAvailableObjectsUsed < minPerCatType) {
//             render_dialog("minType");
//             validScene = false;
//             return validScene;
//         }
//     }

    numAvailableObjectsUsed = 0;
    for (i = 0; i < numObjTypeShow['human']; i++) {
        for (m = 0; m < curAvailableObj[i].numInstance; m++) {
            if (curAvailableObj[i].instance[m].present) {
                numAvailableObjectsUsed++;
                if (curAvailableObj[i].instance[m].expressionID == 0) {
                    render_dialog("expression");
                    validScene = false;
                    return validScene;
                }
            }
        }
    }
    
    for (i = numObjTypeShow['human']; i < numAvailableObjects; i++) {
        for (m = 0; m < curAvailableObj[i].numInstance; m++) {
            if (curAvailableObj[i].instance[m].present) {
                numAvailableObjectsUsed++;
            }
        }
    }

    if (numAvailableObjectsUsed < minNumObj) {
        render_dialog("minClipart");
        validScene = false;
        return validScene;
    }
    
    return validScene;
}

function log_user_data(msg) {
    
    // TODO Safety here in case of things not being loaded yet?
    curUserSequence.selectedIdx.push(selectedIdx);
    curUserSequence.selectedIns.push(selectedIns);
    // SA: TODO Verify that this is correct/reasonable
    if ( selectedIdx != notUsed && selectedIns != notUsed) {
        curUserSequence.poseID.push(curAvailableObj[selectedIdx].instance[selectedIns].poseID);
        curUserSequence.expressionID.push(curAvailableObj[selectedIdx].instance[selectedIns].expressionID);
        curUserSequence.present.push(curAvailableObj[selectedIdx].instance[selectedIns].present);
        curUserSequence.x.push(curAvailableObj[selectedIdx].instance[selectedIns].x);
        curUserSequence.y.push(curAvailableObj[selectedIdx].instance[selectedIns].y);
        curUserSequence.z.push(curAvailableObj[selectedIdx].instance[selectedIns].z);
        curUserSequence.flip.push(curAvailableObj[selectedIdx].instance[selectedIns].flip);
        curUserSequence.depth1.push(curAvailableObj[selectedIdx].instance[selectedIns].depth1);
    } else {
        curUserSequence.poseID.push(notUsed);
        curUserSequence.expressionID.push(notUsed);
        curUserSequence.present.push(notUsed);
        curUserSequence.x.push(notUsed);
        curUserSequence.y.push(notUsed);
        curUserSequence.z.push(notUsed);
        curUserSequence.flip.push(notUsed);
        curUserSequence.depth1.push(notUsed);
    }
    if (msg != undefined) {
        console.log(msg + ": " + curUserSequence.flip.length);
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
                // SA: TODO Add new scene data here?
                availableObject: sceneData[i].availableObject,
                userSequence: sceneData[i].userSequence,
                sceneType: sceneData[i].sceneType,
                initHistory: sceneData[i].initHistory
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
    if ( submitAction ) {
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

function load_config_json() {
    $.getJSON(dataURL+sceneConfigFile).done( function(data) { 
        load_object_config(data); 
    }).fail( function() { 
        console.log("Loading JSON " + sceneConfigFile + " failed.");  
    });
}

function load_object_config(data) {
    
    var curFile;
    
    if (jsonIdx == -1) {
        sceneConfigData = data;
        jsonIdx += 1;
    } else {
        objectData[data.objectType] = data;
        jsonIdx += 1;
    }
    
    if (jsonIdx < sceneConfigData.clipartObjJSONFile.length) {
        curFile = sceneConfigData.clipartObjJSONFile[jsonIdx].file;
        
        $.getJSON(dataURL+curFile).done( function(data) { 
            load_object_config(data); 
        }).fail( function() { 
            console.log("Loading JSON " + curFile + " failed.");  
        });
    } else {
        load_obj_category_data();
        reset_scene();
    }
}

function load_obj_category_data() {
        
    if (sceneTypeList.length > 0 && sceneConfigData != undefined) {
        objectTypeOrder = sceneConfigData[sceneTypeList[curScene]].objectTypeOrder;
        numObjTypeShow = sceneConfigData[sceneTypeList[curScene]].numObjTypeShow;

        // Need to initialize this otherwise interface won't load properly
        numAvailableObjects = 0;
        objectTypeToIdx = {};
        for (var i = 0; i < objectTypeOrder.length; i++) {
            numAvailableObjects += numObjTypeShow[objectTypeOrder[i]];
            objectTypeToIdx[objectTypeOrder[i]] = i;
        }
        
        selectedTab = sceneConfigData[sceneTypeList[curScene]].startTab;
        selectedTabIdx = objectTypeToIdx[selectedTab];
        tabPage = 0;
        
        // SA: TODO Currently objectTypeOrder.length is assumed
        // to be the number of tabs, which is hardcoded to 4.
        NUM_TABS = objectTypeOrder.length;
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
    TAB_WIDTH = tabsImg.width;
    TAB_HEIGHT = tabsImg.height / NUM_TABS;
    ATTR_ROW = CANVAS_ROW + CANVAS_HEIGHT + CLIPART_BUFFER;
    ATTR_COL = CANVAS_COL;
    ATTR_WIDTH = CANVAS_WIDTH + TAB_WIDTH + 8;
    ATTR_HEIGHT = CLIPART_SKIP + 2 * CLIPART_BUFFER;
    ATTR2_ROW = ATTR_ROW + ATTR_HEIGHT + CLIPART_BUFFER / 2;
    ATTR2_COL = CANVAS_COL;
    ATTR2_WIDTH = CANVAS_WIDTH + TAB_WIDTH + 8;
    ATTR2_HEIGHT = ATTR_HEIGHT;
    CLIPART_WIDTH = objectBoxImg.width;
    CLIPART_HEIGHT = CANVAS_HEIGHT;
    CLIPART_COL = CANVAS_COL + CANVAS_WIDTH + CLIPART_BUFFER;
    CLIPART_ROW = CANVAS_ROW;
    SIZE_HEIGHT = slideMarkImg.height;
    
    //draw the image
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    draw_scene();
    draw_clipart();
    draw_buttons();
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
                    
                    for (i = 0; i < numObjTypeShow['human']; i++) {
                        if (curAvailableObj[i].instance[0].depth0 == k) {
                            for (m = 0; m < curAvailableObj[i].numInstance; m++) {
                                if (curAvailableObj[i].instance[m].present == true && 
                                    curAvailableObj[i].instance[m].z == j && 
                                    curAvailableObj[i].instance[m].depth1 == l) {
                                    
                                    var scale = curZScale[curAvailableObj[i].instance[m].z]
                                    var indexP = curAvailableObj[i].instance[m].poseID*curAvailableObj[i].instance[m].numExpression +
                                                curAvailableObj[i].instance[m].expressionID;
                                                
                                    if (curClipartImgs[i][indexP] == undefined) {
                                        curClipartImgs[i][indexP] = new Image();
                                        curClipartImgs[i][indexP].src = 
                                            obj_img_filename_pose_expr(curAvailableObj[i].instance[m]);
                                        curClipartImgs[i][indexP].onload = draw_canvas;
                                        continue;
                                    }
                                    
                                    var w = curClipartImgs[i][indexP].width;
                                    var h = curClipartImgs[i][indexP].height;

                                    var rowOffset = -h / 2;
                                    var colOffset = -w / 2;
                                    rowOffset *= scale;
                                    colOffset *= scale;

                                    if (curAvailableObj[i].instance[m].flip == 0) {
                                        ctx.drawImage(curClipartImgs[i][indexP], 0, 0, w, h, 
                                                    curAvailableObj[i].instance[m].x + colOffset + CANVAS_COL, 
                                                    curAvailableObj[i].instance[m].y + rowOffset + CANVAS_ROW, 
                                                    w * scale, h * scale);
                                    } else if (curAvailableObj[i].instance[m].flip == 1) {
                                        ctx.setTransform(-1, 0, 0, 1, 0, 0);
                                        ctx.drawImage(curClipartImgs[i][indexP], 0, 0, w, h, 
                                                    -curAvailableObj[i].instance[m].x + colOffset - CANVAS_COL, 
                                                    curAvailableObj[i].instance[m].y + rowOffset + CANVAS_ROW, 
                                                    w * scale, h * scale);
                                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                                    }
                                }
                            }
                        }
                    }

                    // remain the same for objects
                    for (i = numObjTypeShow['human']; i < numAvailableObjects; i++) {
                        if (curAvailableObj[i].instance[0].depth0 == k) {
                            for (m = 0; m < curAvailableObj[i].numInstance; m++) {
                                if (curAvailableObj[i].instance[m].present == true && 
                                    curAvailableObj[i].instance[m].z == j && 
                                    curAvailableObj[i].instance[m].depth1 == l) {
                                    
                                    var scale = curZScale[curAvailableObj[i].instance[m].z];

                                    var w = curClipartImgs[i][curAvailableObj[i].instance[m].poseID].width;
                                    var h = curClipartImgs[i][curAvailableObj[i].instance[m].poseID].height;

                                    var rowOffset = -h / 2;
                                    var colOffset = -w / 2;
                                    rowOffset *= scale;
                                    colOffset *= scale;

                                    if (curAvailableObj[i].instance[m].flip == 0) {
                                        ctx.drawImage(curClipartImgs[i][curAvailableObj[i].instance[m].poseID], 
                                                      0, 0, w, h, 
                                                      curAvailableObj[i].instance[m].x + colOffset + CANVAS_COL, 
                                                      curAvailableObj[i].instance[m].y + rowOffset + CANVAS_ROW, 
                                                      w * scale, h * scale);
                                    } else if (curAvailableObj[i].instance[m].flip == 1) {
                                        ctx.setTransform(-1, 0, 0, 1, 0, 0);
                                        ctx.drawImage(curClipartImgs[i][curAvailableObj[i].instance[m].poseID], 
                                                      0, 0, w, h, 
                                                      -curAvailableObj[i].instance[m].x + colOffset - CANVAS_COL, 
                                                      curAvailableObj[i].instance[m].y + rowOffset + CANVAS_ROW, 
                                                      w * scale, h * scale);
                                        ctx.setTransform(1, 0, 0, 1, 0, 0);
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

    ctx.drawImage(titleImg, CANVAS_COL, 15);
}

function draw_clipart() {
    
    var w = tabsImg.width;
    var h = tabsImg.height / NUM_TABS;

    ctx.drawImage(tabsImg, 0, h * selectedTabIdx, w, h, CLIPART_COL, CLIPART_ROW - TAB_HEIGHT + 10, w, h);
    ctx.drawImage(objectBoxImg, 0, 0, objectBoxImg.width, objectBoxImg.height, CLIPART_COL, CLIPART_ROW, CLIPART_WIDTH, CLIPART_HEIGHT);
    ctx.drawImage(attrBoxImg, 0, 0, attrBoxImg.width, attrBoxImg.height, ATTR_COL, ATTR_ROW, ATTR_WIDTH, ATTR_HEIGHT);
    ctx.drawImage(attr2BoxImg, 0, 0, attr2BoxImg.width, attr2BoxImg.height, ATTR2_COL, ATTR2_ROW, ATTR2_WIDTH, ATTR2_HEIGHT);

    if (loadedObjectsAndBG == true) {

        curType = objectData[selectedTab].objectType;
    
        for (r = 0; r < NUM_CLIPART_VERT; r++) {
            for (c = 0; c < NUM_CLIPART_HORZ; c++) {
                var idx = r * NUM_CLIPART_HORZ + c + tabPage;

                // Only do something if there is an object of that type for selected idx 
                if ( idx < numObjTypeShow[curType] ) {
                    idx += clipartIdxStart[selectedTabIdx]; // to that page
                    if (selectedIdx == idx) { // Draws the "select" box background
                        ctx.drawImage(selectedImg, 
                                      CLIPART_COL + c * CLIPART_SKIP +
                                      (CLIPART_BUFFER / 2) + CLIPART_OBJECT_OFFSET_COL, 
                                      CLIPART_ROW + r * CLIPART_SKIP +
                                      (CLIPART_BUFFER / 2) + CLIPART_OBJECT_OFFSET_ROW, 
                                      CLIPART_SKIP, CLIPART_SKIP);
                    }
                    
                    var indexCR;
                    var left = 1;
                    var Size = 13;
                    var locationOffset = 11;

                    if ( curType == "human" ) {

                        if (curAvailableObj[idx].smallestUnusedInstanceIdx < curAvailableObj[idx].numInstance) {
                            indexCR = curAvailableObj[idx].instance[curAvailableObj[idx].smallestUnusedInstanceIdx].expressionID;
                        } else {
                            ctx.drawImage(noLeftImg, 
                                          CLIPART_COL + c * CLIPART_SKIP +
                                          (CLIPART_BUFFER / 2) + CLIPART_OBJECT_OFFSET_COL, 
                                          CLIPART_ROW + r * CLIPART_SKIP +
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
                        
                        var w = curPeopleExprImgs[idx][indexCR].width;
                        var h = curPeopleExprImgs[idx][indexCR].height;
                        
                        var newW = Math.min(w, CLIPART_SIZE * w / Math.max(w, h));
                        var newH = Math.min(h, CLIPART_SIZE * h / Math.max(w, h));

                        var rowOffset = (CLIPART_SIZE - newH) / 2 + CLIPART_BUFFER / 2;
                        var colOffset = (CLIPART_SIZE - newW) / 2 + CLIPART_BUFFER / 2;
                        var xo = CLIPART_COL + c * CLIPART_SKIP + CLIPART_BUFFER + colOffset;
                        var yo = CLIPART_ROW + r * CLIPART_SKIP + CLIPART_BUFFER + rowOffset;

                        ctx.drawImage(curPeopleExprImgs[idx][indexCR], 0, 0, w, h, 
                                      Math.floor(xo) + CLIPART_OBJECT_OFFSET_COL, 
                                      Math.floor(yo) + CLIPART_OBJECT_OFFSET_ROW, 
                                      newW, newH);
                        xo = CLIPART_COL + (c + 1) * CLIPART_SKIP - 1;
                        yo = CLIPART_ROW + (r + 1) * CLIPART_SKIP - locationOffset;
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
                        yo = CLIPART_ROW + (r + 1) * CLIPART_SKIP;
                        ctx.fillText(left, 
                                     Math.floor(xo - optionsW) + CLIPART_OBJECT_OFFSET_COL, 
                                     Math.floor(yo - optionsH) + CLIPART_OBJECT_OFFSET_ROW);
                        ctx.restore();
                        
                    } else {
                        if (curAvailableObj[idx].smallestUnusedInstanceIdx < curAvailableObj[idx].numInstance) {
                            indexCR = curAvailableObj[idx].instance[curAvailableObj[idx].smallestUnusedInstanceIdx].poseID;
                        } else {
                            ctx.drawImage(noLeftImg, 
                                          CLIPART_COL + c * CLIPART_SKIP +
                                          (CLIPART_BUFFER / 2) + CLIPART_OBJECT_OFFSET_COL, 
                                          CLIPART_ROW + r * CLIPART_SKIP +
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

                        var w = curClipartImgs[idx][indexCR].width;
                        var h = curClipartImgs[idx][indexCR].height;
                        
                        var newW = Math.min(w, CLIPART_SIZE * w / Math.max(w, h));
                        var newH = Math.min(h, CLIPART_SIZE * h / Math.max(w, h));

                        var rowOffset = (CLIPART_SIZE - newH) / 2 + CLIPART_BUFFER / 2;
                        var colOffset = (CLIPART_SIZE - newW) / 2 + CLIPART_BUFFER / 2;
                        var xo = CLIPART_COL + c * CLIPART_SKIP + CLIPART_BUFFER + colOffset;
                        var yo = CLIPART_ROW + r * CLIPART_SKIP + CLIPART_BUFFER + rowOffset;

                        ctx.drawImage(curClipartImgs[idx][indexCR], 0, 0, w, h, 
                                      Math.floor(xo) + CLIPART_OBJECT_OFFSET_COL, 
                                      Math.floor(yo) + CLIPART_OBJECT_OFFSET_ROW, 
                                      newW, newH);
                        xo = CLIPART_COL + (c + 1) * CLIPART_SKIP - 1;
                        yo = CLIPART_ROW + (r + 1) * CLIPART_SKIP - locationOffset;
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
                        yo = CLIPART_ROW + (r + 1) * CLIPART_SKIP;
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
            if (selectedIdx < numObjTypeShow['human']) {
                // people
                for (i = 0; i < curAvailableObj[selectedIdx].instance[0].numPose; i++) {
                    // just to show it is selected
                    if (i == curAvailableObj[selectedIdx].instance[selectedIns].poseID) {
                        ctx.drawImage(selectedImg, 
                                    ATTR_COL + i * CLIPART_SKIP + CLIPART_BUFFER / 2, 
                                    ATTR_ROW + CLIPART_BUFFER, 
                                    CLIPART_SKIP, CLIPART_SKIP);
                    }
                    var indexP = i * curAvailableObj[selectedIdx].instance[0].numExpression

                    var w = curClipartImgs[selectedIdx][indexP].width;
                    var h = curClipartImgs[selectedIdx][indexP].height;

                    var newW = Math.min(w, CLIPART_SIZE * w / Math.max(w, h));
                    var newH = Math.min(h, CLIPART_SIZE * h / Math.max(w, h));

                    var rowOffset = (CLIPART_SIZE - newH) / 2 + CLIPART_BUFFER / 2;
                    var colOffset = (CLIPART_SIZE - newW) / 2 + CLIPART_BUFFER / 2;

                    var xo = ATTR_COL + i * CLIPART_SKIP + CLIPART_BUFFER + colOffset;
                    var yo = ATTR_ROW + CLIPART_BUFFER + rowOffset;

                    // only draw the first one
                    ctx.drawImage(curClipartImgs[selectedIdx][indexP], 0, 0, w, h, 
                                Math.floor(xo), Math.floor(yo), newW, newH);
                }
                // then expressions
                for (i = 1; i < curAvailableObj[selectedIdx].instance[0].numExpression; i++) {
                    // just to show it is selected
                    if (i == curAvailableObj[selectedIdx].instance[selectedIns].expressionID)
                        ctx.drawImage(selectedImg, 
                                    ATTR2_COL + (i - 1) * CLIPART_SKIP + CLIPART_BUFFER / 2, 
                                    ATTR2_ROW + CLIPART_BUFFER, 
                                    CLIPART_SKIP, CLIPART_SKIP);

                    var w = curPeopleExprImgs[selectedIdx][i].width;
                    var h = curPeopleExprImgs[selectedIdx][i].height;
                    var newW = Math.min(w, CLIPART_SIZE * w / Math.max(w, h));
                    var newH = Math.min(h, CLIPART_SIZE * h / Math.max(w, h));

                    var rowOffset = (CLIPART_SIZE - newH) / 2 + CLIPART_BUFFER / 2;
                    var colOffset = (CLIPART_SIZE - newW) / 2 + CLIPART_BUFFER / 2;

                    var xo = ATTR2_COL + (i - 1) * CLIPART_SKIP + CLIPART_BUFFER + colOffset;
                    var yo = ATTR2_ROW + CLIPART_BUFFER + rowOffset;

                    // only draw the first one
                    ctx.drawImage(curPeopleExprImgs[selectedIdx][i], 0, 0, w, h, Math.floor(xo), Math.floor(yo), newW, newH);
                }
            } else { // Not human
                for (i = 0; i < curAvailableObj[selectedIdx].instance[0].numPose; i++) {
                    if (i == curAvailableObj[selectedIdx].instance[selectedIns].poseID) {
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
            }
        }
    }
}

function draw_buttons() {
    
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
                      CANVAS_COL + SCALE_COL, 
                      SCALE_ROW + (SCALE_HEIGHT - hSlide) / 2, 
                      SCALE_WIDTH, hSlide);
        if (selectedIdx != notUsed && loadedObjectsAndBG == true) {
            ctx.drawImage(slideMarkImg, 0, 0, wMark, hMark, 
                          CANVAS_COL + SCALE_COL + 
                          curAvailableObj[selectedIdx].instance[selectedIns].z * (SCALE_WIDTH / (numZSize - 1)) - 
                          wMark / 2, 
                          SCALE_ROW, wMark, SCALE_HEIGHT);
        }

        for (i = 0; i < 2; i++) {
            if (selectedIdx != notUsed && loadedObjectsAndBG == true) {
                if (i == curAvailableObj[selectedIdx].instance[selectedIns].flip) {
                    ctx.drawImage(buttonImg, w, (i + 3) * h, w, h, 
                                  i * w + CANVAS_COL + FLIP_COL, 
                                  FLIP_ROW, w, h);
                }
                else {
                    ctx.drawImage(buttonImg, 0, (i + 3) * h, w, h, 
                                  i * w + CANVAS_COL + FLIP_COL, 
                                  FLIP_ROW, w, h);
                }
            } else {
                ctx.drawImage(buttonImg, 0, (i + 3) * h, w, h, 
                              i * w + CANVAS_COL + FLIP_COL, 
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
    
    moveClipart = false;

    if (selectedIdx != notUsed &&
        loadedObjectsAndBG == true) {
        // record the movement data
        if (selectedIdx != lastIdx || selectedIns != lastIns || 
                curAvailableObj[selectedIdx].instance[selectedIns].x != lastX || 
                curAvailableObj[selectedIdx].instance[selectedIns].y != lastY || 
                curAvailableObj[selectedIdx].instance[selectedIns].z != lastZ) {

            log_user_data("mouseup1");

            lastIdx = selectedIdx;
            lastIns = selectedIns;
            lastX = curAvailableObj[selectedIdx].instance[selectedIns].x;
            lastY = curAvailableObj[selectedIdx].instance[selectedIns].y;
            lastZ = curAvailableObj[selectedIdx].instance[selectedIns].z;
        }

        if (curAvailableObj[selectedIdx].instance[selectedIns].present == false) {
            // should find a smart way to deal with the pointer
            if (selectedIns < curAvailableObj[selectedIdx].smallestUnusedInstanceIdx) {
                curAvailableObj[selectedIdx].smallestUnusedInstanceIdx = selectedIns;
                curAvailableObj[selectedIdx].smallestUnusedInstanceIdx = selectedIns;
            }

            selectedIdx = notUsed;
            selectedIns = notUsed;
            log_user_data("mouseup2"); // SA: TODO Add? Doesn't seem to get triggered

            draw_canvas();
        }
    }

    ScaleSliderDown = false;
}

function mousedown_canvas(event) {
    
    // XL: Handle bug related to user moving outside of canvas
    // and letting object be lost to the void.
    if ( moveClipart == true ) {
        mouseup_canvas(event);
    }
    
    var ev = event || window.event;

    ScaleSliderDown = false;

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
    var tabsY = cy - (CLIPART_ROW - TAB_HEIGHT) - canvas_fix.offsetTop;

    if (tabsX < CLIPART_WIDTH && tabsX > 0 && 
        tabsY < TAB_HEIGHT && tabsY > 0 &&
        loadedObjectsAndBG == true) {
        
        selectedTabIdx = Math.floor(tabsX / Math.floor(CLIPART_WIDTH / NUM_TABS));
        selectedTab = objectTypeOrder[selectedTabIdx];
        tabPage = 0;
        //log_user_data("tab"); // SA: TODO Add?
        draw_canvas();
    }

    // Select clipart objects to add to canvas
    var clipartX = cx - CLIPART_COL - 
                   canvas_fix.offsetLeft - CLIPART_OBJECT_OFFSET_COL;
    var clipartY = cy - CLIPART_ROW - 
                   canvas_fix.offsetTop - CLIPART_OBJECT_OFFSET_ROW;

    if (clipartX < CLIPART_SKIP * NUM_CLIPART_HORZ && clipartX > 0 && 
            clipartY < CLIPART_SKIP * NUM_CLIPART_VERT && clipartY > 0 &&
            loadedObjectsAndBG == true) {

        selectedIdx = Math.floor(clipartY / CLIPART_SKIP);
        selectedIdx *= NUM_CLIPART_HORZ;
        selectedIdx += Math.floor(clipartX / CLIPART_SKIP) + tabPage;

        // SA: TODO Fix it so selectedTabIdx corresponds to objectTypeOrder
        // Currently, the menu positions are hardcoded (by the menu image), which is sub-optimal.
        if (selectedIdx < numObjTypeShow[objectTypeOrder[selectedTabIdx]]) {
            selectedIdx += clipartIdxStart[selectedTabIdx];

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
                draw_canvas();
            }
        }

        if (selectedIdx != notUsed && selectedTabIdx == 0 && curLoadAll[selectedIdx] == 1) {
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
                        obj_img_filename_pose_expr(curAvailableObj[selectedIdx].instance[selectedIns], j, k);   
                    curClipartImgs[selectedIdx][s].onload = draw_canvas;
                    s++;
                }
            }
            curLoadAll[selectedIdx] = 2; // all loaded
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

    // Select clipart attributes
    var attrX = cx - ATTR_COL - canvas_fix.offsetLeft;
    var attrY = cy - ATTR_ROW - canvas_fix.offsetTop;

    if (selectedIdx != notUsed &&
            loadedObjectsAndBG == true) {
        var numAttr = curAvailableObj[selectedIdx].instance[0].numPose;
        
        if (attrX < CLIPART_SKIP * numAttr && attrX > 0 && attrY < CLIPART_SKIP && attrY > 0) {
            curAvailableObj[selectedIdx].instance[selectedIns].poseID = Math.floor(attrX / CLIPART_SKIP);
            log_user_data("pose");
            draw_canvas();
        }
    }

    // Select the 2nd clipart attributes for people expressions
    var attr2X = cx - ATTR2_COL - canvas_fix.offsetLeft;
    var attr2Y = cy - ATTR2_ROW - canvas_fix.offsetTop;

    if (selectedIdx != notUsed &&
            loadedObjectsAndBG == true) {
        var numAttr = curAvailableObj[selectedIdx].instance[0].numExpression; // the total number

        if (attr2X < CLIPART_SKIP * (numAttr - 1) && attr2X > 0 && attr2Y < CLIPART_SKIP && attr2Y > 0) {
            curAvailableObj[selectedIdx].instance[selectedIns].expressionID = Math.floor(attr2X / CLIPART_SKIP) + 1; 
            log_user_data("expression");
            draw_canvas();
        }
    }

    // Select clipart on the canvas
    var canvasX = cx - CANVAS_COL - canvas_fix.offsetLeft;
    var canvasY = cy - CANVAS_ROW - canvas_fix.offsetTop;

    if (loadedObjectsAndBG == true) {
        if (canvasX < CANVAS_WIDTH && canvasX > 0 && 
            canvasY < CANVAS_HEIGHT && canvasY > 0) {

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
                            if ( curAvailableObj[i].instance[0].depth0 == k && curAvailableObj[i].instance[0].depth1 == l) {
                                for (m = 0; m < curAvailableObj[i].numInstance; m++) {
                                    if (curAvailableObj[i].instance[m].present == true && curAvailableObj[i].instance[m].z == j) {
                                        var scale = curZScale[curAvailableObj[i].instance[m].z];

                                        // so it assumes all clip art images are of the same size??
                                        var w = scale * curClipartImgs[i][0].width;
                                        var h = scale * curClipartImgs[i][0].height;
                                        var rowOffset = -h / 2;
                                        var colOffset = -w / 2;

                                        var x = curAvailableObj[i].instance[m].x + colOffset;
                                        var y = curAvailableObj[i].instance[m].y + rowOffset;
                                        if (canvasX >= x && canvasX < x + w && canvasY >= y && canvasY < y + h) {
                                            selectedIdx = i;
                                            selectedIns = m;
                                            // log_user_data("mousedown_selected"); // Doesn't seem necessary
                                            
                                            mouse_offset_X = (x + w / 2) - canvasX;
                                            mouse_offset_Y = (y + h / 2) - canvasY;
                                            
                                            // SA: TODO Should clicking on a selected object (on canvas) change tab?
                                            // Uncommenting below will enable that feature.
                                            // selectedTab = curAvailableObj[selectedIdx].instance[selectedIns].type;
                                            // selectedTabIdx = objectTypeToIdx[selectedTab];
                                            // log_user_data("tab"); // SA: TODO Add?
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
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
                draw_canvas();
            }
        }

        // Scale clipart objects
        var scaleSliderX = cx - CANVAS_COL - canvas_fix.offsetLeft - SCALE_COL;
        var scaleSliderY = cy - canvas_fix.offsetTop - SCALE_ROW;

        if (scaleSliderX >= 0 && scaleSliderX < SCALE_WIDTH && 
            scaleSliderY >= CANVAS_COL - SCALE_COL && scaleSliderY < SCALE_HEIGHT) {
            
            if (selectedIdx != notUsed) {
                var position = Math.floor(scaleSliderX / (SCALE_WIDTH / (2 * (numZSize - 1))));
                position += 1;
                position /= 2;
                position = Math.floor(position);
                curAvailableObj[selectedIdx].instance[selectedIns].z = Math.max(0, Math.min(numZSize - 1, position));
    //             log_user_data("scale"); // Isn't needed, gets logged via mouse-up
                draw_canvas();
                ScaleSliderDown = true;
            }
        }

        // Flip clipart objects
        var flipButtonX = cx - CANVAS_COL - canvas_fix.offsetLeft - FLIP_COL;
        var flipButtonY = cy - canvas_fix.offsetTop - FLIP_ROW;

        if (flipButtonX >= 0 && flipButtonX < buttonW * 2 && 
            flipButtonY >= 0 && flipButtonY < buttonH) {
            
            if (selectedIdx != notUsed) {
                curAvailableObj[selectedIdx].instance[selectedIns].flip = Math.floor(flipButtonX / buttonW);
                log_user_data("flip");
                draw_canvas();
            }
        }
    } else {
        console.log("Should I be here?");
//         debugger;
        load_obj_category_data();
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
//         log_user_data("mousemove_unselect"); // Changes too frequently with mouse movement
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
            curAvailableObj[selectedIdx].instance[selectedIns].x = canvasX + mouse_offset_X;
            curAvailableObj[selectedIdx].instance[selectedIns].y = canvasY + mouse_offset_Y;
            curAvailableObj[selectedIdx].instance[selectedIns].present = true;
//             log_user_data("mousemove_select"); // Changes too frequently with mouse movement
            draw_canvas();
        }
    }

    if (ScaleSliderDown == true) {
        var scaleSliderX = cx - CANVAS_COL - canvas_fix.offsetLeft - SCALE_COL;
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
