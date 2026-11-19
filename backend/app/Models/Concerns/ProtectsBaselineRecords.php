<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use RuntimeException;

trait ProtectsBaselineRecords
{
    /**
     * Determine if this model instance represents an immutable baseline record.
     */
    public function isBaselineRecord(): bool
    {
        $baselineIds = defined(static::class . '::BASELINE_IDS') ? static::BASELINE_IDS : [];
        if (!empty($baselineIds)) {
            return in_array($this->getKey(), $baselineIds, true);
        }

        return false;
    }

    /**
     * Boot the trait to guard against model instance deletion and unauthorized modification.
     */
    public static function bootProtectsBaselineRecords(): void
    {
        static::deleting(function ($model) {
            if ($model->isBaselineRecord()) {
                throw new RuntimeException(
                    sprintf(
                        "Operasi ditolak: Record baseline %s #%s dilindungi dari penghapusan.",
                        class_basename($model),
                        $model->getKey()
                    )
                );
            }
        });

        static::updating(function ($model) {
            // DataSource models are permitted to update sync timestamps and connectivity status
            if (class_basename($model) === 'DataSource') {
                return;
            }

            if ($model->isBaselineRecord()) {
                throw new RuntimeException(
                    sprintf(
                        "Operasi ditolak: Record baseline %s #%s dilindungi dari pembaruan atau modifikasi.",
                        class_basename($model),
                        $model->getKey()
                    )
                );
            }
        });
    }

    /**
     * Create a new Eloquent query builder that intercepts mass-delete and mass-update
     * operations that target baseline records.
     */
    public function newEloquentBuilder($query): Builder
    {
        return new class($query) extends Builder {
            public function delete()
            {
                $this->guardAgainstBaselineAction('penghapusan (mass delete)');
                return parent::delete();
            }

            public function forceDelete()
            {
                $this->guardAgainstBaselineAction('penghapusan paksa (force delete)');
                return parent::forceDelete();
            }

            public function update(array $values)
            {
                // DataSource sync updates (e.g. last_fetched_at, status) are allowed
                if (class_basename($this->model) !== 'DataSource') {
                    $this->guardAgainstBaselineAction('pembaruan massal (mass update)');
                }
                return parent::update($values);
            }

            protected function guardAgainstBaselineAction(string $action): void
            {
                $baselineIds = defined(get_class($this->model) . '::BASELINE_IDS')
                    ? $this->model::BASELINE_IDS
                    : [];

                if (empty($baselineIds)) {
                    return;
                }

                $keyName = $this->model->getKeyName();
                $targetsBaseline = (clone $this)->whereIn($keyName, $baselineIds)->exists();

                if ($targetsBaseline) {
                    throw new RuntimeException(
                        sprintf(
                            "Operasi query builder ditolak: Percobaan %s menargetkan record baseline %s (dilindungi dari operasi massal).",
                            $action,
                            class_basename($this->model)
                        )
                    );
                }
            }
        };
    }
}
