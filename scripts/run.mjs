import ora from "ora";

import { spawn } from "child_process";
import { EventEmitter } from "events";
// import { writeComposite } from "./composites.mjs";

const events = new EventEmitter();
const spinner = ora();

// const bootstrap = async () => {
//   try {
//     spinner.info("[Authenticating] authenticating session");
//     await writeComposite(spinner);
//     spinner.succeed("Authenticating] authenticating complete");
//   } catch (err) {
//     spinner.fail(err.message);
//     // ceramic.kill()
//     throw err;
//   }
// };

const next = async () => {
  const next = spawn("npm", ["run", "nextDev"]);
  spinner.info("[NextJS] starting nextjs app");
  next.stdout.on("data", (buffer) => {
    console.log("[NextJS]", buffer.toString());
  });
};

const start = async () => {
  // await bootstrap();
  await next();
};

start();

process.on("SIGTERM", () => {
  ceramic.kill();
});
process.on("beforeExit", () => {
  ceramic.kill();
});