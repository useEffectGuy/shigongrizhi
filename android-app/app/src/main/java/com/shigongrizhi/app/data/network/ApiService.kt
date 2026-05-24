package com.shigongrizhi.app.data.network

import com.shigongrizhi.app.data.model.*
import retrofit2.Call
import retrofit2.http.*

interface ApiService {
    
    @POST("auth/login")
    fun login(@Body request: LoginRequest): Call<LoginResponse>
    
    @POST("auth/register")
    fun register(@Body request: RegisterRequest): Call<RegisterResponse>
    
    @GET("auth/devices")
    fun getDevices(): Call<List<Any>>
    
    @GET("users")
    fun getUsers(): Call<List<User>>
    
    @DELETE("users/{id}")
    fun deleteUser(@Path("id") id: Int): Call<Any>
    
    @PUT("users/{id}/role")
    fun updateUserRole(@Path("id") id: Int, @Body body: Map<String, String>): Call<Any>
    
    @PUT("users/{id}/password")
    fun changePassword(@Path("id") id: Int, @Body request: ChangePasswordRequest): Call<Any>
    
    @GET("projects")
    fun getProjects(): Call<List<Project>>
    
    @POST("projects")
    fun createProject(@Body request: CreateProjectRequest): Call<Project>
    
    @DELETE("projects/{id}")
    fun deleteProject(@Path("id") id: Int): Call<Any>
    
    @GET("logs/{projectId}")
    fun getLogs(
        @Path("projectId") projectId: Int,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Call<LogListResponse>
    
    @POST("logs/{projectId}")
    fun createLog(
        @Path("projectId") projectId: Int,
        @Body request: CreateLogRequest
    ): Call<LogEntry>
    
    @GET("logs/{projectId}/{logId}")
    fun getLogDetail(
        @Path("projectId") projectId: Int,
        @Path("logId") logId: Int
    ): Call<LogEntry>
    
    @GET("logs/{projectId}/stats")
    fun getProjectStats(@Path("projectId") projectId: Int): Call<Any>
}
