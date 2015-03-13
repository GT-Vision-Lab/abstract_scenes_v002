 #!/usr/bin/python
 # -*- coding: utf-8 -*-

from PIL import Image
from os import path
import os
import glob
from os.path import basename
from os.path import splitext
from os.path import join as dir_join

# Quick script to horizontally flip images
# I manually looked through them all (except people)
# and appended _orig to the original files and then ran
# this script.
# I also vertically flip pencil by hand

imgDir = '../../site_pngs/Living/'
imgDir = '../../site_pngs/Park/'
imgDir = '../../site_pngs/Animals/'

os.chdir(imgDir);

files_to_flip = glob.glob('*_orig.png')
for filename in files_to_flip:
    new_filename = filename[:-9] + '.png'
    img = Image.open(filename).transpose(Image.FLIP_LEFT_RIGHT)
    img.save(new_filename, 'png', compress_level=0, optimize=1)
    