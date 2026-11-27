<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    protected function setUpTraits(): array
    {
        if (app()->environment('testing')) {
            $connection = config('database.default');
            $dbName = config("database.connections.{$connection}.database");
            if (empty($dbName) || $dbName === 'sentravax_db') {
                throw new \RuntimeException(
                    "SAFETY GUARD: PHPUnit refuses to run against primary database [{$dbName}]. Configure a dedicated test database (e.g. sentravax_test)."
                );
            }
        }

        return parent::setUpTraits();
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}
