package com.malanghub.googleauth

import android.accounts.Account
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import androidx.activity.result.ActivityResult
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke
import com.google.android.gms.auth.GoogleAuthException
import com.google.android.gms.auth.GoogleAuthUtil
import com.google.android.gms.auth.UserRecoverableAuthException
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import java.io.IOException

private const val GOOGLE_AUTH_SCOPE = "oauth2:openid email profile"

@InvokeArg
class SignInArgs {
  var androidClientId: String? = null
}

@InvokeArg
class OpenExternalUrlArgs {
  var url: String? = null
}

@TauriPlugin
class GoogleAuthPlugin(private val activity: Activity): Plugin(activity) {
    private var pendingAccessTokenAccount: GoogleSignInAccount? = null

    @Command
    fun signIn(invoke: Invoke) {
        val args = invoke.parseArgs(SignInArgs::class.java)
        val androidClientId = args.androidClientId?.trim()

        if (androidClientId.isNullOrEmpty()) {
            invoke.reject("VITE_GOOGLE_ANDROID_CLIENT_ID belum diisi.")
            return
        }

        val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestProfile()
            .build()
        val client = GoogleSignIn.getClient(activity, options)

        startActivityForResult(invoke, client.signInIntent, "handleSignInResult")
    }

    @Command
    fun openExternalUrl(invoke: Invoke) {
        val args = invoke.parseArgs(OpenExternalUrlArgs::class.java)
        val url = args.url?.trim()

        if (url.isNullOrEmpty()) {
            invoke.reject("URL eksternal tidak valid.")
            return
        }

        try {
            openExternalTarget(url)
            invoke.resolve()
        } catch (error: Exception) {
            invoke.reject(error.message ?: "Tidak bisa membuka tautan eksternal.", error)
        }
    }

    @ActivityCallback
    fun handleSignInResult(invoke: Invoke, result: ActivityResult) {
        if (result.resultCode != Activity.RESULT_OK) {
            invoke.reject("Google login dibatalkan.")
            return
        }

        try {
            val account = GoogleSignIn.getSignedInAccountFromIntent(result.data)
                .getResult(ApiException::class.java)
            requestGoogleAccessToken(invoke, account)
        } catch (error: ApiException) {
            invoke.reject(googleSignInErrorMessage(error.statusCode), error)
        } catch (error: Exception) {
            invoke.reject("Google login gagal.", error)
        }
    }

    @ActivityCallback
    fun handleAccessTokenRecoveryResult(invoke: Invoke, result: ActivityResult) {
        if (result.resultCode != Activity.RESULT_OK) {
            pendingAccessTokenAccount = null
            invoke.reject("Google login dibatalkan.")
            return
        }

        val account = pendingAccessTokenAccount
        if (account == null) {
            invoke.reject("Google login gagal: akun tidak ditemukan.")
            return
        }

        requestGoogleAccessToken(invoke, account)
    }

    private fun googleSignInErrorMessage(statusCode: Int): String {
        return when (statusCode) {
            7 -> "Google login gagal karena koneksi jaringan."
            10 -> "Google login gagal karena konfigurasi OAuth Android belum cocok. " +
                "Periksa package com.malanghub.app, SHA-1, dan VITE_GOOGLE_ANDROID_CLIENT_ID."
            12500 -> "Google login gagal karena konfigurasi Google Sign-In belum lengkap."
            12501 -> "Google login dibatalkan."
            else -> "Google login gagal ($statusCode)."
        }
    }

    private fun requestGoogleAccessToken(invoke: Invoke, signInAccount: GoogleSignInAccount) {
        val googleAccount = signInAccount.account ?: signInAccount.email?.let {
            Account(it, GoogleAuthUtil.GOOGLE_ACCOUNT_TYPE)
        }

        if (googleAccount == null) {
            invoke.reject("Google tidak mengembalikan akun yang valid.")
            return
        }

        pendingAccessTokenAccount = signInAccount

        Thread {
            try {
                val accessToken = GoogleAuthUtil.getToken(
                    activity.applicationContext,
                    googleAccount,
                    GOOGLE_AUTH_SCOPE
                )

                if (accessToken.isNullOrBlank()) {
                    rejectOnMain(invoke, "Google tidak mengembalikan access token.")
                    return@Thread
                }

                activity.runOnUiThread {
                    pendingAccessTokenAccount = null
                    val ret = JSObject()
                    ret.put("accessToken", accessToken)
                    signInAccount.email?.let { ret.put("email", it) }
                    signInAccount.displayName?.let { ret.put("name", it) }
                    signInAccount.photoUrl?.let { ret.put("photoUrl", it.toString()) }
                    invoke.resolve(ret)
                }
            } catch (error: UserRecoverableAuthException) {
                activity.runOnUiThread {
                    val recoveryIntent = error.intent

                    if (recoveryIntent == null) {
                        pendingAccessTokenAccount = null
                        invoke.reject("Google login perlu izin tambahan.", error)
                        return@runOnUiThread
                    }

                    startActivityForResult(
                        invoke,
                        recoveryIntent,
                        "handleAccessTokenRecoveryResult"
                    )
                }
            } catch (error: IOException) {
                rejectOnMain(invoke, "Google login gagal karena koneksi jaringan.", error)
            } catch (error: GoogleAuthException) {
                rejectOnMain(invoke, "Google login gagal mengambil access token.", error)
            } catch (error: Exception) {
                rejectOnMain(invoke, "Google login gagal.", error)
            }
        }.start()
    }

    private fun rejectOnMain(invoke: Invoke, message: String, error: Exception? = null) {
        activity.runOnUiThread {
            pendingAccessTokenAccount = null

            if (error != null) {
                invoke.reject(message, error)
            } else {
                invoke.reject(message)
            }
        }
    }

    private fun openExternalTarget(url: String) {
        if (url.startsWith("intent:", ignoreCase = true)) {
            openIntentUrl(url)
            return
        }

        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        intent.addCategory(Intent.CATEGORY_BROWSABLE)
        activity.startActivity(intent)
    }

    private fun openIntentUrl(url: String) {
        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
        val fallbackUrl = intent.getStringExtra("browser_fallback_url")
        val packageName = intent.`package`

        intent.addCategory(Intent.CATEGORY_BROWSABLE)
        intent.component = null
        intent.selector = null

        try {
            activity.startActivity(intent)
        } catch (error: ActivityNotFoundException) {
            when {
                !fallbackUrl.isNullOrBlank() -> openExternalTarget(fallbackUrl)
                !packageName.isNullOrBlank() -> openExternalTarget(
                    "https://play.google.com/store/apps/details?id=$packageName"
                )
                else -> throw error
            }
        }
    }
}
