# coding: utf-8
import sys
import csv
import json
import os
import copy
import subprocess
from itertools import izip
from os.path import basename
from os.path import splitext
from os.path import join as dir_join
import glob
import shutil

import pdb # python debugger

# Deal with CSV field being too long
csv.field_size_limit(sys.maxsize)

def dir_path(dname):
    '''
    If the directory doesn't exist then make it.
    '''
    try:
        os.makedirs(dname)
    except os.error:
        pass
    return dname

def process_amt_results(filename, output_dir, overwrite, 
                        gen_apprv_cmnt):
    
    input_file = basename(filename)
    input_file_base, input_file_ext = splitext(input_file)
    
    output_name = '{0}.{1}'.format(input_file_base, 'json')
    output_dir = dir_path(output_dir)
    output_file = dir_join(output_dir, output_name)
    
    results = read_results(filename)

    scene_data = extract_scene_data(results)
    save_json(scene_data, output_file, saveNonMin=False)
    
    assignment_ids = set([scene['assignmentId'] for scene in scene_data])
    
    create_approval_file(assignment_ids, filename, gen_apprv_cmnt)
    create_reject_note_files(filename)
    
    counter = 0
    filename_base, filename_ext = splitext(output_name)
    indv_output_dir = dir_path(dir_join(output_dir, filename_base+'_indv'))
    for scene_data_single in scene_data:
        #pdb.set_trace()
        new_fn = '{0}_{1:02d}{2}'.format(scene_data_single['assignmentId'], 
                                         scene_data_single['hitIdx'], 
                                         filename_ext)
        indv_output_file = dir_join(indv_output_dir, new_fn)
        # Skip if already exists and no overwrite flag
        if (not os.path.isfile(indv_output_file) or overwrite==True):
            save_json(scene_data_single, indv_output_file, saveNonMin=False)
        counter += 1
    
    no_scene_data_name = '{0}_{1}{2}'.format(filename_base, 'noSceneData', filename_ext)
    no_scene_data_fn = dir_join(output_dir, no_scene_data_name)
    for scene_datum in scene_data:
        scene_datum['counts'] = extract_scene_stats(scene_datum['scene'])
        scene_datum['sceneType'] = scene_datum['scene']['sceneType']
        del scene_datum['scene']

    save_json(scene_data, no_scene_data_fn, saveNonMin=True)
    
    no_scene_data_name = '{0}_{1}{2}'.format(filename_base, 'noSceneNoCountsData', filename_ext)
    no_scene_data_fn = dir_join(output_dir, no_scene_data_name)
    for scene_datum in scene_data:
        del scene_datum['counts']
        
    save_json(scene_data, no_scene_data_fn, saveNonMin=True)

def extract_scene_stats(scene):
    avail_objs = scene['availableObject']
    counts = {}
    for avail_obj in avail_objs:
        cur_type = avail_obj['instance'][0]['type']
        cur_name = avail_obj['instance'][0]['name']
        cur_count = 0
        if cur_type not in counts:
            counts[cur_type] = {'count': 0,
                                'names': []};
        
        for inst in avail_obj['instance']:
            if inst['present']:
                cur_count += 1
            
        counts[cur_type]['count'] += cur_count
        counts[cur_type]['names'].append({'name': cur_name, 'count': cur_count})
    return counts

def read_results(filename):
    '''Read the results file'''
    
    # TODO Add flag to go between web-interface file and command-line file
    # They have different format
    with open(filename) as f:        
        # CLT results files are tab-delimited with values wrapped in double-quotes
        # TODO Add support for the CSV version of files (as suggested available in docopt)
        csv_f = csv.reader(f, delimiter='\t', quotechar='"')

        results = []
        headers = csv_f.next()

        for row in csv_f:
            if ( len(row) == len(headers) ):
                result = {}
                for header, col in izip(headers, row):
                    result[header] = col
                # All rows might not have user data yet
                if ( len(result["workerid"]) > 0 ):
                    results.append(result)

    return results

