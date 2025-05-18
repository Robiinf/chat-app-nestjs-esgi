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

  @SubscribeMessage('directMessage')
  async handleDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { text: string; recipientId: string },
  ) {
    const sender = client.data.user;

    if (!sender) return;

    // Vérifier si le destinataire existe
    const recipient = await this.usersService.findById(payload.recipientId);
    if (!recipient) {
      client.emit('error', { message: 'Destinataire non trouvé' });
      return;
    }

    // Sauvegarder le message dans la base de données
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

    // Émettre le message uniquement à l'expéditeur et au destinataire
    const recipientSocket = this.findSocketByUserId(payload.recipientId);
    if (recipientSocket) {
      recipientSocket.emit('directMessage', messageData);
    }

    // Également envoyer au client expéditeur
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

  // Ajouter cette méthode utilitaire pour trouver un socket par ID utilisateur
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

    // Rechercher les utilisateurs correspondant au username partiel
    const users = await this.usersService.findByPartialUsername(
      payload.username,
    );

    // Ne pas inclure l'utilisateur actuel dans les résultats
    const filteredUsers = users.filter(
      (user) => user.id !== client.data.user.id,
    );

    // Transformer les données pour n'envoyer que ce qui est nécessaire
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
    console.log(`Démarrage d'une conversation avec ${payload.recipientId}`);

    if (!client.data.user) {
      console.log('Utilisateur non authentifié');
      return;
    }

    // Vérifier si l'utilisateur existe
    const recipient = await this.usersService.findById(payload.recipientId);
    if (!recipient) {
      console.log('Destinataire non trouvé');
      client.emit('error', { message: 'Utilisateur non trouvé' });
      return;
    }

    // Émettre l'événement newConversation avec les bonnes données
    client.emit('newConversation', {
      user: {
        id: recipient.id,
        username: recipient.username,
        isOnline: recipient.isOnline || false,
      },
      latestMessage: null,
    });

    // Informer l'utilisateur que la conversation est prête
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

    // Optionnellement mettre à jour les messages comme lus dans la base de données
    await this.chatService.markMessagesAsRead(payload.messageIds);

    // Notifier l'expéditeur original que ses messages ont été lus
    const senderSocket = this.findSocketByUserId(payload.senderId);
    if (senderSocket) {
      senderSocket.emit('messagesRead', {
        messageIds: payload.messageIds,
        readerId: client.data.user.id,
      });
    }
  }
}
