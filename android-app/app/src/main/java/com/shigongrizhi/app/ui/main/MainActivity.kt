package com.shigongrizhi.app.ui.main

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.shigongrizhi.app.R
import com.shigongrizhi.app.data.local.AppPreferences
import com.shigongrizhi.app.data.model.*
import com.shigongrizhi.app.data.network.ApiService
import com.shigongrizhi.app.data.network.RetrofitClient
import com.shigongrizhi.app.databinding.ActivityMainBinding
import com.shigongrizhi.app.ui.login.LoginActivity
import com.shigongrizhi.app.ui.log.AddLogActivity
import com.shigongrizhi.app.ui.log.LogDetailActivity
import com.shigongrizhi.app.ui.settings.SettingsActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var apiService: ApiService
    
    private var projects = listOf<Project>()
    private var logs = listOf<LogEntry>()
    private var currentFilter = "all"
    
    private lateinit var logAdapter: LogAdapter
    
    private val dateFormat = SimpleDateFormat("MM月dd日 HH:mm", Locale.CHINA)
    private val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.CHINA)
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        apiService = RetrofitClient.createService(ApiService::class.java)
        
        setupToolbar()
        setupRecyclerView()
        setupClickListeners()
        loadProjects()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "施工日志"
        
        val username = AppPreferences.getUsername()
        val role = if (AppPreferences.isAdmin()) "管理员" else "项目成员"
        binding.tvUserInfo.text = "$username · $role"
        
        val loginTime = AppPreferences.getLoginTime()
        if (loginTime > 0) {
            val loginDate = Date(loginTime)
            binding.tvLoginTime.text = "登录时间: ${dateFormat.format(loginDate)}"
        }
    }
    
    private fun setupRecyclerView() {
        logAdapter = LogAdapter { log ->
            val intent = Intent(this, LogDetailActivity::class.java)
            intent.putExtra("log_id", log.id)
            intent.putExtra("project_id", log.projectId)
            startActivity(intent)
        }
        
        binding.rvLogs.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = logAdapter
        }
    }
    
    private fun setupClickListeners() {
        binding.apply {
            fabAddLog.setOnClickListener {
                if (AppPreferences.getCurrentProjectId() == 0) {
                    Toast.makeText(this@MainActivity, "请先选择项目", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }
                val intent = Intent(this@MainActivity, AddLogActivity::class.java)
                startActivityForResult(intent, REQUEST_ADD_LOG)
            }
            
            cardStatTotal.setOnClickListener { setFilter("all") }
            cardStatWeek.setOnClickListener { setFilter("week") }
            cardStatToday.setOnClickListener { setFilter("today") }
        }
    }
    
    private fun loadProjects() {
        lifecycleScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    apiService.getProjects().execute()
                }
                
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful && response.body() != null) {
                        projects = response.body()!!
                        setupProjectSpinner()
                        
                        if (AppPreferences.getCurrentProjectId() == 0 && projects.isNotEmpty()) {
                            AppPreferences.setCurrentProject(projects[0].id, projects[0].name)
                            binding.spinnerProjects.setSelection(0)
                        }
                        
                        loadLogs()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "加载项目失败: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
    
    private fun setupProjectSpinner() {
        val projectNames = projects.map { it.name }.toMutableList()
        if (projectNames.isEmpty()) {
            projectNames.add("暂无项目")
        }
        
        val adapter = ArrayAdapter(
            this,
            R.layout.item_spinner_project,
            projectNames
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        
        binding.spinnerProjects.adapter = adapter
        
        val savedProjectId = AppPreferences.getCurrentProjectId()
        if (savedProjectId > 0) {
            val index = projects.indexOfFirst { it.id == savedProjectId }
            if (index >= 0) {
                binding.spinnerProjects.setSelection(index)
            }
        }
        
        binding.spinnerProjects.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                if (projects.isNotEmpty() && position < projects.size) {
                    val project = projects[position]
                    AppPreferences.setCurrentProject(project.id, project.name)
                    loadLogs()
                }
            }
            
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }
    
    private fun setFilter(filter: String) {
        currentFilter = filter
        updateStatCards()
        filterLogs()
    }
    
    private fun updateStatCards() {
        binding.apply {
            cardStatTotal.setBackgroundResource(if (currentFilter == "all") R.drawable.bg_stat_active else R.drawable.bg_stat)
            cardStatWeek.setBackgroundResource(if (currentFilter == "week") R.drawable.bg_stat_active else R.drawable.bg_stat)
            cardStatToday.setBackgroundResource(if (currentFilter == "today") R.drawable.bg_stat_active else R.drawable.bg_stat)
            
            val colorTotal = if (currentFilter == "all") R.color.white else R.color.color_primary
            val colorWeek = if (currentFilter == "week") R.color.white else R.color.color_primary
            val colorToday = if (currentFilter == "today") R.color.white else R.color.color_primary
            
            tvStatTotal.setTextColor(resources.getColor(colorTotal))
            tvStatWeek.setTextColor(resources.getColor(colorWeek))
            tvStatToday.setTextColor(resources.getColor(colorToday))
            
            tvStatTotalLabel.setTextColor(resources.getColor(if (currentFilter == "all") R.color.white_80 else R.color.text_secondary))
            tvStatWeekLabel.setTextColor(resources.getColor(if (currentFilter == "week") R.color.white_80 else R.color.text_secondary))
            tvStatTodayLabel.setTextColor(resources.getColor(if (currentFilter == "today") R.color.white_80 else R.color.text_secondary))
        }
    }
    
    private fun loadLogs() {
        val projectId = AppPreferences.getCurrentProjectId()
        if (projectId == 0) {
            logs = emptyList()
            updateStatCounts()
            filterLogs()
            return
        }
        
        lifecycleScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    apiService.getLogs(projectId, 1, 50).execute()
                }
                
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful && response.body() != null) {
                        logs = response.body()!!.logs
                        updateStatCounts()
                        filterLogs()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    logs = emptyList()
                    updateStatCounts()
                    filterLogs()
                }
            }
        }
    }
    
    private fun updateStatCounts() {
        val now = Calendar.getInstance()
        val todayStart = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val weekStart = Calendar.getInstance().apply {
            time = todayStart.time
            add(Calendar.DAY_OF_YEAR, -6)
        }
        
        val todayCount = logs.count { log ->
            val logDate = parseDate(log.createdAt)
            logDate != null && logDate.after(todayStart.time)
        }
        
        val weekCount = logs.count { log ->
            val logDate = parseDate(log.createdAt)
            logDate != null && logDate.after(weekStart.time)
        }
        
        binding.apply {
            tvStatTotal.text = logs.size.toString()
            tvStatWeek.text = weekCount.toString()
            tvStatToday.text = todayCount.toString()
        }
    }
    
    private fun filterLogs() {
        val now = Calendar.getInstance()
        val todayStart = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val weekStart = Calendar.getInstance().apply {
            time = todayStart.time
            add(Calendar.DAY_OF_YEAR, -6)
        }
        
        val filteredLogs = when (currentFilter) {
            "today" -> logs.filter { log ->
                val logDate = parseDate(log.createdAt)
                logDate != null && logDate.after(todayStart.time)
            }
            "week" -> logs.filter { log ->
                val logDate = parseDate(log.createdAt)
                logDate != null && logDate.after(weekStart.time)
            }
            else -> logs
        }
        
        logAdapter.submitList(filteredLogs.sortedByDescending { it.createdAt })
    }
    
    private fun parseDate(dateStr: String?): Date? {
        return try {
            sdf.parse(dateStr ?: "")
        } catch (e: Exception) {
            null
        }
    }
    
    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu_main, menu)
        
        if (!AppPreferences.isAdmin()) {
            menu?.findItem(R.id.action_user_management)?.isVisible = false
            menu?.findItem(R.id.action_project_management)?.isVisible = false
        }
        
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_settings -> {
                val intent = Intent(this, SettingsActivity::class.java)
                startActivity(intent)
                true
            }
            R.id.action_user_management -> {
                Toast.makeText(this, "用户管理功能开发中", Toast.LENGTH_SHORT).show()
                true
            }
            R.id.action_project_management -> {
                Toast.makeText(this, "项目管理功能开发中", Toast.LENGTH_SHORT).show()
                true
            }
            R.id.action_logout -> {
                showLogoutConfirm()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
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
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_ADD_LOG && resultCode == RESULT_OK) {
            loadLogs()
        }
    }
    
    companion object {
        private const val REQUEST_ADD_LOG = 1001
    }
}
