<?php

namespace Tests\Feature;

use App\Exceptions\ImageSanitizationException;
use App\Models\CommunityReport;
use App\Models\HazardType;
use App\Models\Region;
use App\Models\User;
use App\Services\Media\ImageSanitizerService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageSanitizationAndPrivacyTest extends TestCase
{
    protected ImageSanitizerService $sanitizer;
    protected User $citizenUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sanitizer = app(ImageSanitizerService::class);
        $this->citizenUser = User::where('role', 'user')->first()
            ?? User::where('email', 'user@sentravax.id')->first()
            ?? User::factory()->create(['role' => 'user']);
    }

    /**
     * Helper to create a genuine JPEG file embedded with an Exif APP1 segment containing GPS tags.
     */
    protected function createJpegWithExifGps(int $width = 80, int $height = 60, int $orientation = 1): UploadedFile
    {
        $im = imagecreatetruecolor($width, $height);
        $red = imagecolorallocate($im, 200, 30, 30);
        imagefill($im, 0, 0, $red);

        ob_start();
        imagejpeg($im, null, 85);
        $rawJpeg = ob_get_clean();
        imagedestroy($im);

        // Construct standard TIFF little-endian (II) header + IFD0 with Orientation & GPS pointer + GPS IFD
        // TIFF header: "II\x2A\x00\x08\x00\x00\x00"
        // IFD0: 2 entries:
        //   - Tag 0x0112 (Orientation): SHORT (3), count 1, value $orientation
        //   - Tag 0x8825 (GPSInfo): LONG (4), count 1, offset to GPS IFD (0x26 = 38)
        // Next IFD: 0
        // GPS IFD at offset 38: 2 entries:
        //   - Tag 0x0001 (GPSLatitudeRef): ASCII (2), count 2, value "S\0"
        //   - Tag 0x0002 (GPSLatitude): RATIONAL (5), count 3, offset to values (0x44 = 68)
        // Values at offset 68: 6/1 deg, 12/1 min, 30/1 sec
        $tiff = "II\x2A\x00\x08\x00\x00\x00"; // 8 bytes (0-7)
        $ifd0 = pack('v', 2) // 2 entries
            . pack('vvVV', 0x0112, 3, 1, $orientation) // Orientation
            . pack('vvVV', 0x8825, 4, 1, 38) // GPSInfo offset 38
            . pack('V', 0); // next IFD
        // Offset 8 + 2 + 24 + 4 = 38
        $gpsIfd = pack('v', 2)
            . pack('vvVa4', 0x0001, 2, 2, "S\x00\x00\x00") // LatitudeRef 'S'
            . pack('vvVV', 0x0002, 5, 3, 68) // Latitude offset 68
            . pack('V', 0);
        // Offset 38 + 2 + 24 + 4 = 68
        $gpsValues = pack('VVVVVV', 6, 1, 12, 1, 30, 1); // 6 deg, 12 min, 30 sec

        $exifBody = $tiff . $ifd0 . $gpsIfd . $gpsValues;
        $app1Marker = "\xFF\xE1" . pack('n', strlen($exifBody) + 8) . "Exif\x00\x00" . $exifBody;

        // Insert APP1 directly after SOI marker (\xFF\xD8)
        $jpegWithExif = substr($rawJpeg, 0, 2) . $app1Marker . substr($rawJpeg, 2);

        $tempPath = tempnam(sys_get_temp_dir(), 'test_gps_') . '.jpg';
        file_put_contents($tempPath, $jpegWithExif);

        return new UploadedFile($tempPath, 'citizen_report_with_gps.jpg', 'image/jpeg', null, true);
    }

    /**
     * Test 1: Upload JPEG dengan metadata EXIF GPS.
     * Pastikan metadata GPS terdeteksi pada file sumber uji coba,
     * tetapi TIDAK DITEMUKAN sama sekali pada file hasil sanitasi publik.
     */
    public function test_1_upload_jpeg_with_exif_gps_is_sanitized_and_gps_is_stripped(): void
    {
        $fileWithGps = $this->createJpegWithExifGps(120, 80);

        // Pre-condition verification: Source file MUST contain GPS metadata before sanitization
        if (function_exists('exif_read_data')) {
            $initialExif = @exif_read_data($fileWithGps->getRealPath(), 'GPS');
            $this->assertNotEmpty($initialExif, 'Test fixture must successfully contain initial EXIF metadata.');
            $this->assertArrayHasKey('GPSLatitudeRef', $initialExif);
        }

        // Execute sanitization through service
        $storedPath = $this->sanitizer->sanitizeAndStore($fileWithGps, 'community_reports', 'public');
        $this->assertNotNull($storedPath);

        // Verify file exists on public disk
        Storage::disk('public')->assertExists($storedPath);

        // Post-condition forensic verification: Stored file must NOT contain any GPS tags
        $storedFullPath = Storage::disk('public')->path($storedPath);
        if (function_exists('exif_read_data')) {
            $sanitizedExif = @exif_read_data($storedFullPath, 'GPS');
            $hasGps = $sanitizedExif && (!empty($sanitizedExif['GPSLatitude']) || !empty($sanitizedExif['GPSLatitudeRef']));
            $this->assertFalse($hasGps, 'Sanitized public file MUST NOT contain any GPS EXIF metadata.');
        }

        // Clean up
        Storage::disk('public')->delete($storedPath);
    }

    /**
     * Test 2: Pastikan orientasi foto tetap benar setelah sanitasi.
     * If image has EXIF Orientation tag (e.g. orientation 6 = 90 deg rotation),
     * the sanitizer rotates the pixel canvas so width and height reflect the corrected visual orientation.
     */
    public function test_2_image_orientation_is_corrected_and_preserved(): void
    {
        // Width 100, Height 50 with Orientation 6 (rotated 90 CW)
        $fileRotated = $this->createJpegWithExifGps(100, 50, 6);

        $storedPath = $this->sanitizer->sanitizeAndStore($fileRotated, 'community_reports', 'public');
        $this->assertNotNull($storedPath);

        $storedFullPath = Storage::disk('public')->path($storedPath);
        [$width, $height] = getimagesize($storedFullPath);

        // After 90 degree rotation, width and height swap: width becomes 50, height becomes 100
        $this->assertEquals(50, $width, 'Width must reflect rotated orientation (50px).');
        $this->assertEquals(100, $height, 'Height must reflect rotated orientation (100px).');

        // Clean up
        Storage::disk('public')->delete($storedPath);
    }

    /**
     * Test 3: Pastikan format PNG dan WebP tetap dapat diproses.
     */
    public function test_3_png_and_webp_are_supported_and_processed_cleanly(): void
    {
        // 1. Test PNG with transparency
        $imPng = imagecreatetruecolor(60, 60);
        imagesavealpha($imPng, true);
        $transparent = imagecolorallocatealpha($imPng, 0, 0, 0, 127);
        imagefill($imPng, 0, 0, $transparent);
        $blue = imagecolorallocate($imPng, 30, 120, 240);
        imagefilledellipse($imPng, 30, 30, 40, 40, $blue);

        $pngTmp = tempnam(sys_get_temp_dir(), 'test_png_') . '.png';
        imagepng($imPng, $pngTmp);
        imagedestroy($imPng);

        $pngFile = new UploadedFile($pngTmp, 'report_marker.png', 'image/png', null, true);
        $storedPng = $this->sanitizer->sanitizeAndStore($pngFile, 'community_reports', 'public');
        $this->assertStringEndsWith('.png', $storedPng);
        Storage::disk('public')->assertExists($storedPng);
        Storage::disk('public')->delete($storedPng);

        // 2. Test WebP format
        $imWebp = imagecreatetruecolor(80, 80);
        $green = imagecolorallocate($imWebp, 40, 180, 80);
        imagefill($imWebp, 0, 0, $green);

        $webpTmp = tempnam(sys_get_temp_dir(), 'test_webp_') . '.webp';
        imagewebp($imWebp, $webpTmp, 85);
        imagedestroy($imWebp);

        $webpFile = new UploadedFile($webpTmp, 'radar_scan.webp', 'image/webp', null, true);
        $storedWebp = $this->sanitizer->sanitizeAndStore($webpFile, 'community_reports', 'public');
        $this->assertStringEndsWith('.webp', $storedWebp);
        Storage::disk('public')->assertExists($storedWebp);
        Storage::disk('public')->delete($storedWebp);
    }

    /**
     * Test 4: Pastikan file invalid tetap ditolak.
     */
    public function test_4_invalid_or_fake_image_file_is_strictly_rejected(): void
    {
        // Create text file pretending to be image
        $fakeTmp = tempnam(sys_get_temp_dir(), 'fake_img_') . '.jpg';
        file_put_contents($fakeTmp, 'NOT_A_VALID_JPEG_BINARY_JUST_MALICIOUS_SCRIPT');

        $fakeFile = new UploadedFile($fakeTmp, 'exploit.jpg', 'image/jpeg', null, true);

        $this->expectException(ImageSanitizationException::class);
        $this->sanitizer->sanitizeAndStore($fakeFile, 'community_reports', 'public');
    }

    /**
     * Test 5: Pastikan upload gagal secara aman jika sanitasi tidak dapat dilakukan.
     * Raw un-sanitized file must NEVER be stored in public directory.
     */
    public function test_5_upload_fails_safely_without_storing_raw_file_when_sanitizer_fails(): void
    {
        $corruptTmp = tempnam(sys_get_temp_dir(), 'corrupt_') . '.jpg';
        file_put_contents($corruptTmp, "\xFF\xD8\xFF\xE0" . str_repeat('X', 50)); // Corrupt header

        $corruptFile = new UploadedFile($corruptTmp, 'broken.jpg', 'image/jpeg', null, true);

        $hazardType = HazardType::first();
        $region = Region::first();

        // Submit via Public endpoint
        $res = $this->post('/api/v1/public/reports', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Berkas Rusak',
            'description' => 'Mencoba mengunggah berkas gambar rusak.',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'photo' => $corruptFile,
        ]);

        $res->assertStatus(422);
        $res->assertJson([
            'success' => false,
            'error_code' => 'IMAGE_SANITIZATION_FAILED',
        ]);

        // Verify that NO files were leaked or stored into public storage
        $publicFiles = Storage::disk('public')->files('community_reports');
        $this->assertFalse(collect($publicFiles)->contains(fn($f) => str_contains($f, 'broken')));
    }

    /**
     * Test 6: Pastikan akses foto publik yang disanitasi tetap HTTP 200.
     */
    public function test_6_public_sanitized_photo_remains_accessible_via_http(): void
    {
        $file = $this->createJpegWithExifGps(90, 60);

        $hazardType = HazardType::first();
        $region = Region::first();

        $response = $this->post('/api/v1/public/reports', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Publik Terverifikasi Sanitasi',
            'description' => 'Bukti foto laporan warga dengan pembersihan metadata sensitif.',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'photo' => $file,
            'reporter_name' => 'Warga Peduli',
        ]);

        $response->assertStatus(201);
        $reportId = $response->json('data.id');
        $photoUrl = $response->json('data.photo_url');

        $this->assertNotNull($photoUrl);

        try {
            $report = CommunityReport::find($reportId);
            $this->assertNotNull($report->photo_path);

            // Storage disk verification
            Storage::disk('public')->assertExists($report->photo_path);

            // Access via HTTP endpoint
            $urlPath = parse_url($photoUrl, PHP_URL_PATH);
            $httpRes = $this->get($urlPath);
            $httpRes->assertStatus(200);

            // Forensic confirmation: Stored image has NO GPS
            $fullPath = Storage::disk('public')->path($report->photo_path);
            if (function_exists('exif_read_data')) {
                $exif = @exif_read_data($fullPath, 'GPS');
                $hasGps = $exif && (!empty($exif['GPSLatitude']) || !empty($exif['GPSLatitudeRef']));
                $this->assertFalse($hasGps);
            }
        } finally {
            if ($report?->photo_path) {
                Storage::disk('public')->delete($report->photo_path);
            }
            DB::table('community_reports')->where('id', $reportId)->delete();
        }
    }

    /**
     * Test 7: Pastikan upload foto via User Portal juga dibersihkan dari metadata EXIF GPS.
     */
    public function test_7_user_portal_upload_also_strips_exif_gps_metadata(): void
    {
        $file = $this->createJpegWithExifGps(100, 70);

        $hazardType = HazardType::first();
        $region = Region::first();

        $response = $this->actingAs($this->citizenUser)->post('/api/v1/user/reports', [
            'hazard_type_id' => $hazardType->id,
            'region_id' => $region->id,
            'title' => 'Laporan Portal Warga Terverifikasi Sanitasi',
            'description' => 'Laporan melalui portal warga terotentikasi.',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'photo' => $file,
        ]);

        $response->assertStatus(201);
        $reportId = $response->json('data.id');
        $photoUrl = $response->json('data.photo_url');

        $this->assertNotNull($photoUrl);

        try {
            $report = CommunityReport::find($reportId);
            $this->assertNotNull($report->photo_path);

            Storage::disk('public')->assertExists($report->photo_path);

            $fullPath = Storage::disk('public')->path($report->photo_path);
            if (function_exists('exif_read_data')) {
                $exif = @exif_read_data($fullPath, 'GPS');
                $hasGps = $exif && (!empty($exif['GPSLatitude']) || !empty($exif['GPSLatitudeRef']));
                $this->assertFalse($hasGps, 'User portal upload MUST also strip all GPS coordinates.');
            }
        } finally {
            if ($report?->photo_path) {
                Storage::disk('public')->delete($report->photo_path);
            }
            DB::table('community_reports')->where('id', $reportId)->delete();
        }
    }
}
