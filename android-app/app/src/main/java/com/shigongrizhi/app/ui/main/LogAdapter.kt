package com.shigongrizhi.app.ui.main

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.shigongrizhi.app.data.model.LogEntry
import com.shigongrizhi.app.databinding.ItemLogBinding
import java.text.SimpleDateFormat
import java.util.*

class LogAdapter(
    private val onItemClick: (LogEntry) -> Unit
) : ListAdapter<LogEntry, LogAdapter.LogViewHolder>(LogDiffCallback()) {
    
    private val dateFormat = SimpleDateFormat("MM月dd日 HH:mm", Locale.CHINA)
    private val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.CHINA)
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LogViewHolder {
        val binding = ItemLogBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return LogViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: LogViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    inner class LogViewHolder(
        private val binding: ItemLogBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        init {
            binding.root.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onItemClick(getItem(position))
                }
            }
        }
        
        fun bind(log: LogEntry) {
            binding.apply {
                val date = parseDate(log.createdAt)
                if (date != null) {
                    tvDate.text = dateFormat.format(date)
                } else {
                    tvDate.text = log.createdAt ?: ""
                }
                
                tvContent.text = log.content ?: "暂无内容"
                
                val tags = mutableListOf<String>()
                if (!log.weather.isNullOrEmpty()) {
                    tags.add(log.weather!!)
                }
                if (log.temperature != null) {
                    tags.add("${log.temperature}°C")
                }
                log.workers.take(3).forEach {
                    tags.add("${it.name} ×${it.count}")
                }
                if (log.workers.size > 3) {
                    tags.add("+${log.workers.size - 3}")
                }
                
                tvTags.text = tags.joinToString("   ")
                
                if (tags.isEmpty()) {
                    tvTags.visibility = android.view.View.GONE
                } else {
                    tvTags.visibility = android.view.View.VISIBLE
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
    
    class LogDiffCallback : DiffUtil.ItemCallback<LogEntry>() {
        override fun areItemsTheSame(oldItem: LogEntry, newItem: LogEntry): Boolean {
            return oldItem.id == newItem.id
        }
        
        override fun areContentsTheSame(oldItem: LogEntry, newItem: LogEntry): Boolean {
            return oldItem == newItem
        }
    }
}
