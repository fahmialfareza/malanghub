import { spawnSync } from "node:child_process";

const releaseVersion = process.env.MALANGHUB_RELEASE_VERSION || "1.0.0";
const [platform, buildNumber] = process.argv.slice(2);
const ref = process.env.MALANGHUB_RELEASE_REF || getCurrentBranch();

const workflows = {
  android: {
    file: "native-android-play-store.yml",
    inputs: {
      version: releaseVersion,
      build_number: buildNumber,
      track: process.env.MALANGHUB_ANDROID_TRACK || "production",
      status: process.env.MALANGHUB_ANDROID_STATUS || "draft",
    },
  },
  ios: {
    file: "native-ios-app-store.yml",
    inputs: {
      version: releaseVersion,
      build_number: buildNumber,
      export_method: process.env.MALANGHUB_IOS_EXPORT_METHOD || "app-store-connect",
    },
  },
  linux: {
    file: "native-linux-snapcraft.yml",
    inputs: {
      version: releaseVersion,
      build_number: buildNumber,
      channel: process.env.MALANGHUB_SNAP_CHANNEL || "stable",
    },
  },
  macos: {
    file: "native-macos-app-store.yml",
    inputs: {
      version: releaseVersion,
      build_number: buildNumber,
    },
  },
  windows: {
    file: "native-windows-msix.yml",
    inputs: {
      version: releaseVersion,
      build_number: buildNumber,
      identity_name:
        process.env.MALANGHUB_WINDOWS_IDENTITY_NAME || "Malanghub.Malanghub",
      publisher: process.env.MALANGHUB_WINDOWS_PUBLISHER || "CN=Malanghub",
      publisher_display_name:
        process.env.MALANGHUB_WINDOWS_PUBLISHER_DISPLAY_NAME || "Malanghub",
    },
  },
};

if (!platform || !workflows[platform]) {
  fail(
    `Usage: pnpm release <${Object.keys(workflows).join("|")}> <build-number>`,
  );
}

if (!/^[1-9]\d*$/.test(buildNumber ?? "")) {
  fail("Build number must be a positive integer, for example: pnpm release android 100");
}

if (!/^\d+\.\d+\.\d+$/.test(releaseVersion)) {
  fail("MALANGHUB_RELEASE_VERSION must use MAJOR.MINOR.PATCH, for example 1.0.0");
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
