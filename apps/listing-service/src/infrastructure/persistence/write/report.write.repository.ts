import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportRecord } from '../report-record';
import { ReportOrmEntity } from '../typeorm/report.orm.entity';

@Injectable()
export class ReportWriteRepository {
  constructor(
    @InjectRepository(ReportOrmEntity)
    private readonly repo: Repository<ReportOrmEntity>,
  ) {}

  async create(record: ReportRecord): Promise<void> {
    const entity = this.repo.create({
      ...record,
      processedAt: record.processedAt ? new Date(record.processedAt) : null,
    });
    await this.repo.save(entity);
  }

  async update(id: string, patch: Partial<ReportRecord>): Promise<void> {
    const existing = await this.repo.findOneBy({ id } as any);
    if (!existing) {
      return;
    }

    const updated: Partial<ReportOrmEntity> = {
      ...existing,
      ...patch,
      processedAt: patch.processedAt
        ? new Date(patch.processedAt)
        : existing.processedAt,
    };
    await this.repo.save(updated as ReportOrmEntity);
  }
}
