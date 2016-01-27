#!/usr/bin/python
# -*- coding: utf-8 -*-

import json
import glob
import os
import cPickle
import multiprocessing
import pdb

import numpy as np
#pip install joblib==0.9.0b2
from joblib import Parallel, delayed

import abstract_features as af

def extract_relation_feats(AF, json_dir, metafeat_dir, overwrite=False):
        
    all_scene_fns = glob.glob(os.path.join(json_dir, '*.json'))
    AF.sort_nicely(all_scene_fns)
    
    for scene_fn in all_scene_fns:
        extract_relation_feats_one_scene(scene_fn, AF,
                                   json_dir, metafeat_dir, overwrite)

def extract_relation_feats_one_scene(scene_fn, AF, json_dir, 
                                     metafeat_dir, overwrite=False):
        
    af.dir_path(metafeat_dir)
    filename, file_extension = os.path.splitext(scene_fn[len(json_dir):])
    ext = 'cpickle'
    cur_feat_name = ('{}_relationFeats_{}'
                    '_gmmAbsK-{:02d}_gmmRelK-{:02d}'
                    '_{}_instances-{}.{}').format(filename,
                                                AF.scale_str,
                                                AF.gmm_abs_k,
                                                AF.gmm_rel_k,
                                                AF.z_scalar_str,
                                                AF.instance_ordering,
                                                ext)
    cur_feat_fn = os.path.join(metafeat_dir, cur_feat_name)

    scene_type = 'Living' # Only considers objects that appear in Living Room
    scene_type = None # Considers all objects that appear in any scenes
    
    if (not os.path.isfile(cur_feat_fn) or overwrite==True):
        
        print('Extracting features for {}'.format(scene_fn))

        with open(scene_fn, 'rb') as jf:
            cur_scene = json.load(jf)

        cur_metafeats = AF.extract_one_scene_relation_feats(cur_scene, scene_type)
        cur_feats, _ = AF.scene_metafeatures_to_feats(cur_metafeats, None, 
                                                      'keep', False)
        nonzero = 0
        for f in cur_feats:
            if f != 0:
                nonzero += 1
        print(nonzero)
        pdb.set_trace()
        # TODO Save as cross-language-compatible format
        with open(cur_feat_fn, 'wb') as cur_feat_fp:
            cPickle.dump(cur_metafeats, cur_feat_fp)
            
def extract_feats_parallel(AF, json_dir, metafeat_dir, overwrite=False, num_jobs=1, relation=False):
        
    all_scene_fns = glob.glob(os.path.join(json_dir, '*.json'))
    AF.sort_nicely(all_scene_fns)
    
    if relation:
        feat_func = extract_relation_feats_one_scene
    else:
        feat_func = extract_feats_one_scene
    
    Parallel(n_jobs=num_jobs, verbose=1024, batch_size=1)\
        (delayed(extract_feats_one_scene)(scene_fn, AF, json_dir, 
                                          metafeat_dir, overwrite)\
                                              for scene_fn in all_scene_fns)

def extract_feats(AF, json_dir, metafeat_dir, overwrite=False):
        
    all_scene_fns = glob.glob(os.path.join(json_dir, '*.json'))
    AF.sort_nicely(all_scene_fns)
    
    for scene_fn in all_scene_fns:
        extract_feats_one_scene(scene_fn, AF,
                                json_dir, metafeat_dir, overwrite)

def extract_feats_one_scene(scene_fn, AF, json_dir, metafeat_dir, overwrite=False):
        
    af.dir_path(metafeat_dir)
    filename, file_extension = os.path.splitext(scene_fn[len(json_dir):])
    ext = 'cpickle'
    cur_feat_name = ('{}_{}'
                     '_gmmAbsK-{:02d}_gmmRelK-{:02d}'
                     '_{}_instances-{}.{}').format(filename,
                                                   AF.scale_str,
                                                   AF.gmm_abs_k,
                                                   AF.gmm_rel_k,
                                                   AF.z_scalar_str,
                                                   AF.instance_ordering,
                                                   ext)
    cur_feat_fn = os.path.join(metafeat_dir, cur_feat_name)
    
    if (not os.path.isfile(cur_feat_fn) or overwrite==True):
        
        print('Extracting features for {}'.format(scene_fn))

        with open(scene_fn, 'rb') as jf:
            cur_scene = json.load(jf)

        cur_features = AF.extract_one_scene_feats(cur_scene)
        
        # TODO Save as cross-language-compatible format
        with open(cur_feat_fn, 'wb') as cur_feat_fp:
            cPickle.dump(cur_features, cur_feat_fp)
            
