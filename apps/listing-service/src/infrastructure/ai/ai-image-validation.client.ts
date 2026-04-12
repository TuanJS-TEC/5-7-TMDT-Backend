import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiImageValidationResult {
  valid: boolean;
  reason?: string;
}

/** Gọi ai-service (FastAPI) — UC17 kiểm tra ảnh */
@Injectable()
export class AiImageValidationClient {
  private readonly logger = new Logger(AiImageValidationClient.name);

  constructor(private readonly config: ConfigService) {}

  private baseUrl(): string {
    return (
      this.config.get<string>('AI_SERVICE_URL')?.replace(/\/$/, '') ??
      'http://127.0.0.1:8000'
    );
  }

  async validateImage(
    buffer: Buffer,
    mimeType: string,
  ): Promise<AiImageValidationResult> {
    const url = `${this.baseUrl()}/v1/images/validate`;
    const form = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    form.append('file', blob, 'upload.jpg');

    let res: Response;
    try {
      res = await fetch(url, { method: 'POST', body: form });
    } catch (err) {
      this.logger.warn(`AI service unreachable: ${String(err)}`);
      throw new ServiceUnavailableException({
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'Không kết nối được dịch vụ AI kiểm tra ảnh.',
      });
    }

    if (res.status === 503) {
      throw new ServiceUnavailableException({
        code: 'AI_SERVICE_BUSY',
        message: 'Dịch vụ AI tạm thời không sẵn sàng.',
      });
    }

    if (!res.ok) {
      this.logger.warn(`AI validate HTTP ${res.status}`);
      throw new ServiceUnavailableException({
        code: 'AI_SERVICE_ERROR',
        message: 'Lỗi khi gọi dịch vụ AI kiểm tra ảnh.',
      });
    }

    const json = (await res.json()) as {
      valid?: boolean;
      reason?: string;
    };
    return {
      valid: Boolean(json.valid),
      reason: json.reason,
    };
  }
}
