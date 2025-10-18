import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { Inject } from '@nestjs/common/decorators';
import { ConfigType } from '@nestjs/config';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import { pipelinesConfig } from '../../config/pipelines.config';
import type {
  ArgoCdApplication,
  ArgoCdApplicationListResponse
} from '../types/argo-cd.types';

@Injectable()
export class ArgoCdClient {
  private readonly logger = new Logger(ArgoCdClient.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(pipelinesConfig.KEY)
    private readonly config: ConfigType<typeof pipelinesConfig>
  ) {}

  isConfigured(): boolean {
    return Boolean(this.config.baseUrl && this.config.authToken);
  }

  async listApplications(): Promise<ArgoCdApplication[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const url = this.buildUrl('/api/v1/applications');
    const params =
      this.config.projects.length > 0 ? { projects: this.config.projects.join(',') } : undefined;

    try {
      const response = await firstValueFrom(
        this.httpService.get<ArgoCdApplication[] | ArgoCdApplicationListResponse>(url, {
          headers: {
            Authorization: this.config.authToken as string,
            'Content-Type': 'application/json'
          },
          params
        })
      );

      const { data } = response;

      if (Array.isArray(data)) {
        return data;
      }

      if (data && Array.isArray(data.items)) {
        return data.items;
      }

      this.logger.warn('Argo CD returned unexpected payload shape', data as Record<string, unknown>);
      return [];
    } catch (error: unknown) {
      this.handleError(error, 'listing applications');
    }
  }

  async getApplication(name: string): Promise<ArgoCdApplication | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const url = this.buildUrl(`/api/v1/applications/${encodeURIComponent(name)}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get<ArgoCdApplication>(url, {
          headers: {
            Authorization: this.config.authToken as string,
            'Content-Type': 'application/json'
          }
        })
      );

      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      this.handleError(error, `fetching application ${name}`);
    }
  }

  private buildUrl(path: string): string {
    const baseUrl = this.config.baseUrl;

    if (!baseUrl) {
      throw new InternalServerErrorException('Argo CD base URL is not configured');
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return new URL(normalizedPath, baseUrl).toString();
  }

  private handleError(error: unknown, context: string): never {
    if (isAxiosError(error)) {
      const status = error.response?.status ?? 502;
      const message = error.response?.data?.error || error.message;
      this.logger.error(`Argo CD request failed while ${context}: ${message}`, error.stack);
      throw new BadGatewayException(`Argo CD request failed (${status})`);
    }

    this.logger.error(`Unexpected error while ${context}`, (error as Error)?.stack);
    throw new BadGatewayException('Unexpected error while communicating with Argo CD');
  }
}
