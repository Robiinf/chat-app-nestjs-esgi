import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message } from './entities/message.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async getUserFromToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      return user;
    } catch (error) {
      return null;
    }
  }

  async saveMessage(messageData: {
    text: string;
    userId: string;
    type: string;
    recipientId?: string;
  }): Promise<Message> {
    const message = this.messageRepository.create({
      text: messageData.text,
      user: { id: messageData.userId },
      type: messageData.type,
      recipient: messageData.recipientId
        ? { id: messageData.recipientId }
        : null,
    });

    return this.messageRepository.save(message);
  }

  async getGlobalMessages(): Promise<any[]> {
    const messages = await this.messageRepository.find({
      where: { type: 'global' },
      order: { createdAt: 'ASC' },
      relations: ['user'],
      take: 100, // Limiter à 100 messages pour éviter de surcharger
    });

    return messages.map((message) => ({
      id: message.id,
      text: message.text,
      createdAt: message.createdAt,
      user: {
        id: message.user.id,
        username: message.user.username,
        messageColor: message.user.messageColor || '#1e88e5',
      },
    }));
  }

  async getDirectMessages(userId: string, otherUserId: string): Promise<any[]> {
    const messages = await this.messageRepository.find({
      where: [
        {
          type: 'direct',
          user: { id: userId },
          recipient: { id: otherUserId },
        },
        {
          type: 'direct',
          user: { id: otherUserId },
          recipient: { id: userId },
        },
      ],
      order: { createdAt: 'ASC' },
      relations: ['user', 'recipient'],
    });

    return messages.map((message) => ({
      id: message.id,
      text: message.text,
      createdAt: message.createdAt,
      isRead: message.isRead || false,
      readAt: message.readAt,
      user: {
        id: message.user.id,
        username: message.user.username,
        messageColor: message.user.messageColor || '#1e88e5',
      },
      recipientId:
        message.type === 'direct'
          ? message.user.id === userId
            ? message.recipient?.id
            : message.user.id
          : null,
    }));
  }

  async getUserConversations(userId: string): Promise<any[]> {
    // Trouver tous les messages directs impliquant cet utilisateur
    const sentMessages = await this.messageRepository.find({
      where: { type: 'direct', user: { id: userId } },
      relations: ['recipient'],
    });

    const receivedMessages = await this.messageRepository.find({
      where: { type: 'direct', recipient: { id: userId } },
      relations: ['user'],
    });

    // Extraire les IDs uniques des utilisateurs avec qui l'utilisateur a conversé
    const userIds = new Set<string>();

    sentMessages.forEach((msg) => {
      if (msg.recipient) {
        userIds.add(msg.recipient.id);
      }
    });
    receivedMessages.forEach((msg) => userIds.add(msg.user.id));

    // Récupérer les infos de ces utilisateurs
    const conversations = await Promise.all(
      Array.from(userIds).map(async (contactId) => {
        const contact = await this.usersService.findById(contactId);
        // Ajouter une vérification
        if (!contact) {
          return null; // Ou un objet par défaut si vous préférez
        }

        const latestMessage = await this.getLatestDirectMessage(
          userId,
          contactId,
        );

        return {
          user: {
            id: contact.id,
            username: contact.username,
            isOnline: contact.isOnline || false,
          },
          latestMessage: latestMessage
            ? {
                text: latestMessage.text,
                createdAt: latestMessage.createdAt,
                isFromUser: latestMessage.user.id === userId,
              }
            : null,
        };
      }),
    );

    // Et filtrer les conversations nulles
    return conversations.filter(Boolean) as any[];
  }

  async getLatestDirectMessage(
    userId1: string,
    userId2: string,
  ): Promise<Message | null> {
    const message = await this.messageRepository.findOne({
      where: [
        {
          type: 'direct',
          user: { id: userId1 },
          recipient: { id: userId2 },
        },
        {
          type: 'direct',
          user: { id: userId2 },
          recipient: { id: userId1 },
        },
      ],
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    return message;
  }

  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    await this.messageRepository.update(
      { id: In(messageIds) },
      { isRead: true, readAt: new Date() },
    );
  }
}
