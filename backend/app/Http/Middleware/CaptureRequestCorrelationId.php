<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class CaptureRequestCorrelationId
{
    /**
     * Handle an incoming request and attach unique correlation ID for end-to-end operational tracing.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $correlationId = $request->header('X-Request-ID')
            ?? $request->header('X-Correlation-ID')
            ?? (string) Str::uuid();

        $request->attributes->set('correlation_id', $correlationId);

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Request-ID', $correlationId);

        return $response;
    }
}
