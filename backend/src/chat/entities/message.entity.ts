import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Room } from './room.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string;

  @Column({ default: 'global' })
  type: string; // 'global', 'room', 'private'

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Room, (room) => room.messages, { nullable: true })
  room: Room | null;

  @ManyToOne(() => User, { nullable: true })
  recipient: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
