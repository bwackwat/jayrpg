#!/usr/bin/python3

from http.server import HTTPServer, SimpleHTTPRequestHandler, test
import sys

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, directory='client')
        
    def end_headers (self):
        self.send_header('Cross-Origin-Resource-Policy', "'cross-origin' always")
        self.send_header('Cross-Origin-Opener-Policy', "same-origin")
        self.send_header('Cross-Origin-Embedder-Policy', "require-corp")
        # self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

if __name__ == '__main__':
    test(CORSRequestHandler, HTTPServer, port=8000)
