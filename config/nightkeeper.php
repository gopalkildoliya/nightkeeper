<?php

return [
    'signing_key' => env('INGEST_SIGNING_KEY', ''),
    'expires_in' => 3600,
    'refresh_in' => 3000,
    'slow_route_us' => (int) env('NIGHTKEEPER_SLOW_ROUTE_MS', 2000) * 1000,
];
