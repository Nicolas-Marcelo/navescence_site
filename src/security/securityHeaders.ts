import type {
  Application,
} from "express";

import helmet from "helmet";

export function registerSecurityHeaders(
  app: Application,
) {
  app.disable(
    "x-powered-by",
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [
            "'self'",
          ],

          scriptSrc: [
            "'self'",
          ],

          styleSrc: [
            "'self'",
            "https://fonts.googleapis.com",
          ],

          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "data:",
          ],

          imgSrc: [
            "'self'",
            "data:",
          ],

          connectSrc: [
            "'self'",
            "ws:",
            "wss:",
          ],

          objectSrc: [
            "'none'",
          ],

          baseUri: [
            "'self'",
          ],

          frameAncestors: [
            "'none'",
          ],
        },
      },

      crossOriginEmbedderPolicy:
        false,
    }),
  );
}