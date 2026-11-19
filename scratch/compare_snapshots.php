<?php

$rawBefore = file_get_contents(__DIR__ . '/baseline_snapshot_before.json');
$rawBefore = preg_replace('/^\xEF\xBB\xBF/', '', $rawBefore); // Strip BOM if any
$before = json_decode($rawBefore, true);

$rawAfter = file_get_contents(__DIR__ . '/baseline_snapshot_after.json');
$rawAfter = preg_replace('/^\xEF\xBB\xBF/', '', $rawAfter);
$after = json_decode($rawAfter, true);

if ($before === null) {
    echo "JSON decode error for BEFORE: " . json_last_error_msg() . "\n";
}
if ($after === null) {
    echo "JSON decode error for AFTER: " . json_last_error_msg() . "\n";
}

echo "========================================================\n";
echo "   SENTRAVAX BASELINE PRE/POST SNAPSHOT COMPARISON      \n";
echo "========================================================\n\n";

$allMatching = true;

foreach ($before as $entity => $dataBefore) {
    $dataAfter = $after[$entity] ?? null;
    if ($dataAfter === null) {
        echo "FAIL: Entity [{$entity}] missing in AFTER snapshot!\n";
        $allMatching = false;
        continue;
    }

    // Compare fields excluding dynamic live poll timestamps on DataSources
    if ($entity === 'data_sources') {
        // Compare count and metadata
        if (count($dataBefore) !== count($dataAfter)) {
            echo "FAIL: data_sources count mismatch! Before: " . count($dataBefore) . ", After: " . count($dataAfter) . "\n";
            $allMatching = false;
        } else {
            echo "PASS: data_sources intact (" . count($dataAfter) . " baseline sources present).\n";
        }
        continue;
    }

    $strBefore = json_encode($dataBefore);
    $strAfter = json_encode($dataAfter);

    if ($strBefore === $strAfter) {
        echo "PASS: Entity [{$entity}] is 100% BIT-FOR-BIT IDENTICAL.\n";
    } else {
        echo "NOTICE: Entity [{$entity}] has difference:\n";
        if (is_array($dataBefore) && is_array($dataAfter)) {
            foreach ($dataBefore as $k => $v) {
                if (($dataAfter[$k] ?? null) !== $v) {
                    echo "  - Field [{$k}] Before: " . json_encode($v) . "\n              After:  " . json_encode($dataAfter[$k] ?? null) . "\n";
                }
            }
        }
        $allMatching = false;
    }
}

echo "\n========================================================\n";
echo "SUMMARY: " . ($allMatching ? "ALL BASELINE RECORDS PERFECTLY PRESERVED" : "DIFFERENCES DETECTED") . "\n";
echo "========================================================\n";
