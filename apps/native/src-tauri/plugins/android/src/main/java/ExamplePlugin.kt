package com.malanghub.googleauth

import android.app.Activity
import androidx.activity.result.ActivityResult
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException

@InvokeArg
class SignInArgs {
  var androidClientId: String? = null
  var serverClientId: String? = null
}

@TauriPlugin
class GoogleAuthPlugin(private val activity: Activity): Plugin(activity) {
    @Command
    fun signIn(invoke: Invoke) {
        val args = invoke.parseArgs(SignInArgs::class.java)
        val serverClientId = args.serverClientId?.trim()

        if (serverClientId.isNullOrEmpty()) {
            invoke.reject("VITE_GOOGLE_SERVER_CLIENT_ID belum diisi.")
            return
        }

        val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestProfile()
            .requestIdToken(serverClientId)
            .build()
        val client = GoogleSignIn.getClient(activity, options)

        startActivityForResult(invoke, client.signInIntent, "handleSignInResult")
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
            val idToken = account.idToken

            if (idToken.isNullOrBlank()) {
                invoke.reject("Google tidak mengembalikan ID token.")
                return
            }

            val ret = JSObject()
            ret.put("idToken", idToken)
            account.email?.let { ret.put("email", it) }
            account.displayName?.let { ret.put("name", it) }
            account.photoUrl?.let { ret.put("photoUrl", it.toString()) }
            invoke.resolve(ret)
        } catch (error: ApiException) {
            invoke.reject("Google login gagal (${error.statusCode}).", error)
        } catch (error: Exception) {
            invoke.reject("Google login gagal.", error)
        }
    }
}
