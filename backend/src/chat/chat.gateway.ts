import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const user = await this.chatService.getUserFromToken(token);
      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;

      await this.usersService.updateOnlineStatus(user.id, true);

      this.server.emit('userStatus', { userId: user.id, status: 'online' });

      const onlineUsers = await this.usersService.getOnlineUsers();
      client.emit('onlineUsers', onlineUsers);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data.user) {
      const userId = client.data.user.id;

      await this.usersService.updateOnlineStatus(userId, false);

      this.server.emit('userStatus', { userId, status: 'offline' });
    }
  }

  @SubscribeMessage('globalMessage')
  async handleGlobalMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { text: string },
  ) {
    const user = client.data.user;

    if (!user) return;

    const message = await this.chatService.saveMessage({
      text: payload.text,
      userId: user.id,
      type: 'global',
    });

    this.server.emit('globalMessage', {
      id: message.id,
      text: message.text,
      createdAt: message.createdAt,
      user: {
        id: user.id,
        username: user.username,
        messageColor: user.messageColor || '#1e88e5',
      },
    });
  }

  @SubscribeMessage('getMessageHistory')
  async handleGetHistory(@ConnectedSocket() client: Socket) {
    const messages = await this.chatService.getGlobalMessages();
    client.emit('messageHistory', messages);
  }

  @SubscribeMessage('directMessage')
  async handleDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { text: string; recipientId: string },
  ) {
    const sender = client.data.user;

    if (!sender) return;

    const recipient = await this.usersService.findById(payload.recipientId);
    if (!recipient) {
      client.emit('error', { message: 'Destinataire non trouvé' });
      return;
    }

    const message = await this.chatService.saveMessage({
      text: payload.text,
      userId: sender.id,
      type: 'direct',
      recipientId: payload.recipientId,
    });

    const messageData = {
      id: message.id,
      text: message.text,
      createdAt: message.createdAt,
      user: {
        id: sender.id,
        username: sender.username,
        messageColor: sender.messageColor || '#1e88e5',
      },
      recipientId: payload.recipientId,
    };

    const recipientSocket = this.findSocketByUserId(payload.recipientId);
    if (recipientSocket) {
      recipientSocket.emit('directMessage', messageData);
    }

    client.emit('directMessage', messageData);
  }

  @SubscribeMessage('getDirectMessages')
  async handleGetDirectMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    if (!client.data.user) return;

    const messages = await this.chatService.getDirectMessages(
      client.data.user.id,
      payload.userId,
    );

    client.emit('directMessageHistory', {
      userId: payload.userId,
      messages,
    });
  }

  private findSocketByUserId(userId: string): Socket | undefined {
    const connectedSockets = this.server.sockets.sockets;
    const sockets = Array.from(connectedSockets.values());

    return sockets.find((socket) => socket.data?.user?.id === userId);
  }

  @SubscribeMessage('getConversations')
  async handleGetConversations(@ConnectedSocket() client: Socket) {
    if (!client.data.user) return;

    const conversations = await this.chatService.getUserConversations(
      client.data.user.id,
    );
    client.emit('conversations', conversations);
  }

  @SubscribeMessage('searchUsers')
  async handleSearchUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { username: string },
  ) {
    if (!client.data.user) return;

    const users = await this.usersService.findByPartialUsername(
      payload.username,
    );

    const filteredUsers = users.filter(
      (user) => user.id !== client.data.user.id,
    );

    const results = filteredUsers.map((user) => ({
      id: user.id,
      username: user.username,
      isOnline: user.isOnline || false,
    }));

    client.emit('searchResults', results);
  }

  @SubscribeMessage('startConversation')
  async handleStartConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { recipientId: string },
  ) {
    if (!client.data.user) {
      return;
    }

    const recipient = await this.usersService.findById(payload.recipientId);
    if (!recipient) {
      client.emit('error', { message: 'Utilisateur non trouvé' });
      return;
    }

    client.emit('newConversation', {
      user: {
        id: recipient.id,
        username: recipient.username,
        isOnline: recipient.isOnline || false,
      },
      latestMessage: null,
    });

    client.emit('conversationStarted', {
      userId: payload.recipientId,
      username: recipient.username,
      isOnline: recipient.isOnline || false,
    });
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { recipientId: string; isTyping: boolean },
  ) {
    if (!client.data.user) return;

    const sender = client.data.user;
    const recipientSocket = this.findSocketByUserId(payload.recipientId);

    if (recipientSocket) {
      recipientSocket.emit('userTyping', {
        userId: sender.id,
        username: sender.username,
        isTyping: payload.isTyping,
      });
    }
  }

  @SubscribeMessage('messageRead')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageIds: string[]; senderId: string },
  ) {
    if (!client.data.user) return;

    await this.chatService.markMessagesAsRead(payload.messageIds);

    const senderSocket = this.findSocketByUserId(payload.senderId);
    if (senderSocket) {
      senderSocket.emit('messagesRead', {
        messageIds: payload.messageIds,
        readerId: client.data.user.id,
      });
    }
  }
}
