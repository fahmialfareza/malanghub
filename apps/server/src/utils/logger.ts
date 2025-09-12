import pino, { Logger } from "pino";

// If New Relic is enabled, require the pino enricher at runtime. This keeps
// the module tree free of New Relic when disabled.
let logger: Logger<never, boolean>;
if (process.env.NEW_RELIC_ENABLED === "true") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nrPino = require("@newrelic/pino-enricher");
  logger = pino(nrPino());
} else {
  logger = pino();
}

export default logger;
