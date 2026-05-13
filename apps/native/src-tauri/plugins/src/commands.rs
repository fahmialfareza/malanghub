use tauri::{command, AppHandle, Runtime};

use crate::models::*;
use crate::GoogleAuthExt;
use crate::Result;

#[command]
pub(crate) async fn sign_in<R: Runtime>(
    app: AppHandle<R>,
    payload: SignInRequest,
) -> Result<SignInResponse> {
    app.google_auth().sign_in(payload)
}
