package com.shigongrizhi.app.data.local

import android.content.Context
import android.content.SharedPreferences

object AppPreferences {
    
    private lateinit var preferences: SharedPreferences
    
    private const val PREF_NAME = "construction_log_prefs"
    
    private const val KEY_TOKEN = "token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_USERNAME = "username"
    private const val KEY_ROLE = "role"
    private const val KEY_LOGIN_TIME = "login_time"
    private const val KEY_CURRENT_PROJECT_ID = "current_project_id"
    private const val KEY_CURRENT_PROJECT_NAME = "current_project_name"
    
    fun init(context: Context) {
        preferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }
    
    fun setToken(token: String) {
        preferences.edit().putString(KEY_TOKEN, token).apply()
    }
    
    fun getToken(): String {
        return preferences.getString(KEY_TOKEN, "") ?: ""
    }
    
    fun setUserId(id: Int) {
        preferences.edit().putInt(KEY_USER_ID, id).apply()
    }
    
    fun getUserId(): Int {
        return preferences.getInt(KEY_USER_ID, 0)
    }
    
    fun setUsername(username: String) {
        preferences.edit().putString(KEY_USERNAME, username).apply()
    }
    
    fun getUsername(): String {
        return preferences.getString(KEY_USERNAME, "") ?: ""
    }
    
    fun setRole(role: String) {
        preferences.edit().putString(KEY_ROLE, role).apply()
    }
    
    fun getRole(): String {
        return preferences.getString(KEY_ROLE, "user") ?: "user"
    }
    
    fun isAdmin(): Boolean {
        return getRole() == "admin"
    }
    
    fun setLoginTime(time: Long) {
        preferences.edit().putLong(KEY_LOGIN_TIME, time).apply()
    }
    
    fun getLoginTime(): Long {
        return preferences.getLong(KEY_LOGIN_TIME, 0)
    }
    
    fun setCurrentProject(id: Int, name: String) {
        preferences.edit()
            .putInt(KEY_CURRENT_PROJECT_ID, id)
            .putString(KEY_CURRENT_PROJECT_NAME, name)
            .apply()
    }
    
    fun getCurrentProjectId(): Int {
        return preferences.getInt(KEY_CURRENT_PROJECT_ID, 0)
    }
    
    fun getCurrentProjectName(): String {
        return preferences.getString(KEY_CURRENT_PROJECT_NAME, "") ?: ""
    }
    
    fun isLoggedIn(): Boolean {
        return getToken().isNotEmpty()
    }
    
    fun clear() {
        preferences.edit().clear().apply()
    }
}