def extract_scene_data(hit_data):
    '''
    Extract out the most important data that we might
    want to use from the results file. 
    '''

    if (len(hit_data) == 0):
        return

    ans_prefix = 'Answer.'
    ans_res = ans_prefix+'hitResult'
    start_idx = len(ans_prefix)
    ans_fields = [s for s in hit_data[0] if ans_prefix in s]
    
    hit_result = []
    for hit_datum in hit_data:
        
        parsed_datum = dict([(key[start_idx:], hit_datum[key]) 
                              for key in ans_fields if ans_res not in key])
        # If you can't assume key is in the result, but we can
        #dict([(key[start_idx:], hit_datum[i]) 
        #      for key in ans_fields if key in hit_datum])
        
        parsed_datum['hitTypeId'] = hit_datum['hittypeid']
        parsed_datum['hitId'] = hit_datum['hitid']
        parsed_datum['assignmentId'] = hit_datum['assignmentid']
        parsed_datum['assignmentStatus'] = hit_datum['assignmentstatus']
        #pdb.set_trace()
        
        result = json_list = json.loads(hit_datum[ans_res])
        cur_idx = 0
        for scene in result:
            parsed_datum['hitIdx'] = cur_idx
            parsed_datum['imgName'] = '{0}_{1:02d}.png'.format(parsed_datum['assignmentId'], cur_idx)
            parsed_datum['scene'] = scene
            if 'sceneType' not in parsed_datum['scene']:
                parsed_datum['scene']['sceneType'] = 'Living'
            if 'sceneConfigFile' not in parsed_datum['scene']:
                parsed_datum['scene']['sceneConfigFile'] = 'abstract_scenes_v002_data_scene_config.json'
            hit_result.append(copy.copy(parsed_datum))
            cur_idx += 1
        
    return hit_result

def save_json(data, filename, saveNonMin=False):
    '''
    Save the object as both a readable json file (i.e., with indentation
    and a min version (i.e., without indenation)
    '''
    
    filename_base, filename_ext = splitext(filename)
    filename_min = '{0}.{1}{2}'.format(filename_base, 'min', filename_ext)

    with open(filename, 'w') as of, open(filename_min, 'w') as of_min:
        json.dump(data, of_min)
        if saveNonMin:
            json.dump(data, of, indent=4, separators=(',', ': '))
        
def create_approval_file(assignment_ids, filename, gen_apprv_cmnt):
    
    filename_base, filename_ext = splitext(filename)
    appr_filename = filename_base + ".approve"
    
    is_new = not os.path.isfile(appr_filename)

    if (not is_new):
        appr_files = glob.glob(appr_filename + '.~*~')
        appr_files.sort()
        if (len(appr_files) == 0):
            appr_filename_back = '{0}.~{1:04d}~'.format(appr_filename, 
                                                        0)
        else:
            appr_filename_back = '{0}.~{1:04d}~'.format(appr_filename,
                                                        len(appr_files))
        print(appr_filename_back)
        shutil.copy(appr_filename, appr_filename_back)
    
    with open(appr_filename, 'wb') as of:
        of.write('"assignmentIdToApprove"\t"assignmentIdToApproveComment"\n');
        for assignment_id in assignment_ids:
            name = '"{0}"\t"{1}"\n'.format(assignment_id, 
                                           gen_apprv_cmnt)
            of.write(name)
            
def create_reject_note_files(filename):
    
    filename_base, filename_ext = splitext(filename)
    rej_filename = filename_base + ".reject"
    notes_filename = filename_base + ".notes"
    if not os.path.isfile(rej_filename):
        with open(rej_filename, 'wb') as rf, open(notes_filename, 'wb') as nf:
            rf.write('"assignmentIdToReject"\t"assignmentIdToRejectComment"\n');
            nf.write('Add any notes/comments you have while looking through the data here.')

def main():
    '''
    Usage:
        process_amt_scene_results.py extract <resfile> <outdir> [--fmt=RESFMT --overwrite --genApprCmnt=AC]
                
    Options:
        <resfile>           Filepath to AMT results file
        <outdir>            Directory to put the processed result files, i.e., JSON
        --resfmt=RESFMT     AMT results file format: tab, i.e., from CLT, or csv, i.e., from web interface  [default: tab]
        --overwrite         Overwrite files even if they exist
        --genApprCmnt=AC    The generic approval comment [default: Good job! Thanks for your work.]
    '''
    
    # 1. set up command line interface
    import docopt, textwrap
    main_args = docopt.docopt(textwrap.dedent(main.__doc__))  

    print('')
    print(main_args)
    print('')

    if (main_args['extract']):
        input_file = main_args['<resfile>']
        output_dir = main_args['<outdir>']
        overwrite = main_args['--overwrite']
        gen_apprv_cmnt = main_args['--genApprCmnt']
        
        process_amt_results(input_file, output_dir, overwrite, 
                            gen_apprv_cmnt)

if __name__ == '__main__':
    main()
