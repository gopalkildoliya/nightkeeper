<?php

namespace App\Services;

class IngestJwt
{
    public function sign(string $secret, string $server, string $environmentId, ?int $nowMs = null, int $expiresInSec = 3600): string
    {
        $nowSec = intdiv($nowMs ?? (int) floor(microtime(true) * 1000), 1000);
        $header = $this->base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
        $payload = $this->base64UrlEncode(json_encode([
            'iss' => 'nightkeeper',
            'aud' => 'ingest',
            'srv' => $server,
            'env' => $environmentId,
            'iat' => $nowSec,
            'exp' => $nowSec + $expiresInSec,
        ], JSON_THROW_ON_ERROR));
        $unsigned = $header.'.'.$payload;

        return $unsigned.'.'.$this->base64UrlEncode(hash_hmac('sha256', $unsigned, $secret, true));
    }

    /**
     * @return array{iss: string, aud: string, srv: string, env: string, iat: int, exp: int}|null
     */
    public function verify(string $secret, string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;
        $expected = hash_hmac('sha256', $header.'.'.$payload, $secret, true);
        $actual = $this->base64UrlDecode($signature);
        if ($actual === null || ! hash_equals($expected, $actual)) {
            return null;
        }

        try {
            /** @var array{iss?: mixed, aud?: mixed, srv?: mixed, env?: mixed, iat?: mixed, exp?: mixed} $claims */
            $claims = json_decode($this->base64UrlDecode($payload) ?? '', true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }

        if (($claims['iss'] ?? null) !== 'nightkeeper' || ($claims['aud'] ?? null) !== 'ingest' || ! is_string($claims['srv'] ?? null)) {
            return null;
        }

        if (! is_string($claims['env'] ?? null) || $claims['env'] === '') {
            return null;
        }

        if (! is_int($claims['exp'] ?? null) && ! is_float($claims['exp'] ?? null)) {
            return null;
        }

        if ((int) $claims['exp'] <= time()) {
            return null;
        }

        return [
            'iss' => 'nightkeeper',
            'aud' => 'ingest',
            'srv' => $claims['srv'],
            'env' => $claims['env'],
            'iat' => (int) ($claims['iat'] ?? $claims['exp']),
            'exp' => (int) $claims['exp'],
        ];
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): ?string
    {
        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        return $decoded === false ? null : $decoded;
    }
}
