"""Minimal HTTP service with health endpoints, used to exercise the Docker build workflow."""

import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Bind every interface: the container port is published to the host.
HOST = "0.0.0.0"
PORT = 8000
HEALTH_PATHS = frozenset({"/health/live", "/health/ready"})


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        status = HTTPStatus.OK if self.path in HEALTH_PATHS else HTTPStatus.NOT_FOUND
        body = json.dumps({"status": "ok" if status is HTTPStatus.OK else "not found"}).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    ThreadingHTTPServer((HOST, PORT), HealthHandler).serve_forever()
