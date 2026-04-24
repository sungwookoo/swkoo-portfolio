import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import { alertmanagerConfig } from '../../config/alertmanager.config';
import type { AlertmanagerAlert } from '../types/alertmanager.types';

@Injectable()
export class AlertmanagerClient {
  private readonly logger = new Logger(AlertmanagerClient.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(alertmanagerConfig.KEY)
    private readonly config: ConfigType<typeof alertmanagerConfig>
  ) {}

  isConfigured(): boolean {
    return Boolean(this.config.baseUrl);
  }

  async listAlerts(): Promise<AlertmanagerAlert[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const url = this.buildUrl('/api/v2/alerts');

    try {
      const response = await firstValueFrom(
        this.httpService.get<AlertmanagerAlert[]>(url, {
          headers: this.buildHeaders(),
          params: { active: 'true', silenced: 'false', inhibited: 'false' }
        })
      );

      const { data } = response;

      if (Array.isArray(data)) {
        return data;
      }

      this.logger.warn('Alertmanager returned unexpected payload shape');
      return [];
    } catch (error: unknown) {
      this.handleError(error, 'listing alerts');
    }
  }

  private buildUrl(path: string): string {
    const baseUrl = this.config.baseUrl;

    if (!baseUrl) {
      throw new InternalServerErrorException('Alertmanager base URL is not configured');
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return new URL(normalizedPath, baseUrl).toString();
  }

  private buildHeaders(): Record<string, string> {
    if (!this.config.authToken) {
      return { 'Content-Type': 'application/json' };
    }

    return {
      Authorization: this.config.authToken,
      'Content-Type': 'application/json'
    };
  }

  private handleError(error: unknown, context: string): never {
    if (isAxiosError(error)) {
      const status = error.response?.status ?? 502;
      const message = error.response?.data?.error || error.message;
      this.logger.error(`Alertmanager request failed while ${context}: ${message}`, error.stack);
      throw new BadGatewayException(`Alertmanager request failed (${status})`);
    }

    this.logger.error(`Unexpected error while ${context}`, (error as Error)?.stack);
    throw new BadGatewayException('Unexpected error while communicating with Alertmanager');
  }
}
