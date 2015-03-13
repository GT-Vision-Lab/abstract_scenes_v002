 #!/usr/bin/python
 # -*- coding: utf-8 -*-

import os
import glob

code_folder = os.path.dirname(os.path.realpath(__file__))

img_dirs = ['../../site_pngs/HumanDeformable/Expressions/']

for img_dir in img_dirs:
    os.chdir(img_dir);
    
    files_to_rename = glob.glob('*.png')
    files_to_rename.sort(reverse=True)
    p_files = []
    for filename in files_to_rename:
        if 'Doll' in filename:
            print(filename)
            filename_base = filename[:-6]
            filename_end = filename[-6:].split('.')[0]
            filename_end_new = '{0:02d}'.format(int(filename_end)+1)
            filename_ext = filename[-6:].split('.')[1]
            filename_new = '{0}{1}.{2}'.format(
                                            filename_base,
                                            filename_end_new,
                                            filename_ext)
            print(filename_new)
            os.rename(filename, filename_new)
        #new_filename = filename + '.bak'
        #img = Image.open(filename)
        #if (img.mode == 'P'):
            #p_files.append(filename)
            ##img.save(new_filename, 'PNG')
            #img.convert("RGBA").save(filename, 'PNG')
    for p_file in p_files:
        print(p_file)
    os.chdir(code_folder)