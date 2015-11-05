#!/usr/bin/python
# -*- coding: utf-8 -*-
 
import json
import os
import random
import copy
from collections import defaultdict
import pdb
import math

import numpy as np
import sklearn.mixture

def dir_path(dname):
    '''If the directory doesn't exist, then make it.'''
    
    try:
        os.makedirs(dname)
    except os.error:
        pass
    return dname
    
class AbstractFeatures(object):
    
    def __init__(self, 
                 config_folder, 
                 instance_ordering='random', 
                 scale_pos=True, 
                 z_scalar=False, 
                 gmm_abs_k=9, 
                 gmm_rel_k=24,
                 coords_occur_fn='coords_occur.npy', 
                 coords_cooccur_fn='coords_cooccur.npy', 
                 gmm_abs_pos_fn='gmm_abs_pos.npy', 
                 gmm_rel_pos_fn='gmm_rel_pos.npy',
                 DEBUG_PRINT=False
                 ):
        
        # How many absolute position GMMs
        self.gmm_abs_k = gmm_abs_k
        # How many relative position GMMs
        self.gmm_rel_k = gmm_rel_k
        
        self.coords_occur_fn = coords_occur_fn
        self.coords_cooccur_fn = coords_cooccur_fn
        self.gmm_abs_pos_fn = gmm_abs_pos_fn
        self.gmm_rel_pos_fn = gmm_rel_pos_fn
        
        self.config_folder = config_folder
        
        # Whether or not to normalize the x/y dimensions 
        # (affects raw x/y and GMM)
        # TODO Figure out which makes more sense
        self.scale_pos = scale_pos
        # Whether or not to use a scalar or one-hot encoding for z
        # TODO Figure out which makes more sense
        self.z_scalar = z_scalar
        # How to order the different instances of a particular object
        # TODO Figure out which makes more sense
        self.instance_ordering = instance_ordering
        
        self.gmm_abs_pos = None
        self.gmm_rel_pos = None
        
        self.human_pose_ft_param = None
        self.empty_human_pose_contact_features = None
        self.empty_human_pose_global_features = None
        self.empty_human_pose_orientation_features = None
        
        self.prev_scene_config_file = ''
        self.DEBUG_PRINT = DEBUG_PRINT
        
    def debug_print(self, args):
        if self.DEBUG_PRINT:
            print(args)

    def sort_nicely(self, l):    
        """ Sort the given list in the way that humans expect."""
        
        import re
        
        convert = lambda text: int(text) if text.isdigit() else text
        alphanum_key = lambda key: [ convert(c) \
                                    for c in re.split('([0-9]+)', key) ]
        l.sort( key=alphanum_key )
            
    def calc_z_scale_vals(self, z_size_decay, num_z_size):
        
        #TODO verify that this isn't needed, think it's just for rendering
        #cur_obj['globalScale']
        z_scales = [1.0]
        for i in range(1, num_z_size):
            z_scales.append(z_scales[i - 1] * z_size_decay)

        return z_scales
            
    def create_gmms_models(self, all_scene_fns, overwrite=False):
        
        both_files_exist = (os.path.isfile(self.coords_occur_fn) 
                           and os.path.isfile(self.coords_cooccur_fn))
                           
        if (not both_files_exist or overwrite==True):
            self.sort_nicely(all_scene_fns)
            
            occur_coord, cooccur_coord = \
                self.extract_coords_via_json_files(all_scene_fns)
            
            occur_coord = {o: np.array(occur_coord[o]) 
                        for o in occur_coord}
            cooccur_coord = {o: np.array(cooccur_coord[o]) 
                            for o in cooccur_coord}
            
            # Saving in case needed later
            np.save(self.coords_occur_fn, occur_coord)
            np.save(self.coords_cooccur_fn, cooccur_coord)
        else:
            occur_coord = np.load(self.coords_occur_fn).item()
            cooccur_coord = np.load(self.coords_cooccur_fn).item()
        
        both_files_exist = (os.path.isfile(self.gmm_abs_pos_fn) 
                           and os.path.isfile(self.gmm_rel_pos_fn))
                           
        if (not both_files_exist or overwrite==True):
            gmm_abs_pos, gmm_rel_pos = self.create_gmms(occur_coord, 
                                                        cooccur_coord)
        
            # Saving for use in feature extraction
            np.save(self.gmm_abs_pos_fn, gmm_abs_pos)
            np.save(self.gmm_rel_pos_fn, gmm_rel_pos)
        
    def extract_coords_via_json_files(self, scene_json_fns):
        
        occur_coords = defaultdict(list)
        cooccur_coords = defaultdict(list)
        
        for scene_fn in scene_json_fns:
            print(scene_fn)
            with open(scene_fn, 'rb') as jf:
                cur_scene = json.load(jf)

            occur_coord, cooccur_coord = \
                self.extract_one_scene_coords(cur_scene,
                                              self.scale_pos)
            
            for key in occur_coord:
                occur_coords[key].extend(occur_coord[key])
            for key in cooccur_coord:
                cooccur_coords[key].extend(cooccur_coord[key])

        return occur_coords, cooccur_coords

    def extract_one_scene_coords(self, cur_scene_json_obj, scale_pos=True):
        """
        Extracts the coordinates of objects (that are present in the scene).
        
        This will be used to create the GMMs for objects and pairs of
        objects.
        
        Warning: This should be called with the same scale_pos values
        that is getting passed to the GMM and feature extraction.
        
        Parameters
        ----------
        cur_scene_json_obj : the JSON object of a scene (used in interface).
        scale_pos : boolean
            scales the object coordinates by the scene dimensions 
            when True (default)
        
        Returns
        -------
        occur_coord : dictionary of lists that contain the
            x, y, z, and flip values for all present objects.
        cooccur_coord : dictionary of lists that contain the
            x, y, z, and flip values for all pairs of present objects
            and the scaled differences accounting for flip of obj1
        """

        cur_scene = cur_scene_json_obj['scene']
        self.read_scene_config_file(cur_scene['sceneConfigFile'])
        cur_scene_type = cur_scene['sceneType']
        cur_scene_config = self.scene_config_data[cur_scene_type]

        num_z_size = cur_scene_config['numZSize']
        z_scale_decay = cur_scene_config['zSizeDecay']
        num_flip = cur_scene_config['numFlip']
        assert num_flip == 2, 'Code not setup flip not being 2'
        
        cur_avail_obj = cur_scene['availableObject']

        cur_z_scale = self.calc_z_scale_vals(z_scale_decay,
                                             num_z_size)
        
        data_present = [instance for obj in cur_avail_obj 
                        for instance in obj['instance'] 
                        if instance['present']]

        occur_coord = defaultdict(list)
        cooccur_coord = defaultdict(list)
        
        for i, obj in enumerate(data_present):
            assert obj['present'], 'Instance must be present'
            x1 = obj['x']
            y1 = obj['y']

            if scale_pos:
                x1 = x1/self.scene_dims[0]
                y1 = y1/self.scene_dims[1]
            
            z1 = obj['z']
            flip = obj['flip']
            
            occur_coord['x'].append(x1)
            occur_coord['y'].append(y1)
            occur_coord['z'].append(z1)
            occur_coord['flip'].append(flip)

            for j, other_obj in enumerate(data_present):
                if i != j:
                    assert other_obj['present'], 'only finding valid data'

                    x2 = other_obj['x']
                    y2 = other_obj['y']
                    
                    if scale_pos:
                        x2 = x2/self.scene_dims[0]
                        y2 = y2/self.scene_dims[1]
                    z2 = other_obj['z']
                    
                    cooccur_coord['x1'].append(x1)
                    cooccur_coord['x2'].append(x2)
                    cooccur_coord['y1'].append(y1)
                    cooccur_coord['y2'].append(y1)
                    cooccur_coord['z1'].append(z1)
                    cooccur_coord['z2'].append(z2)
                    cooccur_coord['flip1'].append(flip)
                    cooccur_coord['flip2'].append(other_obj['flip'])
                    
                    del_x, del_y = self.calc_rel_pos_coords(x1, y1, 
                                                            z1, flip, 
                                                            x2, y2,
                                                            cur_z_scale)
                    cooccur_coord['del_x'].append(del_x)
                    cooccur_coord['del_y'].append(del_y)

        return occur_coord, cooccur_coord
    
    def calc_rel_pos_coords(self, x1, y1, z1, flip1, x2, y2, cur_z_scale):
        
        if flip1 == 1:
            del_x = (-1 * (x1 - x2)) / cur_z_scale[z1]
        else:
            del_x = ( 1 * (x1 - x2)) / cur_z_scale[z1]
        
        del_y = (y1 - y2) / cur_z_scale[z1]
    
        return del_x, del_y
    
    def create_gmms(self, coords_occur, coords_cooccur):
        '''Assumes input is dict of numpy array? '''
        
        depths = np.unique(coords_occur['z'])
        
        gmm_abs_pos = {}
        for depth in depths:
            idxs = coords_occur['z'] == depth
            coords = np.vstack( (coords_occur['x'][idxs], 
                                 coords_occur['y'][idxs]) ).transpose()
            np.random.seed(1)
            gmm = sklearn.mixture.GMM(n_components=self.gmm_abs_k)
            gmm_abs_pos[depth] = gmm.fit(coords)
        
        coords = np.vstack( (coords_cooccur['del_x'], 
                             coords_cooccur['del_y']) ).transpose()
        np.random.seed(1)
        gmm = sklearn.mixture.GMM(n_components=self.gmm_rel_k)
        gmm_rel_pos = gmm.fit(coords)

        return gmm_abs_pos, gmm_rel_pos

    def calc_num_objs_in_clipart_library(self, scene_config,
                                         scene_type=None,
                                         deform_types=None):
        
        self.read_scene_config_file(scene_config)
        
        deform_types = {'human': 'deformable', 
                        'animal': 'nondeformable', 
                        'smallObject': 'nondeformable', 
                        'largeObject': 'nondeformable'}
        cur_deform_types = deform_types
        
        order_by_obj_type = {}    
        all_names = []
        all_objs = 0
        all_kinds = 0
        object_data_keys = self.object_data.keys()
        object_data_keys.sort()

        all_avail_obj = {}
        
        # TODO Assuming that small/large objects
        # are different when different type.
        # This is not strictly true, 
        # as some are just in different poses.
        unique_obj_idx = {}
        
        for obj_type in object_data_keys:
            names = []
            obj_type_data = self.object_data[obj_type]
            deform_type = obj_type_data[cur_deform_types[obj_type]]
            self.debug_print(obj_type)
            self.debug_print(deform_type.keys())

            attr_types = deform_type['attributeTypeList']
            
            for atype in deform_type['type']:
                
                scenes = atype['availableScene']
                if scene_type is None:
                    avail = True
                else:
                    avail = False
                    max_num_inst = 0
                    for scene in scenes:
                        cur_num_inst = scene['numInstance']
                        if cur_num_inst > max_num_inst:
                            max_num_inst = cur_num_inst

                        if scene_type in scene['scene']:
                            avail = True
                            break

                if avail:
                    all_objs += 1
                    names.append(atype['name'])

                    # TODO Also need to check for deformable for human?
                    # If non-deformable people, might be different styles
                    # (e.g., clothes)
                    if obj_type != 'human' and obj_type != 'animal':
                        assert len(attr_types) == 1, 'Not setup for more'
                        num_kinds = atype['num' + attr_types[0]]
                        
                        for idx_kind in range(0, num_kinds):
                            uoi_name = '{}.{}'.format(atype['name'],
                                                      idx_kind)
                            unique_obj_idx[uoi_name] = all_kinds+idx_kind
                    else:
                        num_kinds = 1
                        unique_obj_idx[atype['name']] = all_kinds
                    
                    all_kinds += num_kinds
                    
            sorted_names = sorted(names)
            order_by_obj_type[obj_type] = sorted_names
            all_names.extend(sorted_names)
        self.debug_print(len(all_names))
        self.debug_print(all_kinds)
        self.debug_print( (sorted(unique_obj_idx.keys()),
                           len(unique_obj_idx)) )

        return all_names, all_objs, all_kinds
    
    def get_all_clipart_objects(self, cur_scene):

        cur_deform_types = cur_scene['deformTypesUse']
        cur_avail_obj = cur_scene['availableObject']

        object_data_keys = self.object_data.keys()
        object_data_keys.sort()

        all_names = []
        all_avail_obj = {}
        cur_obj_names = {objs['instance'][0]['name']: obj_idx 
                         for obj_idx, objs in enumerate(cur_avail_obj)}
        
        
        human_properties = {}
        doll_properties = {}
        
        for obj_type in object_data_keys:
            names = []
            obj_type_data = self.object_data[obj_type]
            deform_type = obj_type_data[cur_deform_types[obj_type]]
            self.debug_print(obj_type)
            self.debug_print(deform_type.keys())

            if (obj_type == 'human'):
                human_properties['sexes'] = deform_type['sexes']
                human_properties['ages'] = deform_type['ages']
                human_properties['races'] = deform_type['races']

            attr_types = deform_type['attributeTypeList']
            
            for atype in deform_type['type']:
                
                scenes = atype['availableScene']
                max_num_inst = 0
                for scene in scenes:
                    cur_num_inst = scene['numInstance']
                    if cur_num_inst > max_num_inst:
                        max_num_inst = cur_num_inst

                cur_name = atype['name']
                names.append(cur_name)
                
                # By default, currently False
                deform = False
                if 'deformable' in atype:
                    deform = atype['deformable']

                new_inst = {
                    'type': obj_type,
                    'name': cur_name,
                    'deformable': deform,
                    'present': False,
                    'instanceID': 0
                }
                
                if obj_type == 'human':
                    new_inst['numExpression'] = atype['numExpression']
                    if new_inst['deformable']:
                        num_coords = len(atype['partIdxList'])
                        new_inst['deformableX'] = np.zeros(num_coords)
                        new_inst['deformableY'] = np.zeros(num_coords)
                    props = { 'sex': atype['sex'],
                              'race': atype['race'],
                              'age': atype['age']
                            }                    
                    doll_properties[cur_name] = props

                elif obj_type == 'animal':
                    new_inst['numPose'] = atype['numPose']
                else: # small/large object
                    new_inst['numType'] = atype['numType']
                    self.debug_print(atype['numType'])
                
                instances = []
                for inst_idx in range(0, max_num_inst):
                    cur_inst = copy.deepcopy(new_inst)
                    cur_inst['instanceID'] = inst_idx
                    instances.append(cur_inst)

                new_obj = { 'numInstance': max_num_inst,
                            'instance': instances
                }
                
                all_avail_obj[cur_name] = new_obj

                # Deal with the case that imported scene doesn't have
                # the max number of instances, which would
                # make feature dimensions inconsistent
                if cur_name in cur_obj_names:
                    cur_obj = cur_avail_obj[cur_obj_names[cur_name]]
                    cur_num_inst = cur_obj['numInstance']

                    if cur_num_inst < max_num_inst:
                        instances = []
                        for inst_idx in range(cur_num_inst, max_num_inst):
                            cur_inst = copy.deepcopy(new_inst)
                            cur_inst['instanceID'] = inst_idx
                            instances.append(cur_inst)
                            
                        cur_obj['instance'].extend(instances)
                        cur_obj['numInstance'] = len(cur_obj['instance'])
                        assert cur_obj['numInstance'] == max_num_inst \
                               , 'for consistent dim'

            sorted_names = sorted(names)
            all_names.extend(sorted_names)
        self.debug_print(len(all_names))

        all_objs = []
        for name in all_names:
            if name in cur_obj_names:
                obj = cur_avail_obj[cur_obj_names[name]]
            else:
                obj = all_avail_obj[name]
            all_objs.append(obj)

        return all_objs, human_properties, doll_properties
        
    def extract_one_scene_features(self, data):

        try:
            cur_scene = data['scene']
        except:
            print('XRT type')
            cur_scene = data
        
        self.read_scene_config_file(cur_scene['sceneConfigFile'])
        
        cur_deform_types = cur_scene['deformTypesUse']
        cur_scene_type = cur_scene['sceneType']
        cur_scene_config = self.scene_config_data[cur_scene_type]

        not_used = cur_scene_config['notUsed']
        num_z_size = cur_scene_config['numZSize']
        z_scale_decay = cur_scene_config['zSizeDecay']
        num_flip = cur_scene_config['numFlip']
        
        cur_z_scale = self.calc_z_scale_vals(z_scale_decay,
                                             num_z_size)
                
        all_objs, human_properties, doll_properties = \
                self.get_all_clipart_objects(cur_scene)

        human_count = 0
        humans = []
        
        features = []
        feat_name_fmt = '{}-{}'
        inst_name_fmt = '{}.{}'
        
        features.extend(self.get_scene_features(cur_scene))
        
        if self.instance_ordering == 'random':
            random.seed(1)
            
        for objs in all_objs:
            cardinality = 0
            num_inst = objs['numInstance']
            inst_idxs = self.get_instance_ordering(num_inst)

            for idxIT in inst_idxs:    
                obj = objs['instance'][idxIT]
                
                type_name = obj['type']
                obj_name = obj['name']
                inst_name = inst_name_fmt.format(obj_name, idxIT)

                common_feats = self.create_common_features(feat_name_fmt, 
                                                           type_name, 
                                                           obj_name, 
                                                           inst_name, 
                                                           obj, 
                                                           num_flip, 
                                                           num_z_size, 
                                                           not_used)
                
                features.extend(common_feats)
                
                if type_name == 'human':
                    humans.append(inst_name)
                    human_count += 1
                    
                    cur_doll_prop = doll_properties[obj_name]
                    human_feats = self.create_human_features(feat_name_fmt, 
                                                             type_name, 
                                                             obj_name, 
                                                             inst_name, 
                                                             obj, 
                                                             cur_doll_prop,
                                                             human_properties,
                                                             cur_z_scale)
                    #print(human_feats)
                    features.extend(human_feats)
                elif type_name == 'animal':
                    animal_feats = self.create_animal_features(feat_name_fmt,
                                                               type_name, 
                                                               obj_name, 
                                                               inst_name, 
                                                               obj)
                    features.extend(animal_feats)            
                elif type_name == 'smallObject' or type_name == 'largeObject':
                    obj_feats = self.create_object_features(feat_name_fmt, 
                                                            type_name, 
                                                            obj_name, 
                                                            inst_name, 
                                                            obj)
                    features.extend(obj_feats)
                else:
                    assert True == False, 'Invalid object category!'
                
                if obj['present']:
                    cardinality += 1
            
            card_feature = self.create_obj_cardinality_feature(feat_name_fmt, 
                                                               type_name, 
                                                               obj_name, 
                                                               inst_name, 
                                                               obj, 
                                                               cardinality)
            features.append(card_feature)
            
            if cardinality > 0:
                self.debug_print(card_feature)

        self.debug_print(human_count)
        self.debug_print(humans)
        self.debug_print(len(humans))
        #pdb.set_trace()
        return features
    
    def convert_to_one_hot(self, val, max_val):

        one_hot = np.zeros(max_val, dtype=np.int8)
        
        if val is not None:
            one_hot[val] = 1

        return one_hot
    
    def create_feature(self, name, tags, feature):
        
        feature = {'name': name,
                   'tags': tags,
                   'feature': feature
                }
        feature['tags'].append(name)
        
        return feature

    def get_instance_ordering(self, num_inst):
        '''Create ordering of the different instances of an object type.
        
        Note: Random seed should initialized before 
        the double for-loop over all objects.
        '''
        
        inst_idxs = range(0, num_inst)
            
        if self.instance_ordering == 'random':
            # Seed initialized before the double for-loop
            random.shuffle(inst_idxs)
        elif self.instance_ordering == 'from_center':
            # Calculate distance from center for these
            ordering = self.order_instances_in_scene(objs)
            new_order = [obj[1] for obj in ordering]
            assert set(inst_idxs) == set(new_order), 'instance ids not right'
            inst_idxs = new_order
        else: # original
            pass

        return inst_idxs

    def order_objects_in_scene(self, cur_objs):
        
        from scipy.spatial import distance
        
        data = []
        for idxOT, obj in enumerate(cur_objs):
            for idxIT, inst in enumerate(obj['instance']):
                x = inst['x']
                y = inst['y']
                z = inst['z']
                if inst['present']:
                    from_center = distance.euclidean((x, y),
                                                      self.scene_center)
                else: # Not present, just make twice scene distance
                    from_center = distance.euclidean((-self.scene_dims[0], 
                                                       -self.scene_dims[1]),
                                                       self.scene_dims)
                data.append([from_center, idxOT, idxIT, inst['name']])
        
        # Order all instances by distance from center; 
        # in case of ties, keeps original ordering
        sorted_data = sorted(data, key=lambda datum: datum[0])
        
        return sorted_data

    def order_instances_in_scene(self, obj):
        
        from scipy.spatial import distance
        
        data = []

        for idxIT, inst in enumerate(obj['instance']):
            # TODO? Normalize?
            x = inst['x'] 
            y = inst['y']
            z = inst['z']
            if inst['present']:
                from_center = distance.euclidean((x, y), self.scene_center)
            else: # Not present, just make twice scene distance
                from_center = distance.euclidean((-self.scene_dims[0], 
                                                  -self.scene_dims[1]),
                                                  self.scene_dims)
            data.append([from_center, idxIT, inst['name']])
        
        # Order all instances by distance from center; 
        # in case of ties, keeps original ordering
        sorted_data = sorted(data, key=lambda datum: datum[0])
        
        return sorted_data
    
    def get_scene_features(self, cur_scene):
        
        scene_meta = []
        
        # Note: assumes possible_scene_types has unique elements
        # (it should)
        possible_scene_types = self.scene_config_data['baseDirectory'].keys()
        possible_scene_types.sort()
        cur_scene_type = cur_scene['sceneType']
        coarse_scene_type = cur_scene_type.split('-')[0]
        scene_idx = possible_scene_types.index(coarse_scene_type)
        
        name = 'scene-type'
        tags = ['scene-level']
        type_feat = self.convert_to_one_hot(scene_idx,
                                            len(possible_scene_types))
        type_meta = self.create_feature(name, tags, type_feat)
        scene_meta.append(type_meta)
        
        return scene_meta

    def create_obj_cardinality_feature(self, feat_name_fmt, type_name,
                                       obj_name, inst_name, obj, cardinality):
        
        feat_type = 'cardinality'
        feat_name = feat_name_fmt.format(feat_type, obj_name)
        feat_tags = ['object-level', 'cardinality', type_name, obj_name]
        feat_val = cardinality*self.convert_to_one_hot(0, 1)
        card_meta= self.create_feature(feat_name, feat_tags, feat_val)
        
        return card_meta
            
    def create_common_features(self, feat_name_fmt, type_name, obj_name,
                               inst_name, obj, num_flip, num_z_size,
                               not_used):
                    
        common_meta = []
        
        common_meta.append(self.create_presence_feature(feat_name_fmt,
                                                        type_name, 
                                                        obj_name, 
                                                        inst_name, 
                                                        obj))
        common_meta.append(self.create_flip_feature(feat_name_fmt, 
                                                    type_name, 
                                                    obj_name, 
                                                    inst_name, obj, 
                                                    num_flip))
        common_meta.append(self.create_z_feature(feat_name_fmt, 
                                                 type_name, 
                                                 obj_name, 
                                                 inst_name, 
                                                 obj, 
                                                 num_z_size))
        common_meta.extend(self.create_pos_features(feat_name_fmt, 
                                                    type_name, 
                                                    obj_name, 
                                                    inst_name, 
                                                    obj, 
                                                    not_used))
    
        return common_meta
    
    def create_presence_feature(self, feat_name_fmt, type_name, 
                                obj_name, inst_name, obj):
        
        feat_type = 'presence'
        feat_name = feat_name_fmt.format(feat_type, inst_name)
        feat_tags = ['instance-level', 'category-general', 
                     feat_type, type_name, obj_name, inst_name]    
                
        if obj['present']:
            pres_feat = self.convert_to_one_hot(0, 1)
        else:
            pres_feat = self.convert_to_one_hot(None, 1)
            
        pres_meta = self.create_feature(feat_name, feat_tags, pres_feat)
        
        return pres_meta

    def create_flip_feature(self, feat_name_fmt, type_name, 
                            obj_name, inst_name, obj, num_flip):
        
        feat_type = 'flip'
        feat_name = feat_name_fmt.format(feat_type, inst_name)
        feat_tags = ['instance-level', 'category-general', feat_type, 
                     type_name, obj_name, inst_name]
        # Assumes flip is indexable
        if obj['present']:
            flip = obj['flip']
            flip_feat = self.convert_to_one_hot(flip, num_flip)    
        else:
            flip_feat = self.convert_to_one_hot(None, num_flip)
        
        flip_meta = self.create_feature(feat_name, feat_tags, flip_feat)
        
        return flip_meta 

    def create_z_feature(self, feat_name_fmt, type_name, 
                         obj_name, inst_name, obj, num_z_size):

        feat_type = 'posz'
        feat_name = feat_name_fmt.format(feat_type, inst_name)
        feat_tags = ['instance-level', 'category-general', 
                     feat_type, type_name, obj_name, inst_name]
        if self.z_scalar:
            if obj['present']:
                z = obj['z']
                cur_feat = (z+1)*self.convert_to_one_hot(0, 1) 
            else:
                self.convert_to_one_hot(None, 1)
        else:
            if obj['present']:
                z = obj['z']
                z_feat = self.convert_to_one_hot(z, num_z_size)
            else:
                z_feat = self.convert_to_one_hot(None, num_z_size) 
        
        z_meta = self.create_feature(feat_name, feat_tags, z_feat)
        
        return z_meta
    
    def create_pos_features(self, feat_name_fmt, type_name, 
                            obj_name, inst_name, obj, not_used):
        
        pos_meta = []
        
        if obj['present']:
            x = obj['x']
            y = obj['y']
            z = obj['z']
            if self.scale_pos:
                x = x/self.scene_dims[0]
                y = y/self.scene_dims[1]
        else:
            x = None
            y = None
            z = None

        pos_meta.append(self.create_x_feature(feat_name_fmt, 
                                              type_name, 
                                              obj_name, 
                                              inst_name, obj, 
                                              not_used, 
                                              x))
        pos_meta.append(self.create_y_feature(feat_name_fmt, 
                                              type_name, 
                                              obj_name, 
                                              inst_name, 
                                              obj, 
                                              not_used, 
                                              y))
        pos_meta.append(self.create_gmm_abs_feature(feat_name_fmt, 
                                                    type_name, 
                                                    obj_name, 
                                                    inst_name, 
                                                    obj, 
                                                    x, 
                                                    y, 
                                                    z))

        return pos_meta

    def create_x_feature(self, feat_name_fmt, type_name, 
                         obj_name, inst_name, obj, not_used, x):
                    
        # TODO How to properly deal with not present?
        feat_type = 'posx'
        feat_name = feat_name_fmt.format(feat_type, inst_name)
        feat_tags = ['instance-level', 'category-general', 
                     feat_type, type_name, obj_name, inst_name]
        
        if obj['present']:
            x_feat = x*np.ones(1, dtype=np.float32)
        else:
            x_feat = not_used*np.ones(1, dtype=np.float32)
        
        x_meta = self.create_feature(feat_name, feat_tags, x_feat)
        
        return x_meta
                
    def create_y_feature(self, feat_name_fmt, type_name, 
                         obj_name, inst_name, obj, not_used, y):
        
        # TODO How to properly deal with not present?
        feat_type = 'posy'
        feat_name = feat_name_fmt.format(feat_type, inst_name)
        feat_tags = ['instance-level', 'category-general', 
                     feat_type, type_name, obj_name, inst_name]
        
        if obj['present']:
            y_feat = y*np.ones(1, dtype=np.float32)
        else:
            y_feat = not_used*np.ones(1, dtype=np.float32)
        
        y_meta = self.create_feature(feat_name, feat_tags, y_feat)
        
        return y_meta
    
    def create_gmm_abs_feature(self, feat_name_fmt, type_name, 
                               obj_name, inst_name, obj, x, y, z):
                
        feat_type = 'posgmm'
        feat_name = feat_name_fmt.format(feat_type, inst_name)
        feat_tags = ['instance-level', 'category-general', 
                     feat_type, type_name, obj_name, inst_name]
        
        if obj['present']:
            gmm_abs_feat = self.get_gmm_abs_feats([x, y], z)
            self.debug_print(gmm_abs_feat)
        else:
            gmm_abs_feat = self.get_gmm_abs_feats([0, 0], None)

        gmm_abs_meta = self.create_feature(feat_name, feat_tags, gmm_abs_feat)
        
        return gmm_abs_meta
    
    def get_gmm_abs_feats(self, coords, depth):
        
        assert len(coords) == 2
        
        if self.gmm_abs_pos is None:
            self.gmm_abs_pos = np.load(self.gmm_abs_pos_fn).item()
        
        empty_gmm_abs = self.gmm_abs_pos[0].predict_proba([0,0])[0]
        empty_gmm_abs = 0*np.ones(empty_gmm_abs.shape)

        features = []
        
        for z in range(0, len(self.gmm_abs_pos)):
            if z == depth:
                output = self.gmm_abs_pos[depth].predict_proba(coords)[0]
                features.extend(output)
            else:
                features.extend(empty_gmm_abs)

        features = np.hstack(np.array(features))
        
        return features
    
    def get_gmm_rel_feats(self, coords):

        assert len(coords) == 2 and coords is not None
        
        if self.gmm_rel_pos is None:
            self.gmm_rel_pos = np.load(self.gmm_rel_pos_fn).item()
        
        empty_gmm_abs = self.gmm_rel_pos.predict_proba([0,0])[0]
        empty_gmm_abs = 0*np.ones(empty_gmm_abs.shape)

        features = []
        if coords is not None:
            output = self.gmm_rel_pos[depth].predict_proba(coords)[0]
            features.extend(output)
        else:
            features.extend(empty_gmm_abs)

        features = np.hstack(np.array(features))
        
        return features
    
    def create_human_features(self, feat_name_fmt, type_name, 
                              obj_name, inst_name, obj, 
                              doll_properties, human_properties, 
                              cur_z_scale):
    
        human_meta = []
        
        sexes = human_properties['sexes']
        races = human_properties['races']
        ages = human_properties['ages']
    
        if obj['present']:
            sex = sexes.index(doll_properties['sex']),
            race = races.index(doll_properties['race']),
            age = ages.index(doll_properties['age'])
        else:
            age = None
            sex = None
            race = None
                
        feat_type = 'humansex'
        feat_name = feat_name_fmt.format(feat_type, inst_name)
        feat_tags = ['instance-level', 'category-specific', 
                     feat_type, type_name, obj_name, inst_name]
        num_sexes = len(sexes)
        sex = self.convert_to_one_hot(sex, num_sexes)
        sex_meta = self.create_feature(feat_name, feat_tags, sex)
        human_meta.append(sex_meta)
        
        feat_type = 'humanrace'
        feat_name = feat_name_fmt.format(feat_type, inst_name)
        feat_tags = ['instance-level', 'category-specific', 
                     feat_type, type_name, obj_name, inst_name]
        num_races = len(races)
        race = self.convert_to_one_hot(race, num_races)
        race_meta = self.create_feature(feat_name, feat_tags, race)
        human_meta.append(race_meta)
        
        feat_type = 'humanage'
        feat_name = feat_name_fmt.format(feat_type, inst_name)
        feat_tags = ['instance-level', 'category-specific', 
                     feat_type, type_name, obj_name, inst_name]
        num_ages = len(ages)
        age = self.convert_to_one_hot(age, num_ages)
        age_meta = self.create_feature(feat_name, feat_tags, age)
        human_meta.append(age_meta)
        
        feat_type = 'humanexpr'
        feat_name = feat_name_fmt.format(feat_type, inst_name)
        feat_tags = ['instance-level', 'category-specific', 
                     feat_type, type_name, obj_name, inst_name]
        if obj['present']:
            expr = self.convert_to_one_hot(obj['expressionID'],
                                           obj['numExpression'])
        else:
            expr = self.convert_to_one_hot(None, obj['numExpression'])
        expr_meta = self.create_feature(feat_name, feat_tags, expr)
        human_meta.append(expr_meta)
        
        pose_meta = self.human_pose_features(obj, cur_z_scale, feat_name_fmt,
                                             type_name, obj_name, inst_name)

        human_meta.extend(pose_meta)
        
        return human_meta

    def create_animal_features(self, feat_name_fmt, type_name, 
                               obj_name, inst_name, obj):

        animal_meta = []

        feat_type = 'animalpose'
        feat_name = feat_name_fmt.format(feat_type, inst_name)
        feat_tags = ['instance-level', 'category-specific', 'poseid',
                     feat_type, type_name, obj_name, inst_name]

        if obj['present']:
            pose_feat = self.convert_to_one_hot(obj['poseID'], obj['numPose'])
        else:
            pose_feat = self.convert_to_one_hot(None, obj['numPose']) 

        pose_meta = self.create_feature(feat_name, feat_tags, pose_feat)
        animal_meta.append(pose_meta)

        return animal_meta

    def create_object_features(self, feat_name_fmt, type_name, 
                               obj_name, inst_name, obj):

        obj_meta = []
        
        feat_type = 'objecttype' # make for small vs large?
        feat_name = feat_name_fmt.format(feat_type, inst_name)
        feat_tags = ['instance-level', 'category-specific', 'typeid', 
                     feat_type, type_name, obj_name, inst_name]
        
        if obj['present']:
            type_feat = self.convert_to_one_hot(obj['typeID'], obj['numType'])
        else:
            type_feat = self.convert_to_one_hot(None, obj['numType'])

        type_meta = self.create_feature(feat_name, feat_tags, type_feat)
        obj_meta.append(type_meta)
        
        return obj_meta
            
    def read_scene_config_file(self, scene_config_filename):
        
        scene_config_file = os.path.join(self.config_folder, 
                                         scene_config_filename)
        
        # Only need to load if not the same as previous
        if (scene_config_file != self.prev_scene_config_file):

            self.prev_scene_config_file = scene_config_file
            
            with open(scene_config_file) as json_dirid:
                self.scene_config_data = json.load(json_dirid)
                
                # TODO Get scene dimensions from the actual PNGs used 
                # (i.e., bgImg in the scene_config_file)
                # Should scene_center have be minus 1?
                # Same for Park and Living Room for now...
                self.scene_dims = (700.0, 400.0) 
                self.scene_center = (self.scene_dims[0]/2.0,
                                     self.scene_dims[1]/2.0)
                
                obj_filenames = self.scene_config_data['clipartObjJSONFile']
                object_data = {}
                for obj_file in obj_filenames:
                    obj_file_vers = obj_file['file']
                    for obj_dtype, obj_type_file in obj_file_vers.items():
                        with open(os.path.join(self.config_folder,
                                               obj_type_file)) as f:
                            obj = json.load(f)
                            if obj['objectType'] not in object_data:
                                object_data[obj['objectType']] = {}
                            object_data[obj['objectType']][obj_dtype] = obj
                self.object_data = object_data
            
    def get_object_attr_types(self, obj_type, deform_type):
        
        cur_attr_types = []
        attributes = \
            self.object_data[obj_type][deform_type]['attributeTypeList']
        
        for cur_attr_name in attributes:
            cur_attr_type = {}

            if (cur_attr_name == 'Type'):
                cur_attr_type = {'num': 'numType', 'id': 'typeID'}
            elif (cur_attr_name == 'Pose'):
                cur_attr_type = {'num': 'numPose', 'id': 'poseID'}
            elif (cur_attr_name == 'Expression'):
                cur_attr_type = {'num': 'numExpression', 'id': 'expressionID'}
            
            cur_attr_types.append(cur_attr_type)
        
        return cur_attr_types
    
    def scene_metafeatures_to_features(self, cur_metafeats, 
                                       tags=None, 
                                       keep_or_remove=None,
                                       get_names=False):
        
        features = []
        feature_names = []
        
        if tags is not None:
            tags = set(tags)

        for cur_metafeat in cur_metafeats:

            cur_feat = cur_metafeat['feature']
            
            if get_names:
                cur_name = cur_metafeat['name']
            
            if tags is None:
                features.extend(cur_feat)
                if get_names:
                    cur_names = ['{}[{}]'.format(cur_name, i) \
                                 for i in xrange(0, len(cur_feat))]
                    feature_names.extend(cur_names)
            else:
                cur_tags = cur_metafeat['tags']
                
                if keep_or_remove == 'keep':
                    keep = False
                    for tag in cur_tags:
                        if tag in tags:
                            keep = True
                elif keep_or_remove == 'remove':
                    keep = True
                    for tag in cur_tags:
                        if tag in tags:
                            keep = False
                else:
                    print('invalid keep_or_remove parameter')
                    assert False
                
                if keep:
                    features.extend(cur_feat)
                    if get_names:
                        cur_names = ['{}[{}]'.format(cur_name, i) \
                                     for i in xrange(0, len(cur_feat))]
                        feature_names.extend(cur_names)


        features = np.array(features, dtype=np.float32)

        return features, feature_names
    
    def tanmay_baby(self, obj):
        # Note: This is what Tanmay originally had for their ICCV 2015 paper.
        # This has several bugs in it that are (hopefully) 
        # fixed in the new function
        if obj['flip'] == 0:
            mapping = [0, 2, 1, 12, 13, 14, 9, 10, 11, 3, 4, 5, 6, 7, 8]
        else:
            mapping = [0, 2, 1, 9, 10, 11, 12, 13, 14, 6, 7, 8, 3, 4, 5]
        
        X = obj['deformableX']
        Y = obj['deformableY']
                
        dX=X[1-1]*1.25-X[2-1]*0.25
        dY=Y[1-1]*1.25-Y[2-1]*0.25

        X1=[X[1-1], (X[1-1]+X[2-1])/2.0, X[2-1], 
            dX, (dX+X[3-1])/2.0, X[3-1], dX, (dX+X[4-1])/2.0, X[4-1], 
            X[5-1], (X[5-1]+X[6-1])/2.0, 
            X[6-1], X[7-1], (X[7-1]+X[8-1])/2.0, X[8-1]]
        Y1=[Y[1-1], (Y[1-1]+Y[2-1])/2.0, Y[2-1], 
            dY, (dY+Y[3-1])/2.0, Y[3-1], dY, (dY+Y[4-1])/2.0, Y[4-1], 
            Y[5-1], (Y[5-1]+Y[6-1])/2.0, 
            Y[6-1], Y[7-1], (Y[7-1]+Y[8-1])/2.0, Y[8-1]]
            
        X1 = [X1[idx] for idx in mapping]
        Y1 = [Y1[idx] for idx in mapping]
        
        return np.array(X1), np.array(Y1)

    def baby_transform(self, obj):
        """Deals with transforming baby coordinates for pose features.
         
        Until new_X/new_Y are set, right and left refer to 
        the image left/right
        (assuming body is upright). After they are set, they correspond to
        the doll's left/right side.
        """
        
        parts = obj['partIdxList']
        
        torso_idx = parts['Torso']
        head_idx = parts['Head']
        r_leg_idx = parts['RightLeg']
        l_leg_idx = parts['LeftLeg']
        r_arm_idx = parts['RightArm']
        r_hand_idx = parts['LeftArm']
        l_arm_idx = parts['LeftArm']
        l_hand_idx = parts['LeftHand']
        
        X = obj['deformableX']
        Y = obj['deformableY']
        GR = obj['deformableGlobalRot']
        
        body_ang = GR[torso_idx]
        body_rot = [math.cos(body_ang), -math.sin(body_ang), 
                    math.sin(body_ang), math.cos(body_ang) ]
        
        right_leg_ang = GR[r_leg_idx]
        right_leg_rot = [math.cos(right_leg_ang), -math.sin(right_leg_ang), 
                         math.sin(right_leg_ang), math.cos(right_leg_ang)]
        
        left_leg_ang = GR[l_leg_idx]
        left_leg_rot = [math.cos(left_leg_ang), -math.sin(left_leg_ang), 
                        math.sin(left_leg_ang), math.cos(left_leg_ang)]

        right_arm_ang = GR[r_arm_idx]
        right_arm_rot = [math.cos(right_arm_ang), -math.sin(right_arm_ang), 
                         math.sin(right_arm_ang), math.cos(right_arm_ang)]

        left_arm_ang = GR[l_arm_idx]
        left_arm_rot = [math.cos(left_arm_ang), -math.sin(left_arm_ang), 
                         math.sin(left_arm_ang), math.cos(left_arm_ang)]

        #TODO Get these from a file instead of hardcoding
        del_head_x = -3 # (24 - 27) from Head.png
        del_head_y = -38 # (5 - 43) from Head.png
        del_r_knee_x = 0 # (13 - 13) from RightLeg.png
        del_r_knee_y = 14 # (24 - 10) from RightLeg.png
        del_l_knee_x = 0 # (13 - 13) from LeftLeg.png
        del_l_knee_y = 14 # (24 - 10) from LeftLeg.png
        del_r_ankle_x = 9 # (22 - 13) from RightLeg.png
        del_r_ankle_y = 28 # (38 - 10) from RightLeg.png
        del_l_ankle_x = 9 # (22 - 13) from LeftLeg.png
        del_l_ankle_y = 28 # (38 - 10) from LeftLeg.png
        del_r_elbow_x = 13 # (23 - 10) from RightArm.png
        del_r_elbow_y = 11 # (21 - 10) from RightArm.png
        del_l_elbow_x = 13 # (23 - 10) from LeftArm.png
        del_l_elbow_y = 11 # (21 - 10) from LefttArm.png

        if obj['flip'] == 1:
            del_head_x *= -1
            del_r_knee_x *= -1
            del_l_knee_x *= -1
            del_r_ankle_x *= -1
            del_l_ankle_x *= -1
            del_r_elbow_x *= -1
            del_l_elbow_x *= -1

        torso_x = X[torso_idx]
        torso_y = Y[torso_idx]
        neck_x = X[head_idx]
        neck_y = Y[head_idx]
        top_head_x = neck_x + (del_head_x*body_rot[0] + 
                               del_head_y*body_rot[1])
        top_head_y = neck_y + (del_head_x*body_rot[2] +
                               del_head_y*body_rot[3])
        
        right_hip_x = X[r_leg_idx]
        right_hip_y = Y[r_leg_idx]
        left_hip_x = X[l_leg_idx]
        left_hip_y = Y[l_leg_idx]
        
        right_knee_x = right_hip_x + (del_r_knee_x*right_leg_rot[0] +
                                      del_r_knee_y*right_leg_rot[1])
        right_knee_y = right_hip_y + (del_r_knee_x*right_leg_rot[2] +
                                      del_r_knee_y*right_leg_rot[3])
        left_knee_x = left_hip_x + (del_l_knee_x*left_leg_rot[0] +
                                    del_l_knee_y*left_leg_rot[1])
        left_knee_y = left_hip_y + (del_l_knee_x*left_leg_rot[2] +
                                    del_l_knee_y*left_leg_rot[3])
        
        right_ankle_x = right_hip_x + (del_r_ankle_x*right_leg_rot[0] +
                                       del_r_ankle_y*right_leg_rot[1])
        right_ankle_y = right_hip_y + (del_r_ankle_x*right_leg_rot[2] +
                                       del_r_ankle_y*right_leg_rot[3])
        left_ankle_x = left_hip_x + (del_l_ankle_x*left_leg_rot[0] +
                                     del_l_ankle_y*left_leg_rot[1])
        left_ankle_y = left_hip_y + (del_l_ankle_x*left_leg_rot[2] +
                                     del_l_ankle_y*left_leg_rot[3])
        
        right_shoulder_x = X[r_arm_idx]
        right_shoulder_y = Y[r_arm_idx]
        left_shoulder_x = X[l_arm_idx]
        left_shoulder_y = Y[l_arm_idx]
        
        right_elbow_x = right_shoulder_x + (del_r_elbow_x*right_arm_rot[0] +
                                            del_r_elbow_y*right_arm_rot[1])
        right_elbow_y = right_shoulder_y + (del_r_elbow_x*right_arm_rot[2] +
                                            del_r_elbow_y*right_arm_rot[3])
        left_elbow_x = left_shoulder_x + (del_l_elbow_x*left_arm_rot[0] +
                                          del_l_elbow_y*left_arm_rot[1])
        left_elbow_y = left_shoulder_y + (del_l_elbow_x*left_arm_rot[2] +
                                          del_l_elbow_y*left_arm_rot[3])
        
        right_wrist_x = X[r_hand_idx]
        right_wrist_y = Y[r_hand_idx]
        left_wrist_x = X[l_hand_idx]
        left_wrist_y = Y[l_hand_idx]
        
        # Need to convert from image left/right to doll's left/right,
        # accouting for flip
        if obj['flip'] == 0:
            new_X = [torso_x, top_head_x, neck_x, 
                     left_shoulder_x, left_elbow_x, left_wrist_x,
                     right_shoulder_x, right_elbow_x, right_wrist_x,
                     right_hip_x, right_knee_x, right_ankle_x, 
                     left_hip_x, left_knee_x, left_ankle_x
                    ]
            new_Y = [torso_y, top_head_y, neck_y, 
                     left_shoulder_y, left_elbow_y, left_wrist_y,
                     right_shoulder_y, right_elbow_y, right_wrist_y,
                     right_hip_y, right_knee_y, right_ankle_y, 
                     left_hip_y, left_knee_y, left_ankle_y
                    ]
        else:
            new_X = [torso_x, top_head_x, neck_x, 
                     right_shoulder_x, right_elbow_x, right_wrist_x,
                     left_shoulder_x, left_elbow_x, left_wrist_x,
                     left_hip_x, left_knee_x, left_ankle_x,
                     right_hip_x, right_knee_x, right_ankle_x
                    ]
            new_Y = [torso_y, top_head_y, neck_y, 
                     right_shoulder_y, right_elbow_y, right_wrist_y,
                     left_shoulder_y, left_elbow_y, left_wrist_y,
                     left_hip_y, left_knee_y, left_ankle_y,
                     right_hip_y, right_knee_y, right_ankle_y
                    ]
            
        return np.array(new_X), np.array(new_Y)

    def nonbaby_transform(self, obj):
        
        if obj['flip'] == 0:
            parts = ['Torso', 
                     'Hair',
                     'Head',
                     'LeftArmTop',
                     'LeftArmBottom',
                     'LeftHand',
                     'RightArmTop',
                     'RightArmBottom',
                     'RightHand',
                     'RightLegTop',
                     'RightLegBottom',
                     'RightFoot',
                     'LeftLegTop',
                     'LeftLegBottom',
                     'LeftFoot'
                    ]
        else:
            parts = ['Torso', 
                     'Hair',
                     'Head',
                     'RightArmTop',
                     'RightArmBottom',
                     'RightHand',
                     'LeftArmTop',
                     'LeftArmBottom',
                     'LeftHand',
                     'LeftLegTop',
                     'LeftLegBottom',
                     'LeftFoot',
                     'RightLegTop',
                     'RightLegBottom',
                     'RightFoot'
                    ]
            
        mapping = [obj['partIdxList'][part] for part in parts]
    
        X = obj['deformableX']
        Y = obj['deformableY']
        
        X = [X[idx] for idx in mapping]
        Y = [Y[idx] for idx in mapping]
        
        return np.array(X), np.array(Y)
    
    def human_pose_transformation(self, obj, cur_z_scale):
        
        #required_ordering = ['torso',
                             #'top of head',
                             #'neck',
                             #'left shoulder',
                             #'left elbow',
                             #'left wrist',
                             #'right shoulder',
                             #'right elbow',
                             #'right wrist',
                             #'right hip',
                             #'right knee',
                             #'right ankle',
                             #'left hip',
                             #'left knee',
                             #'left ankle'
                            #]

        #TODO Check the age property for baby
        if (obj['name'] == 'Doll19' or 
            obj['name'] == 'Doll20'):
            X, Y = self.baby_transform(obj)
        else:
            X, Y = self.nonbaby_transform(obj)
          
        X = X*obj['globalScale']*cur_z_scale[obj['z']]
        Y = Y*obj['globalScale']*cur_z_scale[obj['z']]
        
        #for x, y, part in zip(X, Y, required_ordering):
            #print(part, x, y)
            #pass
        
        return X, Y
        
    def human_pose_features(self, obj, cur_z_scale, feat_name_fmt, type_name,
                            obj_name, inst_name):
        
        present = obj['present']
        if present:
            X, Y = self.human_pose_transformation(obj, cur_z_scale)
        else:
            X = obj['deformableX']
            Y = obj['deformableY']
        
        # feature extraction does not need torso
        X = X[1:]
        Y = Y[1:]

        return self.calculate_human_pose_features(present, X, Y,
                                                  feat_name_fmt, 
                                                  type_name, obj_name,
                                                  inst_name)
        
    def calculate_human_pose_features(self, present, X, Y,
                                      feat_name_fmt, 
                                      type_name,
                                      obj_name,
                                      inst_name,
                                      feat_basic=False, 
                                      feat_contact=True, 
                                      feat_global=True, 
                                      num_gauss=3, 
                                      feat_orient=True, 
                                      num_orient=12):
        
        if self.human_pose_ft_param is None:
            ft_param = {}
            ft_param['is_real'] = 0
            ft_param['num_people'] = 1
            ft_param['num_parts'] = 14
            ft_param['num_joint_pairs'] = 8
            ft_param['num_orient'] = num_orient
            ft_param['num_gauss'] = num_gauss
            
            ft_param['idx_head'] = 0
            ft_param['idx_shoulderL'] = 2
            ft_param['idx_shoulderR'] = 5
            ft_param['idx_hipL'] = 11
            ft_param['idx_hipR'] = 8

            joint_pairs0 = [None]*8
            joint_pairs0[0] = 2
            joint_pairs0[1] = 3
            joint_pairs0[2] = 5
            joint_pairs0[3] = 6
            joint_pairs0[4] = 8
            joint_pairs0[5] = 9
            joint_pairs0[6] = 11
            joint_pairs0[7] = 12
            ft_param['num_joint_pairs1'] = len(joint_pairs0)
            ft_param['joint_pairs0'] = joint_pairs0

            joint_pairs1 = [None]*8
            joint_pairs1[0] =  3 # L Elbow
            joint_pairs1[1] =  4 # L Hand
            joint_pairs1[2] =  6 # R Elbow
            joint_pairs1[3] =  7 # R Hand
            joint_pairs1[4] =  9 # R Knee
            joint_pairs1[5] = 10 # R Foot
            joint_pairs1[6] = 12 # L Knee
            joint_pairs1[7] = 13 # L Foot
            ft_param['num_joint_pairs1'] = len(joint_pairs1)
            ft_param['joint_pairs1'] = joint_pairs1

            contact_joint_pairs0 = [None]*13
            contact_joint_pairs0[0] =   0 # Head
            contact_joint_pairs0[1] =   2 # L Shoulder
            contact_joint_pairs0[2] =   3 # L Elbow
            contact_joint_pairs0[3] =   4 # L Hand
            contact_joint_pairs0[4] =   5 # R Shoulder
            contact_joint_pairs0[5] =   6 # R Elbow
            contact_joint_pairs0[6] =   7 # R Hand
            contact_joint_pairs0[7] =   8 # R Hip
            contact_joint_pairs0[8] =   9 # R Knee
            contact_joint_pairs0[9] =  10 # R Foot
            contact_joint_pairs0[10] = 11 # L Hip
            contact_joint_pairs0[11] = 12 # L Knee
            contact_joint_pairs0[12] = 13 # L Foot
            ft_param['num_contact_joint_pairs0'] = \
                                            len(contact_joint_pairs0)
            ft_param['contact_joint_pairs0'] = contact_joint_pairs0

            joint_pairs_parent0 = [None]*8
            joint_pairs_parent0[0] = 2
            joint_pairs_parent0[1] = 2
            joint_pairs_parent0[2] = 5
            joint_pairs_parent0[3] = 5
            joint_pairs_parent0[4] = 5
            joint_pairs_parent0[5] = 8
            joint_pairs_parent0[6] = 2
            joint_pairs_parent0[7] = 11
            ft_param['joint_pairs_parent0'] = joint_pairs_parent0

            joint_pairs_parent1 = [None]*8
            joint_pairs_parent1[0] = 11
            joint_pairs_parent1[1] = 3
            joint_pairs_parent1[2] = 8
            joint_pairs_parent1[3] = 6
            joint_pairs_parent1[4] = 8
            joint_pairs_parent1[5] = 9
            joint_pairs_parent1[6] = 11
            joint_pairs_parent1[7] = 12
            ft_param['joint_pairs_parent1'] = joint_pairs_parent1
            
            self.human_pose_ft_param = ft_param
        else:
            ft_param = self.human_pose_ft_param
        
        feat_type_fmt = 'humanpose-{}'
        feats = []
        
        #TODO Consider adding for consistency with ECCV 2014 features
        #if feat_basic:
            #feats.append(self.human_pose_basic_features())
        
        all_empty = (self.empty_human_pose_contact_features is None and
                    self.empty_human_pose_global_features is None and
                    self.empty_human_pose_orientation_features is None)
        
        if all_empty and not present:
            # Just fill with garbage values
            X = np.random.randint(0, high=self.scene_dims[0], size=len(X))
            Y = np.random.randint(0, high=self.scene_dims[1], size=len(Y))
            
        if feat_contact:
            feat_type = feat_type_fmt.format('contact')
            feat_name = feat_name_fmt.format(feat_type, inst_name)
            feat_tags = ['instance-level', 'category-specific', 'pose',
                         feat_type, type_name, obj_name, inst_name]
            if present:
                pose_feat = self.human_pose_contact_features(ft_param, 
                                                             [(X, Y)])
                pose_feat = np.array(pose_feat)
            else:
                if self.empty_human_pose_contact_features is None:
                    pose_feat = self.human_pose_contact_features(ft_param,
                                                                 [(X, Y)])
                    pose_feat = np.zeros(len(pose_feat))
                    self.empty_human_pose_contact_features = pose_feat
                    
                else:
                    pose_feat = self.empty_human_pose_contact_features
            
            pose_meta = self.create_feature(feat_name, feat_tags, pose_feat)
            feats.append(pose_meta)
            
        if feat_global:
            feat_type = feat_type_fmt.format('global')
            feat_name = feat_name_fmt.format(feat_type, inst_name)
            feat_tags = ['instance-level', 'category-specific', 'pose',
                         feat_type, type_name, obj_name, inst_name]
            if present:
                pose_feat = self.human_pose_global_features(ft_param, 
                                                            [(X, Y)])
                pose_feat = np.array(pose_feat)
            else:
                if self.empty_human_pose_global_features is None:
                    pose_feat = self.human_pose_global_features(ft_param,
                                                                [(X, Y)])
                    pose_feat = np.zeros(len(pose_feat))
                    self.empty_human_pose_global_features = pose_feat
                else:
                    pose_feat = self.empty_human_pose_global_features
            
            pose_meta = self.create_feature(feat_name, feat_tags, pose_feat)
            feats.append(pose_meta)
        
        if feat_orient:
            feat_type = feat_type_fmt.format('orientation')
            feat_name = feat_name_fmt.format(feat_type, inst_name)
            feat_tags = ['instance-level', 'category-specific', 'pose',
                         feat_type, type_name, obj_name, inst_name]
            if present:
                # Not what the common sense paper used
                pose_feat = self.human_pose_orientation_features(ft_param, 
                                                [(X, Y)], 
                                                get_overall_orientation=True)
                pose_feat = np.array(pose_feat)
            else:
                if self.empty_human_pose_orientation_features is None:
                    # Not what the common sense paper used
                    pose_feat = \
                        self.human_pose_orientation_features(ft_param, 
                                                [(X, Y)], 
                                                get_overall_orientation=True) 
                    pose_feat = np.zeros(len(pose_feat))
                    self.empty_human_pose_orientation_features = pose_feat
                else:
                    pose_feat = self.empty_human_pose_orientation_features
            
            pose_meta = self.create_feature(feat_name, feat_tags, pose_feat)
            feats.append(pose_meta)

        return feats
    
    def human_pose_orientation_features(self, ft_param, partXY,
                                        get_overall_orientation=False):
        '''
        get_overall_orientation is for whether or not you want 
        the "global" orientation of the body/torso
        w.r.t. the image frame
        #TODO make things more efficient?
        '''

        orient_features = []
        fvec = np.array([])
        for j in range(0, ft_param['num_people']):
            
            hist = -1*np.ones((1, ft_param['num_orient']))
            midShoulder_x = -1
            midShoulder_y = -1
            head_x = -1
            head_y = -1
            
            pose_x = partXY[j][0]
            pose_y = partXY[j][1]
            
            if (    pose_x[ft_param['idx_head']] == -1 or
                    pose_y[ft_param['idx_head']] == -1 or 
                    pose_x[ft_param['idx_shoulderL']] == -1 or
                    pose_y[ft_param['idx_shoulderL']] == -1 or
                    pose_x[ft_param['idx_shoulderR']] == -1 or
                    pose_y[ft_param['idx_shoulderR']] == -1 ):
                
                num_feats = \
                    ft_param['num_orient']*ft_param['num_joint_pairs']
                fvec = np.append(fvec, -1*np.ones( (1, num_feats)))
            else:
                if get_overall_orientation:
                    midShoulder_x = (
                        pose_x[ft_param['idx_shoulderL']] + 
                        pose_x[ft_param['idx_shoulderR']] ) / 2.0
                    midShoulder_y = (
                        pose_y[ft_param['idx_shoulderL']] +
                        pose_y[ft_param['idx_shoulderR']] ) / 2.0
                    
                    head_x = pose_x[ft_param['idx_head']]
                    head_y = pose_y[ft_param['idx_head']]
                    
                    orient_body = (math.pi + 
                                   math.atan2(head_y - midShoulder_y, 
                                              head_x - midShoulder_x)) 
                    
                    orient_idx = orient_body / (2.0 * math.pi )
                    orient_idx *= (ft_param['num_orient']-0.001)
                    
                    orient_del = orient_idx - math.floor(orient_idx)
                    
                    hist = np.zeros((1, ft_param['num_orient']))
                    
                    idx1 = math.floor(orient_idx)
                    # Deal with wrap-around
                    idx2 = (idx1 + 1) % ft_param['num_orient'] 

                    hist[0, idx1] = 1.0 - orient_del
                    hist[0, idx2] = orient_del
                
                    fvec = np.append(fvec, hist)
           
                for k in range(0, ft_param['num_joint_pairs']):
                    if (pose_x[ft_param['joint_pairs0'][k]] == -1.0 or
                        pose_y[ft_param['joint_pairs0'][k]] == -1.0 or
                        pose_x[ft_param['joint_pairs1'][k]] == -1.0 or
                        pose_y[ft_param['joint_pairs1'][k]] == -1.0 or
                        pose_x[ft_param['joint_pairs_parent0'][k]] == -1.0 or
                        pose_y[ft_param['joint_pairs_parent0'][k]] == -1.0 or
                        pose_x[ft_param['joint_pairs_parent1'][k]] == -1.0 or
                        pose_y[ft_param['joint_pairs_parent1'][k]] == -1.0
                        ):
                        
                        num_feat = ft_param['num_orient']
                        fvec = np.append(fvec, -1*np.ones(1, num_feat))
                    else:
                        y_dist = (pose_y[ft_param['joint_pairs_parent1'][k]] -
                                  pose_y[ft_param['joint_pairs_parent0'][k]])
                        x_dist = (pose_x[ft_param['joint_pairs_parent1'][k]] -
                                  pose_x[ft_param['joint_pairs_parent0'][k]])
                        orient_parent = math.pi + math.atan2(y_dist, x_dist)
                        
                        y_dist = (pose_y[ft_param['joint_pairs1'][k]] -
                                 pose_y[ft_param['joint_pairs0'][k]])
                        x_dist = (pose_x[ft_param['joint_pairs1'][k]] -
                                  pose_x[ft_param['joint_pairs0'][k]])
                        orient = math.pi + math.atan2(y_dist, x_dist)
                                                      
                        if (orient < orient_parent):
                            orient = orient + 2.0*math.pi
                        
                        orient = orient - orient_parent
                        
                        orient_idx = orient / (2.0 * math.pi)
                        orient_idx = (orient_idx *
                                      (ft_param['num_orient']-0.001))
                        
                        orient_del = orient_idx - math.floor(orient_idx)
                        
                        hist = np.zeros((1, ft_param['num_orient']))
                        
                        idx1 = math.floor(orient_idx)
                        # Deal with wrap-around
                        idx2 = (idx1 + 1) % ft_param['num_orient'] 
                        hist[0, idx1] = 1.0 - orient_del
                        hist[0, idx2] = orient_del
                        
                        fvec = np.append(fvec, hist)

        return fvec
    
    #def human_pose_calc_avg_scale(self, ft_param, partXY):
    #TODO MATLAB->Python
        #avgScale = 0.0;
        #numScale = 0;
        #for i = 1:ft_param['numImgs:
            #for j = 1:ft_param['num_people:
                #base_body_idx = mod( j-1, ft_param['num_people ) + 1;
                #other_body_idx   = mod( j  , ft_param['num_people ) + 1;
                #personBase = partXY{i, base_body_idx};
                
                #mean = [struct('x', 'y'); struct('x', 'y')];
                
                #if (base_x(ft_param['ihead] == -1.0 or
                        #base_y(ft_param['ihead] == -1.0 or
                        #base_x(ft_param['ishoulderL] == -1.0 or
                        #base_y(ft_param['ishoulderL] == -1.0 or
                        #base_x(ft_param['ishoulderR] == -1.0 or
                        #base_y(ft_param['ishoulderR] == -1.0 or
                        #base_x(ft_param['ihipL] == -1.0 or
                        #base_y(ft_param['ihipL] == -1.0 or
                        #base_x(ft_param['ihipR] == -1.0 or
                        #base_y(ft_param['ihipR] == -1.0
                        #)
                    #% do nothing
                    
                #else
                    #mean(1+1).x = (base_x(ft_param['ishoulderL) + base_x(ft_param['ishoulderR) + base_x(ft_param['ihipL) + base_x(ft_param['ihipR)) / 4.0;
                    #mean(1+1).y = (base_y(ft_param['ishoulderL) + base_y(ft_param['ishoulderR) + base_y(ft_param['ihipL) + base_y(ft_param['ihipR)) / 4.0;
                    
                    #mean(0+1).x = base_x(ft_param['ihead);
                    #mean(0+1).y = base_y(ft_param['ihead);
                    
                    #scale_body = sqrt((mean(1+1).x - mean(0+1).x)*(mean(1+1).x - mean(0+1).x) + (mean(1+1).y - mean(0+1).y)*(mean(1+1).y - mean(0+1).y));
                    #avgScale = avgScale + scale_body;
                    #numScale = numScale+1;
                #end
            #end
        #end
        #avgScale = avgScale/numScale;
        #fprintf('Average body scale = %f\n', avgScale);

    def human_pose_contact_features(self, ft_param, partXY, avg_scale=None):

        fvec = np.array([])
        for j in range(0, ft_param['num_people']):

            base_body_idx = (j) % ft_param['num_people']
            other_body_idx = (j+1) % ft_param['num_people']
            
            other_x = partXY[other_body_idx][0]
            other_y = partXY[other_body_idx][1] 
            base_x = partXY[base_body_idx][0]
            base_y = partXY[base_body_idx][1]
            
            if (base_x[ft_param['idx_head']] == -1.0 or
                base_y[ft_param['idx_head']] == -1.0 or 
                base_x[ft_param['idx_shoulderL']] == -1.0 or 
                base_y[ft_param['idx_shoulderL']] == -1.0 or
                base_x[ft_param['idx_shoulderR']] == -1.0 or
                base_y[ft_param['idx_shoulderR']] == -1.0 or
                base_x[ft_param['idx_hipL']] == -1.0 or
                base_y[ft_param['idx_hipL']] == -1.0 or
                base_x[ft_param['idx_hipR']] == -1.0 or
                base_y[ft_param['idx_hipR']] == -1.0
            ):
                assert avg_scale is not None\
                    , 'Body is incomplete and avg_scale not passed in'
                scale_body = avg_scale
            else:
                torso_x = (base_x[ft_param['idx_shoulderL']] + 
                           base_x[ft_param['idx_shoulderR']] + 
                           base_x[ft_param['idx_hipL']] + 
                           base_x[ft_param['idx_hipR']]) / 4.0
                torso_y = (base_y[ft_param['idx_shoulderL']] + 
                           base_y[ft_param['idx_shoulderR']] + 
                           base_y[ft_param['idx_hipL']] + 
                           base_y[ft_param['idx_hipR']]) / 4.0
                
                head_x = base_x[ft_param['idx_head']]
                head_y = base_y[ft_param['idx_head']]
                                       
                scale_body = math.sqrt((torso_x - head_x)**2 + 
                                       (torso_y - head_y)**2)
            
            for k in range(0,ft_param['num_joint_pairs1']):
                if (base_x[ft_param['joint_pairs1'][k]] == -1.0 or
                        base_y[ft_param['joint_pairs1'][k]] == -1.0):
                    num_feat = ft_param['num_contact_joint_pairs0']
                    fvec = np.append(fvec, -1.0*np.ones((1, num_feat)))
                else:
                    for m in range(0, ft_param['num_contact_joint_pairs0']):
                        cjp0_idx = ft_param['contact_joint_pairs0'][m]
                        if (base_x[cjp0_idx] == -1.0 or
                            base_y[cjp0_idx] == -1.0):
                            fvec = np.append(fvec, -1.0)
                        else:
                            jp1_idx = ft_param['joint_pairs1'][k]
                            x0 = base_x[jp1_idx]
                            y0 = base_y[jp1_idx]
                            
                            cjp0_idx = ft_param['contact_joint_pairs0'][m]
                            x0 = x0 - base_x[cjp0_idx]
                            y0 = y0 - base_y[cjp0_idx]
                            
                            x0 = x0/scale_body
                            y0 = y0/scale_body
                            
                            denom = 0.20
                            if (ft_param['is_real'] == 1):
                                denom = 0.8*denom
                            gauss_val = math.exp(-(x0**2 + y0**2) / denom)
                            fvec = np.append(fvec, gauss_val)
            
            if ( ft_param['num_people'] == 2 ):
                for k  in range(0, ft_param['num_joint_pairs1']):
                    jp1_idx = ft_param['joint_pairs1'][k]
                    if (other_x[jp1_idx] == -1.0 or
                        other_y[jp1_idx] == -1.0):
                        num_feat = ft_param['num_contact_joint_pairs0']
                        fvec = np.append(fvec, -1.0*np.ones((1, num_feat)))
                    else:
                        ncjp0 = ft_param['num_contact_joint_pairs0']
                        for m in range(0, ncjp0):
                            cjp0_idx = ft_param['contact_joint_pairs0'][m]
                            if (base_x[cjp0_idx] == -1.0 or
                                base_y[cjp0_idx] == -1.0):
                                
                                fvec = np.append(fvec, -1.0)
                            else:
                                jp1_idx = ft_param['joint_pairs1'][k]
                                x0 = other_x[jp1_idx]
                                y0 = other_y[jp1_idx]
                                
                                cjp0_idx = ft_param['contact_joint_pairs0'][m]
                                x0 = x0 - base_x[cjp0_idx]
                                y0 = y0 - base_y[cjp0_idx]
                                
                                x0 = x0/scale_body
                                y0 = y0/scale_body
                                
                                denom = 0.20
                                if (ft_param['is_real'] == 1):
                                    denom = 0.8*denom

                                gauss_val = math.exp(-(x0**2+y0**2) / denom)
                                fvec = np.append(fvec, gauss_val)
        return fvec
    
    def human_pose_global_features(self, ft_param, partXY, avg_scale=None):

        fvec = np.array([])
        for j in range(0, ft_param['num_people']):

            base_body_idx = (j) % ft_param['num_people']
            other_body_idx = (j+1) % ft_param['num_people']
            
            other_x = partXY[other_body_idx][0]
            other_y = partXY[other_body_idx][1] 
            base_x = partXY[base_body_idx][0]
            base_y = partXY[base_body_idx][1]
            
            if (    base_x[ft_param['idx_head']] == -1.0 or
                    base_y[ft_param['idx_head']] == -1.0 or 
                    base_x[ft_param['idx_shoulderL']] == -1.0 or 
                    base_y[ft_param['idx_shoulderL']] == -1.0 or
                    base_x[ft_param['idx_shoulderR']] == -1.0 or
                    base_y[ft_param['idx_shoulderR']] == -1.0 or
                    base_x[ft_param['idx_hipL']] == -1.0 or
                    base_y[ft_param['idx_hipL']] == -1.0 or
                    base_x[ft_param['idx_hipR']] == -1.0 or
                    base_y[ft_param['idx_hipR']] == -1.0
                    ):
                #TODO Should that be num_people instead of 2?
                num_feat = (2 * ft_param['num_gaussians'] * 
                            ft_param['num_joint_pairs'] )
                fvec = np.append(fvec, -1.0*np.ones((1, num_feat)))
            else:
                torso_x = (base_x[ft_param['idx_shoulderL']] + 
                           base_x[ft_param['idx_shoulderR']] + 
                           base_x[ft_param['idx_hipL']] + 
                           base_x[ft_param['idx_hipR']]) / 4.0
                torso_y = (base_y[ft_param['idx_shoulderL']] + 
                           base_y[ft_param['idx_shoulderR']] + 
                           base_y[ft_param['idx_hipL']] + 
                           base_y[ft_param['idx_hipR']]) / 4.0
                
                head_x = base_x[ft_param['idx_head']]
                head_y = base_y[ft_param['idx_head']]
                                       
                scale_body = math.sqrt((torso_x - head_x)**2 + 
                                       (torso_y - head_y)**2)
                orient_body = math.pi/2.0 - math.atan2(head_y-torso_y,  
                                                       head_x-torso_x) 
                        
                for k in range(0, ft_param['num_joint_pairs']):
                    jp1_idx = ft_param['joint_pairs1'][k]
                    if (base_x[jp1_idx] == -1.0 or
                        base_y[jp1_idx] == -1.0):
                        num_feat = ft_param['num_gaussians']
                        fvec = np.append(fvec, -1.0*np.ones((1, num_feat)))
                    else:
                        jp1_idx = ft_param['joint_pairs1'][k]
                        x0 = base_x[jp1_idx]
                        y0 = base_y[jp1_idx]
                        
                        x0 = x0 - torso_x
                        y0 = y0 - torso_y
                        
                        x0 = x0/scale_body
                        y0 = y0/scale_body
                    
                        x1 = (x0*math.cos(orient_body) -
                              y0*math.sin(orient_body))
                        y1 = (x0*math.sin(orient_body) +
                              y0*math.cos(orient_body))
                        x1 = x1/2.0
                        
                        denom = 0.5
                        if (ft_param['is_real'] == 1):
                            denom = 0.8*denom
                        
                        gauss_center = math.exp(-(x1**2+y1**2)/(denom))
                        gauss_above = math.exp(-(x1**2+(y1-1.0)**2)/(denom))
                        gauss_below = math.exp(-(x1**2+(y1+1.0)**2)/(denom))
                        cur_f = [gauss_center, gauss_above, gauss_below]
                        cur_f = np.array(cur_f)
                        fvec = np.append(fvec, cur_f)
                    
                    if (ft_param['num_people'] == 2):
                        jp1_idx = ft_param['joint_pairs1'][k]
                        if (other_x[jp1_idx] == -1.0 or
                            other_y[jp1_idx] == -1.0):
                            
                            num_feat = ft_param['num_gaussians']
                            fvec = np.append(fvec, -1.0*np.ones((1,
                                                                 num_feat)))
                        else:
                            jp1_idx = ft_param['joint_pairs1'][k]
                            x0 = other_x[jp1_idx]
                            y0 = other_y[jp1_idx]

                            x0 = x0 - torso_x
                            y0 = y0 - torso_y

                            x0 = x0/scale_body
                            y0 = y0/scale_body

                            x1 = (x0*math.cos(orient_body) -
                                  y0*math.sin(orient_body))
                            y1 = (x0*math.sin(orient_body) +
                                  y0*math.cos(orient_body))
                            x1 = x1/2.0

                            denom = 0.50
                            if (ft_param['is_real'] == 1):
                                denom = 0.8*denom
                            
                            gauss_c = math.exp(-(x1**2+y1**2)/(denom))
                            gauss_a = math.exp(-(x1**2+(y1-1.0)**2)/(denom))
                            gauss_b = math.exp(-(x1**2+(y1+1.0)**2)/(denom))
                            cur_f = [gauss_c, gauss_a, gauss_b]
                            cur_f = np.array(cur_f)
                            fvec = np.append(fvec, cur_f)
        return fvec