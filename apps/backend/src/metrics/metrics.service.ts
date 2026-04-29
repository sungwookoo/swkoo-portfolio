import { Injectable, OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();

  readonly httpRequestsTotal: Counter<'method' | 'route' | 'status_code'>;
  readonly httpRequestDuration: Histogram<'method' | 'route' | 'status_code'>;

  constructor() {
    this.registry.setDefaultLabels({ app: 'swkoo-backend' });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests handled by the backend',
      labelNames: ['method', 'route', 'status_code'] as const,
      registers: [this.registry]
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'] as const,
      buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
      registers: [this.registry]
    });
  }

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.registry });
  }

  metricsText(): Promise<string> {
    return this.registry.metrics();
  }

  contentType(): string {
    return this.registry.contentType;
  }
}
