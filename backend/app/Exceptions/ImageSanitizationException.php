<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImageSanitizationException extends Exception
{
    /**
     * Render the exception as an HTTP response.
     */
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage() ?: 'Gagal memproses dan mensanitasi foto secara aman.',
            'error_code' => 'IMAGE_SANITIZATION_FAILED',
        ], 422);
    }
}
