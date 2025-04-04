import os
import subprocess
import threading
import time
import sys

def run_daphne():
    """Run the Daphne ASGI server for WebSocket support"""
    print("Starting Daphne ASGI server on port 8001...")
    subprocess.run(["daphne", "-p", "8001", "nseapi.asgi:application"])

def run_django():
    """Run the Django development server"""
    print("Starting Django development server on port 8000...")
    subprocess.run(["python", "manage.py", "runserver", "0.0.0.0:8000"])

if __name__ == "__main__":
    # Start Daphne in a separate thread
    daphne_thread = threading.Thread(target=run_daphne)
    daphne_thread.daemon = True
    daphne_thread.start()
    
    # Give Daphne a moment to start
    time.sleep(2)
    
    # Run Django in the main thread
    try:
        run_django()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        sys.exit(0) 