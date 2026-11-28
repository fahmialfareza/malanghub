// On macOS, Linux and iOS the bundled app is served from `tauri://localhost`,
// which sends no Referer header, so Tiny Cloud cannot validate the TinyMCE API
// key and disables the editor. Serving the assets from a fixed loopback origin
// (`http://localhost:<port>`) gives Tiny Cloud a domain it accepts. Windows and
// Android already use `http://tauri.localhost`, which Tiny Cloud accepts.
// The port must stay fixed: localStorage (and the login session) is per origin.
#[cfg(any(target_os = "macos", target_os = "linux", target_os = "ios"))]
const LOCALHOST_PORT: u16 = 47815;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_google_auth::init());

    // Only switch origins for bundled builds, and only if the port is free.
    // If another process already holds it, the webview would load that
    // process's page with IPC access, so fall back to `tauri://` instead.
    #[cfg(any(target_os = "macos", target_os = "linux", target_os = "ios"))]
    let use_localhost =
        !cfg!(dev) && std::net::TcpListener::bind(("127.0.0.1", LOCALHOST_PORT)).is_ok();
    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "ios")))]
    let use_localhost = false;

    #[cfg(any(target_os = "macos", target_os = "linux", target_os = "ios"))]
    let builder = if use_localhost {
        builder.plugin(
            tauri_plugin_localhost::Builder::new(LOCALHOST_PORT)
                .host("127.0.0.1")
                .build(),
        )
    } else {
        builder
    };

    builder
        // `tauri.conf.json` sets the main window to `create: false` so it is
        // built here, where the URL can point at the localhost server.
        .setup(move |app| create_main_window(app, use_localhost))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn create_main_window(
    app: &mut tauri::App,
    use_localhost: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    #[allow(unused_mut)]
    let mut config = app
        .config()
        .app
        .windows
        .iter()
        .find(|window| window.label == "main")
        .cloned()
        .ok_or("main window missing from tauri config")?;

    #[cfg(any(target_os = "macos", target_os = "linux", target_os = "ios"))]
    if use_localhost {
        config.url =
            tauri::WebviewUrl::External(format!("http://localhost:{LOCALHOST_PORT}/").parse()?);
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "ios")))]
    let _ = use_localhost;

    tauri::WebviewWindowBuilder::from_config(app.handle(), &config)?.build()?;
    Ok(())
}
