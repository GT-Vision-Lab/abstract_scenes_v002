# abstract_scenes_v002
The second version of the interface for the [Abstract Scenes research project](http://research.microsoft.com/en-us/um/people/larryz/clipart/abstract_scenes.html).

### Interface Images
To use the web interface (or render scenes in general), you will need to download the images.
You can find the majority of the images [here](https://vision.ece.vt.edu/abstract_scenes_v002/site_pngs/site_pngs_without_HumanNondeformable.zip).
If you need the nondeformable human images (1.5GB), you can find them [here](https://vision.ece.vt.edu/abstract_scenes_v002/site_pngs/site_pngs_just_HumanNondeformable.zip).

### Running the Interface Locally
If you are running the interface local (e.g., not on a web server), you can use Python to run a local web server.
If you have Python installed properly installed, in a command prompt, you can run 'python -m SimpleHTTPServer 8000' in the abstract_scenes_v002/ folder.
If you haven't configured it well (e.g., it's slightly more complicated on Windows), you can run the code/start_python_web_server.py script.
You'll need to update the directory accordingly.

### Python Information
Note: This currently is known to work with Python 2.7. 
As of 2015/03/2013, it just uses [docopt](http://docopt.org/) (installable via pip) and [Pillow](http://pillow.readthedocs.org/en/latest/index.html) (installable via pip).
To run a basic launch AMT task->download results->process and render results pipeline, there is the example script code/amt_simple_launch/manage_hits.sh.