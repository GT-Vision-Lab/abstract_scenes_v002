 #!/usr/bin/python
 # -*- coding: utf-8 -*-
 
import json
from PIL import Image, ImageFilter
from os import path
import os
import glob

import math
from numpy import matrix
from numpy import linalg

import pdb

def dir_path(dname):
    '''
    If the directory doesn't exist then make it.
    '''
    try:
        os.makedirs(dname)
    except os.error:
        pass
    return dname

class RenderScenes(object):
    
    def __init__(self, opts):
        self.opts = opts
        self.prev_scene_config_file = ''
        
    def run(self):
        if (self.opts['render']):
            self.render_scenes()

    def render_scenes(self):
        
        #"pilot_01.json"
        json_data = self.opts['<jsondata>']
        #render_dir = '../imgs/'
        render_dir = dir_path(self.opts['<outdir>'])
        clipart_img_format = self.opts['--format']
        self.overwrite = self.opts['--overwrite']

        if (self.opts['--site_pngs_dir'] == 'USE_DEF'):
            #base_url_interface = os.path.join('..', '..', 'interface')
            base_url_interface = '/srv/share/abstract_scenes_v002/site_pngs/'
        else:
            base_url_interface = self.opts['--site_pngs_dir']
            
        if (self.opts['--config_dir'] == 'USE_DEF'):
            #config_folder = dir_path(os.path.join('..', '..', 'data'))
            config_folder = '/srv/share/abstract_scenes_v002/site_data/'
        else:
            config_folder = self.opts['--config_dir']

        self.config_folder = config_folder
        self.render_dir = render_dir
        self.clipart_img_format = clipart_img_format
        self.base_url_interface = base_url_interface
        
        if path.isdir(json_data):
            search_str = path.join(json_data, '*.json')
            json_files = glob.glob(search_str)
            json_files.sort()
            for json_file in json_files:
                with open(json_file) as json_fileid:
                    scene = json.load(json_fileid)    
                self.render_one_scene(scene)
        else:
            with open(json_data) as json_fileid:
                all_scenes = json.load(json_fileid)

            if type(all_scenes) == list:
                for cur_scene in all_scenes:
                    self.render_one_scene(cur_scene)
            elif type(all_scenes) == dict:
                self.render_one_scene(all_scenes)
        
    def render_one_scene(self, data):
        
        if 'imgName' in data:
            img_name = data['imgName']
        elif 'file_name' in data:
            img_name = data['file_name']
        elif 'id' in data:
            img_name = '{}.png'.format(data['id'])

        img_file = os.path.join(self.render_dir, img_name)
        
        # Skip if already exists and no overwrite flag
        if (not os.path.isfile(img_file) or self.overwrite==True):
            cur_scene = data['scene']
            self.read_scene_config_file(cur_scene['sceneConfigFile'])
            cur_scene_type = cur_scene['sceneType']
            cur_scene_config = self.scene_config_data[cur_scene_type]
                
            def_z_size =  cur_scene_config['defZSize']   
            img_pad_num = cur_scene_config['imgPadNum']
            not_used = cur_scene_config['notUsed']
            num_z_size = cur_scene_config['numZSize']
            num_depth0 = cur_scene_config['numDepth0']
            num_depth1 = cur_scene_config['numDepth1']
            num_flip = cur_scene_config['numFlip']
            
            object_type_data = cur_scene_config['objectTypeData']
            object_type_order = []
            num_obj_type_show = {}
            for obj_el in object_type_data:

                cur_name = obj_el['nameType']
                object_type_order.append(cur_name)
                num_obj_type_show[cur_name] = obj_el['numShow']
            
            cur_avail_obj = cur_scene['availableObject']
            cur_z_scale = [1.0]
            for i in range(1, num_z_size):
                cur_z_scale.append(cur_z_scale[i - 1] * cur_scene_config['zSizeDecay'])

            bg_img_file = os.path.join(self.base_url_interface, 
                                cur_scene_config['baseDir'], 
                                cur_scene_config['bgImg'])
            bg_img = Image.open(bg_img_file)
            
            # // Make sure we get the depth ordering correct (render the objects using their depth order)
            for k in reversed(range(0, num_depth0)): # (num_depth0-1, num_depth0-2, ... 0)
            #     if (curDepth0Used[k] <= 0) { // not used, just to accelerate the process
            #         continue;
            #     }
                for j in reversed(range(0, num_z_size+1)):
            #         // for people, choose both the expression and the pose
                    for L in reversed(range(0, num_depth1)):
            #             if (curDepth1Used[l] <= 0) { // not used, just to accelerate the process
            #                 continue;
            #             }
                        for i in range(0, len(cur_avail_obj)):
                            if (cur_avail_obj[i]['instance'][0]['depth0'] == k):
                                for m in range(0, cur_avail_obj[i]['numInstance']):
                                    cur_obj = cur_avail_obj[i]['instance'][m]
                                    if (cur_obj['present'] == True and
                                        cur_obj['z'] == j and
                                        cur_obj['depth1'] == L):
                                        
                                        if (cur_obj['type'] == 'human'):
                                            if (cur_obj['deformable'] == True):
                                                self.overlay_deformable_person(bg_img, img_pad_num,
                                                                               cur_obj, cur_z_scale)
                                            else:
                                                self.overlay_nondeformable_person(bg_img, img_pad_num,
                                                                                  cur_obj, cur_z_scale)
                                        else:
                                            self.overlay_nondeformable_obj(bg_img, img_pad_num,
                                                                           cur_obj, cur_z_scale)

            bg_img.save(img_file, self.clipart_img_format, compress_level=0, optimize=1)
            
    def read_scene_config_file(self, scene_config_filename):
        
        scene_config_file = os.path.join(self.config_folder, scene_config_filename)
        
        # Only need to load if not the same as previous
        if (scene_config_file != self.prev_scene_config_file):

            self.prev_scene_config_file = scene_config_file
            
            with open(scene_config_file) as json_fileid:
                self.scene_config_data = json.load(json_fileid)

                obj_filenames = self.scene_config_data['clipartObjJSONFile']
                object_data = {}
                for obj_file in obj_filenames:
                    obj_file_vers = obj_file['file']
                    for obj_dtype, obj_type_file in obj_file_vers.items():
                        with open(os.path.join(self.config_folder, obj_type_file)) as f:
                            obj = json.load(f)
                            if obj['objectType'] not in object_data:
                                object_data[obj['objectType']] = {}
                            object_data[obj['objectType']][obj_dtype] = obj
                self.object_data = object_data
            
    def get_object_attr_types(self, obj_type, deform_type):
        
        cur_attr_types = []

        for cur_attr_name in self.object_data[obj_type][deform_type]['attributeTypeList']:
            cur_attr_type = {}

            if (cur_attr_name == 'Type'):
                cur_attr_type = {'num': 'numType', 'id': 'typeID'}
            elif (cur_attr_name == 'Pose'):
                cur_attr_type = {'num': 'numPose', 'id': 'poseID'}
            elif (cur_attr_name == 'Expression'):
                cur_attr_type = {'num': 'numExpression', 'id': 'expressionID'}
            
            cur_attr_types.append(cur_attr_type)
        
        return cur_attr_types

    def obj_img_filename(self, img_pad_num, obj, attr1=None, attr2=None, attr3=None):
        
        object_data = self.object_data
        # TODO Don't hardcode this?
        clipart_img_format = 'png'
        
        cur_obj_type = obj['type']
        cur_obj_name = obj['name']
        if (obj['deformable'] == True):
            cur_obj_deform = 'deformable'
        else:
            cur_obj_deform = 'nondeformable'
            
        cur_attr_types = self.get_object_attr_types(cur_obj_type, cur_obj_deform)
        
        if (attr1 == None):
            attr1 = obj[cur_attr_types[0]['id']]
            
        if (cur_obj_type == 'largeObject' or cur_obj_type == 'smallObject'):
            sceneFolder = self.scene_config_data['baseDirectory'][obj['baseDir']]

            name = '{0}{1}.{2}'.format(cur_obj_name,
                                    str(attr1+1).zfill(img_pad_num), 
                                    clipart_img_format)
            filename = os.path.join(self.base_url_interface, sceneFolder, name)
        elif (cur_obj_type == 'animal'):
            animalFolder = object_data['animal'][cur_obj_deform]['baseDirectory']

            name = '{0}{1}.{2}'.format(cur_obj_name,
                                    str(attr1+1).zfill(img_pad_num), 
                                    clipart_img_format)
            filename = os.path.join(self.base_url_interface, animalFolder, name)       
        elif (cur_obj_type == 'human'):

            if (attr2 == None):
                attr2 = obj[cur_attr_types[1]['id']]

            if (attr3 == None):
                attr3 = obj['styleID']

            humanFolder = object_data['human'][cur_obj_deform]['baseDirectory']
            styleFolder = '{0}{1}'.format(cur_obj_name, 
                                        str(attr3+1).zfill(img_pad_num))
            
            name = '{0}{1}.{2}'.format(str(attr2+1).zfill(img_pad_num), 
                                    str(attr1+1).zfill(img_pad_num), 
                                    clipart_img_format)
            filename = os.path.join(self.base_url_interface, humanFolder, styleFolder, name)
        else:
            filename = None

        return filename

    ## Needed for the interface but not here (loads just the heads w/ expr)
    ## TODO Update to support this class
    def obj_expr_filename(self, img_pad_num, obj):
        filename = None
        clipart_img_format = 'png'
        
        cur_obj_type = obj['type']
        cur_obj_name = obj['name']
        if (obj['deformable'] == True):
            obj_deform = 'deformable'
        else:
            obj_deform = 'nondeformable'
        
        if (cur_obj_type == 'human'):
            humanFolder = self.object_data['human'][obj_deform]['baseDirectory']
            name = '{0}{1}.{2}'.format(cur_obj_name, 
                                       str(obj['expressionID']+1).zfill(img_pad_num),
                                        clipart_img_format)
            filename = os.path.join(self.base_url_interface, humanFolder, 
                                    'Expressions', name)
        
        return filename
    
    def paperdoll_part_img_filename_expr(self, obj, part_name):

        filename = None
        cur_obj_type = obj['type']
        cur_obj_name = obj['name']
        
        if (obj['deformable'] == True):
            obj_deform = 'deformable'
        else:
            obj_deform = 'nondeformable'
        
        clipart_img_format = 'png'
        
        if (cur_obj_type == 'human'):
            humanFolder = self.object_data['human'][obj_deform]['baseDirectory']
            name = '{0}.{1}'.format(part_name, clipart_img_format)
            filename = os.path.join(self.base_url_interface, humanFolder, cur_obj_name, name)
        
        return filename

    def get_render_transform(self, X1, X, rad, flip, scale):

        if (flip == 0):
            S  = matrix([[scale, 0, 0], 
                        [0, scale, 0], 
                        [0, 0, 1]])
            T1 = matrix([[1, 0, X1[0]],
                        [0, 1, X1[1]],
                        [0, 0, 1]])
            T2 = matrix([[1, 0, X[0]], 
                        [0, 1, X[1]], 
                        [0, 0, 1]])
            R  = matrix([[math.cos(rad), -math.sin(rad), 0], 
                        [math.sin(rad), math.cos(rad), 0], 
                        [0, 0, 1]])
            T = S*T2*R*T1
        else: # (flip == 1)
            rad *= -1
            S  = matrix([[scale, 0, 0], 
                        [0, scale, 0], 
                        [0, 0, 1]])
            T1 = matrix([[1, 0, X1[0]],
                        [0, 1, X1[1]],
                        [0, 0, 1]])
            T2 = matrix([[1, 0, -X[0]], 
                        [0, 1, X[1]], 
                        [0, 0, 1]])
            R  = matrix([[math.cos(rad), -math.sin(rad), 0], 
                        [math.sin(rad), math.cos(rad), 0], 
                        [0, 0, 1]])
            F = matrix([[-1, 0, 0], 
                        [0, 1, 0], 
                        [0, 0, 1]])
            T = F*S*T2*R*T1
        
        Tinv = linalg.inv(T);
        Tinvtuple = (Tinv[0,0], Tinv[0,1], Tinv[0,2], 
                    Tinv[1,0], Tinv[1,1], Tinv[1,2])

        return Tinvtuple

    def overlay_deformable_person(self, bg_img, img_pad_num, cur_obj, z_scale):
        
        num_parts = len(cur_obj['body'])
        scale = cur_obj['globalScale'] * z_scale[cur_obj['z']]
        
        bg_size= bg_img.size
        flip = cur_obj['flip']
        
        for partIdx in range(0, num_parts):
            part = cur_obj['body'][partIdx]
            part_name = part['part']
            
            X1 = [-part['childX'], 
                  -part['childY']]
            X = [cur_obj['deformableX'][partIdx], 
                 cur_obj['deformableY'][partIdx]]
            rotation = cur_obj['deformableGlobalRot'][partIdx]
            
            Tinvtuple = self.get_render_transform(X1, X, 
                                                  rotation, flip, scale)
            if (part_name == 'Head'):
                part_fn = self.obj_expr_filename(img_pad_num, cur_obj)
            else:
                part_fn = self.paperdoll_part_img_filename_expr(cur_obj, part_name)
            
            # TODO Update so don't keep opening files for efficiency
            part_img = Image.open(part_fn)
            part_tf = part_img.transform(bg_size, Image.AFFINE,
                                         Tinvtuple, resample=Image.BICUBIC)
            
            bg_img.paste(part_tf, (0, 0), part_tf)
        
    def overlay_nondeformable_person(self, bg_img, img_pad_num, cur_obj, z_scale):
        # In our case, we're just computing the filename and loading it, so 
        # a nondeformable person is the same as nondeformable objects.
        self.overlay_nondeformable_obj(bg_img, img_pad_num, cur_obj, z_scale)
        
    def overlay_nondeformable_obj(self, bg_img, img_pad_num, cur_obj, z_scale):
        
        scale = z_scale[cur_obj['z']]

        # TODO We should just load all possible
        # clipart images once and then index into them 
        # with filename for efficiency
        cur_filename = self.obj_img_filename(img_pad_num, cur_obj)
        cur_clipart_img = Image.open(cur_filename)
        
        (w, h) = cur_clipart_img.size
        X = [cur_obj['x'], cur_obj['y']]

        colOffset = -w / 2.0
        rowOffset = -h / 2.0
        colOffset *= scale
        rowOffset *= scale
        
        X[0] += colOffset
        X[1] += rowOffset
        
        offset = (int(X[0]), int(X[1]))
        resized = cur_clipart_img.resize((int(w*scale), int(h*scale)), Image.ANTIALIAS)

        if (cur_obj['flip'] == 0):
            bg_img.paste(resized, offset, resized)
        else: 
            flipped = resized.transpose(Image.FLIP_LEFT_RIGHT)
            bg_img.paste(flipped, offset, flipped)

def main():
    '''
    Usage:
        render_scenes_json.py render <jsondata> <outdir> [--overwrite --site_pngs_dir=ID --config_dir=CD --format=FMT]
                
    Options:
        <jsondata>         Either a filepath to JSON file (from other code and extracted from results file) or directory filled with per-scene JSON files.
        <outdir>            Directory to put the processed result files, i.e., JSON
        --format=FMT        Image file format [default: png]
        --site_pngs_dir=ID  Path to the site_pngs dir (contains all object images) [default: USE_DEF]
        --config_dir=CD     Path to the config data files (contains all object data) [default: USE_DEF]
        --overwrite         Overwrite files even if they exist
    '''
    
    #USE_DEF for --site_pngs_dir is /srv/share/abstract_scenes_v002/site_pngs/
    #USE_DEF for --config_dir is /srv/share/abstract_scenes_v002/site_data/
    
    # 1. set up command line interface
    import docopt, textwrap
    main_args = docopt.docopt(textwrap.dedent(main.__doc__))
    
    print('')
    print(main_args)
    print('')
    
    if (main_args['render']):
        rend = RenderScenes(main_args)
        rend.run()

if __name__ == '__main__':
    main()
