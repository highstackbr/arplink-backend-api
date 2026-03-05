import type { NextFunction, Request, Response } from 'express';

export function httpLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      }),
    );
  });
  next();
}

