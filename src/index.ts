import { makeConfig } from "./config/enironment";
import { AppServer } from "./app";

function main() {
  const config = makeConfig();

  const app = AppServer(config);

  const start = () => {
    const { port } = config.server;
    app.listen(port, () => console.log(`Listening on port ${port}`));
  };

  start();
}

main();
