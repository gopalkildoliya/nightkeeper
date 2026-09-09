<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('organization_user', function (Blueprint $table) {
            $table->uuid('organization_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 16);
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->unique(['organization_id', 'user_id']);
        });

        Schema::create('applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('environments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('application_id');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->timestamps();

            $table->foreign('application_id')->references('id')->on('applications')->cascadeOnDelete();
        });

        Schema::table('nightwatch_events', function (Blueprint $table) {
            $table->uuid('environment_id')->nullable()->after('id');
            $table->foreign('environment_id')->references('id')->on('environments')->cascadeOnDelete();
        });

        Schema::table('issues', function (Blueprint $table) {
            $table->dropUnique(['group_hash']);
            $table->uuid('environment_id')->nullable()->after('id');
            $table->unique(['environment_id', 'group_hash']);
            $table->foreign('environment_id')->references('id')->on('environments')->cascadeOnDelete();
        });

        $this->backfillDefaultEnvironment();
    }

    public function down(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->dropForeign(['environment_id']);
            $table->dropUnique(['environment_id', 'group_hash']);
            $table->dropColumn('environment_id');
            $table->unique('group_hash');
        });

        Schema::table('nightwatch_events', function (Blueprint $table) {
            $table->dropForeign(['environment_id']);
            $table->dropColumn('environment_id');
        });

        Schema::dropIfExists('environments');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('organization_user');
        Schema::dropIfExists('organizations');
    }

    private function backfillDefaultEnvironment(): void
    {
        if (! DB::table('nightwatch_events')->exists() && ! DB::table('issues')->exists()) {
            return;
        }

        $now = now();
        $organizationId = (string) Str::uuid();
        $applicationId = (string) Str::uuid();
        $environmentId = (string) Str::uuid();

        DB::table('organizations')->insert([
            'id' => $organizationId,
            'name' => 'Local',
            'slug' => 'local',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('applications')->insert([
            'id' => $applicationId,
            'organization_id' => $organizationId,
            'name' => 'Default',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('environments')->insert([
            'id' => $environmentId,
            'application_id' => $applicationId,
            'name' => 'Production',
            'token' => Str::password(44, symbols: false),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('nightwatch_events')->whereNull('environment_id')->update(['environment_id' => $environmentId]);
        DB::table('issues')->whereNull('environment_id')->update(['environment_id' => $environmentId]);
    }
};
