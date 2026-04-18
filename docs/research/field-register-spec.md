# Specyfikacja techniczna — Księga Polowa (Field Register) w AgriClaw

**Dokument:** `docs/research/field-register-spec.md`
**Data:** 2026-04-18
**Autor:** Infinity Team — Product & Engineering
**Status:** Specyfikacja implementacyjna — v1.0
**Zakres:** Moduł "Księga Polowa" (Field Register) w aplikacji AgriClaw (Next.js + Prisma + PostGIS)
**Powiązane dokumenty:** `docs/research/eu-pl-regulations-2026.md` (Sekcja A), `README.md`, `prisma/schema.prisma`

> **Filozofia dokumentu.** Ten plik jest **spec developerskim**. Odbiorca (programista) powinien móc wyłącznie na jego podstawie zaimplementować pełnoprawny moduł księgi polowej zgodny z polskim i unijnym prawem (kwiecień 2026). Dokument zawiera: model danych (Prisma schema), walidatory, API endpointy, format eksportów (PDF/CSV/JSON/XML), integrację z LPIS i rejestrem ŚOR, przykłady payloadów, testy akceptacyjne, plan migracji, konfigurację retencji.

---

## Spis treści

1. [Cel i zakres modułu](#1-cel-i-zakres-modułu)
2. [Model domeny i słownik terminów](#2-model-domeny-i-słownik-terminów)
3. [Model danych — schemat Prisma](#3-model-danych--schemat-prisma)
4. [Walidacja danych — reguły i implementacja](#4-walidacja-danych--reguły-i-implementacja)
5. [Integracje danych zewnętrznych](#5-integracje-danych-zewnętrznych)
6. [REST API — specyfikacja endpointów](#6-rest-api--specyfikacja-endpointów)
7. [Eksport do PDF (layout IJHARS/PIORiN)](#7-eksport-do-pdf-layout-ijhar­spiorin)
8. [Eksport do CSV](#8-eksport-do-csv)
9. [Eksport do JSON (AgriClaw Public API v1)](#9-eksport-do-json-agriclaw-public-api-v1)
10. [Eksport do XML (ARiMR eWniosek Plus)](#10-eksport-do-xml-arimr-ewniosek-plus)
11. [Integracja z LPIS — mapowanie pól do działek ewidencyjnych](#11-integracja-z-lpis--mapowanie-pól-do-działek-ewidencyjnych)
12. [Synchronizacja z rejestrem ŚOR (MRiRW)](#12-synchronizacja-z-rejestrem-śor-mrirw)
13. [Audit trail, wersjonowanie, integralność](#13-audit-trail-wersjonowanie-integralność)
14. [Retencja i usuwanie danych (RODO)](#14-retencja-i-usuwanie-danych-rodo)
15. [Kontrole inspekcyjne — moduł "Prezentacja Inspektorowi"](#15-kontrole-inspekcyjne)
16. [Generator Planu Nawozowego (OSN)](#16-generator-planu-nawozowego-osn)
17. [Integracja z czatem AI (głosowe wprowadzanie zabiegu)](#17-integracja-z-czatem-ai)
18. [UI/UX — makiety ekranów](#18-uiux--makiety-ekranów)
19. [Plan migracji z papieru do AgriClaw](#19-plan-migracji-z-papieru)
20. [Testy akceptacyjne](#20-testy-akceptacyjne)
21. [Monitoring, metryki, SLI/SLO](#21-monitoring-metryki-slislo)
22. [Roadmapa wdrożenia](#22-roadmapa-wdrożenia)
23. [Załącznik A. Pełna tabela pól zabiegu (referencja)](#załącznik-a-pełna-tabela-pól-zabiegu-referencja)
24. [Załącznik B. Słownik BBCH (skrót)](#załącznik-b-słownik-bbch-skrót)
25. [Załącznik C. Słownik upraw MRiRW (skrót)](#załącznik-c-słownik-upraw-mrirw-skrót)
26. [Załącznik D. Schemat XSD eWniosek Plus](#załącznik-d-schemat-xsd-ewniosek-plus)

---

## 1. Cel i zakres modułu

### 1.1. Cel biznesowy

Księga Polowa (Field Register) w AgriClaw to **centralny moduł zgodności prawnej i kontraktowej**. Odpowiada za:
- prowadzenie ewidencji zabiegów zgodnie z **Rozp. MRiRW z 30 marca 2023 r. (Dz.U. 2023 poz. 612)**,
- ewidencję nawożenia zgodnie z **Programem OSN (Dz.U. 2023 poz. 244)**,
- generowanie **Planu Nawozowego** i **Bilansu Azotu** wymaganego przez ekoschematy WPR 2023-2027,
- eksport ewidencji w formatach wymaganych przez PIORiN, ARiMR, IJHARS,
- integrację z systemami ubezpieczeniowymi (raporty szkód),
- wsparcie certyfikacji GLOBALG.A.P., IP, BIO.

### 1.2. Nieobjęte zakresem tego dokumentu

- **Analiza satelitarna** — NDVI/NDRE/SMAP — opisana w `src/lib/satellite/*` i osobnych specyfikacjach.
- **Silnik rekomendacji AI** — opisany w `src/lib/openclaw-prompt.ts` i `docs/research/ai-architecture.md` (planowany).
- **Onboarding / uwierzytelnianie** — NextAuth, opisany w `src/lib/auth.ts`.
- **Gospodarka zwierzętami** (ewidencja zwierząt gospodarskich) — nie w MVP AgriClaw.

### 1.3. Użytkownicy modułu

| Rola | Uprawnienia | Scenariusz |
|---|---|---|
| **Rolnik (Owner)** | CRUD na księdze swojego gospodarstwa | Wprowadzenie zabiegu, eksport raportu rocznego |
| **Operator (Worker)** | Odczyt + wpis nowych zabiegów (own) | Mobilny wpis z pola po zabiegu |
| **Doradca (Advisor)** | Odczyt z linku shared | Konsultacja planu nawożenia |
| **Inspektor (Read-only external)** | Odczyt w trybie "Prezentacja Inspektorowi" | Kontrola PIORiN — tryb limited session |
| **System (ARiMR)** | (przyszłość — API) | Automatyczna synchronizacja deklaracji |

### 1.4. Kluczowe charakterystyki niefunkcjonalne

- **Integralność** — audit trail wszystkich zmian, niemutowalny hash sumaryczny wpisu po zamknięciu okresu.
- **Dostępność** — SLA 99,5% dla aplikacji web, 99% dla API (dop. przerwa 7,2 h/mc).
- **Czas odpowiedzi** — lista zabiegów dla gospodarstwa < 200 ms (p95), zapis < 500 ms.
- **Skalowalność** — do 10 000 gospodarstw × 500 zabiegów/rok = 5 mln operacji/rok. Partycjonowanie Postgres po `farm_id`.
- **Retencja** — 10 lat (zob. sekcja 14).
- **Backup** — codzienny snapshot Neon + off-site backup (AWS S3 Glacier, co tydzień).

---

## 2. Model domeny i słownik terminów

### 2.1. Encje główne

- **Farm** (Gospodarstwo) — jednostka organizacyjna, właściciel pól.
- **Field** (Pole) — wydzielony obszar uprawy, może być częścią działki ewidencyjnej lub kilku działek.
- **Crop** (Uprawa) — konkretny cykl produkcyjny na polu (np. "pszenica ozima 2025/2026").
- **Operation** (Zabieg) — pojedyncze zdarzenie agrotechniczne (ŚOR, nawożenie, siew, zbiór, uprawa mechaniczna).
- **Product** (Środek/Nawóz) — substancja użyta w zabiegu (ŚOR z rejestru MRiRW lub nawóz).
- **Equipment** (Sprzęt) — maszyna/opryskiwacz wykorzystana do zabiegu.
- **Operator** — osoba fizyczna wykonująca zabieg (z certyfikatem).
- **WeatherSnapshot** — zdjęcie pogody z momentu zabiegu (temperature, wiatr, wilgotność).

### 2.2. Encje pomocnicze

- **PppRegistry** — lokalna replika rejestru MRiRW (wersjonowana).
- **LpisReference** — warstwa referencyjna działek ewidencyjnych ARiMR.
- **EppoCode** — słownik agrofagów.
- **CropCatalog** — słownik MRiRW upraw.
- **AuditEntry** — log zmian.

### 2.3. Relacje

```
Farm (1) ──── (N) Field (1) ──── (N) Crop (1) ──── (N) Operation (N) ──── (M) Product
                                              │
                                              └── (N) Operator
                                              └── (1) Equipment
                                              └── (1) WeatherSnapshot
```

---

## 3. Model danych — schemat Prisma

### 3.1. Rozszerzenie `prisma/schema.prisma`

Poniższy schemat **dodaje** (nie zastępuje) nowe modele do istniejącego schematu AgriClaw. Zakładamy obecność modeli `User`, `Farm`, `Field` (w bieżącym `prisma/schema.prisma`). Jeżeli pole `Field.geometry` już istnieje jako typ geometryczny PostGIS — pozostawiamy.

```prisma
// ============================================================
// Field Register — Księga Polowa
// ============================================================

model Operation {
  id                String               @id @default(cuid())
  farmId            String
  fieldId           String
  cropId            String?
  type              OperationType
  startedAt         DateTime
  finishedAt        DateTime?
  areaHa            Decimal              @db.Decimal(8, 4)
  bbchPhase         Int?                 @db.SmallInt
  reason            String?              // słownik EPPO pest_code lub free text
  eppoCode          String?              // EPPO pest code
  operatorId        String
  equipmentId       String?

  // Środki / nawozy — relacja wiele-do-wielu przez OperationProduct
  products          OperationProduct[]

  // Pogoda zsnapshotowana w momencie zabiegu
  weatherTempC      Decimal?             @db.Decimal(4, 1)
  weatherWindMs     Decimal?             @db.Decimal(4, 1)
  weatherHumidity   Int?                 @db.SmallInt
  weatherSource     String?              // "open-meteo" | "imgw" | "manual"

  notes             String?              @db.VarChar(2000)

  // Certyfikacyjne
  ipSystem          Boolean              @default(false)   // wykonany w systemie IP?
  bioCompliant      Boolean              @default(false)   // w BIO?

  // Audit
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  createdBy         String
  version           Int                  @default(1)
  closedAt          DateTime?            // po zamknięciu rocznym — niemutowalny
  checksum          String?              // SHA-256 treści wpisu po zamknięciu

  farm              Farm                 @relation(fields: [farmId], references: [id], onDelete: Cascade)
  field             Field                @relation(fields: [fieldId], references: [id])
  crop              Crop?                @relation(fields: [cropId], references: [id])
  operator          Operator             @relation(fields: [operatorId], references: [id])
  equipment         Equipment?           @relation(fields: [equipmentId], references: [id])
  creator           User                 @relation("OperationCreatedBy", fields: [createdBy], references: [id])
  auditEntries      AuditEntry[]

  @@index([farmId, startedAt])
  @@index([fieldId, startedAt])
  @@index([cropId])
  @@index([type])
}

enum OperationType {
  PPP_SPRAY             // stosowanie ŚOR
  FERTILIZATION_MINERAL // nawożenie mineralne
  FERTILIZATION_ORGANIC // obornik / gnojowica / pomiot
  FERTILIZATION_MIXED   // nawóz mieszany
  SOWING                // siew
  HARVEST               // zbiór
  TILLAGE               // uprawa mechaniczna (orka, talerzowanie)
  MOWING                // koszenie (TUZ)
  IRRIGATION            // nawadnianie
  LIMING                // wapnowanie
  OTHER                 // inne (uzasadnione w notes)
}

model OperationProduct {
  id                String     @id @default(cuid())
  operationId       String
  productId         String
  doseValue         Decimal    @db.Decimal(10, 4)  // dawka
  doseUnit          DoseUnit                       // l/ha, kg/ha, g/ha, t/ha, ml/ha
  nContentKg        Decimal?   @db.Decimal(8, 3)   // wyliczona ilość czystego N
  p2o5ContentKg     Decimal?   @db.Decimal(8, 3)
  k2oContentKg      Decimal?   @db.Decimal(8, 3)

  operation         Operation  @relation(fields: [operationId], references: [id], onDelete: Cascade)
  product           Product    @relation(fields: [productId], references: [id])

  @@index([operationId])
  @@index([productId])
}

enum DoseUnit {
  L_HA     // litr / ha
  KG_HA    // kilogram / ha
  G_HA     // gram / ha
  T_HA     // tona / ha
  ML_HA    // mililitr / ha
}

model Product {
  id                 String        @id @default(cuid())
  type               ProductType
  tradeName          String
  producer           String?

  // ŚOR
  pppRegistryId      String?       // FK do PppRegistry (MRiRW)
  pppRegistrationNo  String?       // R-XX/YYYY
  activeSubstances   String[]      // lista substancji czynnych
  activeSubstanceConcentration Json?   // [{ "substance": "tebukonazol", "concentration": 430, "unit": "g/kg" }]

  // Nawóz
  fertilizerNContent  Decimal?     @db.Decimal(5, 2)  // % N
  fertilizerP2O5      Decimal?     @db.Decimal(5, 2)  // % P2O5
  fertilizerK2O       Decimal?     @db.Decimal(5, 2)  // % K2O

  // Zatwierdzenie dla systemów jakości
  allowedInIp         Boolean      @default(true)     // IP
  allowedInBio        Boolean      @default(false)    // Rolnictwo ekologiczne
  globalGapCompliant  Boolean      @default(true)

  // Status dostępności
  archivedAt          DateTime?    // wycofanie z rynku

  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  pppRegistry        PppRegistry?  @relation(fields: [pppRegistryId], references: [id])
  operationProducts  OperationProduct[]

  @@unique([tradeName, producer])
  @@index([type])
  @@index([pppRegistrationNo])
}

enum ProductType {
  PPP                  // ŚOR
  FERTILIZER_MINERAL   // nawóz mineralny
  FERTILIZER_ORGANIC   // obornik, gnojowica, pomiot
  FERTILIZER_MIXED     // mieszany
  SEEDS                // materiał siewny (dla rekordu siewu)
  ADJUVANT             // adiuwant
  BIOLOGICAL           // środek biologiczny (BIO)
}

model PppRegistry {
  id                 String       @id @default(cuid())
  registrationNo     String       @unique     // R-XX/YYYY
  tradeName          String
  producer           String
  type               String       // fungicyd, herbicyd, insektycyd, ...
  activeSubstances   Json         // lista z koncentracją
  allowedCrops       String[]     // kody upraw (słownik MRiRW)
  allowedAgrofags    String[]     // kody EPPO
  doseMin            Decimal?     @db.Decimal(10, 4)
  doseMax            Decimal?     @db.Decimal(10, 4)
  doseUnit           DoseUnit
  maxApplicationsPerSeason Int?
  carenzaDays        Int?         // okres karencji NPR (dni)
  preventionHours    Int?         // prewencja
  bbchMin            Int?
  bbchMax            Int?
  bufferFromWaterM   Int?         // strefa ochronna od wód
  labelPdfUrl        String?
  approvedFrom       DateTime
  approvedUntil      DateTime?

  // Metadane synchronizacji
  mrirwLastSyncAt    DateTime     @default(now())
  source             String       @default("mrirw-dane.gov.pl")

  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  products           Product[]

  @@index([registrationNo])
  @@index([type])
  @@index([approvedUntil])
}

model Operator {
  id                 String       @id @default(cuid())
  farmId             String
  userId             String?      // jeśli jest kontem w AgriClaw
  firstName          String
  lastName           String
  pesel              String?      // opcjonalny — osobowe
  certificateNo      String       // nr zaświadczenia o szkoleniu ŚOR
  certificateExpiresAt DateTime
  phoneNumber        String?
  email              String?

  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  farm               Farm         @relation(fields: [farmId], references: [id], onDelete: Cascade)
  operations         Operation[]

  @@index([farmId])
  @@index([certificateExpiresAt])
}

model Equipment {
  id                 String       @id @default(cuid())
  farmId             String
  type               EquipmentType
  manufacturer       String?
  model              String?
  identifier         String?      // np. nr rejestracyjny ciągnika
  sttTestNo          String?      // nr protokołu STT
  sttTestExpiresAt   DateTime?

  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  farm               Farm         @relation(fields: [farmId], references: [id], onDelete: Cascade)
  operations         Operation[]

  @@index([farmId])
  @@index([sttTestExpiresAt])
}

enum EquipmentType {
  SPRAYER_FIELD       // opryskiwacz polowy
  SPRAYER_ORCHARD     // opryskiwacz sadowniczy
  SPRAYER_BACKPACK    // ręczny
  SPREADER_MINERAL    // rozsiewacz nawozów mineralnych
  SPREADER_ORGANIC    // rozrzutnik obornika
  SEEDER              // siewnik
  PLOW                // pług
  HARVESTER           // kombajn
  OTHER
}

model Crop {
  id                 String       @id @default(cuid())
  fieldId            String
  speciesCode        String       // kod MRiRW (np. "PSZENICA_OZIMA")
  varietyName        String?      // odmiana
  sowingDate         DateTime?
  harvestDate        DateTime?
  plannedYieldTha    Decimal?     @db.Decimal(6, 2)  // planowany plon t/ha
  actualYieldTha     Decimal?     @db.Decimal(6, 2)  // rzeczywisty
  previousCropCode   String?      // poprzednik — potrzebne dla GAEC 7

  // Certyfikacje
  ipCertified        Boolean      @default(false)
  bioCertified       Boolean      @default(false)
  globalGapCertified Boolean      @default(false)

  startedAt          DateTime     // początek sezonu uprawy
  endedAt            DateTime?    // koniec (po zbiorze)

  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  field              Field        @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  operations         Operation[]

  @@index([fieldId])
  @@index([speciesCode])
}

model AuditEntry {
  id            String    @id @default(cuid())
  operationId   String
  userId        String
  action        AuditAction
  changedFields Json      // [{ field: "doseValue", from: "1.5", to: "1.8" }]
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime  @default(now())

  operation     Operation @relation(fields: [operationId], references: [id], onDelete: Cascade)
  user          User      @relation(fields: [userId], references: [id])

  @@index([operationId])
  @@index([userId])
  @@index([createdAt])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  CLOSE       // zamknięcie wpisu (immutability)
}

model LpisReference {
  id              String    @id @default(cuid())
  voivodeship     String    // województwo
  commune         String    // gmina
  cadastralDistrict String  // obręb
  parcelNumber    String    // nr działki
  areaHa          Decimal   @db.Decimal(8, 4)
  geometry        Unsupported("geometry(Polygon, 4326)")
  lpisFeatureId   String?   // ID z LPIS ARiMR

  importedAt      DateTime  @default(now())
  sourceVersion   String?   // "LPIS 2026.1"

  @@unique([voivodeship, commune, cadastralDistrict, parcelNumber])
  @@index([lpisFeatureId])
}

model EppoCode {
  code         String    @id           // np. "PUCCRE" dla Puccinia recondita
  scientificName String
  commonNamePl String?
  commonNameEn String?
  type         String    // PEST, DISEASE, WEED
  category     String?

  updatedAt    DateTime  @updatedAt

  @@index([type])
}

model CropCatalog {
  code         String    @id           // "PSZENICA_OZIMA"
  nameShort    String    // "Pszenica ozima"
  nameLong     String
  category     String    // "Zboża", "Rzepak", "Okopowe", ...
  bbchSchema   String?   // referencja do słownika BBCH (np. "BBCH_CEREAL")
  isIpSchemeAvailable Boolean @default(false)

  @@index([category])
}
```

### 3.2. PostGIS — rozszerzenia

```sql
-- Migracja Prisma raw SQL
CREATE EXTENSION IF NOT EXISTS postgis;

-- Indeks przestrzenny na LPIS
CREATE INDEX lpis_reference_geom_idx ON "LpisReference" USING GIST (geometry);

-- Indeks przestrzenny na Field (zakładamy istnienie pola Field.geometry jako geometry(Polygon,4326))
CREATE INDEX field_geom_idx ON "Field" USING GIST (geometry);
```

### 3.3. Migracje

Migracja zostaje wygenerowana przez `prisma migrate dev --name field_register_v1`. W pliku migracji ręcznie dodać:
- rozszerzenie PostGIS,
- indeksy GIST,
- partycjonowanie `Operation` po kolumnie `farmId` (po uzyskaniu 100k+ operacji — tbd w v1.1, nie MVP).

---

## 4. Walidacja danych — reguły i implementacja

### 4.1. Walidatory Zod

Plik: `src/lib/schemas/field-register.ts`.

```typescript
import { z } from "zod";

const BBCH = z.number().int().min(0).max(99);

const DoseUnitEnum = z.enum(["L_HA", "KG_HA", "G_HA", "T_HA", "ML_HA"]);

const OperationTypeEnum = z.enum([
  "PPP_SPRAY",
  "FERTILIZATION_MINERAL",
  "FERTILIZATION_ORGANIC",
  "FERTILIZATION_MIXED",
  "SOWING",
  "HARVEST",
  "TILLAGE",
  "MOWING",
  "IRRIGATION",
  "LIMING",
  "OTHER",
]);

export const OperationProductSchema = z.object({
  productId: z.string().cuid(),
  doseValue: z.number().positive().max(10000),
  doseUnit: DoseUnitEnum,
});

export const OperationCreateSchema = z.object({
  fieldId: z.string().cuid(),
  cropId: z.string().cuid().optional(),
  type: OperationTypeEnum,
  startedAt: z.coerce.date().refine((d) => d <= new Date(), {
    message: "Zabieg nie może mieć daty w przyszłości",
  }),
  finishedAt: z.coerce.date().optional(),
  areaHa: z.number().positive().max(10000),
  bbchPhase: BBCH.optional(),
  reason: z.string().max(200).optional(),
  eppoCode: z.string().max(20).optional(),
  operatorId: z.string().cuid(),
  equipmentId: z.string().cuid().optional(),
  products: z.array(OperationProductSchema).min(0).max(10),
  weatherTempC: z.number().min(-20).max(45).optional(),
  weatherWindMs: z.number().min(0).max(30).optional(),
  weatherHumidity: z.number().int().min(0).max(100).optional(),
  weatherSource: z.enum(["open-meteo", "imgw", "manual"]).optional(),
  notes: z.string().max(2000).optional(),
  ipSystem: z.boolean().default(false),
  bioCompliant: z.boolean().default(false),
});
```

### 4.2. Walidatory biznesowe (poza Zod)

Poniższe walidatory są w `src/lib/validators/field-register-rules.ts`. Każdy zwraca `ValidationIssue[]`:

```typescript
export type ValidationSeverity = "ERROR" | "WARNING" | "INFO";
export type ValidationIssue = {
  severity: ValidationSeverity;
  code: string;
  message: string;
  field?: string;
  legalReference?: string;
};
```

**Reguła WZ-01: Wiatr max 4 m/s przy stosowaniu ŚOR** (art. 35 ust. 3 ustawy o ŚOR):
```typescript
function validateWindSpeed(op: OperationCreate): ValidationIssue[] {
  if (op.type === "PPP_SPRAY" && op.weatherWindMs !== undefined && op.weatherWindMs > 4) {
    return [{
      severity: "ERROR",
      code: "WZ-01",
      message: `Prędkość wiatru ${op.weatherWindMs} m/s przekracza dopuszczalne 4 m/s dla zabiegu ŚOR.`,
      field: "weatherWindMs",
      legalReference: "Art. 35 ust. 3 ustawy z 8 marca 2013 r. o środkach ochrony roślin (Dz.U. 2023 poz. 340)",
    }];
  }
  return [];
}
```

**Reguła WZ-02: Temperatura w zakresie etykiety** (dla każdego ŚOR sprawdzić etykietę):
```typescript
// Wymaga pobrania etykiety z PppRegistry; jeśli etykieta definiuje zakres temp, walidujemy.
// Dla MVP: ostrzeżenie przy <5°C lub >25°C.
function validateTemperatureRange(op: OperationCreate): ValidationIssue[] {
  if (op.type === "PPP_SPRAY" && op.weatherTempC !== undefined) {
    if (op.weatherTempC < 5 || op.weatherTempC > 25) {
      return [{
        severity: "WARNING",
        code: "WZ-02",
        message: `Temperatura ${op.weatherTempC}°C poza typowym oknem agronomicznym 5–25°C.`,
        field: "weatherTempC",
      }];
    }
  }
  return [];
}
```

**Reguła WZ-03: Dawka w zakresie etykiety** (dla każdego produktu ŚOR):
```typescript
async function validatePppDoseRange(op: OperationCreate, products: ProductWithRegistry[]) {
  const issues: ValidationIssue[] = [];
  for (const op_prod of op.products) {
    const prod = products.find(p => p.id === op_prod.productId);
    if (!prod?.pppRegistry) continue;
    const reg = prod.pppRegistry;
    if (reg.doseMin && op_prod.doseValue < Number(reg.doseMin)) {
      issues.push({
        severity: "WARNING",
        code: "WZ-03-MIN",
        message: `Dawka ${op_prod.doseValue} ${op_prod.doseUnit} poniżej minimalnej etykietowej ${reg.doseMin} ${reg.doseUnit} dla ${prod.tradeName}.`,
        legalReference: `Etykieta ŚOR nr zezwolenia ${reg.registrationNo}`,
      });
    }
    if (reg.doseMax && op_prod.doseValue > Number(reg.doseMax)) {
      issues.push({
        severity: "ERROR",
        code: "WZ-03-MAX",
        message: `Dawka ${op_prod.doseValue} ${op_prod.doseUnit} przekracza maksymalną etykietową ${reg.doseMax} ${reg.doseUnit} dla ${prod.tradeName}. Zabroniona — art. 35 ustawy o ŚOR.`,
        legalReference: "Art. 35 ust. 1 ustawy z 8 marca 2013 r. o ŚOR",
      });
    }
  }
  return issues;
}
```

**Reguła WZ-04: Okres karencji NPR — sprawdzenie przed planowanym zbiorem**:
```typescript
async function validateCarenzaDays(op: OperationCreate, crop: Crop, products: ProductWithRegistry[]) {
  const issues: ValidationIssue[] = [];
  if (!crop.harvestDate) return issues;  // nieznana data zbioru — skip
  for (const op_prod of op.products) {
    const prod = products.find(p => p.id === op_prod.productId);
    if (!prod?.pppRegistry?.carenzaDays) continue;
    const minHarvestDate = addDays(op.startedAt, prod.pppRegistry.carenzaDays);
    if (crop.harvestDate < minHarvestDate) {
      issues.push({
        severity: "ERROR",
        code: "WZ-04",
        message: `Karencja ${prod.pppRegistry.carenzaDays} dni po zastosowaniu ${prod.tradeName} wykracza poza planowaną datę zbioru ${crop.harvestDate.toISOString().slice(0,10)}.`,
        legalReference: `Art. 35 ust. 1 ustawy o ŚOR, etykieta ${prod.pppRegistry.registrationNo}`,
      });
    }
  }
  return issues;
}
```

**Reguła WZ-05: BBCH w zakresie etykiety**:
```typescript
async function validateBbchPhase(op: OperationCreate, products: ProductWithRegistry[]) {
  const issues: ValidationIssue[] = [];
  if (op.bbchPhase === undefined) return issues;
  for (const op_prod of op.products) {
    const reg = products.find(p => p.id === op_prod.productId)?.pppRegistry;
    if (!reg) continue;
    if (reg.bbchMin !== null && op.bbchPhase < reg.bbchMin!) {
      issues.push({
        severity: "WARNING",
        code: "WZ-05",
        message: `Faza BBCH ${op.bbchPhase} poniżej zalecanego minimum ${reg.bbchMin} dla produktu.`,
      });
    }
    if (reg.bbchMax !== null && op.bbchPhase > reg.bbchMax!) {
      issues.push({
        severity: "WARNING",
        code: "WZ-05",
        message: `Faza BBCH ${op.bbchPhase} powyżej zalecanego maksimum ${reg.bbchMax} dla produktu.`,
      });
    }
  }
  return issues;
}
```

**Reguła WZ-06: Dozwolona uprawa**:
```typescript
async function validateAllowedCrop(op: OperationCreate, crop: Crop | null, products: ProductWithRegistry[]) {
  const issues: ValidationIssue[] = [];
  if (!crop) return issues;
  for (const op_prod of op.products) {
    const reg = products.find(p => p.id === op_prod.productId)?.pppRegistry;
    if (!reg) continue;
    if (reg.allowedCrops.length > 0 && !reg.allowedCrops.includes(crop.speciesCode)) {
      issues.push({
        severity: "ERROR",
        code: "WZ-06",
        message: `Produkt ${products.find(p => p.id === op_prod.productId)?.tradeName} nie jest dopuszczony na uprawę "${crop.speciesCode}". Art. 35 ustawy o ŚOR.`,
        legalReference: "Art. 35 ust. 1 ustawy o ŚOR",
      });
    }
  }
  return issues;
}
```

**Reguła WZ-07: Operator posiada ważne zaświadczenie**:
```typescript
function validateOperatorCertificate(op: OperationCreate, operator: Operator): ValidationIssue[] {
  if (op.type === "PPP_SPRAY" && operator.certificateExpiresAt < op.startedAt) {
    return [{
      severity: "ERROR",
      code: "WZ-07",
      message: `Operator ${operator.firstName} ${operator.lastName} nie posiada ważnego zaświadczenia (${operator.certificateNo}, wygasło ${operator.certificateExpiresAt.toISOString().slice(0,10)}).`,
      legalReference: "Art. 41 ustawy z 8 marca 2013 r. o ŚOR",
    }];
  }
  return [];
}
```

**Reguła WZ-08: STT sprzętu ważny**:
```typescript
function validateEquipmentStt(op: OperationCreate, equipment?: Equipment): ValidationIssue[] {
  if (op.type !== "PPP_SPRAY" || !equipment) return [];
  if (equipment.sttTestExpiresAt && equipment.sttTestExpiresAt < op.startedAt) {
    return [{
      severity: "ERROR",
      code: "WZ-08",
      message: `Sprzęt ${equipment.manufacturer ?? ""} ${equipment.model ?? ""} ma przeterminowane badanie STT (${equipment.sttTestExpiresAt.toISOString().slice(0,10)}).`,
      legalReference: "Art. 48 ustawy z 8 marca 2013 r. o ŚOR",
    }];
  }
  return [];
}
```

**Reguła WZ-09: OSN — kalendarzowy zakaz nawożenia N (15.10–1.03)**:
```typescript
function validateOsnCalendar(op: OperationCreate): ValidationIssue[] {
  if (op.type !== "FERTILIZATION_MINERAL" && op.type !== "FERTILIZATION_ORGANIC" && op.type !== "FERTILIZATION_MIXED") {
    return [];
  }
  const m = op.startedAt.getMonth() + 1; // 1-12
  const d = op.startedAt.getDate();
  const isForbidden =
    (m === 10 && d >= 15) || m === 11 || m === 12 || m === 1 || (m === 2) || (m === 3 && d < 1);
  if (isForbidden) {
    return [{
      severity: "ERROR",
      code: "WZ-09",
      message: `Nawożenie azotowe zabronione w okresie 15 października – 1 marca (Program OSN).`,
      legalReference: "Rozp. RM z 31 stycznia 2023 r. w sprawie Programu OSN (Dz.U. 2023 poz. 244), § 8",
    }];
  }
  return [];
}
```

**Reguła WZ-10: OSN — limit jednorazowej dawki N z nawozów organicznych**:
```typescript
function validateOrganicNLimit(op: OperationCreate, products: ProductWithRegistry[]): ValidationIssue[] {
  if (op.type !== "FERTILIZATION_ORGANIC" && op.type !== "FERTILIZATION_MIXED") return [];
  let totalN = 0;
  for (const op_prod of op.products) {
    const prod = products.find(p => p.id === op_prod.productId);
    if (prod?.type === "FERTILIZER_ORGANIC" && prod.fertilizerNContent) {
      totalN += Number(op_prod.doseValue) * Number(prod.fertilizerNContent) / 100;
    }
  }
  if (totalN > 170) {
    return [{
      severity: "ERROR",
      code: "WZ-10",
      message: `Jednorazowa dawka N z nawozów organicznych ${totalN.toFixed(1)} kg/ha przekracza limit 170 kg/ha.`,
      legalReference: "Program OSN, § 10 ust. 1",
    }];
  }
  return [];
}
```

**Reguła WZ-11: Dane obowiązkowe dla ŚOR (A.2)**:
Lista kluczowych pól wymaganych dla `PPP_SPRAY`:
```typescript
const REQUIRED_PPP_FIELDS = [
  "startedAt", "fieldId", "areaHa", "operatorId", "equipmentId",
  "weatherWindMs", "weatherTempC", // wymogi Dz.U. 2023 poz. 612
];
```
Jeżeli brakuje któregokolwiek — ERROR "WZ-11 pole wymagane: {field}".

**Reguła WZ-12: Strefa buforowa od wód**:
```typescript
async function validateWaterBuffer(op: OperationCreate, field: Field, products: ProductWithRegistry[]) {
  if (op.type !== "PPP_SPRAY") return [];
  // Query PostGIS: czy pole znajduje się w odległości < bufferFromWaterM od warstwy hydrograficznej
  // Query przykładowy:
  // SELECT MIN(ST_Distance(f.geometry::geography, h.geometry::geography)) FROM "Field" f, hydrography h WHERE f.id = $1
  // Warstwa "hydrography" musi być załadowana z KBDTR ARiMR lub MPHP (Mapa Podziału Hydrograficznego Polski)
  const issues: ValidationIssue[] = [];
  for (const op_prod of op.products) {
    const reg = products.find(p => p.id === op_prod.productId)?.pppRegistry;
    if (!reg?.bufferFromWaterM) continue;
    const minDistanceM = await queryMinDistanceToWater(field.id);
    if (minDistanceM < reg.bufferFromWaterM) {
      issues.push({
        severity: "ERROR",
        code: "WZ-12",
        message: `Pole jest w odległości ${minDistanceM} m od cieku wodnego, produkt wymaga ${reg.bufferFromWaterM} m bufora.`,
        legalReference: "Etykieta ŚOR nr " + reg.registrationNo + ", GAEC 4",
      });
    }
  }
  return issues;
}
```

### 4.3. Warstwa walidacji — orkiestracja

Plik: `src/lib/validators/field-register-validator.ts`:

```typescript
export async function validateOperation(
  input: OperationCreate,
  context: {
    operator: Operator;
    equipment?: Equipment;
    crop: Crop | null;
    field: Field;
    products: ProductWithRegistry[];
  }
): Promise<ValidationIssue[]> {
  const all = await Promise.all([
    Promise.resolve(validateWindSpeed(input)),
    Promise.resolve(validateTemperatureRange(input)),
    validatePppDoseRange(input, context.products),
    validateCarenzaDays(input, context.crop!, context.products),
    validateBbchPhase(input, context.products),
    validateAllowedCrop(input, context.crop, context.products),
    Promise.resolve(validateOperatorCertificate(input, context.operator)),
    Promise.resolve(validateEquipmentStt(input, context.equipment)),
    Promise.resolve(validateOsnCalendar(input)),
    Promise.resolve(validateOrganicNLimit(input, context.products)),
    Promise.resolve(validateRequiredFields(input)),
    validateWaterBuffer(input, context.field, context.products),
  ]);
  return all.flat();
}
```

### 4.4. Zachowanie wobec ERRORS/WARNINGS

- **ERROR** → blokada zapisu; UI pokazuje czerwony alert + link do `legalReference`.
- **WARNING** → dopuszcza zapis, ale wymaga checkboxa "Przyjmuję do wiadomości — dla mnie to OK" z polem `notes`.
- **INFO** → tooltip informacyjny, bez blokady.

---

## 5. Integracje danych zewnętrznych

### 5.1. Pogoda — snapshot w momencie zabiegu

Serwis: `src/lib/satellite/weather.ts` (istniejący, owrapowany Open-Meteo).

**Funkcja:** `getWeatherSnapshotAt(lat: number, lon: number, timestamp: Date)` → `{ tempC, windMs, humidity, source }`.

- Jeżeli `timestamp` ≤ 5 godzin wstecz → z Open-Meteo archiwalnego.
- Jeżeli `timestamp` w przyszłości → z prognozy.
- Priorytet: IMGW (dla PL > Open-Meteo jakość). Fallback Open-Meteo.

**Integracja:** przy zapisie zabiegu UI proponuje auto-wypełnienie pogody na podstawie pola i czasu. User może nadpisać (manual).

### 5.2. Rejestr ŚOR (PppRegistry) — synchronizacja

Zadanie cron: `/api/cron/sync-ppp-registry` uruchamiane **codziennie o 04:30 UTC**.

Workflow (`src/lib/sync/mrirw-ppp-sync.ts`):
1. HEAD request do `dane.gov.pl/media/resources/...rejestr-srodkow-ochrony-roslin.xlsx` → sprawdź ETag.
2. Jeśli zmieniony → GET + parsuj (biblioteka `xlsx` npm).
3. Dla każdego wiersza:
   - upsert do `PppRegistry` z `mrirwLastSyncAt = now()`,
   - zaktualizuj lub utwórz `Product` z `type = PPP` linkowany do `PppRegistry`.
4. Produkty nieobecne w aktualnym XLSX (wycofane) → `archivedAt = now()`.
5. Raport do logu: `{ added: N, updated: M, archived: K }`.

**Walidacja zmian** — jeśli w kolumnie "aktywne" zmienia się status z "aktywny" na "wycofany", wysyłamy e-mail do wszystkich gospodarstw, które **mają aktywne zabiegi z tym produktem w ostatnich 30 dniach**.

### 5.3. EPPO słownik

Serwis: `src/lib/sync/eppo-sync.ts`. Uruchamiany **raz w tygodniu** (niedziela 02:00).

API EPPO v3: `https://data.eppo.int/api/rest/1.0/codes`. Klucz bezpłatny po rejestracji.

Utrzymujemy tylko kategorie **PEST**, **DISEASE**, **WEED**, **HOST_PLANT** ograniczone do Europy.

### 5.4. IUNG KBW (susza)

Skanery: raz dziennie o 05:00 sprawdź czy nowy raport dekadowy IUNG dostępny: `susza.iung.pulawy.pl/rok/YYYY/dekada-XX/indeks.json`. Jeżeli tak:
- Pobierz raster TIF.
- Dla każdego pola przetnij raster (PostGIS `ST_Intersects`) → przypisz kategorię suszy.
- Jeśli kategoria ≥ 3 (susza umiarkowana dla uprawy) → alert SMS/WhatsApp do rolnika.

### 5.5. LPIS — aktualizacja warstwy

Aktualizacja **raz na kwartał** (1 kwietnia, 1 lipca, 1 października, 1 stycznia). Dane z **Geoportal.gov.pl WFS** (warstwa PL.ZSIN.KartaInformacyjnaBiblioteki).

Import do tabeli `LpisReference`. Po imporcie mechanizm **auto-matchingu** pól AgriClaw do działek ewidencyjnych (zob. Sekcja 11).

### 5.6. Natura 2000

Raz na rok (styczeń) — pobranie WFS GDOŚ → tabela `Natura2000Area`. Używane do walidatora WZ-XX (zabiegi w obszarach chronionych).

---

## 6. REST API — specyfikacja endpointów

Wszystkie endpointy pod `/api/field-register/*`. Auth: NextAuth JWT + `requireAuth()` + `requireFarm()`. Rate limit per user: 60 req/min (Upstash).

### 6.1. `POST /api/field-register/operations`

**Request:**
```json
{
  "fieldId": "clw1f2g3h4i5j6k7l8",
  "cropId": "clw1xxxxxxxxxxxxx",
  "type": "PPP_SPRAY",
  "startedAt": "2026-04-18T06:30:00Z",
  "areaHa": 12.40,
  "bbchPhase": 33,
  "reason": "septorioza pszenicy",
  "eppoCode": "SEPTTR",
  "operatorId": "clw1operator",
  "equipmentId": "clw1equip",
  "products": [
    { "productId": "clw1prod1", "doseValue": 1.2, "doseUnit": "L_HA" }
  ],
  "weatherTempC": 14.5,
  "weatherWindMs": 2.8,
  "weatherHumidity": 68,
  "weatherSource": "open-meteo",
  "notes": "Rano, bez wiatru."
}
```

**Response 201:**
```json
{
  "id": "clw2newop",
  "validation": {
    "errors": [],
    "warnings": [],
    "infos": []
  }
}
```

**Response 400** — walidacja nie powiodła się:
```json
{
  "error": "ValidationError",
  "validation": {
    "errors": [
      { "code": "WZ-01", "message": "...", "legalReference": "..." }
    ],
    "warnings": [],
    "infos": []
  }
}
```

### 6.2. `GET /api/field-register/operations?farmId=&fieldId=&dateFrom=&dateTo=&type=`

Query params:
- `farmId` — wymagane (infer z sesji dla roli Owner).
- `fieldId` — opcjonalne filter.
- `dateFrom`, `dateTo` — ISO dates.
- `type` — filter po typ zabiegu.
- `pagination` — `cursor` + `limit` (max 200).

**Response 200:**
```json
{
  "operations": [ { /* full Operation with expanded products, operator, equipment */ } ],
  "nextCursor": "clw2xxxxx",
  "total": 1243
}
```

### 6.3. `GET /api/field-register/operations/{id}`

Single operation z expand na wszystkie relacje + `auditEntries`.

### 6.4. `PATCH /api/field-register/operations/{id}`

Edit. Pola dozwolone do edycji:
- Jeśli `closedAt` jest null → wszystkie pola.
- Jeśli `closedAt != null` → **zablokowane** (403), z wyjątkiem `notes` (append only).

Po każdym PATCH → `AuditEntry` z `action = UPDATE` i `changedFields`.

### 6.5. `DELETE /api/field-register/operations/{id}`

Soft-delete. Ustawia `deletedAt`. Dostępne tylko dla `OWNER` i tylko gdy `closedAt == null`. Audit entry `DELETE`.

### 6.6. `POST /api/field-register/operations/{id}/close`

Zamknięcie wpisu — uniemożliwia dalsze edycje, zapisuje checksum SHA-256 pól. Po zamknięciu wpis jest niemutowalny.

### 6.7. `POST /api/field-register/periods/{year}/close`

Zamknięcie całego okresu rocznego. Wszystkie zabiegi w okresie dostają `closedAt`, checksum. Wywołuje `/api/field-register/exports/annual/{year}` (generacja PDF rocznego).

### 6.8. `POST /api/field-register/operations/bulk`

Import wsadowy — CSV upload. Używane przy migracji z papieru.

### 6.9. `GET /api/field-register/exports/pdf?farmId=&dateFrom=&dateTo=&type=`

Zwraca `application/pdf`. Generowanie w tle (job queue). Po zakończeniu redirect na URL.

### 6.10. `GET /api/field-register/exports/csv?...`

Jak wyżej, `text/csv`.

### 6.11. `GET /api/field-register/exports/json?...`

Jak wyżej, `application/json`.

### 6.12. `GET /api/field-register/exports/iacs-xml?farmId=&year=`

Generator XML do eWniosek Plus (Sekcja 10).

### 6.13. `GET /api/field-register/exports/agronomist-share/{token}`

Publiczny URL (z tokenem jednorazowym) — umożliwia doradcy odczyt bez logowania. Token generowany przez `POST /api/field-register/shares` z ograniczonym zakresem (fieldId lub farmId) i terminem ważności.

### 6.14. `GET /api/field-register/inspector-session`

Generowanie sesji "Prezentacja Inspektorowi" — patrz Sekcja 15. Zwraca URL + PIN + QR kod.

### 6.15. `POST /api/field-register/ppp-registry/lookup`

Request: `{ query: "Horus 200 SC" }` lub `{ registrationNo: "R-140/2020" }`. Response: lista kandydatów z `PppRegistry`. Używane do autocomplete.

### 6.16. `GET /api/field-register/dashboard?farmId=&year=`

Agregaty:
- `totalOperations` per type,
- `nUsedKgHa` — bilans azotu,
- `pppUsedKgHa` — łączna masa ŚOR,
- `substancjeCzynne` — histogram,
- `complianceScore` — indyk. 0-100 z walidatorów.

---

## 7. Eksport do PDF (layout IJHARS/PIORiN)

### 7.1. Narzędzie

**Biblioteka:** `@react-pdf/renderer` (React Server Components -> PDF). Alternatywa: `puppeteer` + HTML template (jeśli potrzebujemy pełnej swobody CSS).

**Rekomendacja:** `@react-pdf/renderer` — szybkie, serwerlessowe, bez uruchomienia Chromium.

### 7.2. Layout — strony i sekcje

**Strona 1 — Strona tytułowa:**
- Logo AgriClaw (top-left).
- Tytuł: **"EWIDENCJA ZABIEGÓW ŚRODKAMI OCHRONY ROŚLIN I NAWOŻENIA"**.
- Podtytuł: "Zgodnie z Rozp. MRiRW z dnia 30 marca 2023 r. (Dz.U. 2023 poz. 612)" oraz "Program OSN (Dz.U. 2023 poz. 244)".
- Dane gospodarstwa: nazwa, adres, NIP, REGON, **nr producenta ARiMR**, nr gospodarstwa w systemie IACS.
- Okres: od ... do ...
- Data wygenerowania, podpis elektroniczny/kwalifikowany (opcjonalnie).

**Strona 2+ — Zestawienie zabiegów:**

Format: tabela z jednym wierszem per zabieg.

Kolumny (14 w jednym wierszu):
```
| L.p. | Data zabiegu | Nr działki ewid. | Pole / Powierzchnia (ha) | Uprawa + BBCH | Agrofag | Środek / Nawóz | Substancja czynna | Nr zezw. | Dawka | Operator (certyfikat) | Sprzęt (STT) | Pogoda (T/W/H) | Karencja (NPR) |
```

Wierszy na stronę: 6-8 (layout landscape A4, font 8pt).

**Strony podsumowujące:**
- Zestawienie zużycia ŚOR według substancji czynnych (tabela: `substancja — całkowita ilość kg — łączna powierzchnia ha`).
- Zestawienie nawożenia: bilans N, P, K per pole + gospodarstwo.
- Zestawienie operatorów: ilość zabiegów, status certyfikatów.

**Stopki (każdej strony):**
- "Strona X z Y".
- "Wygenerowano przez AgriClaw.pl dnia YYYY-MM-DD HH:MM — hash integralności: SHA-256:[skrót]".
- Podpis operatora w ostatniej stronie (pole odręczne lub kwalifikowany PDF).

### 7.3. Kod (szkielet React)

```tsx
// src/lib/pdf/field-register-pdf.tsx
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 24, fontFamily: "Helvetica", fontSize: 9 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 14, fontWeight: "bold", textAlign: "center", marginVertical: 12 },
  table: { display: "flex", flexDirection: "column", borderStyle: "solid", borderWidth: 0.5 },
  row: { flexDirection: "row", borderBottomWidth: 0.3, minHeight: 20 },
  cell: { padding: 3, borderRightWidth: 0.3 },
  // ...
});

export function FieldRegisterPdf({ farm, operations, period }: Props) {
  return (
    <Document title={`Księga polowa ${farm.name} ${period.from.toISOString().slice(0,10)}..${period.to.toISOString().slice(0,10)}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <TitlePage farm={farm} period={period} />
      </Page>
      {chunk(operations, 7).map((batch, i) => (
        <Page key={i} size="A4" orientation="landscape" style={styles.page}>
          <OperationsTable operations={batch} />
          <PageFooter pageNum={i+2} total={/*...*/} hash={/*sha of payload*/} />
        </Page>
      ))}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <ActiveSubstanceSummary operations={operations} />
        <NBalanceSummary operations={operations} />
        <OperatorSummary operations={operations} />
      </Page>
    </Document>
  );
}
```

### 7.4. Podpis kwalifikowany (opcjonalny)

Integracja z **Krajową Infrastrukturą Podpisu Elektronicznego (KIR, Unizeto)** — po złożeniu podpisu kwalifikowanego przez rolnika, PDF zyskuje **zintegrowany certyfikat** (PAdES). API: `signhub.pl/api` (płatne) lub `mojepodpisy.pl`. Integracja opcjonalna w v1.2 (nie MVP).

---

## 8. Eksport do CSV

### 8.1. Format

- Encoding: **UTF-8 z BOM** (dla kompatybilności z Excel PL).
- Separator: **średnik ";"**.
- Cudzysłowy: `"` dla wszystkich pól tekstowych (zgodnie z RFC 4180 z polską specyfiką).
- Data: `YYYY-MM-DD`.
- Decimal: `,` (przecinek) — polski standard.

### 8.2. Nagłówki kolumn (PL)

```
"Lp.";"Data zabiegu";"Pole (nazwa)";"Działka ewid.";"Powierzchnia [ha]";"Uprawa";"BBCH";"Typ zabiegu";"Agrofag (EPPO)";"Środek — nazwa handlowa";"Substancja czynna";"Nr zezwolenia MRiRW";"Dawka";"Jednostka";"Operator — imię nazwisko";"Nr zaświadczenia operatora";"Sprzęt typ";"Nr badania STT";"Temp. [°C]";"Wiatr [m/s]";"Wilgotność [%]";"Okres karencji [dni]";"Okres prewencji [godz]";"Uwagi"
```

### 8.3. Endpoint

`GET /api/field-register/exports/csv?dateFrom=2026-01-01&dateTo=2026-12-31`.

Streaming response — `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="ksiega-polowa-{farm}-{year}.csv"`.

Generator w `src/lib/exports/csv-generator.ts`:
```typescript
export async function* generateCsvStream(ops: AsyncIterable<OperationFull>): AsyncIterable<string> {
  yield "\uFEFF";  // BOM
  yield CSV_HEADER_LINE + "\r\n";
  let i = 1;
  for await (const op of ops) {
    yield csvLine(i++, op) + "\r\n";
  }
}
```

---

## 9. Eksport do JSON (AgriClaw Public API v1)

### 9.1. Schema

```json
{
  "$schema": "https://agriclaw.pl/schemas/field-register/v1.json",
  "schema": "agriclaw.field-register.v1",
  "exportedAt": "2026-04-18T10:00:00Z",
  "exporter": {
    "application": "AgriClaw",
    "version": "1.2.0"
  },
  "farm": {
    "id": "clw1farm",
    "name": "Gospodarstwo Nowak",
    "nip": "1234567890",
    "regon": "123456789",
    "arimrProducerId": "072581234567",
    "iacsFarmId": "PL-072581234567",
    "address": { "street": "...", "postalCode": "...", "city": "..." }
  },
  "period": { "from": "2026-01-01", "to": "2026-12-31" },
  "operations": [
    {
      "id": "clw2op1",
      "type": "PPP_SPRAY",
      "startedAt": "2026-04-18T06:30:00Z",
      "finishedAt": "2026-04-18T10:15:00Z",
      "field": {
        "id": "clw1field",
        "name": "Pole 3",
        "areaHa": 12.40,
        "lpisParcels": [
          { "voivodeship": "wielkopolskie", "commune": "Kościan", "cadastralDistrict": "Wielichowo", "parcelNumber": "234/1" }
        ]
      },
      "crop": {
        "speciesCode": "PSZENICA_OZIMA",
        "varietyName": "Tobak",
        "bbchPhase": 33
      },
      "products": [
        {
          "tradeName": "Horus 200 SC",
          "pppRegistrationNo": "R-140/2020",
          "activeSubstances": [ { "substance": "cyprokonazol", "concentration": 200, "unit": "g/l" } ],
          "doseValue": 1.2,
          "doseUnit": "L_HA"
        }
      ],
      "operator": {
        "firstName": "Jan",
        "lastName": "Nowak",
        "certificateNo": "ZSOR-123456/2024",
        "certificateExpiresAt": "2029-06-15"
      },
      "equipment": {
        "type": "SPRAYER_FIELD",
        "manufacturer": "Amazone",
        "model": "UX 5201",
        "sttTestNo": "STT-987654/2025",
        "sttTestExpiresAt": "2028-03-20"
      },
      "weather": {
        "tempC": 14.5,
        "windMs": 2.8,
        "humidity": 68,
        "source": "open-meteo"
      },
      "reason": "septorioza pszenicy",
      "eppoCode": "SEPTTR",
      "notes": "Rano, bez wiatru.",
      "compliance": {
        "ipSystem": false,
        "bioCompliant": false,
        "validationErrors": [],
        "validationWarnings": []
      },
      "audit": {
        "createdAt": "2026-04-18T11:30:00Z",
        "createdBy": "Jan Nowak",
        "updatedAt": "2026-04-18T11:30:00Z",
        "version": 1,
        "closedAt": null,
        "checksum": null
      }
    }
  ],
  "summaries": {
    "totalOperations": 42,
    "byType": { "PPP_SPRAY": 18, "FERTILIZATION_MINERAL": 12, "SOWING": 2, "HARVEST": 3, "TILLAGE": 7 },
    "activeSubstanceUsage": [
      { "substance": "cyprokonazol", "totalKg": 8.928, "totalHa": 372.0 }
    ],
    "nitrogenBalance": {
      "totalInputKgN": 12600,
      "totalOutputKgN": 10480,
      "balanceKgNPerHa": 42.4
    }
  }
}
```

### 9.2. JSON Schema

Plik: `docs/research/schemas/field-register-v1.json`. Opisuje strukturę, typy, wymaganości. Walidacja client-side i server-side z `ajv`.

### 9.3. Wersjonowanie

Każda zmiana schematu to nowa wersja. Wsparcie retrospekcyjne dla v1.x przez co najmniej 24 miesiące od wprowadzenia v2.

---

## 10. Eksport do XML (ARiMR eWniosek Plus)

### 10.1. Schemat

XSD ARiMR 2026.1 — plik `arimr.pl/eWniosek/xsd/ewidencja-scc-2026.xsd` (referowany w Sekcji A.3 dokumentu eu-pl-regulations-2026.md).

**Namespace:** `urn:gov:pl:mrirw:arimr:iacs:ewidencja:2026`.

**Elementy główne:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ewidencja xmlns="urn:gov:pl:mrirw:arimr:iacs:ewidencja:2026"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:schemaLocation="urn:gov:pl:mrirw:arimr:iacs:ewidencja:2026 ewidencja-scc-2026.xsd"
           wersja="1.0">

  <naglowek>
    <identyfikatorProducenta>072581234567</identyfikatorProducenta>
    <nip>1234567890</nip>
    <rok>2026</rok>
    <dataWygenerowania>2026-04-18T10:00:00+02:00</dataWygenerowania>
    <aplikacjaZrodlowa nazwa="AgriClaw" wersja="1.2.0" />
  </naglowek>

  <gospodarstwo>
    <nazwa>Gospodarstwo Nowak</nazwa>
    <adres>
      <ulica>...</ulica>
      <miejscowosc>...</miejscowosc>
      <kodPocztowy>64-000</kodPocztowy>
    </adres>
    <powierzchniaUR jednostka="ha">120.50</powierzchniaUR>
  </gospodarstwo>

  <dzialki>
    <dzialka>
      <idWewnetrzne>Pole-3</idWewnetrzne>
      <obreb>Wielichowo</obreb>
      <numer>234/1</numer>
      <powierzchniaHa>12.40</powierzchniaHa>
      <uprawa>
        <kod>PSZENICA_OZIMA</kod>
        <odmiana>Tobak</odmiana>
      </uprawa>
    </dzialka>
  </dzialki>

  <zabiegi>
    <zabieg id="OP-001" typ="PPP_SPRAY">
      <data>2026-04-18T06:30:00+02:00</data>
      <idDzialki>Pole-3</idDzialki>
      <powierzchniaHa>12.40</powierzchniaHa>
      <fazaBBCH>33</fazaBBCH>
      <agrofag kod="SEPTTR">septorioza pszenicy</agrofag>
      <operator>
        <imieNazwisko>Jan Nowak</imieNazwisko>
        <nrZaswiadczenia>ZSOR-123456/2024</nrZaswiadczenia>
      </operator>
      <sprzet>
        <typ>SPRAYER_FIELD</typ>
        <nrBadaniaSTT>STT-987654/2025</nrBadaniaSTT>
      </sprzet>
      <srodek>
        <nazwaHandlowa>Horus 200 SC</nazwaHandlowa>
        <nrZezwolenia>R-140/2020</nrZezwolenia>
        <substancjeCzynne>
          <substancja koncentracja="200" jednostka="g/l">cyprokonazol</substancja>
        </substancjeCzynne>
        <dawka jednostka="l/ha">1.200</dawka>
      </srodek>
      <pogoda temp="14.5" wiatr="2.8" wilgotnosc="68" />
    </zabieg>
  </zabiegi>

  <bilansAzotu>
    <rok>2026</rok>
    <wejscie>
      <mineralne kgN="10400" />
      <organiczne kgN="2200" />
      <inne kgN="0" />
      <razem kgN="12600" />
    </wejscie>
    <wyjscie>
      <plonGlowny kgN="9200" />
      <produktyUboczne kgN="1280" />
      <razem kgN="10480" />
    </wyjscie>
    <saldoKgNPerHa>42.4</saldoKgNPerHa>
  </bilansAzotu>

</ewidencja>
```

### 10.2. Walidacja

Przed generowaniem XML walidator:
1. Sprawdza czy wszystkie pola wymagane w XSD są wypełnione.
2. Uruchamia parser XSD (biblioteka `libxmljs2` w Node).
3. Zwraca listę błędów (jeśli są).

Jeśli brakuje danych — UI pokazuje "Uzupełnij: operatorzy, certyfikaty STT, analiza gleby...".

### 10.3. Podpis

**Stan na kwiecień 2026:** ARiMR nie wymaga podpisu kwalifikowanego na pliku XML — podpis jest na formularzu wniosku (eWniosek) w ARiMR, XML jest załącznikiem. Format: zwykły XML, UTF-8, bez kodowania (pole binary base64 nie wymagane).

### 10.4. Transport

Plik XML zapisywany na dysku użytkownika → user ładuje ręcznie w aplikacji eWniosek Plus (stan pilotażu API, zob. eu-pl-regulations-2026.md Sekcja A.4). Od Q4 2026 — automatyczny upload przez API (wersja v1.2+).

---

## 11. Integracja z LPIS — mapowanie pól do działek ewidencyjnych

### 11.1. LPIS — dane źródłowe

LPIS (Land Parcel Identification System) — warstwa referencyjna ARiMR w ramach IACS. Udostępniana przez **Geoportal.gov.pl** jako WFS:
- URL: `https://mapy.geoportal.gov.pl/wss/service/PZGIK/EGIB/WFS`
- Warstwa: `EGiB_KopiaRoboczaDzialki` (ewidencja gruntów i budynków).
- Format: GML 3.2 lub GeoJSON (po konwersji).

### 11.2. Model danych — LpisReference

Już zdefiniowany w Sekcji 3.1.

### 11.3. Algorytm matchingu Field → LpisParcel

Dla każdego pola (`Field.geometry`):
1. Znajdź działki LPIS przecinające się z polem (`ST_Intersects`).
2. Dla każdej — oblicz procent pokrycia: `ST_Area(ST_Intersection(...)) / ST_Area(Field.geometry)`.
3. Dołącz wszystkie działki z pokryciem ≥ 1%.
4. Jeśli jedna działka pokrywa ≥ 95% — primary parcel.
5. Jeśli >2 działek z pokryciem > 30% — pole rozciąga się na wielu działkach → zapisz wszystkie.

Zapis relacji: `FieldLpisParcel` (many-to-many):
```prisma
model FieldLpisParcel {
  id          String   @id @default(cuid())
  fieldId     String
  lpisRefId   String
  coveragePct Decimal  @db.Decimal(5, 2)
  isPrimary   Boolean  @default(false)

  field       Field    @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  lpisRef     LpisReference @relation(fields: [lpisRefId], references: [id])

  @@unique([fieldId, lpisRefId])
}
```

### 11.4. UI — edycja pola

Przy edycji pola (geometria rysowana przez użytkownika) w tle uruchamiany jest matching. UI pokazuje:
- "Pole pokrywa działkę ewidencyjną 234/1 w 89%, działkę 234/2 w 11%"
- Przy eksporcie XML/CSV używamy primary parcel + listę pomocniczych.

---

## 12. Synchronizacja z rejestrem ŚOR (MRiRW)

### 12.1. Źródło

`dane.gov.pl/pl/dataset/1178,rejestr-srodkow-ochrony-roslin`.

Format: XLSX, kolumny:
- `Nr zezwolenia`,
- `Nazwa handlowa`,
- `Producent`,
- `Typ`,
- `Substancja czynna`,
- `Koncentracja`,
- `Uprawy dopuszczone`,
- `Agrofagi`,
- `Dawka min`,
- `Dawka max`,
- `Jednostka`,
- `Liczba zabiegów/sezon`,
- `Okres karencji [dni]`,
- `Data rozpoczęcia zezwolenia`,
- `Data końca zezwolenia`,
- `Link do etykiety`.

### 12.2. Parser

`src/lib/sync/mrirw-xlsx-parser.ts`:

```typescript
import { read, utils } from "xlsx";

export async function parseMrirwRegistry(buffer: Buffer): Promise<PppRegistryRaw[]> {
  const wb = read(buffer, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = utils.sheet_to_json<MrirwRow>(sheet);

  return rows.map(row => ({
    registrationNo: row["Nr zezwolenia"],
    tradeName: row["Nazwa handlowa"],
    producer: row["Producent"],
    type: mapType(row["Typ"]),
    activeSubstances: parseActiveSubstances(row["Substancja czynna"], row["Koncentracja"]),
    allowedCrops: parseAllowedCrops(row["Uprawy dopuszczone"]),
    allowedAgrofags: parseAgrofags(row["Agrofagi"]),
    doseMin: parseDecimal(row["Dawka min"]),
    doseMax: parseDecimal(row["Dawka max"]),
    doseUnit: mapDoseUnit(row["Jednostka"]),
    maxApplicationsPerSeason: parseInt(row["Liczba zabiegów/sezon"]),
    carenzaDays: parseInt(row["Okres karencji [dni]"]),
    approvedFrom: parseDate(row["Data rozpoczęcia zezwolenia"]),
    approvedUntil: parseDate(row["Data końca zezwolenia"]),
    labelPdfUrl: row["Link do etykiety"],
  }));
}
```

### 12.3. Upsert logic

```typescript
async function syncMrirwToDb(rows: PppRegistryRaw[]) {
  const syncedIds = new Set<string>();

  for (const raw of rows) {
    const existing = await prisma.pppRegistry.findUnique({
      where: { registrationNo: raw.registrationNo },
    });

    if (!existing) {
      await prisma.pppRegistry.create({
        data: { ...raw, mrirwLastSyncAt: new Date() },
      });
    } else {
      await prisma.pppRegistry.update({
        where: { id: existing.id },
        data: { ...raw, mrirwLastSyncAt: new Date() },
      });
    }
    syncedIds.add(raw.registrationNo);
  }

  // Wycofanie nie-widocznych
  const allExisting = await prisma.pppRegistry.findMany({
    where: { mrirwLastSyncAt: { lt: subHours(new Date(), 2) } },
  });
  for (const rec of allExisting) {
    if (!syncedIds.has(rec.registrationNo)) {
      await prisma.pppRegistry.update({
        where: { id: rec.id },
        data: { approvedUntil: new Date() },
      });
      // Alert: powiadom gospodarstwa o wycofaniu
      await notifyFarmsAboutWithdrawal(rec);
    }
  }
}
```

### 12.4. Częstotliwość

Cron: `0 4 * * *` (04:00 UTC każdego dnia) — pobranie i synchronizacja.

---

## 13. Audit trail, wersjonowanie, integralność

### 13.1. AuditEntry — struktura

Każda mutacja encji `Operation` (CREATE, UPDATE, DELETE, CLOSE) powinna tworzyć wpis w `AuditEntry`:

```typescript
interface AuditEntryPayload {
  operationId: string;
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "CLOSE";
  changedFields: Array<{ field: string; from: unknown; to: unknown }>;
  ipAddress?: string;
  userAgent?: string;
}
```

### 13.2. Middleware Prisma

Rozszerzenie Prisma Client (`src/lib/prisma.ts`):
```typescript
import { Prisma, PrismaClient } from "@prisma/client";

const prismaBase = new PrismaClient();

export const prisma = prismaBase.$extends({
  query: {
    operation: {
      async update({ args, query, model }) {
        const before = await prismaBase.operation.findUnique({ where: args.where });
        const result = await query(args);
        if (before) {
          const diff = computeDiff(before, result);
          await prismaBase.auditEntry.create({
            data: {
              operationId: before.id,
              userId: getCurrentUserId(),
              action: "UPDATE",
              changedFields: diff,
              ipAddress: getCurrentIp(),
              userAgent: getCurrentUserAgent(),
            },
          });
        }
        return result;
      },
      // ... analogicznie dla create, delete
    },
  },
});
```

Uwaga: `getCurrentUserId()`, `getCurrentIp()` — pobierane z AsyncLocalStorage context w request handler.

### 13.3. Checksum — integralność wpisu zamkniętego

Po `POST /operations/{id}/close`:
```typescript
function computeChecksum(op: OperationFull): string {
  const payload = canonicalJson(op);   // deterministyczne JSON stringify
  return crypto.createHash("sha256").update(payload).digest("hex");
}
```

Po zamknięciu `checksum` jest niemutowalny. Jakakolwiek późniejsza próba UPDATE sprawdza `if (op.closedAt) return 403`.

### 13.4. Weryfikacja integralności (dla audytu)

Endpoint `GET /api/field-register/operations/{id}/verify-integrity` zwraca:
```json
{
  "valid": true,
  "currentChecksum": "sha256:abc123...",
  "storedChecksum": "sha256:abc123...",
  "closedAt": "2026-12-31T23:59:59Z"
}
```

Jeśli `valid: false` — alarm do support + UOD0 (potencjalny incydent bezpieczeństwa).

---

## 14. Retencja i usuwanie danych (RODO)

### 14.1. Reguły retencji

| Kategoria danych | Czas retencji | Podstawa |
|---|---|---|
| Zabiegi ŚOR | 10 lat | Art. 67 ust. 3 ustawy o ŚOR (min. 3) + bufor na certyfikaty + ubezpieczenia |
| Nawożenie | 10 lat | Program OSN (min. 3) + bufor |
| Raporty szkody ubezpieczeniowe | 5 lat po wypłacie | praktyka rynkowa TU |
| Dane osobowe operatora (PESEL) | 5 lat po ostatnim zabiegu | art. 6 ust. 1 lit. b RODO + ograniczenie czasowe |
| AuditEntry | 5 lat | art. 30 RODO — rejestr przetwarzania |
| Logi techniczne | 12 miesięcy | operacyjne |

### 14.2. Scheduler retencji

Cron: **pierwszy dzień każdego miesiąca, 03:00 UTC**.

Workflow `src/lib/retention/retention-scheduler.ts`:
1. Znajdź `AuditEntry` starsze niż 5 lat → DELETE.
2. Znajdź `Operation` starsze niż 10 lat, `closedAt != null` → SOFT-DELETE (przesunięcie do `ArchivedOperation` table, po 12 mc → HARD-DELETE).
3. Znajdź `Operator` bez aktywnych `Operation` i wszystkie jego `Operation` starsze niż 5 lat → pseudonimizuj PESEL i dane kontaktowe.

### 14.3. Żądanie usunięcia (RODO art. 17)

Endpoint `POST /api/gdpr/delete-request`:
- Wymaga potwierdzenia e-mail (link w wiadomości).
- Po potwierdzeniu: natychmiastowa pseudonimizacja identyfikatorów osobowych (imię, nazwisko, PESEL, telefon, e-mail, adres).
- Dane operacyjne (zabiegi, pola, geometria) **pozostają** — stanowią one obowiązek ustawowy, pseudonimizacja spełnia wymogi RODO (motyw 26).
- Po upływie retencji (10 lat) — pełne usunięcie.

UI: przycisk "Zażądaj usunięcia moich danych" w `/dashboard/settings/privacy`.

Komunikat do użytkownika:
> Twoje dane osobowe (imię, nazwisko, PESEL itp.) zostały pseudonimizowane. Dane dotyczące zabiegów pozostają w rejestrze zgodnie z obowiązkiem prawnym (art. 67 ustawy o ŚOR, Program OSN) przez 10 lat od ostatniego wpisu. Po tym czasie zostaną trwale usunięte.

---

## 15. Kontrole inspekcyjne

### 15.1. Cel trybu "Prezentacja Inspektorowi"

Umożliwia inspektorowi PIORiN/IJHARS/ARiMR **odczyt** księgi polowej **bez dostępu do konta rolnika**, przez dedykowaną sesję z ograniczeniami.

### 15.2. Generowanie sesji

Rolnik klika "Udostępnij inspektorowi" → modal:
- Wybór daty (default: dziś).
- Wybór zakresu (cały rok bieżący, ostatnie 3 lata).
- Wybór praw (odczyt / odczyt + export PDF / odczyt + weryfikacja hashów).
- Wygenerowanie **kodu PIN (6 cyfr)** + link + QR kod.

Backend:
```typescript
POST /api/field-register/inspector-session
{
  "validMinutes": 120,
  "scope": {
    "dateFrom": "2023-01-01",
    "dateTo": "2026-04-18"
  },
  "permissions": ["READ", "EXPORT_PDF"]
}
→ {
  "sessionUrl": "https://agriclaw.pl/inspector/{uuid}",
  "pin": "483716",
  "expiresAt": "2026-04-18T12:30:00Z"
}
```

### 15.3. UI inspektora

URL `/inspector/{uuid}` → ekran z polem PIN. Po wprowadzeniu PIN:
- Pokazuje logo "AgriClaw — Tryb kontroli".
- Dane gospodarstwa (nazwa, NIP, REGON, ARiMR ID).
- **Tabela zabiegów** z wszystkimi polami z Sekcji 7.2.
- Każda operacja rozwija się do pełnych szczegółów (dawka, operator, sprzęt, pogoda, walidacje).
- **Checksum** wyświetlany dla każdego zamkniętego wpisu.
- Przycisk "Zweryfikuj integralność wpisu" → checksum live vs stored.
- Przycisk "Eksport PDF" (jeśli uprawnienie).
- Licznik pozostałego czasu sesji.

Po wygaśnięciu sesji URL zwraca 410 Gone.

### 15.4. Logowanie aktywności inspektora

Każda interakcja inspektora (wyświetlenie, eksport) trafia do `InspectorSessionLog` — przydatne do odtworzenia scenariusza kontroli + rolnik ma przejrzystość co dokładnie inspektor widział.

### 15.5. Opcja "Protokół kontroli" (v1.2)

Inspektor może w trakcie sesji odznaczać pytania z checklisty kontroli PIORiN. Po zakończeniu generuje się **PDF "Protokół kontroli terenowej"** wg wzoru z rozporządzenia w sprawie kontroli PIORiN.

---

## 16. Generator Planu Nawozowego (OSN)

### 16.1. Podstawa

Program OSN (Rozp. RM z 31.01.2023 r., Dz.U. 2023 poz. 244, ze zm. 2025) — obowiązek prowadzenia **Planu Nawozowego** dla gospodarstw > 100 ha UR lub > 50 DJP. Dla mniejszych — bilans azotu od 2023 r.

### 16.2. Struktura Planu Nawozowego

Dokument PDF zawiera:
- **Strona 1**: dane gospodarstwa, zestawienie pól z uprawami.
- **Strona 2+**: dla każdego pola:
  - Przewidywany plon (t/ha).
  - Zapotrzebowanie na N, P2O5, K2O (kg/ha × powierzchnia) wg norm IUNG/CDR.
  - Uzupełnienie z analizy gleby (Nmin) — wpisane przez rolnika.
  - Planowane źródła azotu (mineralne + organiczne).
  - Harmonogram aplikacji.
- **Strona końcowa**: bilans całościowy + podpis rolnika.

### 16.3. Kalkulator

`src/lib/planning/fertilization-plan-calculator.ts`:

```typescript
export function calculateNRequirement({
  cropCode,
  plannedYieldTha,
  soilNminKgHa,
  previousCropCode,
}: FertPlanInput): NRequirement {
  const baseNNeed = CROP_N_COEFFICIENT[cropCode] * plannedYieldTha;  // np. 25 kg N/t pszenicy
  const soilContribution = soilNminKgHa;
  const previousCropBonus = PREVIOUS_CROP_N_BONUS[previousCropCode] ?? 0;  // po strączkowych +30 kg N/ha
  const totalNeed = baseNNeed - soilContribution - previousCropBonus;
  return {
    baseNeed: baseNNeed,
    soilContribution,
    previousCropBonus,
    totalNeed: Math.max(0, totalNeed),
    recommendedMineralN: totalNeed * 0.7,
    recommendedOrganicN: totalNeed * 0.3,
  };
}
```

Współczynniki `CROP_N_COEFFICIENT` pochodzą z IUNG i CDR — tabela sztywno w kodzie, aktualizowana przy rocznej rewizji danych:
- PSZENICA_OZIMA: 25 kg/t
- PSZENICA_JARA: 22 kg/t
- RZEPAK_OZIMY: 55 kg/t
- KUKURYDZA_ZIARNO: 20 kg/t
- ZIEMNIAK: 4 kg/t
- BURAK_CUKROWY: 3 kg/t

### 16.4. PDF layout

- Wzór CDR z broszury "Plan Nawozowy — wytyczne" (2024).
- Biblioteka `@react-pdf/renderer`.
- Pola wypełniane automatycznie + sekcje manualne (analiza gleby).

### 16.5. Eksport XML do eWniosek Plus (ES2 SCC)

Jako załącznik do deklaracji ekoschematu ES2 — osobny XML `planNawozowy` w schemacie ARiMR.

---

## 17. Integracja z czatem AI (głosowe wprowadzanie zabiegu)

### 17.1. Use case

Rolnik w trakcie zabiegu (lub po) mówi do WhatsAppa:
> *"Wczoraj po południu opryskałem pole 3 Horusem 200, 1,2 litra na hektar, wiatr był lekki, temp. 14 stopni."*

AgriClaw AI Agent:
1. Parsuje intent (OPERATION_ENTRY).
2. Wyciąga entitites: pole (Pole 3), data (wczoraj po południu → 2026-04-17 around 14-17), produkt (Horus 200 — lookup w PppRegistry → R-140/2020), dawka (1,2 L/ha), pogoda (wiatr slaby → szacunek 2 m/s, temp 14°C).
3. Wypełnia draft `Operation` → pyta: "Wczoraj, 17 kwietnia. Pole 3, Horus 200 SC 1,2 L/ha przeciw septoriozie. Potwierdzasz?"
4. User: "Tak" → zapis.
5. Walidacja automatyczna, powiadomienie o ewentualnych błędach.

### 17.2. Integracja z OpenClaw Gateway

Dodajemy skill:
```typescript
// src/app/api/skills/agri-field-register/create-operation/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  // body: { farmId, fieldId, type, startedAt, products, ... }

  // Używamy tego samego walidatora jak w normalnym API
  const validation = await validateOperation(body, context);

  return json({
    created: validation.errors.length === 0,
    validation,
    draftId: validation.errors.length > 0 ? savedDraft.id : undefined,
    operationId: validation.errors.length === 0 ? created.id : undefined,
  });
}
```

### 17.3. Język naturalny → pole / produkt resolver

`src/lib/nlu/field-resolver.ts`:
- "pole 3" → szukaj w `Field.name`, fuzzy match.
- "pszenica obok rzeki" → query po geometrii + uprawie.

`src/lib/nlu/product-resolver.ts`:
- "Horus" → lookup w `PppRegistry.tradeName` LIKE.
- Jeżeli ambiguous (>1 match) → pyta dopytki.

---

## 18. UI/UX — makiety ekranów

### 18.1. Ekran listy zabiegów

Ścieżka: `/dashboard/field-register`.

Layout:
```
┌─ Sidebar ─┬─────────────────────────────────────────────────┐
│           │  Księga Polowa                                   │
│ Pola      │  [Dodaj zabieg] [Eksport] [Prezentacja kontroli] │
│ Analizy   │  ──────────────────────────────────────────────  │
│ Księga    │  Filtr: [2026 ▼] [Typ: wszystkie ▼] [Pole: ▼]    │
│  polowa   │  ──────────────────────────────────────────────  │
│ Plan N    │  2026-04-18  PPP  Pole 3  Horus 200 SC  1.2 L/ha│
│ Statystyki│  2026-04-15  SOW  Pole 1  siew kukurydzy         │
│           │  2026-04-10  FER  Pole 3  saletra amonowa 150kg  │
│           │  ...                                             │
│           │  ──────────────────────────────────────────────  │
│           │  Wskaźnik zgodności: 96/100 [ikonki kolorowe]    │
└───────────┴─────────────────────────────────────────────────┘
```

Interakcje:
- Klik w wiersz → szczegóły zabiegu (drawer po prawej).
- Ikonki walidacji (zielone = OK, żółte = warning, czerwone = error).
- Quick filters: "ostatnie 30 dni", "tylko ŚOR", "tylko nawożenie".

### 18.2. Modal "Dodaj zabieg"

Stepper 4 kroki:
1. **Pole i data** — wybór pola z mapy, data + godzina (default: teraz).
2. **Typ i przedmiot** — wybór typu zabiegu, wybór produktu (autocomplete z `PppRegistry`), dawka.
3. **Operator i sprzęt** — dropdown z aktywnymi operatorami i sprzętem.
4. **Pogoda i potwierdzenie** — auto-fill pogody (Open-Meteo), walidacja + zapis.

Na każdym kroku live-walidacja. Czerwone ERROR = blokada "Dalej".

### 18.3. Ekran szczegółów zabiegu

Prawy drawer:
- Nagłówek: typ + data + pole.
- Sekcja "Produkt" — link do etykiety ŚOR + wykres dawki względem zakresu etykietowego.
- Sekcja "Operator" — imię, certyfikat, wygasa za X dni (czerwono jeśli <30).
- Sekcja "Sprzęt" — STT.
- Sekcja "Pogoda" — temperatura, wiatr, wilgotność.
- Sekcja "Walidacja" — lista errors/warnings z legalReference.
- Sekcja "Audit" — historia edycji.
- Przyciski: "Edytuj", "Usuń", "Zamknij wpis (niemutowalny)".

### 18.4. Ekran eksportu

Szary modal z opcjami:
- Format: PDF / CSV / JSON / XML eWniosek Plus.
- Zakres: rok 2026 / okres własny.
- Filtr: wszystkie / tylko ŚOR / tylko nawożenie.
- Podpis: elektroniczny / kwalifikowany (v1.2) / brak.

### 18.5. Ekran "Dashboard Compliance"

Duży widget z:
- Oceną compliance (0-100).
- Lista checklisty (GAEC 1-9, SMR 10-11).
- Alerty aktywne (np. "Certyfikat operatora X wygasa za 15 dni").

---

## 19. Plan migracji z papieru do AgriClaw

### 19.1. Problem

Rolnik ma papierową księgę polową za ostatnie 3 lata. Chce w AgriClaw mieć wsteczne wpisy.

### 19.2. Kanały migracji

**Opcja A — Ręczny formularz** (50 wpisów/dzień dla rolnika). Nudne, ale precyzyjne.

**Opcja B — Import CSV** — rolnik w Excelu przepisuje papier do szablonu CSV AgriClaw (dostępny w `/dashboard/field-register/import/template.csv`). Import przez UI → walidacja → zapis w tle.

**Opcja C — OCR zeszytu** (v1.2) — rolnik fotografuje strony księgi, AgriClaw OCR + ekstrakcja pól (Tesseract + LLM post-processing Claude Opus).

**Opcja D — Import z innego systemu** — ImportAdapter dla:
- GFP (XML),
- eAgro (XLSX),
- SatAgro (JSON) — wymaga zgody rolnika + dostępu API SatAgro (partnerstwo).

### 19.3. Walidacja wsteczna

Wpisy wsteczne nie blokują zapisu nawet przy ERROR (np. przeterminowany certyfikat historyczny) — ale oznaczone są ikoną "Uwaga: historyczna niezgodność".

### 19.4. Finalizacja migracji

Po zakończeniu migracji rolnik ma wpis: "Migracja z papieru zakończona 2026-04-18. Wpisy przed tą datą pochodzą z papierowej ewidencji."

---

## 20. Testy akceptacyjne

### 20.1. Scenariusze E2E (Playwright)

Plik: `tests/e2e/field-register.spec.ts`.

**Test 1: Dodanie zabiegu ŚOR przez UI**
1. Logowanie jako `demo@agriclaw.pl`.
2. Goto `/dashboard/field-register`.
3. Click "Dodaj zabieg".
4. Wypełnij formularz: pole "Pole 3", data dziś, typ "ŚOR", produkt "Horus 200 SC" 1.2 L/ha, operator Jan Nowak, sprzęt Amazone.
5. Submit.
6. Oczekiwane: wpis na liście, validation errors = [].

**Test 2: Blokada zapisu przy wietrze > 4 m/s**
1. Jak wyżej, ale `weatherWindMs = 5.5`.
2. Submit.
3. Oczekiwane: 400 ValidationError, code = "WZ-01".

**Test 3: Blokada zapisu przy dawce powyżej etykiety**
1. Zastosowanie Horus 200 SC 2.5 L/ha (etykieta max 1.5).
2. Oczekiwane: code = "WZ-03-MAX".

**Test 4: Eksport PDF**
1. Zapisz 5 zabiegów.
2. Goto eksport → PDF → zakres 2026.
3. Oczekiwane: pobrany PDF o rozmiarze > 50 KB, zawierający wszystkie 5 wpisów + checksum.

**Test 5: Zamknięcie wpisu blokuje edycję**
1. Zapisz zabieg, zamknij.
2. PATCH → 403.

**Test 6: Audit trail**
1. Zapisz, edytuj dawkę z 1.2 na 1.5, usuń.
2. Sprawdź auditEntries: 3 wpisy (CREATE, UPDATE, DELETE).

**Test 7: Sesja inspektora**
1. Wygeneruj sesję.
2. Nowy browser → URL + PIN → widoczna księga.
3. Kliknij "Weryfikuj integralność" dla zamkniętego wpisu → OK.

**Test 8: OSN kalendarz**
1. Próba zapisu nawożenia N na 20 grudnia → ERROR WZ-09.

**Test 9: Import CSV**
1. Upload `test-fixtures/migration-sample.csv` (10 wpisów).
2. Oczekiwane: 10 wpisów zapisanych, 0 errors.

**Test 10: Eksport XML ARiMR**
1. Generator XML 2026.
2. Walidacja przeciwko XSD `arimr/ewidencja-scc-2026.xsd`.
3. Oczekiwane: walidacja OK, brak błędów.

### 20.2. Testy jednostkowe (Vitest)

- `validators/*.test.ts` — każda reguła z osobnymi przypadkami OK/fail.
- `pdf/field-register-pdf.test.ts` — snapshot testing.
- `exports/csv-generator.test.ts` — struktura linii.
- `sync/mrirw-xlsx-parser.test.ts` — parser XLSX.

### 20.3. Load tests

Target:
- 500 concurrent users czytających listę = p99 < 500 ms.
- 100 concurrent users zapisujących zabieg = p95 < 800 ms.

Narzędzie: `k6` (CLI), scenariusze w `tests/load/`.

---

## 21. Monitoring, metryki, SLI/SLO

### 21.1. Metryki (Prometheus + Grafana / Vercel Analytics)

- `field_register_operations_created_total{type, farm_id}` — licznik per typ.
- `field_register_validation_errors_total{code}` — liczba błędów walidacji per kod.
- `field_register_export_requests_total{format}` — eksporty.
- `field_register_api_request_duration_seconds{endpoint, status}` — histogram latencji.
- `mrirw_sync_last_success_timestamp` — gauge unix timestamp ostatniej pomyślnej synchronizacji.
- `ppp_registry_entries_total` — rozmiar rejestru.

### 21.2. SLO

| SLI | Target |
|---|---|
| Dostępność `/api/field-register/*` | 99,5% miesiąc |
| p95 latencji `GET /operations` | < 400 ms |
| p95 latencji `POST /operations` | < 800 ms |
| Poprawność validation (no false negatives) | 99,99% |
| Synchronizacja MRiRW — opóźnienie | max 36h |

### 21.3. Alerty

Sentry + Vercel alerts:
- Error rate > 1% przez 5 min → Slack #ops.
- Sync MRiRW nie powiódł się 2x z rzędu → Slack #compliance.
- Checksum integrity mismatch wykryty → PagerDuty Sev1.

---

## 22. Roadmapa wdrożenia

### Sprint 1 (tygodnie 1-2)

- Model Prisma: `Operation`, `OperationProduct`, `Product`, `Operator`, `Equipment`, `Crop`, `AuditEntry`.
- Migracja + PostGIS indeksy.
- Seed danych: 5 przykładowych zabiegów.
- API `POST /operations` z walidatorami WZ-01..WZ-05.

### Sprint 2 (tygodnie 3-4)

- API `GET /operations`, `PATCH`, `DELETE`.
- UI: lista zabiegów + drawer szczegółów.
- UI: modal "Dodaj zabieg" (step 1-2).

### Sprint 3 (tygodnie 5-6)

- Walidatory WZ-06..WZ-12.
- Sync MRiRW (cron + parser).
- Resolver produktu (autocomplete).

### Sprint 4 (tygodnie 7-8)

- Eksport PDF (layout A4 landscape).
- Eksport CSV.
- Eksport JSON.

### Sprint 5 (tygodnie 9-10)

- Eksport XML ARiMR (schemat 2026.1).
- Generator Planu Nawozowego (OSN).
- Integracja LPIS (matching geometryczny).

### Sprint 6 (tygodnie 11-12)

- Audit trail + checksum integrity.
- Tryb "Prezentacja Inspektorowi".
- GDPR — żądanie usunięcia.

### Sprint 7 (tygodnie 13-14)

- Integracja czatu AI — dodawanie zabiegu głosowo.
- Import CSV (migracja z papieru).
- Load tests + optymalizacja.

### Sprint 8 (tygodnie 15-16)

- Bilans azotu (kompletny).
- Dashboard Compliance.
- E2E tests pełny zestaw.
- **Launch MVP produkcji.**

### Faza 2 (miesiące 5-8)

- Integracja JD Operations Center.
- OCR papierowej księgi.
- Mobile app (React Native) z offline-first.

### Faza 3 (miesiące 9-12)

- Integracja ARiMR API (jeżeli publiczne).
- Integracje CNH, AGCO.
- Moduł GLOBALG.A.P. readiness.

---

## Załącznik A. Pełna tabela pól zabiegu (referencja)

| # | Nazwa pola | Typ | Nullable | Walidacja | Źródło (akt prawny) |
|---|---|---|---|---|---|
| 1 | id | String (cuid) | N | auto | wewnętrzne |
| 2 | farmId | FK Farm | N | istnieje | — |
| 3 | fieldId | FK Field | N | istnieje | — |
| 4 | cropId | FK Crop | T | istnieje | — |
| 5 | type | enum OperationType | N | z listy | — |
| 6 | startedAt | DateTime | N | <= now | Dz.U. 2023 poz. 612 |
| 7 | finishedAt | DateTime | T | > startedAt | — |
| 8 | areaHa | Decimal | N | 0 < x <= Field.area | Dz.U. 2023 poz. 612 |
| 9 | bbchPhase | Int (0-99) | T | 0-99 | Dz.U. 2023 poz. 612 |
| 10 | reason | String | T | max 200 | — |
| 11 | eppoCode | String | T | w słowniku | EPPO Global DB |
| 12 | operatorId | FK Operator | N (dla PPP) | cert ważny | art. 41 ust. o ŚOR |
| 13 | equipmentId | FK Equipment | T | STT ważny | art. 48 ust. o ŚOR |
| 14 | products[] | OperationProduct[] | — | 0..10 | Dz.U. 2023 poz. 612 |
| 15 | weatherTempC | Decimal | T | -20 do 45 | praktyka |
| 16 | weatherWindMs | Decimal | N (dla PPP) | 0 do 4 | art. 35 ust. 3 o ŚOR |
| 17 | weatherHumidity | Int | T | 0-100 | — |
| 18 | weatherSource | String | T | "..." | — |
| 19 | notes | String | T | max 2000 | — |
| 20 | ipSystem | Bool | N | — | IP |
| 21 | bioCompliant | Bool | N | — | Rozp. 2018/848 |
| 22 | createdAt | DateTime | N | auto | — |
| 23 | updatedAt | DateTime | N | auto | — |
| 24 | createdBy | FK User | N | — | audit |
| 25 | version | Int | N | auto incr | — |
| 26 | closedAt | DateTime | T | po roku | — |
| 27 | checksum | String (hex) | T | SHA-256 po close | integralność |

---

## Załącznik B. Słownik BBCH (skrót)

Skala BBCH (Biologische Bundesanstalt, Bundessortenamt und CHemische Industrie) — międzynarodowy standard fazowania roślin.

**Dla zbóż (wspólne dla pszenicy, żyta, jęczmienia):**
- 00-09: Kiełkowanie
- 10-19: Rozwój liści (liście 1-9)
- 20-29: Krzewienie
- 30-39: Strzelanie w źdźbło (faza 31 = pierwsze kolanko)
- 40-49: Rozwój kłosa
- 50-59: Kłoszenie (faza 55 = połowa kłosa widoczna)
- 60-69: Kwitnienie
- 70-79: Rozwój owoców
- 80-89: Dojrzewanie
- 90-99: Starzenie się / martwienie

**Dla rzepaku:**
- 00-09: Kiełkowanie
- 10-19: Rozwój liści
- 20-29: Rozwój pędu głównego
- 30-39: Wydłużanie pędu głównego
- 50-59: Pojawienie się pąków kwiatowych
- 60-69: Kwitnienie
- 70-79: Rozwój łuszczyn
- 80-89: Dojrzewanie
- 90-99: Starzenie się

Tabela domyślna w `src/lib/constants/bbch.ts`.

---

## Załącznik C. Słownik upraw MRiRW (skrót)

Kody upraw używane w IACS i ekoschematach:

| Kod | Nazwa PL | Kategoria | Typ |
|---|---|---|---|
| PSZENICA_OZIMA | Pszenica ozima | Zboża | Ozima |
| PSZENICA_JARA | Pszenica jara | Zboża | Jara |
| ZYTO_OZIME | Żyto ozime | Zboża | Ozima |
| JECZMIEN_OZIMY | Jęczmień ozimy | Zboża | Ozima |
| JECZMIEN_JARY | Jęczmień jary | Zboża | Jara |
| OWIES | Owies | Zboża | Jara |
| KUKURYDZA_ZIARNO | Kukurydza na ziarno | Zboża | Jara |
| KUKURYDZA_KISZONKA | Kukurydza na kiszonkę | Pasze | Jara |
| RZEPAK_OZIMY | Rzepak ozimy | Oleiste | Ozima |
| RZEPAK_JARY | Rzepak jary | Oleiste | Jara |
| ZIEMNIAK | Ziemniak | Okopowe | Jara |
| BURAK_CUKROWY | Burak cukrowy | Okopowe | Jara |
| SOJA | Soja | Strączkowe | Jara |
| GROCH_SIEWNY | Groch siewny | Strączkowe | Jara |
| BOBIK | Bobik | Strączkowe | Jara |
| LUBIN_WĄSKOLISTNY | Łubin wąskolistny | Strączkowe | Jara |
| TUZ_PASTWISKO | Trwałe użytki zielone — pastwisko | TUZ | — |
| TUZ_LAKA | Trwałe użytki zielone — łąka | TUZ | — |

Pełna lista (~150 kodów) w `src/lib/constants/crop-catalog.ts`. Aktualizowana przy każdej rewizji katalogu MRiRW.

---

## Załącznik D. Schemat XSD eWniosek Plus

Plik referencyjny: `docs/research/schemas/ewidencja-scc-2026.xsd`. Skrócona wersja XSD:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           xmlns="urn:gov:pl:mrirw:arimr:iacs:ewidencja:2026"
           targetNamespace="urn:gov:pl:mrirw:arimr:iacs:ewidencja:2026"
           elementFormDefault="qualified">

  <xs:element name="ewidencja">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="naglowek" type="NaglowekType" />
        <xs:element name="gospodarstwo" type="GospodarstwoType" />
        <xs:element name="dzialki">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="dzialka" type="DzialkaType" minOccurs="1" maxOccurs="unbounded" />
            </xs:sequence>
          </xs:complexType>
        </xs:element>
        <xs:element name="zabiegi">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="zabieg" type="ZabiegType" minOccurs="0" maxOccurs="unbounded" />
            </xs:sequence>
          </xs:complexType>
        </xs:element>
        <xs:element name="bilansAzotu" type="BilansType" minOccurs="0" />
      </xs:sequence>
      <xs:attribute name="wersja" type="xs:string" use="required" fixed="1.0" />
    </xs:complexType>
  </xs:element>

  <xs:complexType name="NaglowekType">
    <xs:sequence>
      <xs:element name="identyfikatorProducenta">
        <xs:simpleType>
          <xs:restriction base="xs:string"><xs:pattern value="[0-9]{12}" /></xs:restriction>
        </xs:simpleType>
      </xs:element>
      <xs:element name="nip">
        <xs:simpleType>
          <xs:restriction base="xs:string"><xs:pattern value="[0-9]{10}" /></xs:restriction>
        </xs:simpleType>
      </xs:element>
      <xs:element name="rok" type="xs:gYear" />
      <xs:element name="dataWygenerowania" type="xs:dateTime" />
      <xs:element name="aplikacjaZrodlowa">
        <xs:complexType>
          <xs:attribute name="nazwa" type="xs:string" use="required" />
          <xs:attribute name="wersja" type="xs:string" use="required" />
        </xs:complexType>
      </xs:element>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name="ZabiegType">
    <xs:sequence>
      <xs:element name="data" type="xs:dateTime" />
      <xs:element name="idDzialki" type="xs:string" />
      <xs:element name="powierzchniaHa">
        <xs:simpleType>
          <xs:restriction base="xs:decimal">
            <xs:minExclusive value="0" />
            <xs:totalDigits value="8" />
            <xs:fractionDigits value="4" />
          </xs:restriction>
        </xs:simpleType>
      </xs:element>
      <xs:element name="fazaBBCH" minOccurs="0">
        <xs:simpleType>
          <xs:restriction base="xs:integer">
            <xs:minInclusive value="0" />
            <xs:maxInclusive value="99" />
          </xs:restriction>
        </xs:simpleType>
      </xs:element>
      <xs:element name="agrofag" type="AgrofagType" minOccurs="0" />
      <xs:element name="operator" type="OperatorType" />
      <xs:element name="sprzet" type="SprzetType" minOccurs="0" />
      <xs:element name="srodek" type="SrodekType" minOccurs="0" maxOccurs="unbounded" />
      <xs:element name="nawoz" type="NawozType" minOccurs="0" maxOccurs="unbounded" />
      <xs:element name="pogoda" type="PogodaType" minOccurs="0" />
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required" />
    <xs:attribute name="typ" use="required">
      <xs:simpleType>
        <xs:restriction base="xs:string">
          <xs:enumeration value="PPP_SPRAY" />
          <xs:enumeration value="FERTILIZATION_MINERAL" />
          <xs:enumeration value="FERTILIZATION_ORGANIC" />
          <xs:enumeration value="FERTILIZATION_MIXED" />
          <xs:enumeration value="SOWING" />
          <xs:enumeration value="HARVEST" />
          <xs:enumeration value="TILLAGE" />
          <xs:enumeration value="MOWING" />
          <xs:enumeration value="IRRIGATION" />
          <xs:enumeration value="LIMING" />
          <xs:enumeration value="OTHER" />
        </xs:restriction>
      </xs:simpleType>
    </xs:attribute>
  </xs:complexType>

  <xs:complexType name="SrodekType">
    <xs:sequence>
      <xs:element name="nazwaHandlowa" type="xs:string" />
      <xs:element name="nrZezwolenia" type="xs:string" />
      <xs:element name="substancjeCzynne">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="substancja" minOccurs="1" maxOccurs="unbounded">
              <xs:complexType>
                <xs:simpleContent>
                  <xs:extension base="xs:string">
                    <xs:attribute name="koncentracja" type="xs:decimal" use="required" />
                    <xs:attribute name="jednostka" type="xs:string" use="required" />
                  </xs:extension>
                </xs:simpleContent>
              </xs:complexType>
            </xs:element>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
      <xs:element name="dawka">
        <xs:complexType>
          <xs:simpleContent>
            <xs:extension base="xs:decimal">
              <xs:attribute name="jednostka" type="xs:string" use="required" />
            </xs:extension>
          </xs:simpleContent>
        </xs:complexType>
      </xs:element>
    </xs:sequence>
  </xs:complexType>

  <!-- Pozostałe typy (GospodarstwoType, DzialkaType, OperatorType, SprzetType, PogodaType, BilansType)
       w pełnym pliku XSD. -->

</xs:schema>
```

---

## Dodatkowe uwagi implementacyjne

### Bezpieczeństwo

- Wszystkie endpointy `/api/field-register/*` wymagają autoryzacji JWT.
- Rate limiting: 60 req/min/user, 1000/dzień dla eksportów.
- CORS: tylko `agriclaw.pl` i `localhost:3000`.
- Input sanitization: wszystkie stringi przez `DOMPurify` (dla PDF) + Zod.
- SQL injection: Prisma parameterized queries (automatyczne).
- XSS: React Server Components + escapowanie w PDF generator.

### Skalowalność

- Prisma connection pool: 20.
- Neon autoscaling do 4 vCPU dla produkcji.
- Hot path (lista zabiegów) cache w Upstash Redis (TTL 60s).
- Export PDF jako background job (BullMQ + Upstash Redis).

### Dostępność WCAG 2.1

- PDF: tabele z odpowiednimi tagami (accessibility).
- UI: aria-labels, kontrasty AA.

### Internacjonalizacja

- MVP: polski.
- Przyszłość: angielski (dla doradców), ukraiński (pracownicy sezonowi).

---

**Koniec specyfikacji.**

*Opracowanie: Infinity Team — Product & Engineering, kwiecień 2026.*
*Dokument stanowi kontrakt implementacyjny. Wszelkie odchylenia od niniejszej specyfikacji wymagają zatwierdzenia przez Compliance Lead.*
