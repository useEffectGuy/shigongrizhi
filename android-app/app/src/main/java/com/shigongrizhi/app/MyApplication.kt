package com.shigongrizhi.app

import android.app.Application
import com.shigongrizhi.app.data.local.AppPreferences

class MyApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        AppPreferences.init(this)
    }
    
    companion object {
        const val APP_NAME = "施工日志"
        const val APP_VERSION = "1.1.0"
        const val API_BASE_URL = "http://192.168.1.100:8519/api/"
    }
}
