import http.server
import socketserver
import os

PORT = 5174
WEB_DIR = os.path.join(os.path.dirname(__file__), 'dist')
os.chdir(WEB_DIR)

Handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(("", PORT), Handler)

print(f"Serving at http://localhost:{PORT}")
httpd.serve_forever()
