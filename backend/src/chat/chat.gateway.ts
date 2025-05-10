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
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*', // En production, limitez à votre domaine frontend
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

      // Mettre à jour le statut de l'utilisateur à "en ligne"
      await this.usersService.updateOnlineStatus(user.id, true);

      // Informer tous les clients qu'un utilisateur est connecté
      this.server.emit('userStatus', { userId: user.id, status: 'online' });

      // Envoyer la liste des utilisateurs en ligne au client qui vient de se connecter
      const onlineUsers = await this.usersService.getOnlineUsers();
      client.emit('onlineUsers', onlineUsers);

      console.log(`Client connected: ${user.username}`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data.user) {
      const userId = client.data.user.id;

      // Mettre à jour le statut de l'utilisateur à "hors ligne"
      await this.usersService.updateOnlineStatus(userId, false);

      // Informer tous les clients qu'un utilisateur est déconnecté
      this.server.emit('userStatus', { userId, status: 'offline' });

      console.log(`Client disconnected: ${client.data.user.username}`);
    }
  }

  @SubscribeMessage('globalMessage')
  async handleGlobalMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { text: string },
  ) {
    const user = client.data.user;

    if (!user) return;

    // Sauvegarder le message dans la base de données
    const message = await this.chatService.saveMessage({
      text: payload.text,
      userId: user.id,
      type: 'global',
    });

    // Émettre le message à tous les clients connectés
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
}
