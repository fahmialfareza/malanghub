use tauri::{command, AppHandle, Runtime};
use tauri_plugin_shell::ShellExt;

use crate::models::*;
use crate::GoogleAuthExt;
use crate::Result;

const EXTERNAL_URL_SCHEMES: &[&str] = &[
    "http://",
    "https://",
    "mailto:",
    "tel:",
    "sms:",
    "geo:",
    "maps:",
    "whatsapp:",
    "comgooglemaps:",
    "google.navigation:",
];

fn is_allowed_external_url(url: &str) -> bool {
    let url = url.trim().to_ascii_lowercase();
    EXTERNAL_URL_SCHEMES
        .iter()
        .any(|scheme| url.starts_with(scheme))
}

#[command]
pub(crate) async fn sign_in<R: Runtime>(
    app: AppHandle<R>,
    payload: SignInRequest,
) -> Result<SignInResponse> {
    app.google_auth().sign_in(payload)
}

#[command]
pub(crate) fn open_external_url<R: Runtime>(
    app: AppHandle<R>,
    url: String,
) -> std::result::Result<(), String> {
    let url = url.trim();

    if !is_allowed_external_url(url) {
        return Err("Unsupported external URL scheme.".into());
    }

    #[allow(deprecated)]
    app.shell()
        .open(url.to_string(), None)
        .map_err(|error| error.to_string())
}
