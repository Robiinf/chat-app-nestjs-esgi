import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    roomId?: string;
    recipientId?: string;
  }): Promise<Message> {
    const message = this.messageRepository.create({
      text: messageData.text,
      user: { id: messageData.userId },
      type: messageData.type,
      room: messageData.roomId ? { id: messageData.roomId } : null,
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
}
