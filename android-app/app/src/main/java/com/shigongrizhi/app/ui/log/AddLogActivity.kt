package com.shigongrizhi.app.ui.log

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.chip.Chip
import com.shigongrizhi.app.R
import com.shigongrizhi.app.data.local.AppPreferences
import com.shigongrizhi.app.data.model.*
import com.shigongrizhi.app.data.network.ApiService
import com.shigongrizhi.app.data.network.RetrofitClient
import com.shigongrizhi.app.databinding.ActivityAddLogBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class AddLogActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityAddLogBinding
    private lateinit var apiService: ApiService
    
    private val workers = mutableListOf<WorkerItem>()
    private val materials = mutableListOf<MaterialItem>()
    private val equipment = mutableListOf<EquipmentItem>()
    
    private val weatherOptions = arrayOf("晴", "多云", "阴", "小雨", "中雨", "大雨", "雪", "雾")
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAddLogBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        apiService = RetrofitClient.createService(ApiService::class.java)
        
        setupToolbar()
        setupWeatherSpinner()
        setupClickListeners()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "新建日志"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }
    }
    
    private fun setupWeatherSpinner() {
        val adapter = ArrayAdapter(
            this,
            R.layout.item_spinner_project,
            weatherOptions
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerWeather.adapter = adapter
    }
    
    private fun setupClickListeners() {
        binding.apply {
            btnAddWorker.setOnClickListener { showAddWorkerDialog() }
            btnAddMaterial.setOnClickListener { showAddMaterialDialog() }
            btnAddEquipment.setOnClickListener { showAddEquipmentDialog() }
            btnSave.setOnClickListener { saveLog() }
        }
    }
    
    private fun showAddWorkerDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_item, null)
        val etName = dialogView.findViewById<EditText>(R.id.etName)
        val etCount = dialogView.findViewById<EditText>(R.id.etCount)
        val tvTitle = dialogView.findViewById<TextView>(R.id.tvDialogTitle)
        val tvNameHint = dialogView.findViewById<TextView>(R.id.tvNameHint)
        val tvCountHint = dialogView.findViewById<TextView>(R.id.tvCountHint)
        
        tvTitle.text = "添加人员"
        tvNameHint.text = "姓名"
        tvCountHint.text = "人数"
        etCount.setText("1")
        
        AlertDialog.Builder(this)
            .setView(dialogView)
            .setPositiveButton("添加") { _, _ ->
                val name = etName.text.toString().trim()
                val count = etCount.text.toString().toIntOrNull() ?: 1
                if (name.isNotEmpty()) {
                    workers.add(WorkerItem(name, count))
                    updateWorkerChips()
                }
            }
            .setNegativeButton("取消", null)
            .show()
    }
    
    private fun showAddMaterialDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_item, null)
        val etName = dialogView.findViewById<EditText>(R.id.etName)
        val etCount = dialogView.findViewById<EditText>(R.id.etCount)
        val tvTitle = dialogView.findViewById<TextView>(R.id.tvDialogTitle)
        val tvNameHint = dialogView.findViewById<TextView>(R.id.tvNameHint)
        val tvCountHint = dialogView.findViewById<TextView>(R.id.tvCountHint)
        
        tvTitle.text = "添加材料"
        tvNameHint.text = "材料名称"
        tvCountHint.text = "数量"
        etCount.setText("1")
        
        AlertDialog.Builder(this)
            .setView(dialogView)
            .setPositiveButton("添加") { _, _ ->
                val name = etName.text.toString().trim()
                val count = etCount.text.toString().toIntOrNull() ?: 1
                if (name.isNotEmpty()) {
                    materials.add(MaterialItem(name, count))
                    updateMaterialChips()
                }
            }
            .setNegativeButton("取消", null)
            .show()
    }
    
    private fun showAddEquipmentDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_item, null)
        val etName = dialogView.findViewById<EditText>(R.id.etName)
        val etCount = dialogView.findViewById<EditText>(R.id.etCount)
        val tvTitle = dialogView.findViewById<TextView>(R.id.tvDialogTitle)
        val tvNameHint = dialogView.findViewById<TextView>(R.id.tvNameHint)
        val tvCountHint = dialogView.findViewById<TextView>(R.id.tvCountHint)
        
        tvTitle.text = "添加机械"
        tvNameHint.text = "机械名称"
        tvCountHint.text = "数量"
        etCount.setText("1")
        
        AlertDialog.Builder(this)
            .setView(dialogView)
            .setPositiveButton("添加") { _, _ ->
                val name = etName.text.toString().trim()
                val count = etCount.text.toString().toIntOrNull() ?: 1
                if (name.isNotEmpty()) {
                    equipment.add(EquipmentItem(name, count))
                    updateEquipmentChips()
                }
            }
            .setNegativeButton("取消", null)
            .show()
    }
    
    private fun updateWorkerChips() {
        binding.chipGroupWorkers.removeAllViews()
        workers.forEachIndexed { index, item ->
            val chip = Chip(this).apply {
                text = "${item.name} ×${item.count}"
                isCloseIconVisible = true
                setOnCloseIconClickListener {
                    workers.removeAt(index)
                    updateWorkerChips()
                }
            }
            binding.chipGroupWorkers.addView(chip)
        }
    }
    
    private fun updateMaterialChips() {
        binding.chipGroupMaterials.removeAllViews()
        materials.forEachIndexed { index, item ->
            val chip = Chip(this).apply {
                text = "${item.name} ×${item.count}"
                isCloseIconVisible = true
                setOnCloseIconClickListener {
                    materials.removeAt(index)
                    updateMaterialChips()
                }
            }
            binding.chipGroupMaterials.addView(chip)
        }
    }
    
    private fun updateEquipmentChips() {
        binding.chipGroupEquipment.removeAllViews()
        equipment.forEachIndexed { index, item ->
            val chip = Chip(this).apply {
                text = "${item.name} ×${item.count}"
                isCloseIconVisible = true
                setOnCloseIconClickListener {
                    equipment.removeAt(index)
                    updateEquipmentChips()
                }
            }
            binding.chipGroupEquipment.addView(chip)
        }
    }
    
    private fun saveLog() {
        val projectId = AppPreferences.getCurrentProjectId()
        if (projectId == 0) {
            Toast.makeText(this, "请先选择项目", Toast.LENGTH_SHORT).show()
            return
        }
        
        val content = binding.etContent.text.toString().trim()
        if (content.isEmpty()) {
            Toast.makeText(this, "请输入施工内容", Toast.LENGTH_SHORT).show()
            return
        }
        
        val weather = weatherOptions[binding.spinnerWeather.selectedItemPosition]
        val temperature = binding.etTemperature.text.toString().toDoubleOrNull()
        
        val request = CreateLogRequest(
            weather = weather,
            temperature = temperature,
            content = content,
            workers = workers,
            materials = materials,
            equipment = equipment
        )
        
        binding.btnSave.isEnabled = false
        binding.progressBar.visibility = View.VISIBLE
        
        lifecycleScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    apiService.createLog(projectId, request).execute()
                }
                
                withContext(Dispatchers.Main) {
                    binding.btnSave.isEnabled = true
                    binding.progressBar.visibility = View.GONE
                    
                    if (response.isSuccessful) {
                        Toast.makeText(this@AddLogActivity, "日志保存成功", Toast.LENGTH_SHORT).show()
                        setResult(RESULT_OK)
                        finish()
                    } else {
                        Toast.makeText(this@AddLogActivity, "保存失败", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.btnSave.isEnabled = true
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this@AddLogActivity, "网络错误: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
