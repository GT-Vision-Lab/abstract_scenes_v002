 #!/usr/bin/python
 # -*- coding: utf-8 -*-

from PIL import Image
from os import path
import os
import glob

code_folder = os.path.dirname(os.path.realpath(__file__))

img_dirs = ['../../site_pngs/HumanDeformable/']

for img_dir in img_dirs:
    os.chdir(img_dir);
    
    img_files  = glob.glob('*/*.png')
    img_files .sort()
    p_files = []
    for filename in img_files :
        #new_filename = filename + '.bak'
        img = Image.open(filename)
        if (img.mode == 'P'):
            p_files.append(filename)
            #img.save(new_filename, 'PNG')
            img.convert("RGBA").save(filename, 'PNG')
    for p_file in p_files:
        print(p_file)
    os.chdir(code_folder)