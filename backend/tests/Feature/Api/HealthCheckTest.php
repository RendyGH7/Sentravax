<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_check_endpoint_returns_valid_json_structure(): void
    {
        $response = $this->getJson('/api/v1/health');

        $this->assertContains($response->getStatusCode(), [200, 503]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'application',
                'status',
                'database',
                'framework',
                'environment',
            ],
            'meta' => [
                'timestamp',
            ],
        ]);

        $content = (string) $response->getContent();
        fwrite(STDOUT, "\n[API HEALTH RESPONSE]\n" . json_encode(json_decode($content), JSON_PRETTY_PRINT) . "\n");
        $this->assertStringNotContainsStringIgnoringCase('password', $content);
        $this->assertStringNotContainsString('admin123', $content);
        $this->assertStringNotContainsString('APP_KEY', $content);
    }
}
