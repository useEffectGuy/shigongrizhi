package com.shigongrizhi.app.data.model

import com.google.gson.annotations.SerializedName

data class LogEntry(
    @SerializedName("id") val id: Int,
    @SerializedName("project_id") val projectId: Int,
    @SerializedName("user_id") val userId: Int,
    @SerializedName("weather") val weather: String? = null,
    @SerializedName("temperature") val temperature: Double? = null,
    @SerializedName("content") val content: String? = null,
    @SerializedName("workers") val workers: List<WorkerItem> = emptyList(),
    @SerializedName("materials") val materials: List<MaterialItem> = emptyList(),
    @SerializedName("equipment") val equipment: List<EquipmentItem> = emptyList(),
    @SerializedName("created_at") val createdAt: String? = null,
    @SerializedName("updated_at") val updatedAt: String? = null
)

data class WorkerItem(
    @SerializedName("name") val name: String,
    @SerializedName("count") val count: Int
)

data class MaterialItem(
    @SerializedName("name") val name: String,
    @SerializedName("count") val count: Int
)

data class EquipmentItem(
    @SerializedName("name") val name: String,
    @SerializedName("count") val count: Int
)

data class CreateLogRequest(
    @SerializedName("weather") val weather: String? = null,
    @SerializedName("temperature") val temperature: Double? = null,
    @SerializedName("content") val content: String? = null,
    @SerializedName("workers") val workers: List<WorkerItem> = emptyList(),
    @SerializedName("materials") val materials: List<MaterialItem> = emptyList(),
    @SerializedName("equipment") val equipment: List<EquipmentItem> = emptyList()
)

data class LogListResponse(
    @SerializedName("logs") val logs: List<LogEntry>,
    @SerializedName("total") val total: Int,
    @SerializedName("page") val page: Int,
    @SerializedName("limit") val limit: Int
)
