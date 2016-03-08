#!/usr/bin/env python3

import os
import subprocess
from os.path import join, dirname, abspath
from server import Server

os.environ['BABEL_ENV']   = 'casperTest'
os.environ['SERVER_PORT'] = '9000'

BASEDIR = dirname(abspath(__file__))

def main():
    # Build the library
    subprocess.call(['npm', 'run', 'build'])
    # Copy the library to the http server path
    subprocess.call([
        'cp',
        join(BASEDIR, '..', 'dist/ether.global.js'),
        join(BASEDIR, 'public')
    ])
    # Build the sample user app under test
    # Building the app only works if dir is set properly
    os.chdir(BASEDIR)
    subprocess.call(['node', join(BASEDIR, 'rollup.js')])

    # Start the http server
    httpd = Server()
    httpd.start()

    # Run CasperJS tests
    subprocess.call([
        join(BASEDIR, '..', 'node_modules/casperjs/bin/casperjs'),
        'test', '--log-level=debug', '--verbose',
        join(BASEDIR, 'test')
    ])

    # Stop the http server
    httpd.stop()

if __name__ == '__main__':
    main()
