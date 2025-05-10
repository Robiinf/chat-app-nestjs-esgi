import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(
    username: string,
    email: string,
    password: string,
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await this.usersRepository.update(userId, { isOnline });
  }

  async updateMessageColor(userId: string, color: string): Promise<void> {
    await this.usersRepository.update(userId, { messageColor: color });
  }

  async updateProfile(
    userId: string,
    profileData: { messageColor?: string },
  ): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (profileData.messageColor) {
      await this.updateMessageColor(userId, profileData.messageColor);
    }

    const updatedUser = await this.findById(userId);
    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }

    return updatedUser;
  }
}
