# coding: utf-8
import sys
import csv
import json
import os
import copy
from itertools import izip
from os.path import basename
from os.path import splitext
from os.path import join as dir_join

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
                        filter_name, filter_list):
    
    input_file = basename(filename)
    input_file_base, input_file_ext = splitext(input_file)
    
    output_name = '{0}.{1}'.format(input_file_base, 'json')
    output_dir = dir_path(output_dir)
    output_file = dir_join(output_dir, output_name)
    
    results = read_results(filename)
    orig_len = len(results)
    filter_results(results, filter_name, filter_list)
    filt_len = len(results)
    if (orig_len != filt_len):
        print('Reduced data from {0} to {1} HITs'.format(orig_len, filt_len))

    scene_data = extract_scene_data(results)
    save_json(scene_data, output_file)
    
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
            save_json(scene_data_single, indv_output_file)
        counter += 1
    
    no_scene_data_name = '{0}_{1}{2}'.format(filename_base, 'noSceneData', filename_ext)
    no_scene_data_fn = dir_join(output_dir, no_scene_data_name)
    for scene_datum in scene_data:
        scene_datum['sceneType'] = scene_datum['scene']['sceneType']
        del scene_datum['scene']
        
    save_json(scene_data, no_scene_data_fn)

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

def filter_results(results, filter_name=None, filter_list=None):
    '''
    Remove all elements of results that have their
    filter_name property value in filter_list
    '''
    
    if (filter_name != None and filter_list != None):
        results = [result for result in results if (result[filter_name] not in filter_list)]

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
        
        parsed_datum['assignmentId'] = hit_datum['assignmentid']
        result = json_list = json.loads(hit_datum[ans_res])
        cur_idx = 0
        for scene in result:
            parsed_datum['hitIdx'] = cur_idx
            parsed_datum['imgName'] = '{0}_{1:02d}.png'.format(parsed_datum['assignmentId'], cur_idx)
            parsed_datum['scene'] = scene
            if 'sceneType' not in parsed_datum['scene']:
                parsed_datum['scene']['sceneType'] = "Living"
            hit_result.append(copy.copy(parsed_datum))
            cur_idx += 1
        
    return hit_result

def save_json(data, filename):
    '''
    Save the object as both a readable json file (i.e., with indentation
    and a min version (i.e., without indenation)
    '''
    
    filename_base, filename_ext = splitext(filename)
    filename_min = '{0}.{1}{2}'.format(filename_base, 'min', filename_ext)

    with open(filename, 'w') as of, open(filename_min, 'w') as of_min:
        json.dump(data, of_min)
        json.dump(data, of, indent=4, separators=(',', ': '))

def main():
    '''
    Usage:
        process_amt_scene_results.py extract <resfile> <outdir> [--fmt=RESFMT --filter=RESFLT --overwrite]
                
    Options:
        <resfile>           Filepath to AMT results file
        <outdir>            Directory to put the processed result files, i.e., JSON
        --resfmt=RESFMT     AMT results file format: tab, i.e., from CLT, or csv, i.e., from web interface  [default: tab]
        --filter=RESFLT     Filter out: A=Approved, R=Rejected, S=Submitted, N=None or combination  [default: N]
        --overwrite         Overwrite files even if they exist
    '''
    
    # 1. set up command line interface
    import docopt, textwrap
    main_args = docopt.docopt(textwrap.dedent(main.__doc__))  

    print('')
    print(main_args)
    print('')
    
    filter_mapping = { "A": "Approved", "R": "Rejected", "S": "Submitted", "N": "" }
    
    if (main_args['extract']):
        input_file = main_args['<resfile>']
        output_dir = main_args['<outdir>']
        filter_str = main_args['--filter']
        overwrite = main_args['--overwrite']
        
        # TODO Handle filtering better
        filter_list = [];
        if "N" not in filter_str:
            for filt_char in filter_str:
                filter_list.append(filter_mapping[filt_char])
        else:
            filter_list = None

        process_amt_results(input_file, output_dir, overwrite, 'assignmentstatus', filter_list)

if __name__ == '__main__':
    main()