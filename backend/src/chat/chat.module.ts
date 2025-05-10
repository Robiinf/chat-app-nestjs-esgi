import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Room } from './entities/room.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Room]), AuthModule, UsersModule],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
