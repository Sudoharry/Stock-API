# Real-Time Trading Chat

This feature adds a real-time chat system to the stock trading application, allowing users to discuss market trends, share tips, and connect with other traders.

## Features

- Real-time messaging using WebSockets
- Persistent chat history stored in the database
- User presence tracking (online users)
- Authentication integration with the existing JWT system
- Mobile-responsive interface

## Technical Implementation

- **Backend**: Django Channels for WebSocket support
- **Database**: Chat messages stored in SQLite
- **Frontend**: HTML/CSS/JavaScript with Bootstrap for styling
- **Protocol**: WebSocket for real-time communication

## Setup

1. Ensure required packages are installed:
   ```
   pip install channels daphne
   ```

2. Run database migrations:
   ```
   python manage.py migrate
   ```

3. Start both servers using the helper script:
   ```
   python run_servers.py
   ```
   - Django server will run on port 8000 (HTTP)
   - Daphne server will run on port 8001 (WebSockets)

## Usage

1. Navigate to `/stocks/chat/` in your browser to access the chat interface.
2. Enter a username when prompted (or it will use your stored username).
3. Send messages using the input field at the bottom of the chat window.
4. View online users in the sidebar.

## API Endpoints

- `GET /api/stocks/chat/messages/` - Retrieve recent chat messages
- `POST /api/stocks/chat/messages/create/` - Create a new chat message

## WebSocket Connection

Connect to the WebSocket at: `ws://your-server-address/ws/chat/`

WebSocket message format:
```json
{
  "type": "message",
  "message": "Hello traders!",
  "username": "trader123"
}
```

## Security Considerations

- Messages are not encrypted in transit (consider using wss:// in production)
- Basic input sanitization is performed
- Messages are associated with user IDs for accountability

## Future Enhancements

- Private messaging between users
- Chat rooms for different market sectors
- Message reactions and threaded replies
- Rich text formatting and emoji support
- File/image sharing capabilities 