<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nightwatch_events', function (Blueprint $table) {
            $table->id();
            $table->string('t', 64);
            $table->double('occurred_at');
            $table->string('trace_id', 36)->nullable();
            $table->string('group_hash', 32)->nullable();
            $table->string('server', 255)->nullable();
            $table->string('deploy', 255)->nullable();
            $table->json('payload');
            $table->timestamp('created_at')->useCurrent();

            $table->index('occurred_at');
            $table->index(['t', 'occurred_at']);
            $table->index('trace_id');
            $table->index('group_hash');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nightwatch_events');
    }
};
