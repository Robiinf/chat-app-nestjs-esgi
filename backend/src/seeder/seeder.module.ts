import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { User } from '../users/user.entity';
import { Message } from '../chat/entities/message.entity';
import { SeedCommand } from './seeder.command';

@Module({
  imports: [TypeOrmModule.forFeature([User, Message])],
  providers: [SeederService, SeedCommand],
  exports: [SeederService],
})
export class SeederModule {}
