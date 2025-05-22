import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Message } from '../chat/entities/message.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async seed() {
    const userCount = await this.usersRepository.count();

    if (userCount > 0) {
      console.log('La base de données contient déjà des données. Seed ignoré.');
      return;
    }

    console.log('Début du seeding de la base de données...');

    const users = await this.seedUsers();

    await this.seedGlobalMessages(users);

    await this.seedDirectMessages(users);

    console.log('Seeding terminé avec succès!');
  }

  private async seedUsers(): Promise<User[]> {
    console.log('Création des utilisateurs...');

    const users: User[] = [];

    const usersData = [
      {
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
        messageColor: '#1e88e5',
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        password: 'password123',
        messageColor: '#43a047',
      },
      {
        username: 'charlie',
        email: 'charlie@example.com',
        password: 'password123',
        messageColor: '#e53935',
      },
      {
        username: 'david',
        email: 'david@example.com',
        password: 'password123',
        messageColor: '#8e24aa',
      },
      {
        username: 'eva',
        email: 'eva@example.com',
        password: 'password123',
        messageColor: '#fb8c00',
      },
    ];

    for (const userData of usersData) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = this.usersRepository.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        messageColor: userData.messageColor,
        isOnline: false,
      });

      const savedUser = await this.usersRepository.save(user);
      users.push(savedUser);
    }

    console.log(`${users.length} utilisateurs créés.`);
    return users;
  }

  private async seedGlobalMessages(users: User[]) {
    console.log('Création des messages globaux...');

    const messages = [
      { text: 'Bonjour tout le monde !', userId: 0 },
      { text: 'Bienvenue sur notre application de chat !', userId: 1 },
      { text: "Comment allez-vous aujourd'hui ?", userId: 2 },
      { text: 'Je travaille sur un nouveau projet passionnant.', userId: 3 },
      {
        text: "Quelqu'un a-t-il des conseils pour apprendre NestJS ?",
        userId: 4,
      },
      { text: "Je peux t'aider avec ça !", userId: 0 },
      { text: 'NestJS est vraiment un excellent framework.', userId: 1 },
      { text: "J'adore TypeScript !", userId: 2 },
      {
        text: 'Qui est partant pour une session de pair programming?',
        userId: 3,
      },
      { text: 'Moi !', userId: 4 },
    ];

    let date = new Date();
    date.setHours(date.getHours() - messages.length);

    for (const messageData of messages) {
      const message = this.messagesRepository.create({
        text: messageData.text,
        user: users[messageData.userId],
        type: 'global',
        createdAt: new Date(date),
      });

      await this.messagesRepository.save(message);

      date = new Date(date.getTime() + 10 * 60000); // +10 minutes
    }

    console.log(`${messages.length} messages globaux créés.`);
  }

  private async seedDirectMessages(users: User[]) {
    console.log('Création des conversations directes...');

    const conversations = [
      {
        senderId: 0,
        recipientId: 1,
        messages: [
          'Salut Bob, comment vas-tu ?',
          'Bonjour Alice ! Je vais bien et toi ?',
          'Très bien merci ! Tu travailles sur quoi en ce moment ?',
          'Je développe une application avec NestJS et Socket.io !',
        ],
      },
      {
        senderId: 0,
        recipientId: 2,
        messages: [
          'Salut Charlie !',
          'Hey Alice, quoi de neuf ?',
          'Pas grand chose, je voulais juste te dire bonjour.',
        ],
      },
      {
        senderId: 1,
        recipientId: 3,
        messages: [
          "David, j'aurais besoin de ton aide sur un bug.",
          'Bien sûr Bob, dis-moi tout !',
          "C'est un problème avec TypeORM...",
          'Envoie-moi ton code, je vais jeter un œil.',
        ],
      },
      {
        senderId: 2,
        recipientId: 4,
        messages: [
          'Eva, as-tu terminé la présentation ?',
          'Presque Charlie, il me reste quelques slides.',
          'Super ! On pourra la réviser ensemble ensuite ?',
          'Parfait !',
        ],
      },
    ];

    for (const conversation of conversations) {
      let date = new Date();
      date.setHours(date.getHours() - conversation.messages.length);

      let isFromSender = true;

      for (const text of conversation.messages) {
        const messageData: any = {
          text,
          user: users[
            isFromSender ? conversation.senderId : conversation.recipientId
          ],
          recipient:
            users[
              isFromSender ? conversation.recipientId : conversation.senderId
            ],
          type: 'direct',
          createdAt: new Date(date),
          isRead: true,
        };

        if (!isFromSender) {
          messageData.readAt = new Date(date.getTime() + 5 * 60000);
        }

        const message = this.messagesRepository.create(messageData);
        await this.messagesRepository.save(message);

        isFromSender = !isFromSender;
        date = new Date(date.getTime() + 5 * 60000);
      }
    }

    console.log(`${conversations.length} conversations créées.`);
  }
}
