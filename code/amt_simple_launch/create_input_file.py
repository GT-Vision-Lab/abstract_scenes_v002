 #!/usr/bin/python
 # -*- coding: utf-8 -*-
 
import pdb

def create_input_file(input_file, num_per_type, types):
    with open(input_file, 'w') as f:
        f.write('sceneType01\n')
        for scene_type in types:
            for x in range(num_per_type):
                f.write('{0}\n'.format(scene_type))

def main():
    '''
    Usage:
        create_input_file.py create <inputfile> <numpertype>
                
    Options:
        <inputfile>         Filepath for the input file
        <numpertype>        Number of each scene type to make
    '''
    
    # 1. set up command line interface
    import docopt, textwrap
    main_args = docopt.docopt(textwrap.dedent(main.__doc__))
    
    print('')
    print(main_args)
    print('')
    
    if (main_args['create']):
        types = ['Park-XinleiSubset', 'Living-XinleiSubset']
        create_input_file(main_args['<inputfile>'], 
                          int(main_args['<numpertype>']), 
                          types)

if __name__ == '__main__':
    main()