#!/usr/bin/env sh

use_local=0

if [ $use_local -gt 0 ]
then
num_jobs=4
sceneJSONGMMDir='../../data/scenes/'
sceneJSONFeatDir='../../data/scenes/'
feat_base='scenes_2015'
inst_ord='random'
outputDataDir='../../data/'
configDir='../../site_data/'
else
num_jobs=50
sceneJSONGMMDir='/srv/share/vqa/release_data/abstract_v002/scene_json/scene_train2015_indv/'
sceneJSONFeatDir='/srv/share/vqa/release_data/abstract_v002/scene_json/scene_indv/'
feat_base='abstract_v002'
inst_ord='random'
outputDataDir='/srv/share/vqa/release_data/abstract_v002/scene_json/features_v3/'
configDir='/srv/share/abstract_scenes_v002/site_data/'
fi

pos_scaled='True'
gmm_abs_K=9
gmm_rel_K=24
z_scalar='False'

calc_gmms=0
calc_feats_single=0
calc_feats_parallel=0
calc_feats_matrix=0
calc_relation_feats_single=0
calc_relation_feats_parallel=0
calc_relation_feats_matrix=0

python abstract_features_helper.py clipart_library \
        --configdir=$configDir

if [ $calc_gmms -gt 0 ]
then
    python abstract_features_helper.py create_gmms \
            $sceneJSONGMMDir \
            $outputDataDir \
            --configdir=$configDir \
            --overwrite \
            --scaled=$pos_scaled \
            --absK=$gmm_abs_K \
            --relK=$gmm_rel_K
fi

if [ $calc_feats_single -gt 0 ]
then
#     If you don't want to install joblib,
#     you can use the non-parallel version
    python abstract_features_helper.py extract_features \
            $sceneJSONFeatDir \
            $outputDataDir \
            --instord=$inst_ord \
            --configdir=$configDir \
            --overwrite \
            --scaled=$pos_scaled \
            --absK=$gmm_abs_K \
            --relK=$gmm_rel_K \
            --zScalar=$z_scalar
fi

if [ $calc_feats_parallel -gt 0 ]
then
    python abstract_features_helper.py extract_features_parallel \
            $sceneJSONFeatDir \
            $outputDataDir \
            $num_jobs \
            --instord=$inst_ord \
            --configdir=$configDir \
            --overwrite \
            --scaled=$pos_scaled \
            --absK=$gmm_abs_K \
            --relK=$gmm_rel_K \
            --zScalar=$z_scalar
fi

if [ $calc_feats_matrix -gt 0 ]
then
    python abstract_features_helper.py create_feat_matrix \
            $sceneJSONFeatDir \
            $outputDataDir \
            $feat_base \
            --instord=$inst_ord \
            --configdir=$configDir \
            --overwrite \
            --scaled=$pos_scaled \
            --absK=$gmm_abs_K \
            --relK=$gmm_rel_K \
            --zScalar=$z_scalar
fi

if [ $calc_relation_feats_single -gt 0 ]
then
#     If you don't want to install joblib,
#     you can use the non-parallel version
    python abstract_features_helper.py extract_relation_features \
        $sceneJSONFeatDir \
        $outputDataDir \
        --instord=$inst_ord \
        --configdir=$configDir \
        --overwrite \
        --scaled=$pos_scaled \
        --absK=$gmm_abs_K \
        --relK=$gmm_rel_K \
        --zScalar=$z_scalar
fi

if [ $calc_relation_feats_parallel -gt 0 ]
then
    python abstract_features_helper.py extract_features_parallel \
            $sceneJSONFeatDir \
            $outputDataDir \
            $num_jobs \
            --instord=$inst_ord \
            --configdir=$configDir \
            --overwrite \
            --relation \
            --scaled=$pos_scaled \
            --absK=$gmm_abs_K \
            --relK=$gmm_rel_K \
            --zScalar=$z_scalar
fi

if [ $calc_relation_feats_matrix -gt 0 ]
then
    python abstract_features_helper.py create_feat_matrix \
            $sceneJSONFeatDir \
            $outputDataDir \
            $feat_base \
            --instord=$inst_ord \
            --configdir=$configDir \
            --overwrite \
            --relation \
            --scaled=$pos_scaled \
            --absK=$gmm_abs_K \
            --relK=$gmm_rel_K \
            --zScalar=$z_scalar
fi