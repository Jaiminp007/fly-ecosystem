"""Local read-only observer. Controls are explicit process arguments."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import signal
import threading
from arena import Arena
p=argparse.ArgumentParser()
p.add_argument('--port',type=int,default=8766)
p.add_argument('--founders',type=int,default=2)
p.add_argument('--capacity',type=int,default=4)
p.add_argument('--steps',type=int,default=100)
p.add_argument('--restore',type=Path)
a=p.parse_args()
if a.steps<0:p.error('steps must be nonnegative')
world=Arena.restore(a.restore) if a.restore else Arena(a.founders,a.capacity)
lock=threading.Lock();state=world.state();stop=threading.Event()
def run():
    global state
    world.paused=False
    try:
        for _ in range(a.steps):
            if stop.is_set():break
            world.step()
            with lock:state=json.loads(json.dumps(world.state(),allow_nan=False))
            if world.paused:break
        world.paused=True
        with lock:state=json.loads(json.dumps(world.state(),allow_nan=False))
        saved=world.save(Path(__file__).resolve().parents[1]/'runs/malecns')
        print('Checkpoint: '+str(saved),flush=True)
    except Exception as e:
        world.error=f'{type(e).__name__}: {e}';world.paused=True
        with lock:state=world.state()
        print(world.error,flush=True)
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ['/api/state','/healthz']:
            with lock:payload=json.dumps(state,allow_nan=False).encode();error=bool(state['error'])
            self.send_response(503 if error else 200);self.send_header('Content-Type','application/json')
        elif self.path=='/':
            payload=Path(__file__).with_name('index.html').read_bytes()
            self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8')
        else:self.send_error(404);return
        self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(payload)))
        self.end_headers();self.wfile.write(payload)
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',a.port),Handler)
worker=threading.Thread(target=run)
worker.start()
print(f'MaleCNS observer: http://127.0.0.1:{a.port}/',flush=True)
def request_stop(*_):
    raise KeyboardInterrupt
signal.signal(signal.SIGTERM,request_stop)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    stop.set()
    worker.join()
    server.server_close()
