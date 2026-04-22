import { logger } from "../utils/logging";

export const loggerMiddleware = (app: any) => 
    app
        .onRequest(({ request }: { request: Request }) => {
            (request as any).startTime = Date.now();
        })
        .onAfterResponse(({ request, set }: { request: Request; set: any }) => {
            const start = (request as any).startTime;
            const duration = Date.now() - start;
            const { method, url } = request;
            const path = new URL(url).pathname;
            const status = set.status || 200;

            const message = `${method} ${path} ${status} - ${duration}ms`;

            if (status >= 500) {
                logger.error(message);
            } else if (status >= 400) {
                logger.warn(message);
            } else {
                logger.info(message);
            }
        });
