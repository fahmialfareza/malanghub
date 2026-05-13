import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcTauriDir = resolve(appDir, "src-tauri");
const preferredInterfaces = ["en0", "en1"];
const command = process.argv[2] ?? "config";
const extraArgs = process.argv.slice(3);

function getAddressFromInterface(name) {
  const result = spawnSync("ipconfig", ["getifaddr", name], {
    encoding: "utf8",
  });

  if (result.status === 0) {
    return result.stdout.trim();
  }

  return "";
}

function getMacLanAddress() {
  for (const name of preferredInterfaces) {
    const address = getAddressFromInterface(name);

    if (address) {
      return address;
    }
  }

  const result = spawnSync("ifconfig", [], { encoding: "utf8" });
  const match = result.stdout.match(
    /\binet (192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+)/,
  );

  return match?.[1] ?? "";
}

function getHost() {
  return process.env.TAURI_DEV_HOST || getMacLanAddress();
}

function writePlatformConfig(platform, host) {
  const configPath = resolve(srcTauriDir, `tauri.${platform}.conf.json`);
  const config = {
    build: {
      devUrl: `http://${host}:1420`,
    },
  };

  mkdirSync(srcTauriDir, { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

  return configPath;
}

function configure(platforms, host) {
  for (const platform of platforms) {
    const configPath = writePlatformConfig(platform, host);
    console.log(`Wrote ${configPath}`);
  }

  console.log(`Mobile dev URL: http://${host}:1420/`);
}

function run(platform, host) {
  configure([platform], host);

  const args = ["tauri", platform, "dev", "--open", `--host=${host}`, ...extraArgs];

  console.log(`Starting ${platform} device dev server on ${host}`);
  console.log(`Use the IDE opened by this command so the generated mobile config is applied.`);

  const child = spawn("pnpm", args, {
    cwd: appDir,
    env: {
      ...process.env,
      TAURI_DEV_HOST: host,
    },
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    }

    process.exit(code ?? 0);
  });
}

const host = getHost();

if (!host) {
  if (command === "config") {
    console.warn("Could not detect the Mac LAN IP. Skipping mobile dev config generation.");
    process.exit(0);
  }

  console.error("Could not detect the Mac LAN IP. Set TAURI_DEV_HOST manually.");
  process.exit(1);
}

if (command === "config") {
  configure(["ios", "android"], host);
} else if (command === "ios" || command === "android") {
  run(command, host);
} else {
  console.error("Usage: node ./scripts/mobile-device-dev.mjs [config|ios|android]");
  process.exit(1);
}
