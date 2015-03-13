#!/usr/bin/env sh

# Run for real!
sandbox=""
# Run in the sandbox
sandbox="-sandbox"

# Input argument demo code
if [ "$#" != 0 ]
then
    setting="setting01"
else
    setting="setting00"
fi

createHITs=0
dlHITs=0
processResults=0
renderScenes=1
updateHITs=0
apprFileHITs=0
apprAllHITs=0
delAndApproveHITs=0

expType="amt_simple_launch"
expName="pilot_01"

# Current directory of script
currentDir=`eval "cd \"$SCRIPT_PATH\" && pwd"`

# Find the main directory for the data files
relDataDir=../../data
relSiteBaseDir=../../
#relDataDir=/srv/share/funny_scenes/data
mkdir -p ${relDataDir}
dataDir=$(readlink -f $relDataDir)
siteBaseDir=$(readlink -f $relSiteBaseDir)

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

if [ $createHITs -gt 0 ]
then
# MTURK_CMD_HOME should be exported in ~/.bashrc and point to the CLT directory
# label defines name of success file
cd $MTURK_CMD_HOME/bin/
# Test with just launching 2 HITs to save time.
#./loadHITs.sh -label $labelFile -input $inputFile -question $questionFile -properties $propertiesFile $sandbox -maxhits 2
./loadHITs.sh -label $labelFile -input $inputFile -question $questionFile -properties $propertiesFile $sandbox
# Creates (hidden) backup files for the existing file, if it exists
cp --backup=numbered $labelFile.success $successFile
fi

if [ $updateHITs -gt 0 ]
then
cd $MTURK_CMD_HOME/bin/
./updateHITs.sh -success $successFile -properties $propertiesFile $sandbox
fi

if [ $dlHITs -gt 0 ] 
then
cd $MTURK_CMD_HOME/bin/
./getResults.sh -successfile $successFile -outputfile $resultsFile $sandbox
fi

if [ $processResults -gt 0 ]
then
cd $currentDir/../process_amt_results
python process_amt_scene_results.py extract $resultsFile $outputDataJSONDir
fi

if [ $renderScenes -gt 0 ]
then
cd $currentDir/../render_scenes
# --<name> are optional fields with default values; see render_scenes_json.py
python render_scenes_json.py render $sceneJSONFile $outputDataIllDir \
        --site_pngs_dir=$siteBaseDir/site_pngs/ \
        --config_dir=$siteBaseDir/site_data/ \
        --config_dir=abstract_scenes_v002_data_scene_config.json \
        --overwrite
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
