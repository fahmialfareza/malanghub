use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignInRequest {
    pub ios_client_id: Option<String>,
    pub android_client_id: Option<String>,
    pub server_client_id: Option<String>,
    pub redirect_uri: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignInResponse {
    pub id_token: Option<String>,
    pub access_token: Option<String>,
    pub email: Option<String>,
    pub name: Option<String>,
    pub photo_url: Option<String>,
}
