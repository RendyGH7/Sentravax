<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Reset report 8 to pending and remove test verifications
\DB::table('report_verifications')->where('community_report_id', 8)->delete();
\DB::table('community_reports')->where('id', 8)->update(['status' => 'pending']);

// Remove test-created insights (id > 1) to restore pure baseline state
\DB::table('ai_insights')->where('id', '>', 1)->delete();

echo "Database purity restored: Report #8 reset to pending, test verifications and test insights cleaned.\n";
