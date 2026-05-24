package com.shigongrizhi.app.data.model

import com.google.gson.annotations.SerializedName

data class Project(
    @SerializedName("id") val id: Int,
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String? = null,
    @SerializedName("created_by") val createdBy: Int? = null,
    @SerializedName("created_at") val createdAt: String? = null
)

data class CreateProjectRequest(
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String? = null
)
