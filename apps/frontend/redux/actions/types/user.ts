export interface UpdateProfileRequest {
  name: string;
  photo?: Blob;
  photoName?: string;
  motto?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  access_token: string;
}

export interface AuthResponse {
  token: string;
}
