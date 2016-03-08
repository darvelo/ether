import os
import urllib
from threading import Thread
from http.server import HTTPServer, SimpleHTTPRequestHandler

BASEDIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))

# modify this to add additional routes
ROUTES = (
    # [url_prefix ,  directory_path]
    ['', os.path.join(BASEDIR, 'public')],
    # ['/media', '/var/www/media'],
    # ['',       '/var/www/site']  # empty string for the 'default' match
)


class RequestHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # look up routes and set root directory accordingly
        for pattern, rootdir in ROUTES:
            if path.startswith(pattern):
                # found match!
                path = path[len(pattern):]  # consume path up to pattern len
                root = rootdir
                break

        # normalize path and prepend root directory
        path = path.split('?', 1)[0]
        path = path.split('#', 1)[0]
        path = os.path.normpath(urllib.parse.unquote(path))
        words = path.split('/')
        words = filter(None, words)

        path = root
        for word in words:
            drive, word = os.path.splitdrive(word)
            head, word = os.path.split(word)
            if word in (os.curdir, os.pardir):
                continue
            path = os.path.join(path, word)

        return path

class Server(Thread):
    def __init__(self, *args, **kwargs):
        Thread.__init__(self, *args, **kwargs)
        server_address = ('', int(os.environ['SERVER_PORT']))
        self.httpd = HTTPServer(server_address, RequestHandler)

    def run(self):
        self.httpd.serve_forever()

    def stop(self):
        self.httpd.shutdown()
