import { Controller, Get } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller()
export class OpenApiController {
  @Get('openapi.json')
  getOpenApiSpec(): unknown {
    const path = join(process.cwd(), 'docs', 'openapi', 'car-marketplace.openapi.json');
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as unknown;
    } catch {
      return {
        openapi: '3.0.3',
        info: { title: 'Car Marketplace API', version: '1.0.0' },
        paths: {},
        message: 'Run from monorepo root; spec file missing',
      };
    }
  }
}
