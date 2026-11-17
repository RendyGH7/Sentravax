<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Reset any non-baseline community report back to pending
\DB::table('community_reports')->where('id', '!=', 1)->update([
    'status' => 'pending',
    'verified_by' => null,
    'verified_at' => null,
    'moderation_notes' => null,
]);

// Remove test verifications (keep only baseline verification id: 1)
\DB::table('report_verifications')->where('id', '!=', 1)->delete();

// Remove test-created insights (keep only baseline insight id: 1)
\DB::table('ai_insights')->where('id', '>', 1)->delete();

echo "Database purity restored: Baseline state preserved.\n";
