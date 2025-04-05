import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

// WebSocket connection URL
const WS_URL = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const BASE_URL = '127.0.0.1:8002';  // Using specific port 8002 for WebSocket
const API_BASE_URL = 'http://127.0.0.1:8000/api/stocks';

const ChatRoom = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const webSocketRef = useRef(null);
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_BASE_URL}/chat/messages/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setMessages(response.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user]);

  // Connect to WebSocket
  useEffect(() => {
    if (!user) return;
    
    const connectWebSocket = () => {
      const ws = new WebSocket(`${WS_URL}${BASE_URL}/ws/chat/`);
      webSocketRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        
        // Send join message
        ws.send(JSON.stringify({
          type: 'join',
          username: user.username,
          userId: user.id
        }));
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        
        // Try to reconnect after 3 seconds
        setTimeout(() => {
          if (webSocketRef.current === ws) {
            connectWebSocket();
          }
        }, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        
        if (data.type === 'chat_message') {
          setMessages(prev => [...prev, {
            username: data.username,
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString()
          }]);
        } else if (data.type === 'user_joined') {
          console.log(`${data.username} joined the chat`);
        } else if (data.type === 'online_users_update') {
          setOnlineUsers(data.users || []);
        }
      };
      
      return ws;
    };
    
    const ws = connectWebSocket();
    
    // Clean up on component unmount
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !webSocketRef.current) return;
    
    // Send message to server via WebSocket
    webSocketRef.current.send(JSON.stringify({
      type: 'message',
      message: newMessage.trim(),
      username: user.username
    }));
    
    // Save message to database via API
    const saveMessageToDatabase = async () => {
      try {
        const token = localStorage.getItem('access_token');
        await axios.post(`${API_BASE_URL}/chat/messages/create/`, {
          message: newMessage.trim()
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Error saving message:', error);
      }
    };
    
    saveMessageToDatabase();
    setNewMessage('');
  };

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="chat-room-container">
      <div className="chat-room-header">
        <h2>Traders' Chat Room</h2>
        <div className="online-users-indicator">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      <div className="chat-interface">
        <div className="chat-messages">
          {loading ? (
            <div className="loading-messages">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message ${msg.username === user?.username ? 'my-message' : 'other-message'}`}
              >
                <div className="message-header">
                  <span className="message-username">{msg.username}</span>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="online-users-panel">
          <h3>Online Traders ({onlineUsers.length})</h3>
          <ul>
            {onlineUsers.map((user, index) => (
              <li key={index} className="online-user">
                <span className="online-dot"></span>
                {user.username || user}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="chat-input-area">
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            disabled={!user || !connected}
          />
          <button type="submit" disabled={!newMessage.trim() || !user || !connected}>
            Send
          </button>
        </form>
      </div>
      
      <div className="chat-guidelines">
        <h4>Chat Guidelines</h4>
        <ul>
          <li>Be respectful to other traders</li>
          <li>Don't share personal financial information</li>
          <li>Avoid giving specific financial advice</li>
          <li>Keep discussions market and trading related</li>
        </ul>
      </div>
    </div>
  );
};

export default ChatRoom; 