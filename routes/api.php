<?php

use App\Http\Controllers\AgentAuthController;
use App\Http\Controllers\IngestController;
use Illuminate\Support\Facades\Route;

Route::post('/agent-auth', [AgentAuthController::class, 'store']);
Route::post('/ingest', [IngestController::class, 'store']);
