package com.shigongrizhi.app.data.network

import com.shigongrizhi.app.data.model.*
import retrofit2.http.*

interface ApiService {
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse
    
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): RegisterResponse
    
    @GET("auth/devices")
    suspend fun getDevices(): List<Any>
    
    @GET("users")
    suspend fun getUsers(): List<User>
    
    @DELETE("users/{id}")
    suspend fun deleteUser(@Path("id") id: Int): Any
    
    @PUT("users/{id}/role")
    suspend fun updateUserRole(@Path("id") id: Int, @Body body: Map<String, String>): Any
    
    @PUT("users/{id}/password")
    suspend fun changePassword(@Path("id") id: Int, @Body request: ChangePasswordRequest): Any
    
    @GET("projects")
    suspend fun getProjects(): List<Project>
    
    @POST("projects")
    suspend fun createProject(@Body request: CreateProjectRequest): Project
    
    @DELETE("projects/{id}")
    suspend fun deleteProject(@Path("id") id: Int): Any
    
    @GET("logs/{projectId}")
    suspend fun getLogs(
        @Path("projectId") projectId: Int,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): LogListResponse
    
    @POST("logs/{projectId}")
    suspend fun createLog(
        @Path("projectId") projectId: Int,
        @Body request: CreateLogRequest
    ): LogEntry
    
    @GET("logs/{projectId}/{logId}")
    suspend fun getLogDetail(
        @Path("projectId") projectId: Int,
        @Path("logId") logId: Int
    ): LogEntry
    
    @GET("logs/{projectId}/stats/summary")
    suspend fun getProjectStats(@Path("projectId") projectId: Int): Any
}
