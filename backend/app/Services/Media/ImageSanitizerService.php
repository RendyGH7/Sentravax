<?php

namespace App\Services\Media;

use App\Exceptions\ImageSanitizationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageSanitizerService
{
    /**
     * Supported MIME types and their canonical extensions.
     */
    public const SUPPORTED_MIMES = [
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    /**
     * Sanitize image by stripping all EXIF/GPS/device metadata, fixing orientation,
     * and safely storing to target disk.
     *
     * @throws ImageSanitizationException
     */
    public function sanitizeAndStore(UploadedFile $file, string $directory = 'community_reports', string $disk = 'public'): string
    {
        // 1. Verify file validity
        if (! $file->isValid()) {
            throw new ImageSanitizationException('Berkas foto yang diunggah tidak valid atau rusak.');
        }

        $realPath = $file->getRealPath();
        if (! $realPath || ! file_exists($realPath)) {
            throw new ImageSanitizationException('Berkas foto tidak dapat diakses pada filesystem.');
        }

        // 2. Determine and validate MIME type via FileInfo
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $realPath) ?: $file->getMimeType();
        finfo_close($finfo);

        if (! isset(self::SUPPORTED_MIMES[$mime])) {
            throw new ImageSanitizationException(sprintf('Format berkas (%s) tidak didukung. Format yang diizinkan: JPEG, PNG, WebP.', $mime));
        }

        $extension = self::SUPPORTED_MIMES[$mime];

        // 3. Extract EXIF Orientation before re-encoding (JPEG/TIFF only)
        $orientation = 1;
        if (in_array($extension, ['jpg', 'jpeg'], true) && function_exists('exif_read_data')) {
            try {
                $exif = @exif_read_data($realPath, 'IFD0');
                if ($exif && ! empty($exif['Orientation'])) {
                    $orientation = (int) $exif['Orientation'];
                }
            } catch (\Throwable $e) {
                Log::info('EXIF read ignored during sanitization: ' . $e->getMessage());
                $orientation = 1;
            }
        }

        // 4. Load image into GD resource
        $image = match ($extension) {
            'jpg', 'jpeg' => @imagecreatefromjpeg($realPath),
            'png' => @imagecreatefrompng($realPath),
            'webp' => @imagecreatefromwebp($realPath),
            default => false,
        };

        if ($image === false) {
            throw new ImageSanitizationException('Gagal mendekode citra gambar. Berkas mungkin korup atau bukan gambar yang valid.');
        }

        // 5. Correct Orientation based on EXIF tag (pixel transformation prior to re-encoding)
        try {
            $image = $this->correctOrientation($image, $orientation);
        } catch (\Throwable $e) {
            imagedestroy($image);
            Log::error('Image orientation correction error: ' . $e->getMessage());
            throw new ImageSanitizationException('Gagal menyesuaikan orientasi gambar secara aman.');
        }

        // 6. Handle alpha transparency for PNG and WebP
        if ($extension === 'png') {
            imagealphablending($image, false);
            imagesavealpha($image, true);
        } elseif ($extension === 'webp') {
            imagealphablending($image, true);
            imagesavealpha($image, true);
        }

        // 7. Re-encode image to isolated temp file (GD completely discards EXIF, GPS, and camera metadata)
        $tempPath = tempnam(sys_get_temp_dir(), 'svx_clean_');
        if (! $tempPath) {
            imagedestroy($image);
            throw new ImageSanitizationException('Gagal membuat berkas sementara untuk sanitasi gambar.');
        }

        $encodeSuccess = match ($extension) {
            'jpg', 'jpeg' => @imagejpeg($image, $tempPath, 90), // High quality (90%)
            'png' => @imagepng($image, $tempPath, 6),
            'webp' => @imagewebp($image, $tempPath, 90),
            default => false,
        };

        imagedestroy($image);

        if (! $encodeSuccess || ! file_exists($tempPath) || filesize($tempPath) === 0) {
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
            throw new ImageSanitizationException('Gagal meng-encode ulang citra yang telah dibersihkan.');
        }

        // 8. Forensic Verification: Ensure output file contains NO EXIF GPS coordinates
        if (in_array($extension, ['jpg', 'jpeg'], true) && function_exists('exif_read_data')) {
            $sanitizedExif = @exif_read_data($tempPath, 'GPS');
            if ($sanitizedExif && (! empty($sanitizedExif['GPSLatitude']) || ! empty($sanitizedExif['GPSLongitude']))) {
                @unlink($tempPath);
                throw new ImageSanitizationException('Sanitasi gagal: Metadata GPS masih terdeteksi pada citra.');
            }
        }

        // 9. Store sanitized file directly to public storage
        $filename = Str::random(40) . '.' . $extension;
        $targetPath = trim($directory, '/') . '/' . $filename;

        try {
            $stream = fopen($tempPath, 'r');
            $stored = Storage::disk($disk)->put($targetPath, $stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        } finally {
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }
        }

        if (! $stored) {
            throw new ImageSanitizationException('Gagal menyimpan foto hasil sanitasi ke media penyimpanan.');
        }

        return $targetPath;
    }

    /**
     * Correct image orientation according to EXIF Orientation flag.
     *
     * @param  \GdImage|resource  $image
     * @return \GdImage|resource
     */
    protected function correctOrientation($image, int $orientation)
    {
        switch ($orientation) {
            case 2: // Horizontal flip
                imageflip($image, IMG_FLIP_HORIZONTAL);
                break;
            case 3: // 180 degrees rotate
                $rotated = imagerotate($image, 180, 0);
                if ($rotated !== false) {
                    imagedestroy($image);
                    $image = $rotated;
                }
                break;
            case 4: // Vertical flip
                imageflip($image, IMG_FLIP_VERTICAL);
                break;
            case 5: // Vertical flip + 90 deg rotate CW
                imageflip($image, IMG_FLIP_VERTICAL);
                $rotated = imagerotate($image, -90, 0);
                if ($rotated !== false) {
                    imagedestroy($image);
                    $image = $rotated;
                }
                break;
            case 6: // 90 degrees rotate CW
                $rotated = imagerotate($image, -90, 0);
                if ($rotated !== false) {
                    imagedestroy($image);
                    $image = $rotated;
                }
                break;
            case 7: // Horizontal flip + 90 deg rotate CW
                imageflip($image, IMG_FLIP_HORIZONTAL);
                $rotated = imagerotate($image, -90, 0);
                if ($rotated !== false) {
                    imagedestroy($image);
                    $image = $rotated;
                }
                break;
            case 8: // 90 degrees rotate CCW
                $rotated = imagerotate($image, 90, 0);
                if ($rotated !== false) {
                    imagedestroy($image);
                    $image = $rotated;
                }
                break;
            case 1:
            default:
                // Normal orientation
                break;
        }

        return $image;
    }
}
