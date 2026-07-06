package com.shigongrizhi.app.ui.settings

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.shigongrizhi.app.R
import com.shigongrizhi.app.data.local.AppPreferences
import com.shigongrizhi.app.data.model.ChangePasswordRequest
import com.shigongrizhi.app.data.network.ApiService
import com.shigongrizhi.app.data.network.RetrofitClient
import com.shigongrizhi.app.databinding.ActivitySettingsBinding
import com.shigongrizhi.app.ui.login.LoginActivity
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class SettingsActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivitySettingsBinding
    private lateinit var apiService: ApiService
    
    private val dateFormat = SimpleDateFormat("MM月dd日 HH:mm", Locale.CHINA)
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        apiService = RetrofitClient.createService(ApiService::class.java)
        
        setupToolbar()
        setupUserInfo()
        setupClickListeners()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "设置"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }
    }
    
    private fun setupUserInfo() {
        val username = AppPreferences.getUsername()
        val role = if (AppPreferences.isAdmin()) "管理员" else "普通用户"
        
        binding.tvUsername.text = username
        binding.tvRole.text = role
        
        if (AppPreferences.isAdmin()) {
            binding.llUserManagement.visibility = View.VISIBLE
            binding.llProjectManagement.visibility = View.VISIBLE
        } else {
            binding.llUserManagement.visibility = View.GONE
            binding.llProjectManagement.visibility = View.GONE
        }
        
        val loginTime = AppPreferences.getLoginTime()
        if (loginTime > 0) {
            binding.tvLoginTime.text = dateFormat.format(Date(loginTime))
        }
    }
    
    private fun setupClickListeners() {
        binding.apply {
            llChangePassword.setOnClickListener { showChangePasswordDialog() }
            llDeviceManagement.setOnClickListener { showToast("设备管理功能开发中") }
            llHelpCenter.setOnClickListener { showHelpCenter() }
            llUserManagement.setOnClickListener { showToast("用户管理功能开发中") }
            llProjectManagement.setOnClickListener { showToast("项目管理功能开发中") }
            btnLogout.setOnClickListener { showLogoutConfirm() }
        }
    }
    
    private fun showChangePasswordDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_change_password, null)
        val etOldPassword = dialogView.findViewById<EditText>(R.id.etOldPassword)
        val etNewPassword = dialogView.findViewById<EditText>(R.id.etNewPassword)
        val etConfirmPassword = dialogView.findViewById<EditText>(R.id.etConfirmPassword)
        
        AlertDialog.Builder(this)
            .setTitle("修改密码")
            .setView(dialogView)
            .setPositiveButton("确认") { _, _ ->
                val oldPassword = etOldPassword.text.toString()
                val newPassword = etNewPassword.text.toString()
                val confirmPassword = etConfirmPassword.text.toString()
                
                if (oldPassword.isEmpty() || newPassword.isEmpty() || confirmPassword.isEmpty()) {
                    showToast("请填写所有字段")
                    return@setPositiveButton
                }
                
                if (newPassword.length < 6) {
                    showToast("新密码至少需要6位")
                    return@setPositiveButton
                }
                
                if (newPassword != confirmPassword) {
                    showToast("两次输入的新密码不一致")
                    return@setPositiveButton
                }
                
                changePassword(oldPassword, newPassword)
            }
            .setNegativeButton("取消", null)
            .show()
    }
    
    private fun changePassword(oldPassword: String, newPassword: String) {
        val userId = AppPreferences.getUserId()
        
        lifecycleScope.launch {
            try {
                apiService.changePassword(
                    userId,
                    ChangePasswordRequest(oldPassword, newPassword)
                )
                showToast("密码修改成功")
            } catch (e: Exception) {
                showToast("密码修改失败: ${e.message}")
            }
        }
    }
    
    private fun showHelpCenter() {
        val helpText = """
            施工日志系统 v1.1.0
            
            主要功能：
            • 项目管理：创建和管理多个项目
            • 日志记录：记录每日施工内容
            • 人员管理：记录施工人员信息
            • 数据统计：人员、材料、机械统计
            
            测试账号：
            • 普通用户：demo / 123456
            • 管理员：admin / admin123
            
            如有问题，请联系系统管理员
        """.trimIndent()
        
        AlertDialog.Builder(this)
            .setTitle("帮助中心")
            .setMessage(helpText)
            .setPositiveButton("知道了", null)
            .show()
    }
    
    private fun showLogoutConfirm() {
        AlertDialog.Builder(this)
            .setTitle("退出登录")
            .setMessage("确定要退出登录吗？")
            .setPositiveButton("确定") { _, _ ->
                logout()
            }
            .setNegativeButton("取消", null)
            .show()
    }
    
    private fun logout() {
        AppPreferences.clear()
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}
