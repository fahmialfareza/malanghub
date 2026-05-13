use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<GoogleAuth<R>> {
    Ok(GoogleAuth(app.clone()))
}

/// Access to the google-auth APIs.
pub struct GoogleAuth<R: Runtime>(AppHandle<R>);

impl<R: Runtime> GoogleAuth<R> {
    pub fn sign_in(&self, _payload: SignInRequest) -> crate::Result<SignInResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }
}
