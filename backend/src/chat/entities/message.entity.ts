import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string;

  @Column({ default: 'global' })
  type: string; // 'global', 'private'

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  recipient: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
