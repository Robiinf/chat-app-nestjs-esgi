import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Message } from './message.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: true })
  isPublic: boolean;

  @ManyToMany(() => User)
  @JoinTable()
  users: User[];

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;
}
