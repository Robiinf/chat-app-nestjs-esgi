import { Command, CommandRunner } from 'nest-commander';
import { SeederService } from './seeder.service';

@Command({ name: 'seed', description: 'Seed the database with initial data' })
export class SeedCommand extends CommandRunner {
  constructor(private readonly seederService: SeederService) {
    super();
  }

  async run(): Promise<void> {
    try {
      await this.seederService.seed();
      process.exit(0);
    } catch (error) {
      console.error('Error during database seeding:', error);
      process.exit(1);
    }
  }
}
