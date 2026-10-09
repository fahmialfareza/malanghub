import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Pages are rendered with getServerSideProps only (no ISR), so no incremental cache is configured.
export default defineCloudflareConfig({});
