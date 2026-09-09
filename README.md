# Nightkeeper

Self-hosted replacement for Laravel Nightwatch’s cloud. Keep `php artisan nightwatch:agent` on your app; point it here with `NIGHTWATCH_BASE_URL`.

## Laravel cloud (this directory)

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Dashboard: http://127.0.0.1:8000

Point a Nightwatch agent at this app:

```
NIGHTWATCH_BASE_URL=http://127.0.0.1:8000
NIGHTWATCH_TOKEN=dev-nightwatch-token
```

`INGEST_SIGNING_KEY` must match this app’s `.env`. Tests use sqlite in memory; local default is also sqlite. Switch `DB_CONNECTION` to `mysql` when you want MySQL.

```bash
php artisan test
```

