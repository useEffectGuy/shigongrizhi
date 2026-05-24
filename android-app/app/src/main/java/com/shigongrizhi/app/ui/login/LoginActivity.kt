package com.shigongrizhi.app.ui.login

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.gson.Gson
import com.shigongrizhi.app.MyApplication
import com.shigongrizhi.app.data.local.AppPreferences
import com.shigongrizhi.app.data.model.LoginRequest
import com.shigongrizhi.app.data.model.RegisterRequest
import com.shigongrizhi.app.data.network.ApiService
import com.shigongrizhi.app.data.network.RetrofitClient
import com.shigongrizhi.app.databinding.ActivityLoginBinding
import com.shigongrizhi.app.ui.main.MainActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class LoginActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLoginBinding
    private lateinit var apiService: ApiService
    
    private var isLoginMode = true
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        apiService = RetrofitClient.createService(ApiService::class.java)
        
        if (AppPreferences.isLoggedIn()) {
            startMainActivity()
            return
        }
        
        setupViews()
    }
    
    private fun setupViews() {
        binding.apply {
            btnLogin.setOnClickListener {
                if (isLoginMode) {
                    doLogin()
                } else {
                    doRegister()
                }
            }
            
            tvSwitchMode.setOnClickListener {
                switchMode()
            }
        }
    }
    
    private fun switchMode() {
        isLoginMode = !isLoginMode
        binding.apply {
            if (isLoginMode) {
                tvTitle.text = "登录"
                tvSubtitle.text = "欢迎使用施工日志系统"
                tilConfirmPassword.visibility = View.GONE
                btnLogin.text = "登录"
                tvSwitchMode.text = "还没有账号？立即注册"
            } else {
                tvTitle.text = "注册"
                tvSubtitle.text = "创建您的施工日志账户"
                tilConfirmPassword.visibility = View.VISIBLE
                btnLogin.text = "注册"
                tvSwitchMode.text = "已有账号？立即登录"
            }
        }
    }
    
    private fun doLogin() {
        val username = binding.etUsername.text.toString().trim()
        val password = binding.etPassword.text.toString()
        
        if (username.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "请输入用户名和密码", Toast.LENGTH_SHORT).show()
            return
        }
        
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    apiService.login(
                        LoginRequest(
                            username = username,
                            password = password,
                            deviceName = "Android Device"
                        )
                    ).execute()
                }
                
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    if (response.isSuccessful && response.body() != null) {
                        val loginResponse = response.body()!!
                        AppPreferences.apply {
                            setToken(loginResponse.token)
                            setUserId(loginResponse.userId)
                            setUsername(loginResponse.username)
                            setRole(loginResponse.role)
                            setLoginTime(System.currentTimeMillis())
                        }
                        Toast.makeText(this@LoginActivity, "登录成功", Toast.LENGTH_SHORT).show()
                        startMainActivity()
                    } else {
                        val error = response.errorBody()?.string()
                        val errorMsg = parseError(error) ?: "登录失败"
                        Toast.makeText(this@LoginActivity, errorMsg, Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    Toast.makeText(this@LoginActivity, "网络错误: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
    
    private fun doRegister() {
        val username = binding.etUsername.text.toString().trim()
        val password = binding.etPassword.text.toString()
        val confirmPassword = binding.etConfirmPassword.text.toString()
        
        if (username.isEmpty() || password.isEmpty() || confirmPassword.isEmpty()) {
            Toast.makeText(this, "请填写所有必填项", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (password.length < 6) {
            Toast.makeText(this, "密码至少需要6位", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (password != confirmPassword) {
            Toast.makeText(this, "两次输入的密码不一致", Toast.LENGTH_SHORT).show()
            return
        }
        
        showLoading(true)
        
        lifecycleScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    apiService.register(
                        RegisterRequest(
                            username = username,
                            password = password
                        )
                    ).execute()
                }
                
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    if (response.isSuccessful && response.body() != null) {
                        val registerResponse = response.body()!!
                        AppPreferences.apply {
                            setToken(registerResponse.token)
                            setUserId(registerResponse.user.id)
                            setUsername(registerResponse.user.username)
                            setRole(registerResponse.user.role)
                            setLoginTime(System.currentTimeMillis())
                        }
                        Toast.makeText(this@LoginActivity, "注册成功", Toast.LENGTH_SHORT).show()
                        startMainActivity()
                    } else {
                        val error = response.errorBody()?.string()
                        val errorMsg = parseError(error) ?: "注册失败"
                        Toast.makeText(this@LoginActivity, errorMsg, Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    Toast.makeText(this@LoginActivity, "网络错误: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
    
    private fun showLoading(show: Boolean) {
        binding.apply {
            progressBar.visibility = if (show) View.VISIBLE else View.GONE
            btnLogin.isEnabled = !show
            tvSwitchMode.isEnabled = !show
        }
    }
    
    private fun parseError(errorJson: String?): String? {
        return try {
            val gson = Gson()
            val errorObj = gson.fromJson(errorJson, ErrorResponse::class.java)
            errorObj.error
        } catch (e: Exception) {
            null
        }
    }
    
    private fun startMainActivity() {
        val intent = Intent(this, MainActivity::class.java)
        startActivity(intent)
        finish()
    }
    
    data class ErrorResponse(val error: String?)
}
