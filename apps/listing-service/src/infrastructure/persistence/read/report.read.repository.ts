import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportRecord } from '../report-record';
import { ReportOrmEntity } from '../typeorm/report.orm.entity';

@Injectable()
export class ReportReadRepository {
  constructor(
    @InjectRepository(ReportOrmEntity)
    private readonly repo: Repository<ReportOrmEntity>,
  ) {}

  private toRecord(row: ReportOrmEntity): ReportRecord {
    return {
      id: row.id,
      listingId: row.listingId ?? undefined,
      targetType: row.targetType,
      targetId: row.targetId,
      reporterId: row.reporterId,
      reason: row.reason,
      description: row.description,
      status: row.status,
      evidenceImages: row.evidenceImages,
      evidenceMessages: row.evidenceMessages,
      evidenceVideos: row.evidenceVideos,
      processedBy: row.processedBy ?? undefined,
      processedAt: row.processedAt?.toISOString(),
      processedAction: row.processedAction ?? undefined,
      processedNote: row.processedNote ?? undefined,
      actionExecutionStatus: row.actionExecutionStatus ?? undefined,
      notificationPrimaryChannel: row.notificationPrimaryChannel ?? undefined,
      notificationFinalChannel: row.notificationFinalChannel ?? undefined,
      notificationFallbackUsed: row.notificationFallbackUsed ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async findByListingId(listingId: string): Promise<ReportRecord[]> {
    const rows = await this.repo.find({ where: { listingId } });
    return rows.map((r) => this.toRecord(r));
  }

  async findById(id: string): Promise<ReportRecord | null> {
    const row = await this.repo.findOneBy({ id } as any);
    return row ? this.toRecord(row) : null;
  }

  async findByStatus(status: string): Promise<ReportRecord[]> {
    const rows = await this.repo.find({ where: { status } });
    return rows.map((r) => this.toRecord(r));
  }

  async findAll(): Promise<ReportRecord[]> {
    const rows = await this.repo.find();
    return rows.map((r) => this.toRecord(r));
  }
}
