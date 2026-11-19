<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ra = \App\Models\RiskAssessment::find(1);
$ai = \App\Models\AiInsight::find(1);
$cr1 = \App\Models\CommunityReport::find(1);
$cr9 = \App\Models\CommunityReport::find(9);
$rv1 = \App\Models\ReportVerification::find(1);
$shelters = \App\Models\Shelter::whereIn('id', [1, 2, 3, 4, 5])->orderBy('id')->get();
$sources = \App\Models\DataSource::whereIn('id', [2, 3, 4, 5, 6, 7])->orderBy('id')->get();

$snapshot = [
    'risk_assessment_1' => [
        'id' => $ra?->id,
        'title' => $ra?->title,
        'region_id' => $ra?->region_id,
        'hazard_type_id' => $ra?->hazard_type_id,
        'risk_score' => (float) $ra?->risk_score,
        'risk_level' => $ra?->risk_level,
        'methodology_version' => $ra?->methodology_version,
        'created_at' => $ra?->created_at?->toIso8601String(),
        'updated_at' => $ra?->updated_at?->toIso8601String(),
    ],
    'ai_insight_1' => [
        'id' => $ai?->id,
        'risk_assessment_id' => $ai?->risk_assessment_id,
        'title' => $ai?->title,
        'confidence_score' => (float) $ai?->confidence_score,
        'confidence_level' => $ai?->confidence_level,
        'generation_mode' => $ai?->generation_mode,
        'created_at' => $ai?->created_at?->toIso8601String(),
        'updated_at' => $ai?->updated_at?->toIso8601String(),
    ],
    'community_report_1' => [
        'id' => $cr1?->id,
        'title' => $cr1?->title,
        'status' => $cr1?->status,
        'created_at' => $cr1?->created_at?->toIso8601String(),
        'updated_at' => $cr1?->updated_at?->toIso8601String(),
    ],
    'community_report_9' => [
        'id' => $cr9?->id,
        'title' => $cr9?->title,
        'status' => $cr9?->status,
        'created_at' => $cr9?->created_at?->toIso8601String(),
        'updated_at' => $cr9?->updated_at?->toIso8601String(),
    ],
    'report_verification_1' => [
        'id' => $rv1?->id,
        'community_report_id' => $rv1?->community_report_id,
        'previous_status' => $rv1?->previous_status,
        'new_status' => $rv1?->new_status,
        'created_at' => $rv1?->created_at?->toIso8601String(),
        'updated_at' => $rv1?->updated_at?->toIso8601String(),
    ],
    'shelters' => $shelters->map(fn($s) => [
        'id' => $s->id,
        'name' => $s->name,
        'verification_status' => $s->verification_status,
        'operational_status' => $s->operational_status,
        'capacity' => $s->capacity,
        'created_at' => $s->created_at?->toIso8601String(),
        'updated_at' => $s->updated_at?->toIso8601String(),
    ])->all(),
    'data_sources' => $sources->map(fn($ds) => [
        'id' => $ds->id,
        'name' => $ds->name,
        'connectivity_state' => $ds->connectivity_state,
        'freshness_state' => $ds->freshness_state,
        'provenance_type' => $ds->provenance_type,
        'status' => $ds->status,
        'created_at' => $ds->created_at?->toIso8601String(),
    ])->all(),
];

$target = ($argv[1] ?? 'after') === 'before' ? 'before' : 'after';
file_put_contents(__DIR__ . "/baseline_snapshot_{$target}.json", json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "\nSaved snapshot to scratch/baseline_snapshot_{$target}.json\n";
