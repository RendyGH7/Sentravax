# SENTRAVAX — Citizen-First Resilience & Risk Engine Methodology

## 1. Philosophical Overview: Citizen-First Resilience

Conventional disaster applications treat citizens merely as passive consumers of emergency warnings after a catastrophe has already struck. **SENTRAVAX flips this paradigm** through **Citizen-First Resilience**: empowering households and communities with proactive risk intelligence, transparent spatial analytics, and practical preparedness tools before, during, and after multi-hazard events.

---

## 2. Flagship Feature: SENTRAVAX SIAGA PERSONAL

SENTRAVAX Siaga Personal transforms disaster preparedness into a tangible, measurable, and everyday routine for Indonesian families.

```
┌─────────────────────────────────────────────────────────────┐
│                 SENTRAVAX SIAGA PERSONAL                    │
├──────────────────────────────┬──────────────────────────────┤
│ 1. Cek Risiko Lokasi         │ 4. Wilayah Pantauan          │
│    - Multi-hazard buffer     │    - Rumah, Sekolah, Kantor  │
│    - Skor & Faktor Transparan│    - Notifikasi CAP Tertarget│
├──────────────────────────────┼──────────────────────────────┤
│ 2. Rencana Siaga Keluarga    │ 5. Simulasi Interaktif       │
│    - Titik Kumpul & Rute     │    - Skenario Realistis      │
│    - Kontak Darurat Prioritas│    - Evaluasi Tindakan Cepat │
├──────────────────────────────┴──────────────────────────────┤
│ 3. Tas Siaga Bencana (Go-Bag Checklist 5 Kategori)          │
│    Dokumen | Medis | Logistik | Peralatan | Proteksi        │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Cek Risiko Lokasi Mandiri (Location Risk Check)
- **Zero Barrier Access**: Usable without login by any citizen or visitor on the public portal, as well as authenticated citizens.
- **Dynamic PostGIS Spatial Querying**: Accepts precise GPS coordinates (`latitude`, `longitude`) or administrative region codes.
- **Explainable Factors**: Displays exactly why a location is rated as Low, Medium, High, or Critical.
- **Actionable Steps**: Produces immediate protective actions tailored to the specific risk level.

### 2.2 Rencana Siaga Keluarga (Family Preparedness Plan)
- Structured emergency plan including household assembly points (*titik kumpul*) and alternative evacuation routes.
- Emergency contacts directory categorized by relationship (keluarga, RT/RW, posko BPBD, puskesmas).

### 2.3 Checklist Tas Siaga Bencana (Disaster Go-Bag)
Curated checklist structured according to BNPB guidelines across five essential categories:
1. **Dokumen Penting**: KTP, Kartu Keluarga, Akta Kelahiran, Surat Tanah, Polis Asuransi dalam kantong kedap air.
2. **Medis & Obat Rutin**: Kotak P3K standar, perban, antiseptik, dan persediaan obat resep rutin 7 hari.
3. **Logistik Darurat**: Air mineral kemasan (minimal 3 liter/orang), makanan kaleng tahan lama, biskuit energi.
4. **Peralatan Vital**: Senter LED baterai, radio transistor darurat, peluit sinyal SOS, powerbank terisi penuh, pisau lipat multifungsi.
5. **Proteksi Diri**: Masker respirator N95, jas hujan ponco tahan angin, selimut termal aluminium, pakaian ganti darurat.

Interactive progress tracking computes a household preparedness index in real time.

### 2.4 Wilayah Pantauan (Saved Monitored Areas)
- Citizens can save multiple critical locations (e.g., *Rumah Utama*, *Sekolah Anak*, *Rumah Orang Tua di Daerah*).
- When an official CAP alert or verified disaster threat occurs within those bounds, the notification engine automatically distributes targeted in-app alerts with a 4-hour duplicate cooldown.

### 2.5 Simulasi Bencana Interaktif (Disaster Simulation)
- Step-by-step interactive scenarios designed around Indonesia's prominent hazards (e.g., *Gempa Bumi Saat di Dalam Rumah*, *Banjir Luapan Bertahap*).
- Instant evaluation of user decisions with educational explanations for every correct and incorrect choice.
- 70% mastery threshold to earn preparedness completion badges.

---

## 3. Multi-Hazard Spatial Risk Engine Methodology

The SENTRAVAX Risk Engine (`RiskEngineService`) implements a transparent, deterministic mathematical formulation combining geospatial proximity, hazard severity, time decay, and official early warnings.

### 3.1 Mathematical Formulation

$$\text{Risk Score} = \min\left(98.0, \max\left(5.0, S_{\text{events}} + S_{\text{alerts}} + S_{\text{baseline}}\right)\right)$$

Where:

1. **Nearby Active Events Contribution ($S_{\text{events}}$)**:
   $$S_{\text{events}} = \sum_{i} \left( W_{\text{severity}}(i) \times \text{Decay}_{\text{distance}}(d_i) \times \text{Decay}_{\text{recency}}(t_i) \right)$$
   - Distance decay: Linear decrease from 1.0 (at epicenter) to 0.0 at the outer monitoring radius (25 km / 0.25°).
   - Recency decay: Exponential decay over a 48-hour half-life.
   - Severity weights: Minor (15.0), Moderate (30.0), Severe (50.0), Extreme (75.0).
   - Maximum capped contribution: 45.0 points.

2. **Official Active Alerts Contribution ($S_{\text{alerts}}$)**:
   - Warning level: +25.0 points.
   - Watch level: +15.0 points.
   - Advisory level: +8.0 points.
   - Maximum capped contribution: 30.0 points.

3. **Baseline Regional Vulnerability ($S_{\text{baseline}}$)**:
   - Evaluated from geological and topographic exposure indices (minimum 10.0 points).

### 3.2 Categorical Risk Levels

| Score Range | Risk Level | Label | Actionable Protocol |
|:---:|:---:|:---:|:---|
| **75.0 – 98.0** | `critical` | Bahaya Kritis | Segera evakuasi ke posko aman; siagakan tas bencana di pintu keluar. |
| **50.0 – 74.9** | `high` | Bahaya Tinggi | Amankan dokumen penting; cukupi pasokan air dan obat 3 hari. |
| **25.0 – 49.9** | `medium` | Bahaya Sedang | Lengkapi isi tas siaga; pantau siaran cuaca dan advisori lokal. |
| **5.0 – 24.9** | `low` | Kondisi Aman | Pantau berkala; pastikan masa kedaluwarsa obat P3K masih valid. |

---

## 4. Deterministic AI Intelligence & Ethical Boundaries

### 4.1 Proactive Intelligence Baseline
To guarantee accountability in life-critical disaster management:
- Insights are generated deterministically based on empirical thresholds (number of verified reports, official rain gauges, flood elevation, and river discharge).
- Every AI insight publishes its **empirical evidence list**, **data source provenance**, and a **confidence score** (0.915).
- No black-box generative hallucinations: critical emergency instructions strictly follow BNPB and BMKG standard operating procedures.

### 4.2 Spatiotemporal Duplicate Clustering
When multiple citizens submit reports during an active event:
- PostGIS spatial function `ST_DWithin` clusters incoming reports within **1,500 meters** and **6 hours**.
- Inherits existing `cluster_id` to prevent emergency operator fatigue and present unified event bubbles on the command map.
- Retains full immutable audit trail in `report_verifications` for every approval or rejection.

