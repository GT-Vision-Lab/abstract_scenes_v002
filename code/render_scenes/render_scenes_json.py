# coding: utf-8
import json
from PIL import Image, ImageFilter
from os import path
import os
from numpy import matrix
from numpy import linalg

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
        
    def run(self):
        if (self.opts['render']):
            self.render_scenes()

    def render_scenes(self):
        
        #"pilot_01.json"
        json_file = self.opts['<jsonfile>']
        #render_dir = '../imgs/'
        render_dir = dir_path(self.opts['<outdir>'])
        clipart_img_format = self.opts['--format']
        self.overwrite = self.opts['--overwrite']

        if (self.opts['--interface_dir'] == 'USE_DEF'):
            base_url_interface = os.path.join('..', '..', 'interface')
        else:
            base_url_interface = self.opts['--interface_dir']
            
        if (self.opts['--config_dir'] == 'USE_DEF'):
            config_folder = dir_path(os.path.join('..', '..', 'data'))
        else:
            config_folder = self.opts['--config_dir']

        if (self.opts['--config_file'] == 'USE_DEF'):
            scene_config_file = os.path.join(config_folder, 'abstract_scenes_v002_data_scene_config.json')
        else:
            scene_config_file = self.opts['--config_file']

        self.render_dir = render_dir
        self.clipart_img_format = clipart_img_format
        self.base_url_interface = base_url_interface

        with open(scene_config_file) as json_fileid:
            self.scene_config_data = json.load(json_fileid)

        obj_filenames = self.scene_config_data['clipartObjJSONFile']
        object_data = {}
        for obj_file in obj_filenames:
            with open(os.path.join(config_folder, obj_file['file'])) as f:
                obj = json.load(f)
                object_data[obj['objectType']] = obj
        
        self.object_data = object_data
        
        with open(json_file) as json_fileid:
            all_scenes = json.load(json_fileid)

        for cur_scene in all_scenes:
            self.render_one_scene(cur_scene)

    def obj_img_filename(self, img_pad_num, obj, poseID=None, exprID=None):
        
        object_data = self.object_data
        # TODO Don't hardcode this?
        clipart_img_format = 'png';
        
        if (obj['type'] == 'human'):
            humanFolder = object_data['human']['baseDirectory']
            styleFolder = '{0}{1}'.format(obj['name'], 
                                        str(obj['styleID']+1).zfill(img_pad_num))
            if (poseID == None and exprID == None):
                poseID = obj['poseID']
                exprID = obj['expressionID']
            name = '{0}{1}.{2}'.format(str(poseID+1).zfill(img_pad_num), 
                                    str(exprID+1).zfill(img_pad_num), 
                                    clipart_img_format)
            filename = os.path.join(self.base_url_interface, humanFolder, styleFolder, name)
        elif (obj['type'] == 'animal'):
            animalFolder = object_data['animal']['baseDirectory']
            if ( poseID == None):
                poseID = obj['poseID']
            name = '{0}{1}.{2}'.format(obj['name'],
                                    str(poseID+1).zfill(img_pad_num), 
                                    clipart_img_format)
            filename = os.path.join(self.base_url_interface, animalFolder, name)
        elif (obj['type'] == 'largeObject' or obj['type'] == 'smallObject'):
            sceneFolder = self.scene_config_data['baseDirectory'][obj['baseDir']]
            if ( poseID == None):
                poseID = obj['poseID']
            name = '{0}{1}.{2}'.format(obj['name'],
                                    str(poseID+1).zfill(img_pad_num), 
                                    clipart_img_format)
            filename = os.path.join(self.base_url_interface, sceneFolder, name)
        else:
            filename = None

        return filename

    ## Needed for the interface but not here (loads just the heads w/ expr)
    ## TODO Update to support this class
    #def obj_expr_filenames(self, obj):
        #filenames = []
        #if (obj['type'] == 'human'):
            #for i in range(0, obj['numExpression']):
                #humanFolder = object_data['human']['baseDirectory']
                #name = '{0}{1}.{2}'.format(obj['name'], 
                                    #str(i+1).zfill(img_pad_num),
                                    #clipart_img_format)
                #filename = os.path.join(base_url_interface, humanFolder, name)
                #filenames.append(filename)
        #else:
            #filenames = None
        
        #return filenames

    ## TODO Something that might need to be done for paperdoll/deformable support
    #def get_render_transform(self, X, flip, scale):

        #if ( flip == 0 ):
            #S  = matrix([[scale, 0, 0], 
                        #[0, scale, 0], 
                        #[0, 0, 1]])
            #T1 = matrix([[1, 0, X[0]],
                        #[0, 1, X[1]],
                        #[0, 0, 1]])
            #T = S*T1
        #else: # (flip == 1)
            #S  = matrix([[scale, 0, 0], 
                        #[0, scale, 0], 
                        #[0, 0, 1]])
            #T1 = matrix([[1, 0, -X[0]], 
                        #[0, 1, X[1]], 
                        #[0, 0, 1]])
            #F = matrix([[-1, 0, 0], 
                        #[0, 1, 0], 
                        #[0, 0, 1]])
            #T = F*S*T1
        
        #Tinv = linalg.inv(T)
        ##Tinv = T
        #Tinvtuple = (Tinv[0,0], Tinv[0,1], Tinv[0,2], 
                    #Tinv[1,0], Tinv[1,1], Tinv[1,2])

        #return Tinvtuple

    def render_one_scene(self, data):
        
        img_file = os.path.join(self.render_dir, data['imgName'])
        
        # Skip if already exists and no overwrite flag
        if (not os.path.isfile(img_file) or self.overwrite==True):
            cur_scene = data['scene']
            cur_scene_type = cur_scene['sceneType']
            cur_scene_config = self.scene_config_data[cur_scene_type]
                
            def_z_size =  cur_scene_config['defZSize']   
            img_pad_num = cur_scene_config['imgPadNum']
            not_used = cur_scene_config['notUsed']
            num_z_size = cur_scene_config['numZSize']
            num_depth0 = cur_scene_config['numDepth0']
            num_depth1 = cur_scene_config['numDepth1']
            numFlip = cur_scene_config['numFlip']
            
            num_obj_type_show = cur_scene_config['numObjTypeShow']
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
                                    if (cur_avail_obj[i]['instance'][m]['present'] == True and
                                        cur_avail_obj[i]['instance'][m]['z'] == j and
                                        cur_avail_obj[i]['instance'][m]['depth1'] == L):
                                        
                                        scale = cur_z_scale[cur_avail_obj[i]['instance'][m]['z']]
                                        
                                        #if (cur_avail_obj[i]['instance'][m]['type'] == 'human'):
                                            #indexP = cur_avail_obj[i]['instance'][m]['poseID']*cur_avail_obj[i]['instance'][m]['numExpression'] + cur_avail_obj[i]['instance'][m]['expressionID'];
                                        #else:
                                            #indexP = cur_avail_obj[i]['instance'][m]['poseID']

                                        # TODO We should just load all possible
                                        # clipart images once and then index into them 
                                        # with filename for efficiency
                                        cur_filename = self.obj_img_filename(img_pad_num, cur_avail_obj[i]['instance'][m])
                                        cur_clipart_img = Image.open(cur_filename)
                                        
                                        (w, h) = cur_clipart_img.size
                                        X = [cur_avail_obj[i]['instance'][m]['x'], cur_avail_obj[i]['instance'][m]['y']]

                                        colOffset = -w / 2
                                        rowOffset = -h / 2
                                        colOffset *= scale
                                        rowOffset *= scale
                                        
                                        X[0] += colOffset
                                        X[1] += rowOffset
                                        
                                        offset = (int(X[0]), int(X[1]))
                                        resized = cur_clipart_img.resize((int(w*scale), int(h*scale)))

                                        if (cur_avail_obj[i]['instance'][m]['flip']== 0):
                                            bg_img.paste(resized, offset, resized)
                                        else: 
                                            flipped = resized.transpose(Image.FLIP_LEFT_RIGHT)
                                            bg_img.paste(flipped, offset, flipped)

            bg_img.save(img_file, self.clipart_img_format, compress_level=0, optimize=1)

def main():
    '''
    Usage:
        render_scenes_json.py render <jsonfile> <outdir> [--overwrite --interface_dir=ID --config_dir=CD --config_file=CF --format=FMT]
                
    Options:
        <jsonfile>          Filepath to JSON file (from other code and extracted from results file)
        <outdir>            Directory to put the processed result files, i.e., JSON
        --format=FMT        Image file format [default: png]
        --interface_dir=ID  Path to the interface dir (contains all object images) [default: USE_DEF]
        --config_dir=CD     Path to the config data files (contains all object data) [default: USE_DEF]
        --config_file=CF    Name of the config data file (contains all object images) [default: USE_DEF]
        --overwrite         Overwrite files even if they exist
    '''
    
    #USE_DEF for --interface_dir is ../../interface/ (except done system-agnostically in Python
    #USE_DEF for --config_dir is ../../data/
    #USE_DEF for --config_file is abstract_scenes_v002_data_scene_config.json
    
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