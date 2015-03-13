 #!/usr/bin/python
 # -*- coding: utf-8 -*-

from PIL import Image
from os import path
import os
import glob

# Quick script to horizontally flip images
# I manually looked through them all (except people)
# and appended _orig to the original files and then ran
# this script.
# I also vertically flip pencil by hand

code_folder = os.path.dirname(os.path.realpath(__file__))

img_dirs = ['../../site_pngs/Living/',
            '../../site_pngs/Park/',
            '../../site_pngs/Animals/']

for img_dir in img_dirs:
    os.chdir(img_dir);

    files_to_flip = glob.glob('*_orig.png')
    for filename in files_to_flip:
        new_filename = filename[:-9] + '.png'
        img = Image.open(filename).transpose(Image.FLIP_LEFT_RIGHT)
        img.save(new_filename, 'png', compress_level=0, optimize=1)

    os.chdir(code_folder)