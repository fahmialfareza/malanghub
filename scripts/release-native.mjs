import { spawnSync } from "node:child_process";

const [platform, buildNumber] = process.argv.slice(2);
const ref = process.env.MALANGHUB_RELEASE_REF || getCurrentBranch();

if (!/^[1-9]\d*$/.test(buildNumber ?? "")) {
  fail("Build number must be a positive integer, for example: pnpm release android 100");
}

const build = parseInt(buildNumber, 10);
const releaseVersion = `${Math.floor(build / 100)}.${Math.floor((build % 100) / 10)}.${build % 10}`;

const workflows = {
  android: {
    file: "native-android-play-store.yml",
    inputs: {
      build_number: buildNumber,
      track: process.env.MALANGHUB_ANDROID_TRACK || "production",
      status: process.env.MALANGHUB_ANDROID_STATUS || "draft",
    },
  },
  ios: {
    file: "native-ios-app-store.yml",
    inputs: {
      build_number: buildNumber,
      export_method: process.env.MALANGHUB_IOS_EXPORT_METHOD || "app-store-connect",
    },
  },
  linux: {
    file: "native-linux-snapcraft.yml",
    inputs: {
      build_number: buildNumber,
      channel: process.env.MALANGHUB_SNAP_CHANNEL || "stable",
    },
  },
  macos: {
    file: "native-macos-app-store.yml",
    inputs: {
      build_number: buildNumber,
    },
  },
  windows: {
    file: "native-windows-msix.yml",
    inputs: {
      build_number: buildNumber,
    },
  },
};

if (!platform || !workflows[platform]) {
  fail(
    `Usage: pnpm release <${Object.keys(workflows).join("|")}> <build-number>`,
  );
}

run("gh", ["auth", "status"], {
  errorMessage: "GitHub CLI is not authenticated. Run `gh auth login` first.",
});

const workflow = workflows[platform];
const args = ["workflow", "run", workflow.file, "--ref", ref];

for (const [key, value] of Object.entries(workflow.inputs)) {
  args.push("-f", `${key}=${value}`);
}

run("gh", args);

console.log(
  [
    `Dispatched ${workflow.file}`,
    `platform: ${platform}`,
    `version: ${releaseVersion}`,
    `build: ${buildNumber}`,
    `ref: ${ref}`,
    "",
    `Watch it with: gh run list --workflow ${workflow.file} --limit 5`,
  ].join("\n"),
);

function getCurrentBranch() {
  const result = spawnSync("git", ["branch", "--show-current"], {
    encoding: "utf8",
  });
  return result.stdout.trim() || "main";
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    fail(options.errorMessage || `Command failed: ${command} ${args.join(" ")}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
