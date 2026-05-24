package com.shigongrizhi.app.ui.log

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.chip.Chip
import com.shigongrizhi.app.R
import com.shigongrizhi.app.data.model.LogEntry
import com.shigongrizhi.app.data.network.ApiService
import com.shigongrizhi.app.data.network.RetrofitClient
import com.shigongrizhi.app.databinding.ActivityLogDetailBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

class LogDetailActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLogDetailBinding
    private lateinit var apiService: ApiService
    
    private val dateFormat = SimpleDateFormat("yyyy年MM月dd日 HH:mm", Locale.CHINA)
    private val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.CHINA)
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLogDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        apiService = RetrofitClient.createService(ApiService::class.java)
        
        setupToolbar()
        
        val logId = intent.getIntExtra("log_id", 0)
        val projectId = intent.getIntExtra("project_id", 0)
        
        if (logId > 0 && projectId > 0) {
            loadLogDetail(projectId, logId)
        } else {
            Toast.makeText(this, "日志数据错误", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "日志详情"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }
    }
    
    private fun loadLogDetail(projectId: Int, logId: Int) {
        binding.progressBar.visibility = View.VISIBLE
        
        lifecycleScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    apiService.getLogDetail(projectId, logId).execute()
                }
                
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    if (response.isSuccessful && response.body() != null) {
                        bindLogData(response.body()!!)
                    } else {
                        Toast.makeText(this@LogDetailActivity, "加载失败", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this@LogDetailActivity, "网络错误: ${e.message}", Toast.LENGTH_SHORT).show()
                    finish()
                }
            }
        }
    }
    
    private fun bindLogData(log: LogEntry) {
        binding.apply {
            val date = parseDate(log.createdAt)
            tvCreatedAt.text = if (date != null) dateFormat.format(date) else log.createdAt ?: ""
            
            tvContent.text = log.content ?: "暂无内容"
            
            val tags = mutableListOf<String>()
            if (!log.weather.isNullOrEmpty()) {
                tags.add(log.weather!!)
            }
            if (log.temperature != null) {
                tags.add("${log.temperature}°C")
            }
            
            if (tags.isNotEmpty()) {
                tvWeatherTags.text = tags.joinToString("   ")
                tvWeatherTags.visibility = View.VISIBLE
            } else {
                tvWeatherTags.visibility = View.GONE
            }
            
            chipGroupWorkers.removeAllViews()
            chipGroupMaterials.removeAllViews()
            chipGroupEquipment.removeAllViews()
            
            if (log.workers.isNotEmpty()) {
                tvWorkersTitle.visibility = View.VISIBLE
                log.workers.forEach {
                    val chip = Chip(this@LogDetailActivity).apply {
                        text = "${it.name} ×${it.count}"
                    }
                    chipGroupWorkers.addView(chip)
                }
            } else {
                tvWorkersTitle.visibility = View.GONE
            }
            
            if (log.materials.isNotEmpty()) {
                tvMaterialsTitle.visibility = View.VISIBLE
                log.materials.forEach {
                    val chip = Chip(this@LogDetailActivity).apply {
                        text = "${it.name} ×${it.count}"
                    }
                    chipGroupMaterials.addView(chip)
                }
            } else {
                tvMaterialsTitle.visibility = View.GONE
            }
            
            if (log.equipment.isNotEmpty()) {
                tvEquipmentTitle.visibility = View.VISIBLE
                log.equipment.forEach {
                    val chip = Chip(this@LogDetailActivity).apply {
                        text = "${it.name} ×${it.count}"
                    }
                    chipGroupEquipment.addView(chip)
                }
            } else {
                tvEquipmentTitle.visibility = View.GONE
            }
        }
    }
    
    private fun parseDate(dateStr: String?): Date? {
        return try {
            sdf.parse(dateStr ?: "")
        } catch (e: Exception) {
            null
        }
    }
}
