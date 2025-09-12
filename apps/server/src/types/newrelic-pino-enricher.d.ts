declare module "@newrelic/pino-enricher" {
  import { pino } from "pino";
  function nrPino(): pino.Bindings;
  export default nrPino;
}
