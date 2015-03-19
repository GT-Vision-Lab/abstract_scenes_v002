#!/usr/bin/env sh

# This script outlines a full pipeline of collecting
# abstract scenes data.
#
# First, you'll need Python setup as described in the README.md.
# The lab virtualenv is fine.
# On servers, type source "/srv/share/lab_venv_2.7/bin/activate"
# to load that virtualenv.
#
# Assumes that you have setup AMT CLT
# https://requester.mturk.com/developer/tools/clt (you can download it via this link!)
# MTURK_CMD_HOME should be exported in ~/.bashrc and point to the CLT directory
# JAVA_HOME should also be exported in ~/.bashrc and point to /usr
# Also need to have the access and secret keys setup correctly.
#
# The first step is to have your .input, .properties, and .question files
# created. Currently, they're in this folder. Ideally, you'll have
# code that generates these for your different experiments and they
# would be placed in ../../data/input/$expType/$expName/.
#
# Then you can launch it on AMT sandbox by making sure that
# sandbox="-sandbox" is UNcommented and have only createHITs=1
# (and the other RunTasks variables set to 0).
# Only do this once (assuming it didn't fail).
# Then run the stuff in the next section to see the results.
# After you're done with the sandbox data, set createHITs=0
# and delAndApproveHITs=1 to delete all of the HITs off of 
# sandbox so it doesn't get cluttered with old HITs when
# you launch newer versions.
#
# To process the results, you will want
# dlHITs=1
# processResults=1
# renderScenes=1
# and the rest set to 0.
# dlHITs downloads the AMT result file
# based on $successFile.
# Then processResults takes that file
# and extracts it into a JSON format.
# This also creates individual scene JSON
# files separately so you can load them into
# the interface again.
# Then renderScenes takes the JSON file
# and renders the scenes.
# Once all of these finish running,
# you can browse the results using
# the webpage in code/scenes_website/abstract_scenes.html.
# This has a few Query String parameters to help filtering
# out the data. Read through the .js file for more details.
#
# Check out the AMT CLT documentation about how to use 
# approveWork.sh and rejectWork.sh.

# Run for real!
sandbox=""
# Run in the sandbox
sandbox="-sandbox"

#RunTasks variables
createHITs=0
dlHITs=0
processResults=0
renderScenes=0
rejFileHITs=0
apprFileHITs=0
apprAllHITs=0
delAndApproveHITs=0

expType="amt_simple_launch_demo"
expName="pilot_01"

# Current directory of script
currentDir=`eval "cd \"$SCRIPT_PATH\" && pwd"`

# Find the main directory for the data files
# If running locally
relDataDir=../../data
relCodeBaseDir=../../
# If running on server
relDataDir=/srv/share/abstract_scenes_v002/data
relCodeBaseDir=/srv/share/abstract_scenes_v002/
mkdir -p ${relDataDir}
dataDir=$(readlink -f $relDataDir)
codeBaseDir=$(readlink -f $relCodeBaseDir)

inputDataDir=$dataDir/input/$expType/$expName
outputDataDir=$dataDir/output/$expType/$expName
outputDataJSONDir=$outputDataDir/json/
outputDataIllDir=$outputDataDir/ills/

mkdir -p ${inputDataDir}
mkdir -p ${outputDataDir}
mkdir -p ${outputDataJSONDir}
mkdir -p ${outputDataIllDir}

questionFile=$currentDir/$expName.question
propertiesFile=$currentDir/$expName.properties
inputFile=$currentDir/$expName.input

labelFile=$outputDataDir/$expName.tmp # .success gets appended, current a temp file
successFile=$outputDataDir/$expName.success # Should be same as labelFile except .success instead of .tmp

resultsFile=$outputDataDir/$expName.results
sceneJSONFile=$outputDataJSONDir/$expName.min.json
approveFile=$outputDataDir/$expName.approve
rejectFile=$outputDataDir/$expName.reject

if [ $createHITs -gt 0 ]
then
# MTURK_CMD_HOME should be exported in ~/.bashrc and point to the CLT directory
# label defines name of success file
cd $MTURK_CMD_HOME/bin/
# Test with just launching 2 HITs to save time.
#./loadHITs.sh -label $labelFile -input $inputFile -question $questionFile -properties $propertiesFile $sandbox -maxhits 2
./loadHITs.sh -label $labelFile -input $inputFile -question $questionFile -properties $propertiesFile $sandbox
# Creates (hidden) backup files for the existing file, if it exists, 
# so you don't overwrite a previous successFile and lose data
cp --backup=numbered $labelFile.success $successFile
fi

if [ $dlHITs -gt 0 ] 
then
cd $MTURK_CMD_HOME/bin/
./getResults.sh -successfile $successFile -outputfile $resultsFile $sandbox
fi

if [ $processResults -gt 0 ]
then
cd $currentDir/../process_amt_results
python process_amt_scene_results.py extract $resultsFile $outputDataJSONDir \
        --genApprCmnt="Good job everyone! Thanks for all your work."
fi

if [ $renderScenes -gt 0 ]
then
cd $currentDir/../render_scenes
# --<name> are optional fields with default values; see render_scenes_json.py
python render_scenes_json.py render $sceneJSONFile $outputDataIllDir \
        --site_pngs_dir=$codeBaseDir/site_pngs/ \
        --config_dir=$codeBaseDir/site_data/ \
        --overwrite
fi

if [ $rejFileHITs -gt 0 ]
then
cd $MTURK_CMD_HOME/bin/
./rejectWork.sh -rejectfile $rejectFile $sandbox
fi

if [ $apprFileHITs -gt 0 ]
then
cd $MTURK_CMD_HOME/bin/
./approveWork.sh -approvefile $approveFile $sandbox
fi

if [ $apprAllHITs -gt 0 ]
then
cd $MTURK_CMD_HOME/bin/
./approveWork.sh -successfile $successFile $sandbox
fi

if [ $delAndApproveHITs -gt 0 ]
then
cd $MTURK_CMD_HOME/bin/
./deleteHITs.sh -successfile $successFile -approve -expire $sandbox
fi
