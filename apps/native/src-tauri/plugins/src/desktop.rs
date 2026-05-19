use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

#[cfg(target_os = "macos")]
extern "C" {
    fn macos_apple_sign_in(
        out_token: *mut *mut std::os::raw::c_char,
        out_email: *mut *mut std::os::raw::c_char,
        out_name: *mut *mut std::os::raw::c_char,
        out_error: *mut *mut std::os::raw::c_char,
    );
}

#[cfg(target_os = "macos")]
extern "C" {
    fn free(ptr: *mut std::os::raw::c_void);
}

#[cfg(target_os = "macos")]
fn perform_macos_apple_sign_in() -> crate::Result<AppleSignInResponse> {
    use std::ffi::CStr;
    use std::os::raw::c_char;

    let mut out_token: *mut c_char = std::ptr::null_mut();
    let mut out_email: *mut c_char = std::ptr::null_mut();
    let mut out_name: *mut c_char = std::ptr::null_mut();
    let mut out_error: *mut c_char = std::ptr::null_mut();

    unsafe {
        macos_apple_sign_in(&mut out_token, &mut out_email, &mut out_name, &mut out_error);
    }

    let take = |ptr: *mut c_char| -> Option<String> {
        if ptr.is_null() {
            return None;
        }
        let s = unsafe { CStr::from_ptr(ptr).to_string_lossy().into_owned() };
        unsafe { free(ptr as *mut std::os::raw::c_void) };
        Some(s)
    };

    let error = take(out_error);
    let token = take(out_token);
    let email = take(out_email);
    let name = take(out_name);

    if let Some(msg) = error {
        return Err(crate::Error::AppleSignInFailed(msg));
    }

    Ok(AppleSignInResponse {
        identity_token: token,
        email,
        name,
    })
}

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

    pub fn apple_sign_in(&self) -> crate::Result<AppleSignInResponse> {
        #[cfg(target_os = "macos")]
        return perform_macos_apple_sign_in();

        #[cfg(not(target_os = "macos"))]
        Err(crate::Error::UnsupportedPlatform)
    }
}
