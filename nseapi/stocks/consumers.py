import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage
import datetime

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time chat functionality."""
    
    # Class-level variable to track online users across all instances
    online_users = {}
    
    async def connect(self):
        """
        Connect to the WebSocket and join the chat room.
        """
        self.room_name = "trading_chat"
        self.room_group_name = f"chat_{self.room_name}"
        self.user_id = None
        self.username = None
        
        # Log connection attempt
        logger.info(f"WebSocket connection attempt from {self.scope['client']}")
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        logger.info(f"WebSocket connected: {self.channel_name}")
        await self.accept()
        
        # Send a welcome message immediately
        try:
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to chat server',
                'timestamp': str(datetime.datetime.now())
            }))
            logger.info(f"Sent welcome message to {self.channel_name}")
        except Exception as e:
            logger.error(f"Error sending welcome message: {str(e)}", exc_info=True)
        
        # Send current online users immediately upon connection
        await self.update_online_users()
    
    async def disconnect(self, close_code):
        """
        Leave the chat room.
        """
        logger.info(f"WebSocket disconnected: {self.channel_name}, user: {self.username}, code: {close_code}")
        
        # Remove user from online users if authenticated
        if hasattr(self, 'user_id') and self.user_id:
            await self.remove_online_user(self.user_id)
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Update online users for all clients
        await self.update_online_users()
    
    async def receive(self, text_data):
        """
        Receive message from WebSocket and broadcast to room.
        """
        try:
            # Log the raw data first for debugging
            logger.info(f"Raw WebSocket data received: {text_data}")
            
            data = json.loads(text_data)
            message_type = data.get('type', '')
            
            logger.info(f"WebSocket received message type: {message_type}, data: {data}")
            
            if message_type == 'ping':
                # Respond to ping with pong
                logger.debug("Ping received, sending pong")
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': str(datetime.datetime.now())
                }))
                return
            
            elif message_type == 'request_online_users':
                # Direct request for online users
                logger.info("Received request for online users")
                online_users = await self.get_online_users()
                await self.send(text_data=json.dumps({
                    'type': 'online_users',
                    'users': online_users
                }))
                logger.info(f"Sent online users directly in response to request: {len(online_users)} users")
                return
            
            elif message_type == 'join_room':
                # User joined the room
                self.user_id = str(data.get('userId', 'anonymous'))
                self.username = data.get('username', 'Anonymous')
                
                logger.info(f"User joined chat: {self.username} ({self.user_id})")
                
                # Store user connection
                added = await self.add_online_user(self.user_id, self.username)
                logger.info(f"User {self.username} added to online users: {added}")
                
                # Send a test message back to confirm connection
                await self.send(text_data=json.dumps({
                    'type': 'connection_established',
                    'message': f'Welcome {self.username}! You are now connected to the chat.'
                }))
                
                # Send direct notification to other users (bypass channel layer)
                # Update online users list for all clients
                await self.update_online_users()
                
            elif message_type == 'send_message':
                # User sent a message
                message_data = {
                    'userId': data.get('userId', self.user_id or 'anonymous'),
                    'username': data.get('username', self.username or 'Anonymous'),
                    'message': data.get('message', ''),
                    'timestamp': data.get('timestamp', str(datetime.datetime.now()))
                }
                
                logger.info(f"Message received from {message_data['username']}: {message_data['message'][:30]}...")
                
                # Echo back to sender first
                await self.send(text_data=json.dumps({
                    'type': 'new_message',
                    **message_data
                }))
                logger.info(f"Echoed message back to sender: {message_data['message'][:30]}...")
                
                # Save message to database
                saved = await self.save_message(message_data)
                logger.info(f"Message saved to database: {saved}")
                
                # Also send immediate feedback
                await self.send(text_data=json.dumps({
                    'type': 'message_received',
                    'message': 'Your message has been received and saved'
                }))
                
                # Try to broadcast to room via channel layer
                try:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            **message_data
                        }
                    )
                    logger.info("Message broadcast to group")
                except Exception as e:
                    logger.error(f"Error broadcasting message: {str(e)}", exc_info=True)
                    
            else:
                logger.warning(f"Unknown message type received: {message_type}")
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received: {text_data[:100]}...")
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
    
    async def chat_message(self, event):
        """
        Send message to WebSocket.
        """
        # Send message to WebSocket
        try:
            message = {
                'type': 'new_message',
                'userId': event.get('userId', 'anonymous'),
                'username': event.get('username', 'Anonymous'),
                'message': event.get('message', ''),
                'timestamp': event.get('timestamp')
            }
            await self.send(text_data=json.dumps(message))
            logger.info(f"Message sent to client: {message}")
        except Exception as e:
            logger.error(f"Error sending message to client: {str(e)}", exc_info=True)
    
    async def user_joined(self, event):
        """
        Send notification when a user joins.
        """
        # Send notification to WebSocket
        try:
            message = {
                'type': 'user_joined',
                'userId': event.get('userId', ''),
                'username': event.get('username', '')
            }
            await self.send(text_data=json.dumps(message))
            logger.info(f"User joined notification sent: {message}")
        except Exception as e:
            logger.error(f"Error sending user joined notification: {str(e)}", exc_info=True)
    
    async def update_online_users(self):
        """
        Update the list of online users for all clients.
        """
        # Get list of online users
        online_users = await self.get_online_users()
        
        logger.info(f"Updating online users: {online_users}")
        
        try:
            # Send directly to this client
            await self.send(text_data=json.dumps({
                'type': 'online_users',
                'users': online_users
            }))
            logger.info(f"Sent online users directly to client: {len(online_users)} users")
            
            # Try to broadcast via channel layer
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'online_users_update',
                    'users': online_users
                }
            )
        except Exception as e:
            logger.error(f"Error updating online users: {str(e)}", exc_info=True)
    
    async def online_users_update(self, event):
        """
        Send updated list of online users to WebSocket.
        """
        # Send message to WebSocket
        try:
            message = {
                'type': 'online_users',
                'users': event.get('users', [])
            }
            await self.send(text_data=json.dumps(message))
            logger.info(f"Online users list sent: {len(event.get('users', []))} users: {event.get('users', [])}")
        except Exception as e:
            logger.error(f"Error sending online users update: {str(e)}", exc_info=True)
    
    @database_sync_to_async
    def save_message(self, message_data):
        """
        Save a chat message to the database.
        """
        try:
            ChatMessage.objects.create(
                user_id=message_data['userId'],
                username=message_data['username'],
                message=message_data['message']
            )
            logger.info(f"Message saved to database from {message_data['username']}")
            return True
        except Exception as e:
            logger.error(f"Error saving message to database: {str(e)}", exc_info=True)
            return False
    
    @database_sync_to_async
    def add_online_user(self, user_id, username):
        """
        Add a user to the online users list.
        """
        try:
            # Adding to class-level dictionary
            ChatConsumer.online_users[user_id] = {
                'userId': user_id,
                'username': username
            }
            logger.info(f"Added user to online users: {username} ({user_id})")
            logger.info(f"Current online users: {list(ChatConsumer.online_users.values())}")
            return True
        except Exception as e:
            logger.error(f"Error adding online user: {str(e)}", exc_info=True)
            return False
    
    @database_sync_to_async
    def remove_online_user(self, user_id):
        """
        Remove a user from the online users list.
        """
        try:
            if user_id in ChatConsumer.online_users:
                username = ChatConsumer.online_users[user_id].get('username', 'Unknown')
                del ChatConsumer.online_users[user_id]
                logger.info(f"Removed user from online users: {username} ({user_id})")
                logger.info(f"Remaining online users: {list(ChatConsumer.online_users.values())}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error removing online user: {str(e)}", exc_info=True)
            return False
    
    @database_sync_to_async
    def get_online_users(self):
        """
        Get the list of online users.
        """
        try:
            users = list(ChatConsumer.online_users.values())
            logger.info(f"Retrieved online users: {users}")
            return users
        except Exception as e:
            logger.error(f"Error getting online users: {str(e)}", exc_info=True)
            return [] 