import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import { AppServer } from "./app";
import { makeConfig } from "./config/enironment";

declare global {
  namespace NodeJS {
    interface Global {
      __rootdir__: string;
    }
  }
}

global.__rootdir__ = __dirname || process.cwd();

function main() {
  const config = makeConfig();

  Sentry.init({
    dsn: config.secrets.sentry_dsn,
    integrations: [
      new RewriteFrames({
        root: global.__rootdir__,
      }),
    ],
  });

  const app = AppServer(config);

  const start = () => {
    const { port } = config.server;
    app.listen(port, () => console.log(`Listening on port ${port}`));
  };

  start();
}

main();
