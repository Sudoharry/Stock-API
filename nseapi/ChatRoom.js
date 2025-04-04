// WebSocket connection URL - use port 8000 for both HTTP and WS connections
const WS_URL = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const BASE_URL = '127.0.0.1:8000';  // Use the same port for WebSocket and HTTP
const WS_PATH = '/ws/';  // Use the simpler fallback path
const API_BASE_URL = 'http://127.0.0.1:8000/api';  // Fix the API base URL - remove /stocks 