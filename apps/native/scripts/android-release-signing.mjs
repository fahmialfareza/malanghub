import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const buildGradlePath = resolve(
  projectRoot,
  "src-tauri/gen/android/app/build.gradle.kts",
);

let source = readFileSync(buildGradlePath, "utf8");

if (!source.includes("import java.io.FileInputStream")) {
  source = source.replace(
    "import java.util.Properties",
    "import java.io.FileInputStream\nimport java.util.Properties",
  );
}

if (!source.includes('create("release")')) {
  source = source.replace(
    "    buildTypes {",
    `    signingConfigs {
        create("release") {
            val keystorePropertiesFile = rootProject.file("keystore.properties")
            val keystoreProperties = Properties()

            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(FileInputStream(keystorePropertiesFile))
            }

            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }

    buildTypes {`,
  );
}

if (!source.includes("signingConfig = signingConfigs.getByName(\"release\")")) {
  source = source.replace(
    `        getByName("release") {
            isMinifyEnabled = true`,
    `        getByName("release") {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true`,
  );
}

writeFileSync(buildGradlePath, source);
