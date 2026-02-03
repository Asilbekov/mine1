
from http.server import BaseHTTPRequestHandler
import json
import logging
import sys

# Setup logging similar to automate_checks.py
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger = logging.getLogger(__name__)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Simulate fetching status
        response = {
            "status": "active",
            "version": "2.0.0",
            "active_workers": 8,
            "processed_today": 1234,
            "success_rate": 98.5,
            "message": "Python Backend is operating normally"
        }
        
        self.wfile.write(json.dumps(response).encode('utf-8'))
        return

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data)
            action = data.get('action')
            
            response_data = {"accepted": True}
            
            if action == 'update_config':
                logger.info(f"Received config update: {data.get('updates')}")
                # In a real scenario, this would update config.py or a database
                response_data["message"] = "Configuration updated successfully"
                
            elif action == 'start_automation':
                logger.info("Starting automation sequence...")
                # Connects to check_automation.py logic
                response_data["message"] = "Automation started"
                
            elif action == 'stop_automation':
                logger.info("Stopping automation...")
                response_data["message"] = "Automation stopped"
            
            else:
                response_data = {"accepted": False, "error": "Unknown action"}
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            
        return
