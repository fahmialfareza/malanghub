import AuthenticationServices
import AppKit
import Foundation

private final class AppleSignInCoordinator: NSObject,
    ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding
{
    private let semaphore = DispatchSemaphore(value: 0)
    var token: String?
    var email: String?
    var name: String?
    var error: String?

    func run() {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            let provider = ASAuthorizationAppleIDProvider()
            let request = provider.createRequest()
            request.requestedScopes = [.fullName, .email]
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
        semaphore.wait()
    }

    func authorizationController(
        controller _: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        defer { semaphore.signal() }
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            error = "Apple Sign In: credential tidak dikenali."
            return
        }
        token = credential.identityToken.flatMap { String(data: $0, encoding: .utf8) }
        email = credential.email
        let parts = [credential.fullName?.givenName, credential.fullName?.familyName]
            .compactMap { $0?.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        name = parts.isEmpty ? nil : parts.joined(separator: " ")
    }

    func authorizationController(
        controller _: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        defer { semaphore.signal() }
        if let e = error as? ASAuthorizationError, e.code == .canceled {
            self.error = "Apple Sign In dibatalkan."
        } else {
            self.error = error.localizedDescription
        }
    }

    func presentationAnchor(for _: ASAuthorizationController) -> ASPresentationAnchor {
        NSApplication.shared.windows.first(where: { $0.isKeyWindow })
            ?? NSApplication.shared.windows.first
            ?? ASPresentationAnchor()
    }
}

// C-compatible entry point called from Rust via FFI.
// Swift allocates each out-string with strdup; the Rust caller must free them.
@_cdecl("macos_apple_sign_in")
public func macosAppleSignIn(
    outToken: UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>,
    outEmail: UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>,
    outName: UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>,
    outError: UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>
) {
    let c = AppleSignInCoordinator()
    c.run()
    outToken.pointee = c.token.map { strdup($0) }
    outEmail.pointee = c.email.map { strdup($0) }
    outName.pointee = c.name.map { strdup($0) }
    outError.pointee = c.error.map { strdup($0) }
}