def create_feat_matrix(AF, json_dir, metafeat_dir, feat_dir,
                       feat_fn_base, relation=False, overwrite=False):
    
    tags = ['scene-level', 'Doll01'] # Filter based on these
    tags = None # Filter nothing (i.e., keep all features)
    # If filtering, is tags list for things to keep or remove?
    keep_or_remove = 'keep'
    #keep_or_remove = 'remove'
    
    if relation:
        rel_str = '_relationFeats'
    else:
        rel_str = ''
    base_name = ('{}{}_{}'
                 '_gmmAbsK-{:02d}_gmmRelK-{:02d}'
                 '_{}_instances-{}').format(feat_fn_base,
                                            rel_str,
                                            AF.scale_str,
                                            AF.gmm_abs_k,
                                            AF.gmm_rel_k,
                                            AF.z_scalar_str,
                                            AF.instance_ordering,
                                            )        
    
    json_fn = '{}_files.json'.format(base_name)
    json_file = os.path.join(feat_dir, json_fn)
    
    feat_fn = '{}_features.npy'.format(base_name)
    feat_file = os.path.join(feat_dir, feat_fn)
    
    by_dim_name = 'feature_names_by_dimension'
    names_fn = '{}_{}.json'.format(base_name, by_dim_name)
    feat_name_file = os.path.join(feat_dir, names_fn)
    
    feat_name = 'feature_names'
    unq_names_fn = '{}_{}.json'.format(base_name, feat_name)
    feat_unq_name_file = os.path.join(feat_dir, unq_names_fn)
    
    both_files_exist = (os.path.isfile(feat_file) 
                        and os.path.isfile(feat_name_file))
                           
    if (not both_files_exist or overwrite==True):

        json_files = glob.glob(json_dir + '*.json')
        AF.sort_nicely(json_files)
        json_files = [jf[len(json_dir):] for jf in json_files]
        print('Subset of files:')
        print(json_files[:10])

        with open(json_file, 'wb') as fp:
            json.dump(json_files, fp, indent=4, separators=(',', ': '))
        
        feats, feat_names = collect_feats(AF, json_files, metafeat_dir, 
                                            tags, keep_or_remove, relation=relation)

        # TODO Save as cross-language-compatible format
        np.save(feat_file, feats)

        with open(feat_name_file, 'wb') as fp:
            json.dump(feat_names, fp, indent=4, separators=(',', ': '))

        feat_unq_names = [n.split('[')[0] \
                          for n in feat_names if n.split('[')[1] == '0]']

        with open(feat_unq_name_file, 'wb') as fp:
            json.dump(feat_unq_names, fp, indent=4, separators=(',', ': '))

def collect_feats(AF, json_files, metafeat_dir, 
                     tags=None, keep_or_remove=None, relation=False):
    all_feats = []
    get_names = True
    
    if relation:
        rel_str = '_relationFeats'
    else:
        rel_str = ''
    
    for scene_fn in json_files:
        filename, file_extension = os.path.splitext(scene_fn)
        ext = 'cpickle'
        metafeat_fn = ('{}{}_{}'
                       '_gmmAbsK-{:02d}_gmmRelK-{:02d}'
                       '_{}_instances-{}.{}').format(filename,
                                                     rel_str,
                                                     AF.scale_str,
                                                     AF.gmm_abs_k,
                                                     AF.gmm_rel_k,
                                                     AF.z_scalar_str,
                                                     AF.instance_ordering,
                                                     ext)        
        cur_metafeat_fn = os.path.join(metafeat_dir, 
                                       metafeat_fn)
        
        with open(cur_metafeat_fn, 'rb') as fp:
            cur_metafeats = cPickle.load(fp)
        
        if get_names:
            cur_feats, feat_names = \
                AF.scene_metafeatures_to_feats(cur_metafeats, 
                                                  tags, 
                                                  keep_or_remove,
                                                  get_names)
            get_names = False
        else:
            cur_feats, _ = AF.scene_metafeatures_to_feats(cur_metafeats, 
                                                        tags, 
                                                        keep_or_remove,
                                                        get_names)
        
        all_feats.append(cur_feats)
    
    all_feats = np.vstack(all_feats)
    
    return all_feats, feat_names

