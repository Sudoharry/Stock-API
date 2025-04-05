import React, { useState, useEffect, useRef } from 'react';
import '../styles.css';

const ChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Determine WebSocket URL based on current protocol
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const WS_URL = `${protocol}//${window.location.hostname}:8000/ws/chat/`;
  const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

  // Handle connection and messages
  useEffect(() => {
    if (!isOpen) return;

    // Fetch previous messages first
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/chat-messages/`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data || []);
        } else {
          console.error('Failed to fetch messages:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Connect WebSocket
    const websocket = new WebSocket(WS_URL);
    setWs(websocket);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Join the room as soon as connected
      if (user) {
        websocket.send(JSON.stringify({
          type: 'join_room',
          userId: user.id.toString(),
          username: user.username
        }));
      }
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);
      
      if (data.type === 'new_message') {
        setMessages(prev => [...prev, {
          id: Date.now(), // Temporary ID if not provided
          user_id: data.userId,
          username: data.username,
          message: data.message,
          timestamp: data.timestamp || new Date().toISOString()
        }]);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      websocket.close();
    };
  }, [isOpen, user, WS_URL, API_BASE_URL]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !isConnected || !ws) return;

    const messageData = {
      type: 'send_message',
      userId: user?.id?.toString() || 'anonymous',
      username: user?.username || 'Anonymous',
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    // Send via WebSocket
    ws.send(JSON.stringify(messageData));
    
    // Clear input field
    setMessage('');

    // Also save to database
    saveMessageToDatabase(message.trim());
  };

  const saveMessageToDatabase = async (messageText) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat-messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          message: messageText,
          user_id: user?.id?.toString() || 'anonymous'
        })
      });

      if (!response.ok) {
        console.error('Failed to save message:', response.statusText);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return '';
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="chat-widget-container">
      {isOpen && (
        <div className={`chat-widget-panel ${isOpen ? 'active' : ''}`}>
          <div className="chat-widget-header">
            <h3>Support Chat</h3>
            <button className="chat-widget-close" onClick={toggleChat}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="chat-widget-messages">
            {loading ? (
              <div className="loading-messages">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="no-messages">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={msg.id || index}
                  className={`widget-message ${msg.user_id === user?.id?.toString() ? 'widget-my-message' : 'widget-other-message'}`}
                >
                  <div className="widget-message-content">
                    {msg.user_id !== user?.id?.toString() && (
                      <div className="widget-message-username">{msg.username}</div>
                    )}
                    {msg.message}
                    <div className="widget-message-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-widget-input">
            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder={isConnected ? "Type a message..." : "Connecting..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!isConnected}
              />
              <button type="submit" disabled={!isConnected || !message.trim()}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      )}
      <button 
        className={`chat-widget-button ${isOpen ? 'active' : ''}`} 
        onClick={toggleChat}
        aria-label="Chat support"
      >
        <i className={isOpen ? "fas fa-times" : "fas fa-comment"}></i>
      </button>
    </div>
  );
};

export default ChatWidget; 