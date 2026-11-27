import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.resolve(__dirname, '../src/pages/public');

const homePageSource = fs.readFileSync(path.join(pagesDir, 'HomePage.tsx'), 'utf8');
const educationPageSource = fs.readFileSync(path.join(pagesDir, 'PublicEducationPage.tsx'), 'utf8');

test('F-03: HomePage contact form does not simulate success with setTimeout or toast.success', () => {
  const submitMatch = homePageSource.match(/const handleContactSubmit = [\s\S]*?\n  \};/);
  assert.ok(submitMatch, 'handleContactSubmit handler must exist');
  const submitBody = submitMatch[0];

  assert.equal(submitBody.includes('setTimeout'), false, 'handleContactSubmit must not use setTimeout');
  assert.equal(submitBody.includes('toast.success'), false, 'handleContactSubmit must not emit fake toast.success');
  assert.equal(
    homePageSource.includes('Pengiriman pesan langsung melalui formulir web belum tersedia.'),
    true,
    'HomePage must display honest notice that online form submission is unavailable'
  );
  assert.equal(
    homePageSource.includes('aria-disabled="true"'),
    true,
    'Disabled contact form must expose aria-disabled="true"'
  );
});

test('F-04: PublicEducationPage has no hardcoded FALLBACK_GUIDES or fake BNPB attribution', () => {
  assert.equal(
    educationPageSource.includes('FALLBACK_GUIDES'),
    false,
    'PublicEducationPage must not contain hardcoded FALLBACK_GUIDES'
  );
  assert.equal(
    educationPageSource.includes('Standar BNPB 2026'),
    false,
    'PublicEducationPage must not hardcode Standar BNPB 2026 provenance'
  );
  assert.equal(
    educationPageSource.includes('item.is_published !== false'),
    true,
    'PublicEducationPage must defensively filter unpublished education items'
  );
  assert.equal(
    educationPageSource.includes('Coba Lagi'),
    true,
    'PublicEducationPage must provide a Retry button on API failure'
  );
  assert.equal(
    educationPageSource.includes('Belum Ada Panduan Edukasi Terpublikasi'),
    true,
    'PublicEducationPage must distinguish empty API response from filtered results'
  );
});
