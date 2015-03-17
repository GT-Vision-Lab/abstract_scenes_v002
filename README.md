# abstract_scenes_v002
The second version of the interface for the [Abstract Scenes research project](http://research.microsoft.com/en-us/um/people/larryz/clipart/abstract_scenes.html).

## Interface Images
To use the web interface (or render scenes in general), you will need to download the images.
You can find the majority of the images [here](https://vision.ece.vt.edu/abstract_scenes_v002/site_pngs/site_pngs_without_HumanNondeformable.zip).
If you need the nondeformable human images (1.5GB), 
you can find them [here](https://vision.ece.vt.edu/abstract_scenes_v002/site_pngs/site_pngs_just_HumanNondeformable.zip).
These images should be placed in a folder called `site_pngs/`.
If you don't feel like downloading the images and know you'll have Internet,
you can uncomment the following line in `abstract_scenes_v002_head.js`:

`// baseURLInterface = "https://vision.ece.vt.edu/abstract_scenes_v002/site_pngs/";`

## Running the Interface Locally
If you are running the interface local (e.g., not on a web server), you can use Python to run a local web server.
If you have Python installed properly installed, in a command prompt, 
you can run `python -m SimpleHTTPServer 8000` in the `abstract_scenes_v002/` folder.
If you haven't configured it well (e.g., it's slightly more complicated on Windows), 
you can run the `code/start_python_web_server.py` script, 
but you'll need to update the directory accordingly in the script.
Once the Python HTTP server starts up, you can open a web browser, 
enter `localhost:8000` (or whatever port number you specified), and then
navigate to the `site/abstract_scenes_v002.html` file.

## Python Information
This currently is known to work with Python 2.7. 
As of 2015/03/17, it just uses [docopt](http://docopt.org/) (installable via pip) and 
[Pillow](http://pillow.readthedocs.org/en/latest/index.html) (installable via pip).
To run a basic launch AMT task->download results->process and render results pipeline, 
there is the example script `code/amt_simple_launch/manage_hits.sh`.

If you're running on the lab servers, you can just load the lab virtualenv.
To do this, you can, into the terminal, type:

`bash /srv/share/lab_venv_2.7/bin/activate`

or you can append the following at the end of your `~/.bashrc` file, 
if you want this virtualenv to be loaded whenever you log onto a server machine:

`source "/srv/share/lab_venv_2.7/bin/activate"`

(You'll need to either login again or type `source ~/.bashrc` to load the changes in your `~/.bashrc` file.)

Now your terminal should look like **(lab_venv_2.7)**santol@godel:~$ (emphasis mine). 
You now will have access to a bunch of Python packages that we installed, such as numpy and scipy. 
Running the command `pip list` will display all pip-installable packages that the virtualenv currently has installed. 
[Envplus](https://github.com/jsvine/envplus) is one way of being able to create your own virtualenv on top of the lab one. 
Or you can just install whatever you need in your own personal virtualenv.

## How to Operate the Interface

### Changing Interface Behavior via the URL

Note: QS is short for query string, i.e., the <name>=<value> stuff after the
question mark (?) in the URL.

You have 3 ways of using this interface and 2 demos:

1. Load-scene-from-JSON demo mode by jsonDemo=1
2. Specify an ordered list of existing scene JSON files to initialize with. 
   E.g., QS has sceneJSONFile01=AXOOE_01.json&sceneJSONFile02=AOEUE_11.json
3. Specify an ordered list of scene types to go through. E.g., QS has
   sceneType01=Park&sceneType02=Living&sceneType03=Kitchen
   Note: Kitchen currently doesn't exist
4. Specify the total number of scenes along with which type of scene. E.g.,
   QS has sceneType=Park&numScene=4
   If either one of these are blank, some defaults are used.
   If both are blank, demo mode.
5. Blank-scene demo mode by not having anything in the QS (or everything turned off).

This order is also the precedence order (e.g., 1's parameters supercede 3's).

In addition, there are several other QS parameters that you can tweak.
You only need to specify these when you want to change from the defaults.

* restrictInput=0 (default is 1) disables checking if 
   the user work meets our minimum requirements. 
This is convenient for testing/browing the other parts of the interface.
* deformHuman=0 uses the original people from Xinlei's version.
   deformHuman=1 uses the paperdoll/deformable people, which is the default.
* deformHumanPoseInit=0 uses random poses (for deformable people). 
   deformHumanPoseInit=1 randomly selects one of the initial poses 
   that is specified in ...human_deform.json.
   The other object categories are currently hardcoded in ..._head.js into the
   deformTypesUse variable. 
   Adding some code to process the QS and updating
   this variable (and creating the JSON files) accordingly should be all you 
   need to do if we add other kinds of deformable categories.
* sceneConfigFile=abstract_scenes_v002_data_scene_config.json by default,
   but you can pass the filename via the sceneConfig QS parameter.
   Note: This is currently only read once at the beginning of the webpage load.
   Also, if you're loading scenes from JSON files, 
   all of the scenes that you're loading should come from the same sceneConfigFile.
   Ideally, we should update the code to be more flexible and 
   load the correct scene depending on the 
   sceneConfigFile specified in the sceneJSON data.

### How It Works/Current Setup

* The website files are located in site/.
* The image files for the interface (and rendering!) are in site_pngs/.
* The interface data files needed by the interface (and rendering!) are in site_data/.

#### Website Files

* `abstract_scenes_v002.html` contains the instructions as well as setting
   up the HTML elements that will be used by the interface.
   Besides the instructions and pop-up box text, 
   you probably won't need to change much here.
* `abstract_scenes_v002_head.js` contains the code that parses the URL
   query string (to affect interface behavior) and starts loading
   the scene JSON files (if specified).
   Also contains some helper functions, like gup('name01'), 
   which gives you string value on the right side of the equals for
   the name01 field (empty string if not found in the QS), 
   and decode, which does URL unescaping.
* `abstract_scenes_v002_main.js` contains the actual clipart interface.
   There is a lot here and it's currently not fully documented.
   Efforts have been make to make things slightly easier to understand.
   You probably won't need to change much in this code.
   If you're also trying to get descriptions or something,
   you'd want to append a field to sceneData/curScene data and
   update submit_form accordingly.

#### Image Files

`site_pngs/` currently has the interface images (e.g., buttons) in the main folder
and then several folders for object categories.

* `Animals` - Contains all of the animal images (used across sceneTypes).
* `HumanDeformable` - Contains all of the paperdoll/deforamble images.
  * `Doll##` - Each non-baby doll has 15 parts that follow a consistent naming scheme.
  * `Mike` - A man from the ECCV 2014 paper.
  * `Jenny` - A woman from the ECCV 2014 paper.
  * `Expressions` - Folder that contains all expressions/heads for all people.
    The scheme is \<name\>\<expressionid+1\>, where expressionid+1 has zeropadding.
    The expressions are all in a consistent ordering, with 01 being blank face.
* `HumanNondeformable` - Contains all of the nondeformable people from Xinlei's interface.
  * `\<name\>\<styleid+1\>` - Folder that contains a person with a certain clothing style.
    Within this folder, the images are \<poseid+1\>\<expressionid+1\>.png (both numbers zero-padded).
  * `Expressions` - Folder that contains all expressions/heads for all people.
    The scheme is \<name\>\<expressionid+1\>, where expressionid+1 has zeropadding.
    The expressions are all in a consistent ordering, with 01 being blank face.
* `Living`/`Park` - Folders that contain all of the images (currently background and objects)
   for the a given sceneType. 
   The object images are \<name\>\<typeid+1\>.png with typeid being zero-padded.
   Note that some objects have numbers in their name, so you just concatenate the typeid string to it.
   Also note that not all of these image files are currently being used and there are some duplicates/renames.

#### Interface Data Files

There are currently two types of JSON files:
* Object category files
* Scene/Interface configuration files

##### Object Files
A dictionary that contains the following fields:
* "baseDirectory" - The folder the images are found in (within `site_pngs/`), 
   only for non-scene-specific objects (i.e., currently humans and animals). 
* "attributeTypeList" - A list of strings that contain the current attributes for an object type.
   Changing this will change the attributes menu (bottom bar) titles.
* "dataType" - "clipartObject", but not really used now...
* "objectType" - What kind of object is it, e.g., human, animal, smallObject, largeObject. 
   This is used to label each instance so you can do different things in the code based on type.
* "type" - A list of different object types that all fall into a similar grouping (i.e., objectType).
   Each objectType will have different fields here. Some of the main ones are:
  * "baseDir" - Which name to use to look up the folder in the scene/interface configuration file's "baseDirectory" object. 
   This is only for scene-specific objects (i.e., currently smallObjects and largeObjects).
   Some of these ended up getting shared in multiple sceneTypes, so this specifies which one.
  * "name" - What is the name (must match the image filename!) of the object. 
  * "deformable" - true/false depending on if the object is deformable or not.
    If absent, interface assumes false. (Really should update the files to say false...)
  * num\<Attribute\> - Number of attributes available, such as type, expressions, poses.
  * "availableScene" - A list of objects of which sceneType this object can be found in.
   This will only have one element if an object is only found in one sceneType,
   but some objects occur in multiple scenes and 
   might have different properties in the different sceneTypes.

##### Scene/Interface Files
The scene configuration (for different scene types) MUST come from a JSON file.
By default, it is `abstract_scenes_v002_data_scene_config.json`,
**but for your experiments, you probably want to create a new one specific to your project.**
The sceneConfigFile gets saved into the sceneData that get send back via AMT.
The Python script that processes the AMT results file will need those files 
to exist in the same folder that the interface expects.

A dictionary that contains the following fields:
* "dataType" - "scene", but not really used right now...
* "baseDirectory" - Dictionary of the folder the images of a sceneType are found in (within site_pngs).
   Used for background image and the scene-specific objects.
   Allows us to have the folder name be different from the sceneType name.
* "clipartObjJSONFile" - A list of objects that specify the objectType and a file.
   The file has whether it contains deformable or nondeformable objects and the name of the file.
   These are the files that all of the object data is loaded from.
* \<sceneType\> - A dictionary that contains the interface setup for a specific sceneType.
   Many of the parameters are described in the JavaScript website files.
   You can specify many things, like the tab that the interface starts on (using startTab), 
   the scene's scaling factor for the slider bar (using zSizeDecay), and the object data for
   that sceneType (objectTypeData).
  * objectTypeData - A list of dictionaries which contain which object categories should be present
   for this sceneType and how many of them should randomly be available to the user 
   (setting this to a larger number than available objects is fine and will just have all available objects).
   Note that this list affects the interface menu 
   (i.e., you can switch the ordering of the object category tabs)
   **as well as the rendering order** (i.e., given that all other rendering parameters (e.g., depth1, z) constant,
   the earlier categories get placed first and will be behind later categories).

##### Adding New Scenes/Tweaked Settings of Existing Scenes
You can add new sceneTypes (e.g., Kitchen) or 
tweaks of the interface settings for the same general sceneType (e.g., Park)
by adding more \<sceneType\> dictionaries into the configuration file.
For tweaks of the same general sceneType (e.g., Park), you can just copy-and-paste
and then change the key to be hyphenated (e.g., Park-All).
The code will split on hyphens and use the first element to look things up.
This way, you don't have to keep adding things everywhere 
(e.g., you don't need to add Park-All into the objects availableScene list).
For example, Park-All is the Park scene with all possible objects. 
Park-XinleiSubset has the same available objects, 
but only shows a random subset of each category type.
The number of random subsets is consistent with [Xinlei](http://www.cs.cmu.edu/~xinleic/)'s data collection.


