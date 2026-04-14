import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ReportListingCommand } from './report-listing.command';
import { ReportWriteRepository } from '../../../infrastructure/persistence/write/report.write.repository';
import { ListingReadRepository } from '../../../infrastructure/persistence/read/listing.read.repository';
import { ListingReport } from '../../../domain/entities/report.entity';

@CommandHandler(ReportListingCommand)
export class ReportListingHandler implements ICommandHandler<ReportListingCommand> {
  constructor(
    private readonly reportWriteRepo: ReportWriteRepository,
    private readonly listingReadRepo: ListingReadRepository,
  ) {}

  async execute(command: ReportListingCommand): Promise<string> {
    // 1. Kiểm tra listing có tồn tại không
    const listing = await this.listingReadRepo.findById(command.listingId);
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${command.listingId} not found.`);
    }

    // 2. Tạo report entity
    const reportId = uuidv4();
    const report = new ListingReport(
      reportId,
      command.listingId,
      command.reporterId,
      command.reason,
      command.description,
      'pending',
      new Date()
    );

    // 3. Lưu vào DB
    await this.reportWriteRepo.create({
      id: report.id,
      listingId: report.listingId,
      reporterId: report.reporterId,
      reason: report.reason,
      description: report.description,
      targetType: 'listing',
      targetId: report.listingId,
      status: report.status,
      evidenceImages: [],
      evidenceMessages: [],
      evidenceVideos: [],
      createdAt: report.createdAt.toISOString()
    });

    return report.id;
  }
}
