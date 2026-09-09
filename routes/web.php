<?php

use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnvironmentController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\IssueController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\OrganizationMemberController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/', HomeController::class)->name('home');

    Route::get('organizations', [OrganizationController::class, 'index'])->name('organizations.index');
    Route::get('organizations/create', [OrganizationController::class, 'create'])->name('organizations.create');
    Route::post('organizations', [OrganizationController::class, 'store'])->name('organizations.store');
    Route::get('organizations/{organization}', [OrganizationController::class, 'show'])->name('organizations.show');
    Route::post('organizations/{organization}/members', [OrganizationMemberController::class, 'store'])->name('organizations.members.store');
    Route::delete('organizations/{organization}/members/{user}', [OrganizationMemberController::class, 'destroy'])->name('organizations.members.destroy');
    Route::post('organizations/{organization}/applications', [ApplicationController::class, 'store'])->name('applications.store');
    Route::patch('organizations/{organization}/applications/{application}', [ApplicationController::class, 'update'])->name('applications.update');
    Route::delete('organizations/{organization}/applications/{application}', [ApplicationController::class, 'destroy'])->name('applications.destroy');
    Route::post('applications/{application}/environments', [EnvironmentController::class, 'store'])->name('environments.store');

    Route::middleware('environment')->prefix('environments/{environment}')->scopeBindings()->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('requests', [DashboardController::class, 'requests'])->name('requests');
        Route::get('requests/{groupHash}', [DashboardController::class, 'requestGroup'])->name('requests.show');
        Route::get('exceptions', [DashboardController::class, 'exceptions'])->name('exceptions');
        Route::get('exceptions/{groupHash}', [DashboardController::class, 'exceptionGroup'])->name('exceptions.show');
        Route::get('queries', [DashboardController::class, 'queries'])->name('queries');
        Route::get('queries/{groupHash}', [DashboardController::class, 'queryGroup'])->name('queries.show');
        Route::get('commands', [DashboardController::class, 'commands'])->name('commands');
        Route::get('commands/{groupHash}', [DashboardController::class, 'commandGroup'])->name('commands.show');
        Route::get('jobs', [DashboardController::class, 'jobs'])->name('jobs');
        Route::get('jobs/{groupHash}', [DashboardController::class, 'jobGroup'])->name('jobs.show');
        Route::get('scheduled-tasks', [DashboardController::class, 'scheduledTasks'])->name('scheduled-tasks');
        Route::get('scheduled-tasks/{groupHash}', [DashboardController::class, 'scheduledTaskGroup'])->name('scheduled-tasks.show');
        Route::get('outgoing-requests', [DashboardController::class, 'outgoingRequests'])->name('outgoing-requests');
        Route::get('outgoing-requests/{groupHash}', [DashboardController::class, 'outgoingRequestGroup'])->name('outgoing-requests.show');
        Route::get('cache', [DashboardController::class, 'cache'])->name('cache');
        Route::get('cache/{groupHash}', [DashboardController::class, 'cacheGroup'])->name('cache.show');
        Route::get('mail', [DashboardController::class, 'mail'])->name('mail');
        Route::get('mail/{groupHash}', [DashboardController::class, 'mailGroup'])->name('mail.show');
        Route::get('notifications', [DashboardController::class, 'notifications'])->name('notifications');
        Route::get('notifications/{groupHash}', [DashboardController::class, 'notificationGroup'])->name('notifications.show');
        Route::get('issues', [IssueController::class, 'index'])->name('issues.index');
        Route::get('issues/{issue}', [IssueController::class, 'show'])->name('issues.show');
        Route::get('traces/{traceId}', [DashboardController::class, 'trace'])->name('traces.show');
        Route::get('settings', [EnvironmentController::class, 'show'])->name('environments.settings');
        Route::patch('/', [EnvironmentController::class, 'update'])->name('environments.update');
        Route::post('token', [EnvironmentController::class, 'rotate'])->name('environments.token.rotate');
        Route::delete('/', [EnvironmentController::class, 'destroy'])->name('environments.destroy');
    });
});
