import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarMakeOrmEntity } from './typeorm/car-make.orm.entity';

const DEFAULT_MAKES = [
  'Toyota',
  'Honda',
  'Mazda',
  'Hyundai',
  'Kia',
  'Ford',
  'VinFast',
  'Mercedes',
  'BMW',
];

@Injectable()
export class CarMakeSeedService implements OnModuleInit {
  private readonly logger = new Logger(CarMakeSeedService.name);

  constructor(
    @InjectRepository(CarMakeOrmEntity)
    private readonly repo: Repository<CarMakeOrmEntity>,
  ) {}

  private slugify(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }

  async onModuleInit(): Promise<void> {
    const count = await this.repo.count();
    if (count > 0) {
      return;
    }

    const rows = DEFAULT_MAKES.map((name, idx) =>
      this.repo.create({
        name,
        slug: this.slugify(name),
        isActive: true,
        showOnHome: true,
        sortOrder: (idx + 1) * 10,
      }),
    );
    await this.repo.save(rows);
    this.logger.log(`Seeded ${rows.length} default car makes.`);
  }
}
