<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nightwatch_events', function (Blueprint $table) {
            $table->unsignedBigInteger('duration_us')->nullable();
            $table->unsignedInteger('status_code')->nullable();
            $table->boolean('handled')->nullable();
            $table->string('user_id', 255)->nullable();
            $table->string('status', 32)->nullable();
            $table->string('label', 255)->nullable();

            $table->index(['t', 'group_hash', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::table('nightwatch_events', function (Blueprint $table) {
            $table->dropIndex(['t', 'group_hash', 'occurred_at']);
            $table->dropColumn(['duration_us', 'status_code', 'handled', 'user_id', 'status', 'label']);
        });
    }
};
