 #!/usr/bin/python
 # -*- coding: utf-8 -*-

import os
import glob
import shutil

code_folder = os.path.dirname(os.path.realpath(__file__))

img_dirs = ['../../site_pngs/HumanDeformable/']

for img_dir in img_dirs:
    os.chdir(img_dir);
    
    files_to_copy = glob.glob('Doll*/Head.png')
    files_to_copy.sort()
    print(files_to_copy)
    
    for a_file in files_to_copy:
        dollname = a_file.split('/')[0]
        new_file = 'Expressions/{0}01.png'.format(dollname)
        print(new_file)
        shutil.copyfile(a_file, new_file)
    
    
    os.chdir(code_folder)