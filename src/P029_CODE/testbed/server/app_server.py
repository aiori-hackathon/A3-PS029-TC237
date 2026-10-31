#!/usr/bin/env python3
"""
Application Traffic & Media Server (PS-029)
Team DevElite - AIORI Hackathon 3
Serves DASH media manifests, segmented media chunks, and iperf3 traffic.
"""

import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(os.getenv("PORT", 8080))
MEDIA_DIR = "/app/media"

os.makedirs(MEDIA_DIR, exist_ok=True)
manifest_path = os.path.join(MEDIA_DIR, "stream.mpd")
if not os.path.exists(manifest_path):
    with open(manifest_path, "w", encoding="utf-8") as f:
        f.write("""<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" minBufferTime="PT1.5S" type="static" mediaPresentationDuration="PT30S">
  <Period>
    <AdaptationSet mimeType="video/mp4" codecs="avc1.4d401f">
      <Representation id="1080p" bandwidth="5000000" width="1920" height="1080"/>
      <Representation id="720p" bandwidth="2500000" width="1280" height="720"/>
      <Representation id="480p" bandwidth="1000000" width="854" height="480"/>
    </AdaptationSet>
  </Period>
</MPD>""")

# Create 50MB synthetic payload file for bulk transfer tests
bulk_path = os.path.join(MEDIA_DIR, "bulk_dataset.bin")
if not os.path.exists(bulk_path):
    with open(bulk_path, "wb") as f:
        f.write(os.urandom(1024 * 1024 * 10))  # 10MB test payload

class AppMediaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=MEDIA_DIR, **kwargs)

if __name__ == "__main__":
    print(f"Starting Application Traffic & DASH Media Server on port {PORT}...")
    server = HTTPServer(("0.0.0.0", PORT), AppMediaHandler)
    server.serve_forever()
