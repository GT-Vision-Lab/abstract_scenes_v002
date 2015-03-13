import os
import SimpleHTTPServer

# First change to a directory that 
# has the files you're interested in
# accessing via the HTTP server
# Note: On Windows, you'll want to use
# r before the string 
# (or use \\ instead of \ everywhere).
# This is because it tries treating it
# as a part of aregular expression without it.
os.chdir(r"C:\code\abstract_scenes_v002")

print(os.getcwd())

SimpleHTTPServer.test()