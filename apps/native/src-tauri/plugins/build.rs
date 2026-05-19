const COMMANDS: &[&str] = &["sign_in", "apple_sign_in", "open_external_url"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();

    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    if target_os == "macos" {
        compile_macos_apple_signin();
    }
}

fn compile_macos_apple_signin() {
    use std::process::Command;

    let out_dir = std::env::var("OUT_DIR").expect("OUT_DIR not set");
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
    let swift_src = format!("{}/macos/MacAppleSignIn.swift", manifest_dir);
    let lib_out = format!("{}/libMacAppleSignIn.a", out_dir);

    let target_arch = std::env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default();
    // Target macOS 13+ so the Swift compiler doesn't emit references to
    // backward-deployment compatibility libraries (swiftCompatibility56,
    // swiftCompatibilityConcurrency) which cause linker errors on newer SDKs.
    let swift_target = match target_arch.as_str() {
        "x86_64" => "x86_64-apple-macos13.0",
        _ => "arm64-apple-macos13.0",
    };

    println!("cargo:rerun-if-changed=macos/MacAppleSignIn.swift");

    let status = Command::new("xcrun")
        .args([
            "swiftc",
            "-parse-as-library",
            "-emit-library",
            "-static",
            "-target",
            swift_target,
            "-module-name",
            "MacAppleSignIn",
            "-o",
            &lib_out,
            &swift_src,
        ])
        .status()
        .expect("xcrun swiftc failed (is Xcode installed?)");

    assert!(status.success(), "Swift compilation for macOS failed");

    // Add the Swift toolchain lib directory so the linker can resolve any
    // residual swift* auto-linked libraries.
    if let Ok(out) = Command::new("xcrun").args(["--find", "swiftc"]).output() {
        if let Ok(swiftc) = String::from_utf8(out.stdout) {
            let swiftc = swiftc.trim();
            if let Some(usr) = swiftc.strip_suffix("/bin/swiftc") {
                println!("cargo:rustc-link-search={}/lib/swift/macosx", usr);
            }
        }
    }

    println!("cargo:rustc-link-search=native={}", out_dir);
    println!("cargo:rustc-link-lib=static=MacAppleSignIn");
    println!("cargo:rustc-link-lib=framework=AuthenticationServices");
}
