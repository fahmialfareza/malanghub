use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_google_auth);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<GoogleAuth<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin("com.malanghub.googleauth", "GoogleAuthPlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_google_auth)?;
    Ok(GoogleAuth(handle))
}

/// Access to the google-auth APIs.
pub struct GoogleAuth<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> GoogleAuth<R> {
    pub fn sign_in(&self, payload: SignInRequest) -> crate::Result<SignInResponse> {
        self.0
            .run_mobile_plugin("signIn", payload)
            .map_err(Into::into)
    }

    #[cfg(target_os = "android")]
    pub fn open_external_url(&self, url: String) -> crate::Result<()> {
        self.0
            .run_mobile_plugin("openExternalUrl", OpenExternalUrlRequest { url })
            .map_err(Into::into)
    }
}
