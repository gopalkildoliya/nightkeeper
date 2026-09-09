<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('issues', function (Blueprint $table) {
            $table->id();
            $table->string('group_hash', 32)->unique();
            $table->string('class', 255);
            $table->text('message');
            $table->string('file', 255)->nullable();
            $table->unsignedInteger('line')->nullable();
            $table->double('first_seen_at');
            $table->double('last_seen_at');
            $table->unsignedInteger('occurrences')->default(0);
            $table->unsignedInteger('users_affected')->default(0);
            $table->string('status', 16)->default('open');
            $table->timestamps();

            $table->index(['status', 'last_seen_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issues');
    }
};
