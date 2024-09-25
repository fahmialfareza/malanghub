const nrPino = require("@newrelic/pino-enricher");
const pino = require("pino");
const logger = pino(nrPino());

module.exports = logger;
