import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      // req.route is populated after routing — undefined for 404s.
      // Using the templated path keeps cardinality bounded.
      const route = req.route?.path
        ? `${req.baseUrl ?? ''}${req.route.path}`
        : 'unknown';

      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode)
      };
      const durationSec = (Date.now() - start) / 1000;

      this.metrics.httpRequestsTotal.inc(labels);
      this.metrics.httpRequestDuration.observe(labels, durationSec);
    });

    next();
  }
}
