import AuthenticationServices
import CryptoKit
import Foundation
import Security
import SwiftRs
import Tauri
import UIKit
import WebKit

private struct SignInArgs: Decodable {
  let iosClientId: String?
  let redirectUri: String?
}

private struct GoogleTokenResponse: Decodable {
  let idToken: String?
  let accessToken: String?

  enum CodingKeys: String, CodingKey {
    case idToken = "id_token"
    case accessToken = "access_token"
  }
}

class GoogleAuthPlugin: Plugin, ASWebAuthenticationPresentationContextProviding {
  private var authSession: ASWebAuthenticationSession?

  @objc public func signIn(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(SignInArgs.self)
    guard let clientId = args.iosClientId?.trimmingCharacters(in: .whitespacesAndNewlines),
      !clientId.isEmpty
    else {
      invoke.reject("VITE_GOOGLE_IOS_CLIENT_ID belum diisi.")
      return
    }

    let redirectUri = args.redirectUri?.trimmingCharacters(in: .whitespacesAndNewlines)
      ?? "com.malanghub.app:/oauth2redirect/google"
    guard let redirectURL = URL(string: redirectUri), let callbackScheme = redirectURL.scheme else {
      invoke.reject("Google redirect URI iOS tidak valid.")
      return
    }

    let codeVerifier = Self.randomURLSafeString(byteCount: 32)
    let codeChallenge = Self.codeChallenge(for: codeVerifier)
    let state = Self.randomURLSafeString(byteCount: 32)

    var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
    components.queryItems = [
      URLQueryItem(name: "response_type", value: "code"),
      URLQueryItem(name: "client_id", value: clientId),
      URLQueryItem(name: "redirect_uri", value: redirectUri),
      URLQueryItem(name: "scope", value: "openid email profile"),
      URLQueryItem(name: "code_challenge_method", value: "S256"),
      URLQueryItem(name: "code_challenge", value: codeChallenge),
      URLQueryItem(name: "state", value: state),
      URLQueryItem(name: "prompt", value: "select_account"),
    ]

    guard let authURL = components.url else {
      invoke.reject("Google login URL gagal dibuat.")
      return
    }

    DispatchQueue.main.async {
      self.authSession = ASWebAuthenticationSession(
        url: authURL,
        callbackURLScheme: callbackScheme
      ) { callbackURL, error in
        self.authSession = nil

        if let error = error as? ASWebAuthenticationSessionError,
          error.code == .canceledLogin
        {
          invoke.reject("Google login dibatalkan.")
          return
        }

        if let error = error {
          invoke.reject("Google login gagal.", error: error)
          return
        }

        guard let callbackURL = callbackURL else {
          invoke.reject("Google tidak mengembalikan callback.")
          return
        }

        self.handleCallback(
          callbackURL,
          expectedState: state,
          clientId: clientId,
          redirectUri: redirectUri,
          codeVerifier: codeVerifier,
          invoke: invoke
        )
      }

      self.authSession?.presentationContextProvider = self
      self.authSession?.prefersEphemeralWebBrowserSession = false

      if self.authSession?.start() != true {
        invoke.reject("Google login tidak dapat dimulai.")
      }
    }
  }

  public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    manager.viewController?.view.window ?? ASPresentationAnchor()
  }

  private func handleCallback(
    _ callbackURL: URL,
    expectedState: String,
    clientId: String,
    redirectUri: String,
    codeVerifier: String,
    invoke: Invoke
  ) {
    guard let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false) else {
      invoke.reject("Google callback tidak valid.")
      return
    }

    let query = Dictionary(
      uniqueKeysWithValues: (components.queryItems ?? []).map { ($0.name, $0.value ?? "") }
    )

    if let error = query["error"], !error.isEmpty {
      invoke.reject(query["error_description"] ?? error)
      return
    }

    guard query["state"] == expectedState else {
      invoke.reject("Google login callback tidak valid.")
      return
    }

    guard let code = query["code"], !code.isEmpty else {
      invoke.reject("Google tidak mengembalikan authorization code.")
      return
    }

    exchangeCode(
      code,
      clientId: clientId,
      redirectUri: redirectUri,
      codeVerifier: codeVerifier,
      invoke: invoke
    )
  }

  private func exchangeCode(
    _ code: String,
    clientId: String,
    redirectUri: String,
    codeVerifier: String,
    invoke: Invoke
  ) {
    var request = URLRequest(url: URL(string: "https://oauth2.googleapis.com/token")!)
    request.httpMethod = "POST"
    request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
    request.httpBody = Self.formURLEncoded([
      "code": code,
      "client_id": clientId,
      "redirect_uri": redirectUri,
      "grant_type": "authorization_code",
      "code_verifier": codeVerifier,
    ])

    URLSession.shared.dataTask(with: request) { data, response, error in
      if let error = error {
        DispatchQueue.main.async {
          invoke.reject("Google token exchange gagal.", error: error)
        }
        return
      }

      let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
      guard let data = data, (200..<300).contains(statusCode) else {
        let detail = data.flatMap { String(data: $0, encoding: .utf8) } ?? "HTTP \(statusCode)"
        DispatchQueue.main.async {
          invoke.reject("Google token exchange gagal: \(detail)")
        }
        return
      }

      do {
        let token = try JSONDecoder().decode(GoogleTokenResponse.self, from: data)
        guard token.idToken?.isEmpty == false || token.accessToken?.isEmpty == false else {
          DispatchQueue.main.async {
            invoke.reject("Google tidak mengembalikan token.")
          }
          return
        }

        DispatchQueue.main.async {
          invoke.resolve([
            "idToken": token.idToken,
            "accessToken": token.accessToken,
          ])
        }
      } catch {
        DispatchQueue.main.async {
          invoke.reject("Google token response gagal diparse.", error: error)
        }
      }
    }.resume()
  }

  private static func codeChallenge(for verifier: String) -> String {
    let digest = SHA256.hash(data: Data(verifier.utf8))
    return Data(digest).base64URLEncodedString()
  }

  private static func randomURLSafeString(byteCount: Int) -> String {
    var bytes = [UInt8](repeating: 0, count: byteCount)
    _ = SecRandomCopyBytes(kSecRandomDefault, byteCount, &bytes)
    return Data(bytes).base64URLEncodedString()
  }

  private static func formURLEncoded(_ values: [String: String]) -> Data {
    let body = values
      .map { key, value in
        "\(urlEncode(key))=\(urlEncode(value))"
      }
      .joined(separator: "&")
    return Data(body.utf8)
  }

  private static func urlEncode(_ value: String) -> String {
    var allowed = CharacterSet.urlQueryAllowed
    allowed.remove(charactersIn: "&=+")
    return value.addingPercentEncoding(withAllowedCharacters: allowed) ?? value
  }
}

private extension Data {
  func base64URLEncodedString() -> String {
    base64EncodedString()
      .replacingOccurrences(of: "+", with: "-")
      .replacingOccurrences(of: "/", with: "_")
      .replacingOccurrences(of: "=", with: "")
  }
}

@_cdecl("init_plugin_google_auth")
func initPlugin() -> Plugin {
  return GoogleAuthPlugin()
}
