import { IsUUID } from 'class-validator';

export class ApproveListingDto {
  @IsUUID()
  moderatorId!: string;
}