def get_num_objects_in_clipart_library(AF, scene_type=None, config_file='abstract_scenes_v002_data_scene_config.json'):

    all_names, all_objs, all_kinds, _, _, _, _ = \
        AF.calc_clipart_library_details(config_file, scene_type=scene_type)

    if scene_type == None:
        print("Across all scene types")
    else:
        print("For the {} scene type".format(scene_type))
    print('\tNumber of objects in clipart library: {}'.format(all_objs))
    print('\tNumber of kinds of objects in clipart library: {}'.format(all_kinds))

def extract_annotations(AF, json_dir, ann_dir, overwrite=False):

    if 'train2015' in json_dir:
        fn = 'abstract_v002_instances_train2015.json'
    elif 'val2015' in json_dir:
        fn = 'abstract_v002_instances_val2015.json'
    elif 'test2015' in json_dir:
        fn = 'abstract_v002_instances_test2015.json'
    else:
        fn = 'abstract_v002_instances_???.json'
    ann_file = os.path.join(ann_dir, fn)

    if not os.path.isfile(ann_file) or overwrite == True:

        all_scene_fns = glob.glob(os.path.join(json_dir, '*.json'))
        AF.sort_nicely(all_scene_fns)

        all_anns = []
        for scene_fn in all_scene_fns:
            with open(scene_fn, 'rb') as jf:
                cur_scene = json.load(jf)
            cur_anns = AF.extract_one_scene_annotations(cur_scene)
            all_anns.extend(cur_anns)

        with open(ann_file, 'w') as ofp:
            json.dump(all_anns, ofp)

