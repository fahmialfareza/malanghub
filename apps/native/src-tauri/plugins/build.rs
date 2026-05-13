const COMMANDS: &[&str] = &["sign_in", "open_external_url"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}
