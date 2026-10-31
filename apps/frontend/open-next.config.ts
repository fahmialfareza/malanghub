import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Pages are rendered with getServerSideProps only (no ISR), so no incremental
// cache is configured. Article pages are edge-cached by worker.ts instead.
export default defineCloudflareConfig({});