def main():
    '''
    Usage:
        abstract_features_helper.py create_gmms <jsondir> <outdir> [--overwrite --configdir=CD --scaled=SB --absK=K --relK=K]
        abstract_features_helper.py extract_features <jsondir> <outdir> [--overwrite --configdir=CD --instord=IO --scaled=SB --absK=K --relK=K --zScalar=ZB]
        abstract_features_helper.py extract_relation_features <jsondir> <outdir> [--overwrite --configdir=CD --instord=IO --scaled=SB --absK=K --relK=K --zScalar=ZB]
        abstract_features_helper.py extract_features_parallel <jsondir> <outdir> <num_jobs> [--relation --overwrite --configdir=CD --instord=IO --scaled=SB --absK=K --relK=K --zScalar=ZB]
        abstract_features_helper.py create_feat_matrix <jsondir> <outdir> <featname> [--relation --overwrite --configdir=CD --instord=IO --scaled=SB --absK=K --relK=K --zScalar=ZB]
        abstract_features_helper.py clipart_library [--configdir=CD]
        abstract_features_helper.py annotations <jsondir> <outdir> [--overwrite --configdir=CD]
        
    Options:
        <jsondir>        Directory to scene JSON files to run on
        <outdir>         Directory to put the processed files
        <featname>       Base filename of the feature file
        --overwrite      Overwrite files even if they exist
        --configdir=CD   Path to the config data files (contains all object data) [default: USE_DEF]
        --instord=IO     Ordering of the instances for feature extraction, one of: original, random, from_center [default: random]
        --scaled=SB      Scale the x/y coordinates to (0,1) [default: True]
        --absK=K         Number of GMMs for absolute location [default: 9]
        --relK=K         Number of GMMs for relative location [default: 24]
        --zScalar=ZB     Should z/depth be scalar or one-hot [default: False]
        --relation       Creates relation feature-based matrix
    '''
    
    #USE_DEF for --config_dir is /srv/share/abstract_scenes_v002/site_data/

    import docopt, textwrap
    opts = docopt.docopt(textwrap.dedent(main.__doc__))
    
    print('')
    print(opts)
    print('')
    
    if (opts['--configdir'] == 'USE_DEF'):
        config_folder = '/srv/share/abstract_scenes_v002/site_data/'
    else:
        config_folder = opts['--configdir']
    
    if (opts['clipart_library']):
        AF = af.AbstractFeatures(config_folder)
        get_num_objects_in_clipart_library(AF, scene_type='Living')
        get_num_objects_in_clipart_library(AF, scene_type='Park')
        get_num_objects_in_clipart_library(AF, scene_type=None)
    elif (opts['annotations']):
        AF = af.AbstractFeatures(config_folder)
        af.dir_path(opts['<outdir>'])
        extract_annotations(AF,
                            opts['<jsondir>'],
                            opts['<outdir>'],
                            opts['--overwrite'])
    else:

        if opts['create_gmms']:
            instance_ordering = None
            z_scalar = False # Doesn't matter here...
        else:
            #instance_orders = ['original', 'random', 'from_center']
            instance_ordering = opts['--instord']
            if opts['--zScalar'] == 'True':
                z_scalar = True
            else:
                z_scalar = False

        overwrite = opts['--overwrite']
        
        json_dir = opts['<jsondir>']
        
        out_dir = af.dir_path(opts['<outdir>'])
        gmm_dir = af.dir_path(os.path.join(out_dir, 'gmms'))
        metafeat_dir = af.dir_path(os.path.join(out_dir, 'metafeatures'))
        feat_dir = af.dir_path(os.path.join(out_dir, 'features'))
        
        coords_occur_fn = os.path.join(gmm_dir, 'coords_occur.npy')
        coords_cooccur_fn = os.path.join(gmm_dir, 'coords_cooccur.npy')
        gmm_abs_pos_fn = os.path.join(gmm_dir, 'gmm_abs_pos.npy') 
        gmm_rel_pos_fn = os.path.join(gmm_dir, 'gmm_rel_pos.npy')

        if opts['--scaled'] == 'True':
            scale_pos = True
        else:
            scale_pos = False
            
        gmm_abs_k = int(opts['--absK'])
        gmm_rel_k = int(opts['--relK'])

        AF = af.AbstractFeatures(config_folder,
                                instance_ordering=instance_ordering,
                                coords_occur_fn=coords_occur_fn,
                                coords_cooccur_fn=coords_cooccur_fn,
                                gmm_abs_pos_fn=gmm_abs_pos_fn, 
                                gmm_rel_pos_fn=gmm_rel_pos_fn,
                                scale_pos=scale_pos,
                                z_scalar=z_scalar,
                                gmm_abs_k=gmm_abs_k,
                                gmm_rel_k=gmm_rel_k)
        
        if (opts['create_gmms']):
            all_scene_fns = glob.glob(os.path.join(json_dir, '*.json'))
            AF.create_gmms_models(all_scene_fns, overwrite=overwrite)
        elif (opts['extract_features']):
            extract_feats(AF, json_dir, metafeat_dir, overwrite=overwrite)
        elif (opts['extract_relation_features']):
            extract_relation_feats(AF, json_dir, metafeat_dir, overwrite=overwrite)
        elif (opts['extract_features_parallel']):
            num_jobs = int(opts['<num_jobs>'])
            rel = opts['--relation']
            extract_feats_parallel(AF, json_dir, metafeat_dir, 
                                   overwrite=overwrite, num_jobs=num_jobs,
                                   relation=rel)
        elif (opts['create_feat_matrix']):
            feat_fn_base = opts['<featname>']
            rel = opts['--relation']
            create_feat_matrix(AF, json_dir, metafeat_dir, 
                               feat_dir, feat_fn_base, relation=rel, overwrite=overwrite)
        else:
            print("Not a valid command.")

if __name__ == '__main__':
    main()
