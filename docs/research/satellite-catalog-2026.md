# AgriClaw Satellite & Aerial Data Catalog — April 2026

**Document owner:** AgriClaw Platform & Data Engineering
**Version:** 1.0 (Q2 2026)
**Status:** Living document — revise quarterly
**Scope:** Every commercial and open data source relevant to satellite & aerial agriculture monitoring in Europe (focus: Poland) and globally.

This catalog is the internal reference for the AgriClaw platform. It answers: *which satellite, when, at what cost, through which API, for which farm-size?* It covers 120+ missions, constellations, platforms and institutional data sources. Minimum read time: 3 hours.

---

## Table of Contents

1. Executive summary & how to read this document
2. Section A — Free / Open Data sources
3. Section B — Commercial providers (daily observation, on-demand HR, SAR, hyperspectral, thermal, ultra-HR)
4. Section C — Aggregators & Platforms
5. Section D — Poland institutional & national data
6. Section E — Drones for agriculture
7. Section F — UAV + AI-on-edge (2025-2026)
8. Section G — Upcoming 2025-2026-2028 missions
9. Section H — Data formats, standards & cloud-native stacks
10. Section I — Public ML/AI models for EO
11. Cost matrix — 5 ha / 50 ha / 500 ha
12. Licensing & commercial re-use guide
13. **RECOMMENDATION — 5 new sources for AgriClaw in Q2-Q4 2026**
14. References & further reading

---

## 1. Executive Summary

AgriClaw today runs on **Sentinel-2 L2A** via the **Copernicus Data Space Ecosystem (CDSE)** Sentinel Hub API and supplementary **Sentinel-1 GRD** SAR for cloud-penetrating observations. This is the right baseline in 2026 — free, global, 5-day revisit, 10 m resolution — but it is **not enough** for a premium agri-analytics platform in the Polish and CEE market. Competitors (Taranis, xarvio, FieldView, OneSoil, CropX) are differentiating with (a) daily 3 m PlanetScope, (b) 30-70 cm on-demand tasking, (c) thermal / evapotranspiration layers, (d) hyperspectral nutrient maps, and (e) farmer-grade drone integrations. This document is the map to close those gaps.

**Key 2026 market shifts to internalise:**

- **Daily, global, 3 m is now commodity.** Planet's PlanetScope Dove constellation hit steady 130+ satellites, Satellogic's Merlin 1 m daily launches October 2026. Below $1/km² is achievable on volume.
- **30 cm class doubled in supply.** Maxar (now Vantor) deployed 6 WorldView Legion satellites through Feb 2025 — 6.6 Mkm²/day capacity. Airbus Pléiades Neo 3 & 4 re-flying by 2028 with 20 cm. Pricing is therefore softening.
- **SAR became mass-market.** ICEYE targets €1B revenue in 2026; Capella 5x daily; Umbra 16 cm Spotlight. The €150-300/km² ceiling of 2022 is gone.
- **Hyperspectral is going live.** Pixxel Firefly (6 sats operational 2025, 5 m / 150 bands), Planet Tanager (426 bands / 30 m), Wyvern Dragonette operational. **This is the single most under-exploited data layer for nutrient and crop-stress diagnostics in the AgriClaw roadmap.**
- **Thermal is the new battleground for irrigation.** Hydrosat VanZyl-1/2 operational 2024-2025; SatVu HotSat-2 launched April 2026; NASA SBG TIR coming 2028; LSTM Copernicus 2028.
- **Foundation models changed ML economics.** NASA-IBM Prithvi-EO-2.0 (600 M params), Clay v1.0, SatlasPretrain, Major TOM are publicly available and state-of-the-art for field segmentation and crop classification. Expect 80 % less labelled data needed vs 2023 pipelines.

**Dominant integration stack in 2026:** STAC 1.1 + Cloud Optimized GeoTIFF (COG) + OGC API Coverages + OpenEO + GeoParquet for vectors + Zarr for time-cubes. All five should be native in AgriClaw.

---

## 2. Section A — Free / Open Data Sources

Free doesn't mean trivial — every constellation below delivers production-grade data under permissive licences (CC-BY 4.0 or similar) and can be streamed into a Kubernetes-scale pipeline. The order is roughly by usefulness for agriculture.

### A.1 Sentinel-2 (Copernicus, CDSE)

- **Operator:** European Space Agency / European Commission / EUMETSAT
- **Fleet:** Sentinel-2A (2015), Sentinel-2B (2017), Sentinel-2C (launched 5 Sep 2024, now nominal), Sentinel-2D (on track for H2 2028).
- **Revisit:** 5 days at equator, 2-3 days in Poland due to overlap at 52° N. With 2C operational effective revisit is 2.5 days global.
- **Resolution:** 10 m (B2, B3, B4, B8), 20 m (B5 red-edge 1, B6, B7, B8A, B11 SWIR-1, B12 SWIR-2), 60 m (B1 coastal aerosol, B9 water vapour, B10 cirrus).
- **Bands:** 13 multispectral, 443-2190 nm.
- **Coverage:** Global, land + coastal.
- **Levels:** L1C (top-of-atmosphere), L2A (bottom-of-atmosphere / surface reflectance, cloud mask SCL).
- **Licence:** Free, open, unrestricted commercial use under Copernicus licence.
- **Primary API:** Sentinel Hub (raster/OGC/processing), STAC (discovery), OData (catalogue), OpenEO (processing-graphs), S3 (bulk). Root: `https://sh.dataspace.copernicus.eu/` and `https://catalogue.dataspace.copernicus.eu/`.
- **Auth:** OAuth2 client credentials via `identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token`.
- **Quotas (2026):** openEO General user 10,000 credits/month free. CDSE bulk downloads capped at ~20 GB/hour and rate-limited per user; heavy users should upgrade to CREODIAS paid or Sentinel Hub Enterprise.
- **Example STAC query:**
  ```
  POST https://catalogue.dataspace.copernicus.eu/stac/search
  {"collections":["SENTINEL-2"],"bbox":[20.0,51.5,22.0,53.0],
   "datetime":"2026-04-01T00:00:00Z/2026-04-18T23:59:59Z",
   "query":{"eo:cloud_cover":{"lt":20}}}
  ```
- **Example tile URL (WMTS):**
  `https://sh.dataspace.copernicus.eu/ogc/wmts/<instance-id>?REQUEST=GetTile&LAYER=TRUE_COLOR&TILEMATRIXSET=PopularWebMercator512&TILECOL=2289&TILEROW=1345&TILEMATRIX=12`
- **Agri use cases:** NDVI, NDRE, NDMI, NDWI, EVI, SAVI; crop classification; pasture monitoring; land cover change; biomass proxies.
- **Limitations:** 5-day revisit is too sparse at phenological peak; Central European autumn/winter cloud cover can mean 2-3 weeks without a usable scene.
- **Documentation:** <https://documentation.dataspace.copernicus.eu>
- **AgriClaw status (April 2026):** Primary source — used for all farm overview views, crop-change detection, and NDVI time series.

### A.2 Sentinel-1 (SAR — cloud-penetrating)

- **Fleet:** Sentinel-1A (2014), Sentinel-1B (failed 2022), Sentinel-1C (launched 5 Dec 2024, operational since Feb 2025), Sentinel-1D (planned 2026).
- **Revisit:** 6 days globally with 1A+1C; ~3 days in Europe.
- **Resolution:** IW mode 5 × 20 m → processed to 10 m GRD.
- **Bands:** C-band (5.405 GHz), polarisations VV + VH (over land).
- **Modes:** Stripmap (SM), Interferometric Wide (IW — default over land), Extra Wide (EW), Wave (WV).
- **Licence:** Free, open, Copernicus.
- **API:** Same CDSE / Sentinel Hub endpoints as S-2.
- **Product levels:** L0 raw, SLC (complex), **GRD (most useful)**, OCN.
- **Agri use cases:** Soil moisture proxies (VV/VH ratio), crop height/structure via backscatter time series, flood detection in fields, harvest detection, grassland mowing, ploughing detection. Works at night and through clouds — essential for Poland Oct-Feb.
- **Documentation:** <https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-1>
- **AgriClaw status:** Used as gap-filler when S-2 has > 40 % cloud cover. Candidate for productising "mowing date" and "harvest date" detectors.

### A.3 Sentinel-3 (OLCI + SLSTR)

- **Fleet:** S-3A (2016), S-3B (2018); S-3C scheduled 2027.
- **Revisit:** < 2 days.
- **Resolution:** OLCI 300 m (21 bands, 400-1020 nm); SLSTR 500 m VIS-SWIR + 1 km TIR.
- **Agri use cases:** Regional vegetation indices (EU/Poland-scale yield modelling), land-surface temperature (LST), chlorophyll-a on inland water, aerosols.
- **Licence:** Free, Copernicus.
- **AgriClaw status:** Candidate for **country-scale dashboards** and aggregated yield forecasting when we open a B2B data-service tier.

### A.4 Sentinel-5P (TROPOMI — atmosphere / pollution)

- **Launched:** October 2017; operational.
- **Instrument:** TROPOMI: NO2, SO2, CO, CH4, HCHO, O3, aerosols.
- **Resolution:** 3.5 × 5.5 km (7 km²).
- **Agri use cases:** Pesticide / fertiliser proxies via NH3 (NH3 not native but derivable with ancillary data), livestock methane, regional air-quality overlays on maps. Limited field-scale utility.
- **Licence:** Free, Copernicus.
- **AgriClaw status:** Out of scope for MVP; consider for ESG / sustainability dashboards.

### A.5 Landsat 8/9 (USGS / NASA)

- **Fleet:** Landsat 8 (2013), Landsat 9 (2021). Landsat Next in development for 2031.
- **Revisit:** 8 days combined.
- **Resolution:** 30 m VNIR/SWIR, 15 m panchromatic (pansharpen to 15 m), **100 m thermal TIRS (delivered resampled to 30 m)**.
- **Bands:** 11 total incl. thermal (B10 10.9 µm, B11 12.0 µm).
- **Licence:** Free (US Government public domain).
- **API:** USGS M2M / EarthExplorer; also on AWS Open Data (`s3://usgs-landsat/collection02/`), Google Earth Engine (`LANDSAT/LC09/C02/T1_L2`), Microsoft Planetary Computer.
- **Auth:** ERS account at <https://ers.cr.usgs.gov>, then M2M token.
- **Agri use cases:** Long time-series (back to 1984 w/ Landsat 5); **thermal band for evapotranspiration** (ET) and crop water stress index (CWSI). Harmonized Landsat-Sentinel (HLS) gives 2-3 day revisit at 30 m.
- **Documentation:** <https://www.usgs.gov/landsat-missions>
- **AgriClaw status:** Strong candidate — use HLS for densified 30 m time-series and Landsat TIRS for a thermal layer until we onboard Hydrosat.

### A.6 MODIS Terra & Aqua

- **Launched:** Terra 1999, Aqua 2002.
- **Revisit:** Daily (twice — morning & afternoon).
- **Resolution:** 250 m (B1, B2), 500 m (B3-7), 1 km (B8-36, incl. thermal).
- **Agri use cases:** Regional NDVI, phenology, drought, fire, LST — long baseline 25 + years.
- **Status:** End of life nominally; Terra and Aqua operating past design life. Replaced by VIIRS.
- **Licence:** Free, NASA.
- **AgriClaw status:** Useful for historical baselines and sub-national drought products.

### A.7 VIIRS (Suomi NPP / NOAA-20 / NOAA-21)

- **Revisit:** Daily (twice).
- **Resolution:** 375 m (I-bands), 750 m (M-bands), Day/Night Band (DNB).
- **Agri use cases:** Replacement for MODIS; night lights for barn heating proxies (advanced); fires; LST.
- **Licence:** Free, NOAA.

### A.8 Copernicus DEM (GLO-30, GLO-90, EEA-10)

- **Resolution:** GLO-30 = 30 m global; GLO-90 = 90 m; EEA-10 = 10 m Europe.
- **Data:** WGS84 ellipsoidal heights, DSM (not DTM).
- **Licence:** Free for non-commercial; commercial use allowed for GLO-30 / GLO-90 under Copernicus.
- **Source:** <https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model>
- **Agri use cases:** Slope, aspect, flow accumulation → erosion maps, terrain-aware nitrogen prescription.
- **AgriClaw status:** Should be pre-computed and cached per field.

### A.9 SMAP (NASA) — Soil Moisture Active Passive

- **Launched:** 2015.
- **Resolution:** 9 km enhanced product (ascending + descending).
- **Revisit:** 2-3 days.
- **Bands:** L-band radiometer (and SAR until 2015 failure).
- **Agri use cases:** Regional soil moisture; drought; irrigation planning at county-scale. Too coarse for field-scale.
- **Licence:** Free, NASA.

### A.10 GPM (NASA/JAXA) — Global Precipitation Measurement

- **Resolution:** 0.1° (~10 km), 30-minute accumulation (IMERG product).
- **Agri use cases:** Rainfall input for crop models; irrigation decisions; complements ground stations.
- **Licence:** Free.

### A.11 ASTER GDEM v3

- **Resolution:** 30 m global DEM, plus 14-band multispectral (VNIR 15 m, SWIR 30 m, TIR 90 m).
- **Licence:** Free.
- **AgriClaw status:** Superseded by Copernicus DEM for elevation; ASTER multispectral archive still useful for mineral / soil mapping.

### A.12 ICEYE Open Data

- **What:** Selected SAR scenes (25 cm-3 m) released under CC-BY 4.0 for emergencies and research.
- **URL:** <https://www.iceye.com/free-data>
- **Licence:** CC-BY 4.0.
- **AgriClaw relevance:** Limited — mostly disaster response scenes. Good for SAR training data.

### A.13 Umbra Open Data

- **What:** Umbra provides a free open archive of SAR imagery, 16-25 cm resolution, from their operational satellites.
- **URL:** <https://registry.opendata.aws/umbra-open-data/>
- **Bucket:** `s3://umbra-open-data/`
- **Licence:** CC BY 4.0.
- **AgriClaw relevance:** Best open 25 cm SAR source for ML training; scenes over selected AOIs refreshed regularly. Strong candidate as sandbox for SAR field-boundary detection models before we pay for a commercial Umbra subscription.

### A.14 Capella Open Data

- **What:** Limited "sample" SAR scenes, 50 cm-1 m.
- **URL:** <https://www.capellaspace.com/data/sample-data/>
- **Licence:** Free with registration for demo/evaluation.

### A.15 Other free sources worth knowing

- **ECOSTRESS** (NASA, on ISS) — 70 m thermal, ET. Free. Great proxy before we onboard Hydrosat/SBG.
- **PACE** (NASA, 2024) — ocean color & aerosols; limited agri use but pollen and dust source tracking.
- **GEDI** (ISS lidar, 2018-) — 25 m waveform lidar for biomass; tree / hedge monitoring.
- **ALOS-2 / PALSAR-2** (JAXA) — L-band SAR; free for research with registration; excellent for biomass and flooding.
- **CBERS-4A** (China-Brazil) — 2 m panchromatic, 8 m multispectral; free; 5-day revisit at selected latitudes.
- **Landsat archive 1-7** — 30 years of 30 m imagery, free on AWS/USGS.
- **TROPOMI** (as S-5P above) and **GOSAT-2** for CH4.
- **HARMONIZED Landsat-Sentinel (HLS)** — NASA product; 30 m blended L8/L9/S-2; daily + over growing season.

---

## 3. Section B — Commercial Providers

### B.1 Daily Observation Constellations

#### B.1.1 Planet Labs — PlanetScope (Dove / SuperDove)

- **Constellation:** ~130 SuperDove (PS2.SD) satellites (April 2026); Dove family launched 2014.
- **Revisit:** Daily global; up to multiple-per-day in mid-latitudes.
- **Resolution:** 3 m (native); downsampled analytical products at 3.0/3.7 m; UDM2 mask included.
- **Bands:** 8-band SuperDove (coastal blue, blue, green-I, green, yellow, red, red-edge, NIR) — harmonised to Sentinel-2.
- **Pricing model (April 2026):** "Hectares Under Management". Minimum 1 ha parcel; 1 quota package = 100 ha all products all archive all year. No per-scene fee. Volume discounts start ~10,000 ha.
- **Typical pricing (non-binding, depends on contract):** ~$1.00-$2.50 / ha / year for PlanetScope; Insights Platform analytics layers extra. 5 ha farm → ~$5-12/year if you could subscribe that small, but minimum packages effectively push entry at ~$500/year for 500 ha baseline.
- **APIs:** Planet Data API (v1, REST), Tiles API (XYZ), Planet Insights Platform (STAC + analytics), Orders API, Subscriptions API. Base: `https://api.planet.com/`
- **Auth:** API key in `Authorization: api-key <key>`. OAuth2 available for enterprise.
- **Example tile:** `https://tiles.planet.com/data/v1/PSScene/<scene_id>/{z}/{x}/{y}.png?api_key=<key>`
- **Docs:** <https://docs.planet.com/>
- **Licensing:** Internal use per seat / per-ha; re-distribution requires partner agreement.
- **Customers:** Bayer (Climate FieldView), John Deere, UN WFP, USDA, NASA CSDA.
- **Agri use cases:** Daily NDVI, sub-week change detection, planting date verification, growth-stage tracking, damage assessment.
- **Pros vs Sentinel-2:** 10× more revisit, 3× resolution, better cloud-gap-filling. Native 8-band agri-tuned harmonisation.
- **Cons:** Subscription commitment; red-edge is single narrow band (Sentinel-2 has 3); atmospheric correction ongoing debate; swath 24 km only.

#### B.1.2 Planet — SkySat

- **Fleet:** 21 SkySat satellites.
- **Revisit:** On-demand, up to 7-12× daily over tasked AOI.
- **Resolution:** 0.5 m (50 cm), panchromatic + 4-band MS, video capable.
- **Pricing:** Tasking-based; typical $10-25/km² archive, $15-35/km² new tasking; minimum ~$1-2k per order.
- **Agri use cases:** Orchard rows, nursery inventories, insurance damage assessment, crop-theft / grazing surveillance.

#### B.1.3 BlackSky — Gen-3

- **Fleet:** 4 × Gen-3 commissioned by March 2026; legacy Gen-2 ~16 satellites at 1 m.
- **Resolution:** Gen-3 35 cm pan + 8-band MS (150 cm MS).
- **Revisit:** Near-daily / hourly over tasked AOI with Gen-2; up to 15 revisits per day for some areas.
- **Pricing:** BlackSky Spectra subscription; typical ~$15-40/km² or annual/AOI contracts.
- **Auth:** OAuth2; API at <https://spectra.blacksky.com/>
- **Agri niche:** Emerging — strong in gov/defence, growing in high-value crops & aquaculture.

#### B.1.4 Satellogic

- **Fleet:** 26 + NewSat satellites + Merlin constellation launching from Oct 2026.
- **Resolution:** 70 cm multispectral native, super-resolved to 50 cm.
- **Revisit:** Merlin targets daily global remap at 1 m.
- **Pricing (public, transparent — rare in this industry):**
  - **$8 / km² baseline** for 50 km² tasked image (standard cloud cover ≤ 20 %).
  - Volume commitments 12-24 months drop below $8/km².
  - Stricter cloud / off-nadir specs surcharge.
- **Example 5 ha farm:** 0.05 km² × $8 = $0.40 per image (but 50 km² minimum ⇒ $400 minimum order).
- **500 ha farm:** 5 km² × $8 = $40 per image; many subscription-style options below $3/km² on commitment.
- **APIs:** Aleph platform API, STAC catalogue at `https://catalog.satellogic.com/stac/`.
- **AgriClaw fit:** Very strong — transparent pricing, reasonable minimums, daily 1 m in H2 2026 is best value/$ on market.

### B.2 On-Demand Very-High-Resolution (≤ 50 cm)

#### B.2.1 Maxar / Vantor — WorldView Legion + WV-3 + GeoEye-1

- **Legion constellation:** 6 satellites operational as of Feb 2025.
  - Resolution: 30 cm pan, 1.24 m MS (8 bands).
  - Capacity: 6.6 Mkm²/day combined; up to 15 revisits/day tasked over high-demand regions.
- **Legacy:** WorldView-3 (31 cm, 8-band, SWIR) still operational.
- **Pricing (indicative 2026):** Archive $12-20/km² (minimum ~5 km²); tasking $22-40/km²; Rush tasking premium. Legacy WV-3 cheaper than Legion.
- **API:** Maxar eAPI (`https://api.maxar.com/`), also via UP42, Apollo Mapping, EUSI, Apollo, Vantor-Marketplace.
- **Customers:** Defence, insurance (Cotality, Swiss Re), agribusiness (Corteva, Bayer), mapping (Esri).
- **Agri fit:** Orchard, vineyard, premium vegetable / tobacco; flood-damage assessment; insurance claims.

#### B.2.2 Airbus — Pléiades Neo (30 cm)

- **Fleet:** Pléiades Neo 3 + 4 operational (Neo 1/2 lost in launch failures 2022).
- **Resolution:** 30 cm pan, 1.2 m MS (6 bands incl. red-edge + deep blue).
- **Revisit:** Twice daily potential tasking.
- **Pricing:** Via OneAtlas platform; ~$15-30/km² archive; tasking premium ~2×. Academic & volume discounts.
- **Pléiades Neo Next:** Launch 2028 with 20 cm native.
- **Next product:** "Pléiades Neo Next" 20 cm satellite set for H1 2028.
- **API:** OneAtlas API; STAC; WMTS.
- **Docs:** <https://space-solutions.airbus.com/imagery/>
- **Customers:** Defence, urban planning, high-value agriculture (vineyards in France).

#### B.2.3 Airbus — SPOT 6 / 7

- **Resolution:** 1.5 m pan, 6 m MS.
- **Pricing:** ~$6-10/km² archive; legacy pricing.
- **Role:** Middle-tier between Sentinel-2 and Pléiades.

#### B.2.4 21AT (China Siwei / Twenty-First Century Aerospace Technology) — SuperView / BeijingSat

- **SuperView-1:** 50 cm pan, 2 m MS, 4-sat constellation.
- **SuperView Neo:** 30 cm, launched 2022-2024.
- **Pricing:** Typically $5-12/km² through resellers (EUSI, Apollo Mapping); cheapest 30 cm on market for non-sensitive AOI.
- **Licensing caveat:** Export-restricted over sensitive AOIs — not usable for military or some EU defence clients.

#### B.2.5 KazEOSat-1 / KazEOSat-2 (Kazakhstan)

- **Res:** 1 m pan / 4 m MS (KazEOSat-1); 6.5 m MS (KazEOSat-2).
- **Pricing:** Regional; approx. $7-15/km²; mostly Central Asia tasking.
- **Agri fit:** Kazakhstan / CIS market; low utility for Poland.

#### B.2.6 KOMPSAT-3A (Korea Aerospace Research Institute)

- **Resolution:** 55 cm pan, 2.2 m MS.
- **Fleet:** Single satellite (KOMPSAT-3 = 70 cm).
- **Pricing:** Via SI Imaging Services / resellers; ~$12-22/km²; often used as fallback to Maxar/Airbus.
- **Thermal channel:** KOMPSAT-3A has 5.5 m thermal — rare!

### B.3 SAR (through-cloud, through-night)

#### B.3.1 Capella Space

- **Fleet:** 11 satellites (Acadia-series), Whitney-series retired.
- **Resolution:** Spotlight 0.5 m (25 cm interpolated); stripmap 1.2 m; sliding spotlight 0.35 m.
- **Frequency:** X-band, 9.65 GHz.
- **Revisit:** Up to 5×/day on tasked AOI.
- **Pricing:** Via Capella Console, UP42, Maxar eAPI. Spotlight 25 cm around $160-300/image (5×5 km) archive; tasking premium.
- **Licence:** Internal commercial use; re-distribution restricted.
- **Agri fit:** Field-level ploughing / tillage / harvest detection regardless of weather.

#### B.3.2 ICEYE

- **Fleet:** 40 + SAR satellites (largest commercial SAR constellation as of Q2 2026); 2026 revenue target €1 B.
- **Resolution:** 25 cm Spot Extended; 50 cm Spot; 1 m Strip; 3 m Scan.
- **Revisit:** Up to hourly over tasked areas; daily nominal.
- **Frequency:** X-band.
- **Pricing:** Similar to Capella; ICEYE pushes subscription deals (Flood / Insurance / Agri "Persistent Monitoring"). Expect €120-280 / image (25 cm spot) or €1.5-4 / km² in persistent mode.
- **Insurance / disaster:** ICEYE Persistent Monitoring for Insurance provides near-real-time flood extent — directly applicable to crop insurance vertical.
- **API:** ICEYE Catalog & Ordering API; STAC.
- **AgriClaw fit:** Strong — partner candidate for an "all-weather monitoring" tier.

#### B.3.3 Umbra Space

- **Fleet:** 10 + satellites; highest-res commercial SAR: 16 cm Spotlight Ultra.
- **Resolution:** 16 cm (Spotlight Ultra), 25 cm, 35 cm, 1 m.
- **Frequency:** X-band.
- **Pricing (public, unusual for SAR):** Archive $50-100/image for 25 cm; tasking $200-400; Spotlight Ultra premium.
- **Open Data:** 25 cm SAR open archive on AWS (see A.13).
- **AgriClaw fit:** Outstanding for proof-of-concept; open data free; commercial pricing approachable.

#### B.3.4 Synspective (Japan) — StriX

- **Fleet:** 8 satellites (April 2026), target 30 by 2028.
- **Resolution:** 1-3 m; swath 10-30 km.
- **Polarisation:** VV (single).
- **Frequency:** X-band.
- **Pricing:** Tasking-based; competitive in Asia-Pacific.
- **Niche:** Agriculture + infrastructure monitoring in APAC.

### B.4 Hyperspectral

#### B.4.1 Pixxel — Firefly constellation

- **Fleet:** 6 satellites operational (3 launched Jan 2025, 3 in Aug 2025).
- **Resolution:** **5 m spatial, 150 + spectral bands @ ~5 nm spacing (VNIR-SWIR).**
- **Revisit:** Targeting daily when constellation complete (24 sats planned).
- **Pricing:** Per-km² tasking model; ~$15-35/km² indicative, custom agri pilots available.
- **API:** Pixxel API (AuriQ platform).
- **Customers:** BASF, Rio Tinto, Indian government, NGA.
- **Agri fit:** **Nutrient (N/P/K) mapping, early stress detection (2-3 weeks ahead of NDVI), crop-species discrimination, soil organic carbon, disease detection.** Biggest opportunity in AgriClaw roadmap.

#### B.4.2 Planet — Tanager-1 (+ planned Tanager 2, 3)

- **Launch:** Aug 2024.
- **Specs:** 426 bands, 380-2500 nm @ ~5 nm, **30 m spatial** resolution, swath 18 km.
- **Primary use:** Methane/CO2 detection (Carbon Mapper partnership).
- **Agri side-use:** Mineral mapping, vegetation traits, water quality.
- **Pricing:** Custom enterprise; Planet Insights Platform.

#### B.4.3 Wyvern (Canada) — Dragonette constellation

- **Fleet:** 3 Dragonette satellites + upcoming Dragonette-2 (larger).
- **Res:** 5.3 m spatial, 23 bands (VNIR) selectable from 300 possible.
- **Pricing:** Transparent public pricing — **$22-35 / km²** depending on band set.
- **API:** Wyvern Discovery (STAC-based).
- **AgriClaw fit:** Cheaper hyperspectral alternative to Pixxel for European fields.

#### B.4.4 Orbital Sidekick — GHOSt

- **Fleet:** 6 GHOSt satellites (will expand to 14).
- **Res:** 8.3 m MS, 3 m pan, **512 bands VNIR-SWIR**.
- **Core market:** Oil & gas pipeline leak detection.
- **Agri potential:** Emerging; possible for high-value crop stress.

#### B.4.5 EnMAP (DLR, Germany) — government research (free for scientists)

- **Specs:** 30 m, 224 bands, 420-2450 nm.
- **Free** for research via EOC-GS / DLR.
- **Agri use:** Pilot studies; not commercially licensable for AgriClaw SaaS distribution but fine for internal R&D.

#### B.4.6 PRISMA (ASI, Italy) — free for research

- **Specs:** 30 m hyperspectral, 239 bands.
- **Free with registration.**
- **AgriClaw fit:** Research / model-training source; no direct customer data.

### B.5 Thermal Infrared

#### B.5.1 Hydrosat — VanZyl constellation

- **Fleet:** VanZyl-1 (Aug 2024), VanZyl-2 (June 2025); 16-satellite target by 2028.
- **Specs:** TIR 70 m, 2-band long-wave IR, <0.1 °C differentiation; VNIR 30 m 7-band.
- **Products:** Evapotranspiration (ET), root-zone soil moisture, CWSI.
- **Pricing:** Subscription "IrriWatch"; typical $3-6/ha/year for irrigation advisory in large-scale ag; per-field API for enterprise.
- **Customers:** 50 + countries; US almonds, Latam sugarcane, Indian rice.
- **AgriClaw fit:** **Prime candidate — an ET layer would unlock irrigation / drought monitoring across all our PL / CEE farms.**

#### B.5.2 SatVu — HotSat constellation

- **Fleet:** HotSat-1 (2023, suffered cryocooler issue, retired), HotSat-2 launched on SpaceX Transporter-16 (April 2026), HotSat-3 in build.
- **Specs:** MWIR 3.5 m; revisit 10-20× day once full 9-sat constellation.
- **Agri fit:** Emerging; primary focus on built environment (building heat loss) and energy infrastructure.

#### B.5.3 Landsat 8/9 TIRS (free baseline)

- Covered in A.5. 100 m thermal (resampled 30 m) is the free substitute today.

#### B.5.4 ECOSTRESS (ISS-based, NASA) — free

- 70 m thermal; free; episodic coverage.

### B.6 Ultra-High-Res / Specialistic

#### B.6.1 Albedo — Clarity-1 (VLEO)

- **Launch:** March 2025 on Transporter-13.
- **Specs:** **10 cm pan, 40 cm NIR, 2 m thermal** from very low Earth orbit (~270 km).
- **Pivot (Oct 2025):** Albedo pivoted from direct imagery sales to selling VLEO platforms to other payload operators. Imagery available through partners (e.g., EUSI / European Space Imaging).
- **Pricing (historic):** $35/km² at minimum 25 km² order.
- **AgriClaw fit:** Niche — vineyard rows, orchard inventories, aquaculture cages.

#### B.6.2 Hera Systems

- **Status:** Early stage, 30 cm + video.

#### B.6.3 OroraTech (Germany) — fire detection (thermal, 4 m)

- **Fleet:** 12 nano-satellites launched through 2025 for wildfire detection.
- **Agri use:** Stubble-fires / crop-residue fires monitoring.

### B.7 Summary pricing heuristic (2026, indicative USD)

| Tier | Example | Typical $/km² | Min order | Revisit | Res |
|---|---|---|---|---|---|
| Free | Sentinel-2, Landsat | $0 | n/a | 5 d / 8 d | 10 m / 30 m |
| Daily low-cost | PlanetScope | $1-2 /ha/yr | 100 ha | Daily | 3 m |
| Daily sub-m | Satellogic | $8 | 50 km² | Daily | 70 cm |
| On-demand HR | Airbus SPOT | $6-10 | 25 km² | ~1 d tasked | 1.5 m |
| On-demand VHR | Maxar WV-3 | $12-20 archive / $22-40 task | 5 km² | Sub-daily | 30 cm |
| SAR | ICEYE / Capella | $100-300 /img | 1 img | Daily | 25-50 cm |
| Hyperspectral | Pixxel / Wyvern | $15-35 | 25 km² | Weekly | 5 m |
| Thermal ET | Hydrosat IrriWatch | $3-6 /ha /yr | farm-scale | Daily | 70 m |
| Ultra-HR VLEO | Albedo | $35 | 25 km² | On-demand | 10 cm |

---

## 4. Section C — Aggregators & Platforms

Aggregators multiplex many providers behind a single API / contract / billing interface. For a multi-provider platform like AgriClaw, picking the right aggregator can remove 6-12 months of integration work.

### C.1 Sentinel Hub / Copernicus Data Space Ecosystem (CDSE)

- **Operator:** Sinergise (acquired by Planet in 2023) in partnership with ESA.
- **Role:** The de-facto standard raster and processing API for Sentinel family; CDSE is the EU-funded free tier since Jan 2023 (replaced Copernicus Open Access Hub / SciHub).
- **APIs offered:** Processing API (evalscript), Statistical API, Async Batch, WMS/WMTS, OGC, STAC, OpenEO.
- **Pricing (Sentinel Hub commercial, on top of free CDSE):**
  - Exploration: Free.
  - Basic: €30/month (250 k processing units / month, 10 requests/s).
  - Enterprise: €300-3000/month scaling.
- **CDSE free tier:** 10,000 openEO credits/month for general users; 20,000 for Copernicus-Service users. Sufficient for moderate-scale dev work.
- **Strengths:** Evalscript is genuinely powerful — NDVI/NDRE/NDMI computable server-side; batch processing, Async, statistical API (returns histograms/means). **This is AgriClaw's current primary pipeline (April 2026).**
- **Weaknesses:** Lock-in risk since Planet acquisition. Rate-limiting visible on heavy jobs.
- **URL:** <https://www.sentinel-hub.com/> · <https://dataspace.copernicus.eu/>
- **Documentation:** <https://documentation.dataspace.copernicus.eu>

### C.2 Planet Insights Platform (fka Planet Analytics / Planet Platform)

- **What:** Planet's enterprise STAC + analytics platform bundling PlanetScope, SkySat, Tanager, basemaps, plus **derived analytics** (roads, buildings, forest-carbon, vessel detection, **field boundaries via ML**).
- **APIs:** STAC discovery, Data API, Orders API, Subscriptions API, Analytics API.
- **Pricing:** Enterprise; starts ~$25-40k/year typical agri subscription; unlimited Insights layers depending on tier.
- **URL:** <https://www.planet.com/products/planet-insights-platform/>
- **AgriClaw fit:** Strong if we upgrade to PlanetScope as secondary source — single contract, single auth.

### C.3 UP42 (Airbus subsidiary)

- **What:** Marketplace for 700 + sensors / datasets / analytic blocks from Maxar, Capella, Planet, Pléiades, Airbus SPOT, 21AT, Hydrosat, Wyvern and dozens more.
- **APIs:** REST + GeoJSON search + ordering + async processing; STAC native.
- **Pricing:** Pay-per-use — per-km² or per-scene; normalised across vendors; no subscription.
- **Strengths:** One contract for the entire constellation landscape; very low integration cost.
- **Weaknesses:** Markups of 10-25 % over direct vendor; limited control over tasking prioritisation.
- **URL:** <https://up42.com/>
- **AgriClaw fit:** Ideal for **on-demand tasking** (Maxar / Airbus / Capella) without a dozen contracts.

### C.4 SkyWatch EarthCache

- **What:** Pay-as-you-use aggregator similar to UP42; focus on normalised pricing and simple REST API.
- **Providers included:** Airbus SPOT/Pléiades, Capella, Satellogic, Planet (limited), Satrec 21AT, European Space Imaging.
- **Pricing:** "No subscriptions, no credits" — per km².
- **APIs:** REST; simple.
- **URL:** <https://skywatch.com/earthcache/>
- **AgriClaw fit:** Alternative to UP42; worth benchmarking head-to-head.

### C.5 Google Earth Engine (GEE)

- **What:** The largest public geospatial catalogue + server-side compute. Free for non-commercial and research.
- **Catalogue:** Landsat 1-9 full archive, Sentinel 1-5P, MODIS, VIIRS, ERA5, CHIRPS, CDL, WorldCover, **Dynamic World** (10 m global land cover), GLAD alerts, GEDI, and more than 600 collections.
- **APIs:** JavaScript (Code Editor) and **Python (ee library)**; REST (alpha).
- **Commercial pricing (2026):**
  - **Basic plan:** **$500 / month** — 2 seats, 100 EECU-hours batch, 20 GB storage.
  - **Professional / Premium:** $2k-15k/month, negotiable.
  - Consumption model: ~$0.40/EECU-hour compute + storage.
- **Strengths:** Server-side compute is unbeatable for continental-scale analytics.
- **Weaknesses:** Vendor lock-in; scripting not portable; unreliable SLAs for real-time SaaS.
- **URL:** <https://earthengine.google.com/>
- **AgriClaw fit:** Research / backtesting / batch crop-classification training; **not** a real-time SaaS backend.

### C.6 Microsoft Planetary Computer (Pro)

- **What:** Azure-based STAC catalogue + JupyterHub + Python/Dask; in 2026 the "Pro" tier is GA (enterprise).
- **Catalogue:** Sentinel, Landsat, HLS, MODIS, Copernicus DEM, ESA WorldCover, ERA5, NAIP, 10 m Dynamic World, and 100 + collections.
- **APIs:** STAC at `https://planetarycomputer.microsoft.com/api/stac/v1`, SAS tokens for data access.
- **Pricing:** Free for research tier (Planetary Computer Hub); Pro is Azure-metered (compute + storage).
- **Strengths:** Same data as GEE but **no lock-in** (pure STAC + COG on Azure blob), can export and run on any cloud. Better SLAs than GEE for SaaS.
- **URL:** <https://planetarycomputer.microsoft.com/>
- **AgriClaw fit:** **Strong candidate as alternative free compute for ML training and data lakes.**

### C.7 AWS Open Data (Earth Search, Registry of Open Data)

- **What:** Free S3-hosted geospatial datasets + Element 84's Earth Search STAC.
- **Catalogue highlights:** Sentinel-2 COGs, Landsat 8/9, Copernicus DEM, USDA CDL, NAIP, Maxar Open Data, Umbra Open Data, ICEYE Open Data.
- **STAC:** `https://earth-search.aws.element84.com/v1`
- **Cost:** Data free; compute paid on AWS.
- **AgriClaw fit:** Likely substrate for our S3 / data-lake tier when we outgrow CDSE download quotas.

### C.8 OpenAerialMap (OAM)

- **What:** Open imagery (mostly drone and aircraft) hosted by Humanitarian OpenStreetMap.
- **License:** Varies (mostly CC-BY, CC-0).
- **AgriClaw fit:** Limited for production; great for disaster-response overlays.

### C.9 SentinelHub OpenEO

- **What:** OpenEO is a cross-backend processing standard; CDSE offers it natively.
- **Use:** Express "compute NDVI from Sentinel-2 over AOI, time range T" once — runs on any OpenEO backend (CDSE, EODC, VITO, Google, MS PC via connectors).
- **AgriClaw fit:** Portability insurance — writing ML/analytics in OpenEO syntax avoids vendor lock-in.

### C.10 Radiant MLHub → Source Cooperative

- **What:** Open ML training data (labelled satellite imagery) — Radiant MLHub closed 2024, **Source Cooperative** is the 2025+ replacement.
- **URL:** <https://source.coop/>
- **Content:** Agricultural field boundaries, crop type labels, urban footprints.
- **AgriClaw fit:** Fine-tuning foundation models for Polish / CEE agriculture.

### C.11 Other aggregators worth knowing

- **LandInfo Worldwide** — reseller of Maxar, Airbus, 21AT (US-based).
- **Apollo Mapping** — reseller mainly US / Latam.
- **European Space Imaging (EUSI)** — Europe's biggest Maxar reseller.
- **e-GEOS** — Italian aggregator; COSMO-SkyMed SAR + Pléiades + Neo.
- **Descartes Labs** (now EarthDaily Analytics) — proprietary agri analytics, owns EarthDaily constellation launching 2026.

---

## 5. Section D — Poland Institutional & Government Data

Poland has among the richest **free** national geospatial datasets in Europe. AgriClaw should treat these as cornerstone layers for farmer onboarding and field-boundary import.

### D.1 GUGiK (Główny Urząd Geodezji i Kartografii)

- **What:** Polish Head Office of Geodesy and Cartography — national spatial reference authority.
- **Free data catalogue:**
  - **Ortofotomapa** — aerial orthophoto **25 cm** resolution (and some AOIs at 10 cm / 5 cm for cities); RGB + CIR (colour-infrared) versions. Reference system **PL-1992** (EPSG:2180). GeoTIFF format, 1:5000 tiles.
  - **NMT (DTM)** — Digital Terrain Model 1 m resolution LiDAR-derived.
  - **NMPT (DSM)** — Digital Surface Model 1 m.
  - **LiDAR point clouds** (LAS) — density 4, 6, or 12 pts/m² depending on AOI and year.
  - **BDOT10k** — topographic vector database.
  - **BDOO** — general geographical objects.
  - **EGiB** — cadastre (land & buildings register) — cadastral parcels (vector).
  - **PRG** — register of territorial borders.
- **Access points:**
  - **Geoportal:** <https://www.geoportal.gov.pl/> (interactive viewer & download).
  - **Mapy.geoportal.gov.pl → Zawartość mapy → Dane do pobrania** — clickable tile download (ATOM feeds per voivodship).
  - **WMS / WMTS:** `https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution` and high-resolution variants.
  - **QGIS Plugin:** "Pobieracz danych GUGiK" — bulk downloader for orthophoto, DTM, LiDAR by polygon/line/point selection.
- **Licence:** Free since July 2020, open licence; commercial re-use allowed with attribution.
- **AgriClaw fit:** **Mandatory — the 25 cm orthophoto is our unique Polish differentiator vs international competitors. Farmers recognise their fields instantly at this resolution.**

### D.2 ARiMR (Agencja Restrukturyzacji i Modernizacji Rolnictwa)

- **What:** Polish Agency for Restructuring & Modernisation of Agriculture; implements CAP (Common Agricultural Policy) and runs IACS.
- **Key services for AgriClaw integration:**
  - **eWniosekPlus** — the online JPO (jednolity płatność obszarowa / single area payment) application system. **Farmers draw parcels here each year (by 15 May 2026 deadline).**
  - **Geospatial API:** Limited — parcel data returned to farmer but not bulk-downloadable.
  - **LPIS (Land Parcel Identification System)** — reference database of cadastral + agricultural parcels; aligned with Sentinel-2 monitoring.
  - **AMS (Area Monitoring System)** — uses Sentinel-1 + Sentinel-2 time-series for automated CAP compliance checks since 2021 (mandatory EU-wide since 2023).
- **Implementation partner:** Asseco — IACS system integrator for ARiMR.
- **AgriClaw fit:** **Mandatory integration — "Import my parcels from eWniosekPlus" would be a killer feature.** Technical path: export GeoJSON/SHP from ARiMR farmer portal and upload to AgriClaw; long-term, seek official API partnership.
- **URL:** <https://www.gov.pl/web/arimr> / <https://epue.arimr.gov.pl/>

### D.3 IMGW-PIB (Instytut Meteorologii i Gospodarki Wodnej)

- **What:** Polish meteorological & water management institute.
- **Data:**
  - **Synop stations** — ~60 stations, hourly temperature, humidity, precipitation, wind, pressure.
  - **Climate stations** — ~1000 stations, daily precipitation and temperature.
  - **Radar** — POLRAD composite, 15-min intervals.
  - **Numerical weather prediction:** ALADIN-Poland (4 km grid), COSMO, ECMWF reanalyses.
  - **River & flood:** Hydro stations, hydrological warnings.
- **API:** Public API at <https://danepubliczne.imgw.pl/api/data/synop> (JSON).
- **Licence:** Free (CC-BY 3.0 PL); commercial use allowed.
- **AgriClaw fit:** **Mandatory — local ground-truth for rainfall, frost warnings, harvest-window modelling.** Consider caching 5-year history per parcel.

### D.4 CODGiK (Centralny Ośrodek Dokumentacji Geodezyjnej i Kartograficznej)

- **Role:** Historically the central geodesic archive; since ~2020 merged/transformed inside GUGiK structures.
- **Practical:** Use GUGiK portal instead.

### D.5 IUNG-PIB (Instytut Uprawy Nawożenia i Gleboznawstwa)

- **What:** Polish Institute of Soil Science and Plant Cultivation.
- **Data:**
  - **Soil maps** — digitised 1:25,000 soil maps of Poland; soil classes, texture, organic content.
  - **Agro-climatic regions.**
  - **SOPO** — landslide inventory (relevant for sloped farmland).
- **Licence:** Free for most products; commercial re-distribution restricted for some detailed layers.
- **AgriClaw fit:** **Soil layer is gold** — overlay of IUNG soil map → per-parcel soil class / nutrient baseline.

### D.6 CEPIK (Centralna Ewidencja Pojazdów i Kierowców)

- **What:** Central Register of Vehicles & Drivers.
- **Relevance:** Not directly agri. Could cross-reference tractor / harvester fleet ownership for enterprise agri fleet management. Out of scope for MVP.

### D.7 GDOŚ (Generalna Dyrekcja Ochrony Środowiska)

- **What:** General Directorate for Environmental Protection.
- **Data:**
  - **GDOŚ geoservis** — Natura 2000 sites, protected areas, environmental impact boundaries.
  - Important when calculating EFA (Ecological Focus Areas) for CAP.
- **AgriClaw fit:** Ensure the platform warns farmers when field intersects Natura 2000 or other restricted zones (relevant for spraying, ploughing rules).

### D.8 KZGW / Wody Polskie

- **Data:** National water management; drainage, hydrography; MPHP (river & watershed network).
- **AgriClaw fit:** Irrigation permits / water-rights references.

### D.9 EU CAP Layers (via ARiMR / GSA)

- **Nitrates Directive** layers.
- **LPIS reference layers.**
- **EFA (Ecological Focus Areas).**

---

## 6. Section E — Drones for Agriculture

Satellites cover breadth; drones cover depth. The 2025-2026 drone market has consolidated around DJI for spraying and DJI+Parrot+Wingtra for mapping/sensing.

### E.1 DJI Agras — spraying + spreading

#### E.1.1 DJI Agras T40 (flagship until late 2024)

- **Payload:** 40 L spraying tank, 50 kg spreading hopper.
- **Coverage:** ~21 ha/hour farmland, 4 ha/hour orchard.
- **Features:** Dual atomised spraying, active phased array radar, binocular vision for obstacle avoidance, DJI Terra for mapping, integration with Phantom 4 Multispectral for prescription maps.
- **Price (April 2026):** ~$18-24 k ready-to-fly in US; ~€22-30 k in Poland with training & support.
- **Use cases:** Foliar fertiliser, herbicide, pesticide, granular seed / fertiliser spreading.

#### E.1.2 DJI Agras T50 / T25 (current flagship 2025-2026)

- **T50:** Successor to T40, larger payload (40 L / 50 kg), better coaxial twin-rotor.
- **T25:** Lighter, single-operator drone, 20 L tank.
- **Price:** T50 ~$22-28 k; T25 ~$10-14 k.

### E.2 DJI Mavic 3 Multispectral (M3M) — the NDVI workhorse

- **Cameras:** 20 MP RGB (Hasselblad) + **4 × 5 MP multispectral (green 560 nm, red 650 nm, red-edge 730 nm, NIR 860 nm)** + sunlight sensor.
- **Flight time:** 43 min; coverage up to 200 ha per flight.
- **RTK module:** Centimetre-level georeferencing.
- **NDVI pipeline:** DJI Terra / DJI SmartFarm → GeoTIFF orthomosaic + index rasters (NDVI, NDRE, GNDVI, LCI).
- **Price (April 2026):** $5,800-7,500 (base); $10-12 k with RTK + charging package.
- **AgriClaw fit:** **Exactly the drone our partner agronomists should own**; we should build native import for M3M orthomosaics and index rasters in AgriClaw.
- **URL:** <https://ag.dji.com/mavic-3-m>

### E.3 Parrot ANAFI USA / ANAFI Ai

- **Specs:** 32× zoom, dual 21 MP cameras, thermal option; 5 km range; AI onboard.
- **Price:** $8-15 k depending on kit.
- **Agri fit:** Security / multispectral with optional Sequoia or Sentera payloads.

### E.4 senseFly eBee X / eBee Ag (now part of AgEagle / Wingtra)

- **Form factor:** Fixed-wing; 90 min flight; 500 ha in a single flight.
- **Payloads:** RGB, MicaSense Altum, Sentera Double-4K, thermal.
- **AgriClaw fit:** Best choice for >500 ha farms — far more efficient than multi-rotor.

### E.5 Wingtra WingtraOne Gen II

- **Form factor:** VTOL fixed-wing hybrid — vertical take-off, fixed-wing cruise. 59 min flight. 400 ha per flight.
- **Payloads:** Multispectral (MicaSense RedEdge-MX, Altum), RGB (Sony A7R IV).
- **Price:** $35-60 k depending on payload.
- **Agri fit:** Agricultural survey companies, not individual farmers.

### E.6 MicaSense (AgEagle) sensors (payload only)

- **RedEdge-P:** 5-band MS + panchromatic; drop-in for any drone.
- **Altum-PT:** 6-band MS + thermal + panchromatic.
- **Price:** $5-16 k.
- **Role:** Widely used drop-in sensor upgrading consumer drones.

### E.7 Software stack for drone imagery

- **Pix4Dfields** — agriculture-focused; NDVI/NDRE/VARI/MCARI indices; variable-rate prescription (VRA) export.
- **DroneDeploy Agriculture** — cloud-based mosaicking + indices; subscription.
- **Propeller Aero** — survey-first; cross-use in agri.
- **DJI Terra Agriculture** — free with DJI drones.
- **OpenDroneMap (ODM)** — open-source photogrammetry.

### E.8 AgriClaw drone integration roadmap

- **Q2 2026:** Accept user-uploaded GeoTIFF (orthomosaic + NDVI) from DJI Mavic 3M / Pix4Dfields. Snap to field; store as separate layer.
- **Q3 2026:** Native connector to DJI SmartFarm / DroneDeploy (API).
- **Q4 2026:** Webhook from Pix4Dfields when a flight finishes.

---

## 7. Section F — UAV + AI-on-Edge (2025-2026)

### F.1 Skydio X10D / X10

- **Focus:** Public safety, inspection; fully autonomous obstacle-avoidance; on-board AI NVIDIA Orin.
- **Agri fit:** Limited today; good for infrastructure & livestock.
- **URL:** <https://www.skydio.com/>

### F.2 FlytBase

- **Indian startup enabling "drone-in-a-box" autonomous fleet ops.**
- **AgriClaw fit:** Partner opportunity for future scheduled autonomous NDVI patrols on large farms.

### F.3 In-flight NDVI (real-time)

- Several 2025+ drones stream NDVI to the operator in real-time (DJI Mavic 3M with SmartFarm, Sentera with FieldAgent Live).
- On-device AI for hot-spot detection (disease, pest, water stress) flies from sensor fusion + small models running on Jetson / Orin.

### F.4 Polish drone ecosystem

- **Drone Ultimatix** — enterprise drones / mission planning.
- **RiotTech, Dronehub** — drone-in-a-box infrastructure.
- **Agrocom / Farmbot** — agri-specialist integrators.
- **AgriClaw posture:** Focus on data ingestion from whichever drone the farmer uses; don't build hardware.

---

## 8. Section G — Upcoming 2025-2026-2028 Missions

### G.1 Copernicus Sentinel-4 — launched July 2025

- **Launched:** 1 July 2025, Cape Canaveral.
- **Platform:** Instrument on EUMETSAT MTG-S (Meteosat Third Generation — Sounder).
- **Orbit:** **Geostationary at 36,000 km** — first EU geostationary atmospheric mission.
- **Bands:** UV 305-400 nm, VIS 400-500 nm, NIR 750-775 nm — a UVN imaging spectrometer.
- **Resolution:** ~8 km spatial, hourly temporal over Europe & North Africa.
- **Agri relevance:** Limited direct (measures NO2, O3, SO2, HCHO, aerosols); useful for pesticide-drift and air-quality overlays.
- **Operational availability:** CAMS services late 2026.

### G.2 Copernicus CHIME (Copernicus Hyperspectral Imaging Mission) — A in 2028, B in 2030

- **Instrument:** Pushbroom VSWIR 400-2500 nm, 10 nm spectral resolution, >200 bands, **30 m spatial, 130 km swath.**
- **Orbit:** Sun-synchronous 632 km, 25-day repeat.
- **Agri use:** **Sustainable agriculture, food security, soil, ecosystem — flagship hyperspectral product for CAP monitoring.**
- **Licence:** Will be free under Copernicus open data.
- **AgriClaw action:** Pre-position architecture & ML pipelines to consume 200-band data. Wyvern + Pixxel can be our 2026-2028 bridge until CHIME goes live.

### G.3 Copernicus LSTM (Land Surface Temperature Monitoring) — A in 2028, B in 2030

- **Instruments:** 11 spectral channels VIS-to-TIR; **50 m thermal resolution**; revisit 1-3 days.
- **Operational life:** 2028-2038 (A).
- **Agri use:** Evapotranspiration at field scale — will be the Copernicus free alternative to Hydrosat.

### G.4 Copernicus CO2M (Sentinel-7) — launch window 2026

- **Satellites:** CO2M-A + CO2M-B (plus possible CO2M-C).
- **Instruments:** CO2I spectrometer (0.7 ppm CO2, 10 ppb CH4, 2×2 km resolution), CLIM cloud imager, MAP polarimeter.
- **Agri relevance:** Methane from livestock; carbon accounting for regenerative-agri ESG products.
- **Licence:** Free under Copernicus.

### G.5 Copernicus ROSE-L (L-band SAR) — launch 2028

- **Instruments:** L-band SAR (24 cm wavelength); high penetration of vegetation.
- **Resolution:** 5-10 m.
- **Agri use:** Biomass estimation (forestry, sugar beet, maize), soil moisture under canopy.

### G.6 NISAR (NASA-ISRO SAR) — launched 30 July 2025

- **Specs:** **Dual-band L-SAR (24 cm) + S-SAR (12 cm)** — first-ever dual-band SAR mission.
- **Orbit:** 747 km sun-synchronous, 12-day repeat.
- **Resolution:** 3-10 m; products at 100 m global.
- **Data:** **Free, open, 1-2 days after acquisition.**
- **Agri products:** ISRO/NRSC released first soil-moisture maps Feb 2026 at 100 m over Indo-Gangetic Plains.
- **AgriClaw value:** **Free L-band SAR for soil moisture and deep-canopy penetration — game-changer for root-zone soil water monitoring.**

### G.7 NASA SBG (Surface Biology & Geology) — launch 2028

- **Two-spacecraft architecture:**
  - VSWIR imaging spectrometer: 30 m GSD, 380-2500 nm @ 10 nm res, 16-day revisit.
  - TIR imager: 60 m GSD, 5-7 bands 4-12 µm, 3-day revisit, 0.2 K NeΔT.
- **Data:** Free.
- **Agri relevance:** The US equivalent of CHIME + LSTM combined. High-resolution hyperspectral + thermal free by 2029-2030.

### G.8 Planet — SuperDove Generation 3 / next constellation (rumoured 2026-2027)

- Planet has hinted at next-gen Doves and additional Tanager (2, 3, ...) hyperspectral units; watch Planet Pulse for updates.

### G.9 EarthDaily Analytics — EarthDaily constellation (2026)

- Descartes Labs (rebranded EarthDaily Analytics) planning 10 satellites, **22 spectral bands, 5 m, daily**.
- Strong agri pitch.

### G.10 Satellogic Merlin — first sat Oct 2026

- **Daily 1 m global multispectral** — competing directly with PlanetScope while cheaper.

### G.11 Albedo — Clarity-2, -3 (paused in pivot)

- Still on roadmap but company priority is VLEO bus platform.

### G.12 Pixxel — Firefly full 24-sat constellation (2027)

### G.13 Other private constellations to watch

- **Ororatech Foresat** (thermal, fire + agri) — 100 sats by 2028.
- **Constellr** (German thermal, ~50 m) — launching through 2026-2027.
- **ConstellR ThermalStar** — high-res TIR.
- **GHGSat** (CA) — methane monitoring.
- **Kuva Space** (Finland) — hyperspectral.
- **Open Cosmos** — European smallsat platform.
- **True Anomaly** — defence + SAR.
- **Muon Space** — weather + thermal (built Hydrosat VanZyl-2).

---

## 9. Section H — Data Formats, Standards & Cloud-Native Stacks

### H.1 Cloud Optimized GeoTIFF (COG)

- **What:** GeoTIFF with internal tiling, overviews, and optimised IFD layout enabling HTTP range-read (stream only the bytes you need).
- **Benefit:** Eliminates the need to download entire scenes; a tile server can read a 50 km² window in ms.
- **Status:** De-facto standard since ~2019; native output of Sentinel Hub, Planetary Computer, AWS Earth, Planet, UP42.
- **URL:** <https://www.cogeo.org/>
- **AgriClaw action:** Every raster stored in our data-lake should be COG.

### H.2 SpatioTemporal Asset Catalog (STAC)

- **Current version:** STAC 1.1 (2025). OGC-endorsed since 2024.
- **Components:** STAC Item (GeoJSON Feature + temporal), STAC Collection, STAC Catalog, STAC API (search, transactional).
- **Extensions:** eo, sar, proj, view, raster, ml-model, datacube, table.
- **Role:** Common metadata schema across Sentinel Hub, Planet, Planetary Computer, UP42, AWS Earth Search, Capella, Umbra, Wyvern.
- **Libraries:** `pystac`, `pystac-client`, `stackstac`, `odc-stac`.
- **AgriClaw action:** Treat all external catalogues as STAC; normalise internally to a single STAC Items table (Postgres/PostGIS or pgstac).

### H.3 OGC API Family

- **OGC API - Features:** Replacement for WFS; JSON-based; used by GUGiK INSPIRE services.
- **OGC API - Tiles:** Replacement for WMTS.
- **OGC API - Coverages:** Multidimensional array access (supersedes WCS).
- **OGC API - Processes:** Async compute jobs.
- **OGC API - Records:** Catalogue search.
- **Status:** Increasingly native in CDSE; expect to phase out legacy WMS/WFS by 2027.

### H.4 OpenEO

- **What:** Portable DSL for EO analytics (Python/JavaScript client, REST backend).
- **Usage:** Express "return NDVI time series for this polygon from Sentinel-2" once, execute on any backend (CDSE, EODC, MS PC, Google).
- **URL:** <https://openeo.org/>

### H.5 GeoParquet

- **What:** Apache Parquet with a geometry column + WKB/WKT encoding + CRS metadata.
- **Benefit:** Columnar vector format; cloud-native; 10-100× faster than Shapefile or GeoJSON for big tables (farms, parcels, events).
- **Version:** 1.1.0 in 2025.
- **AgriClaw action:** Store all parcel / event tables in GeoParquet on S3; query with DuckDB + spatial or Athena.

### H.6 FlatGeobuf

- **What:** Binary vector format with spatial index; streams over HTTP.
- **Role:** Successor to Shapefile for tile streaming.

### H.7 Zarr

- **What:** Chunked, compressed N-D array format on cloud storage.
- **Usage:** Multi-temporal data cubes (e.g. `[time, band, y, x]`); native in xarray.
- **Agri use:** Per-farm 5-year NDVI cube of Sentinel-2 in one Zarr store → fast time-series queries.

### H.8 Other formats

- **Shapefile (legacy)** — avoid but support for legacy import.
- **GeoPackage (SQLite-based)** — good for offline/mobile.
- **KML / GeoJSON** — import/export to farmer tools; simple.
- **LAS / LAZ / COPC** — LiDAR.
- **MBTiles / PMTiles** — mobile tile cache.
- **Xee** — Xarray over GEE.

### H.9 Stack recommendation for AgriClaw

- **Tiles/raster:** Sentinel Hub → downloaded as COG → served via titiler / TiTiler-PgSTAC.
- **Catalogue:** pgstac (Postgres) or local STAC catalog.
- **Vectors:** GeoParquet on S3 + PostGIS for hot queries.
- **Time series:** Zarr on S3 for dense per-parcel cubes.
- **Compute:** Dask + rioxarray; OpenEO where portable.

---

## 10. Section I — Public ML / AI Foundation Models for EO

### I.1 NASA-IBM Prithvi-EO-2.0 (600 M params)

- **Data:** 4.2 M HLS (Harmonized Landsat/Sentinel-2) samples.
- **Architecture:** Temporal Vision Transformer.
- **Tasks fine-tuned:** Flood extent, wildfire scars, multi-temporal crop segmentation, cloud gap-filling.
- **Licence:** Apache 2.0 (Prithvi-EO-2.0 was released under Apache 2.0 in 2024).
- **Distribution:** HuggingFace `ibm-nasa-geospatial/` organisation + TerraTorch toolkit.
- **Performance:** Leads GEO-Bench leaderboard.
- **AgriClaw fit:** **Fine-tune on Polish field boundaries and crop types** — should reduce labelled data need by ~80 %. Pick as foundation for AgriClaw's own crop-classification head.
- **URL:** <https://huggingface.co/ibm-nasa-geospatial>

### I.2 Clay Foundation Model (v1.0 → v2.x)

- **Architecture:** Vision Transformer with Masked Autoencoder (MAE) pretraining.
- **Data:** Multi-sensor (S-2, S-1, Landsat, NAIP, etc.).
- **Licence:** Open (Apache 2.0).
- **AgriClaw fit:** Alternative to Prithvi; lighter-weight embeddings for similarity search ("find fields that look like this").
- **URL:** <https://clay-foundation.github.io/model/>

### I.3 Segment Anything Model 2 (SAM 2) by Meta

- **Architecture:** Foundation segmentation model; zero-shot on many domains.
- **2025-2026 research:** SAM 2 demonstrated excellent zero-shot field-boundary delineation on Sentinel-2 and sub-metre imagery. IoU 0.86 over 32 M ha Canadian Prairies.
- **Licence:** Apache 2.0.
- **AgriClaw fit:** **Prime candidate for auto-field-boundary import** — run SAM 2 on GUGiK 25 cm ortho tiles or Sentinel-2 imagery for a new farm AOI, let farmer confirm/edit.

### I.4 Google SatlasPretrain

- **Data:** 21 M km² (10 % Earth), 200 + countries.
- **Tasks:** Multi-label classification, instance segmentation, regression.
- **Licence:** Open.
- **Use:** Pre-trained backbones (Swin-v2) for fine-tuning crop/LULC tasks.

### I.5 ESA Major TOM dataset

- **Size:** 23 TB.
- **Role:** Largest published geospatial pretraining corpus.
- **Partners:** ESA Φ-lab.
- **AgriClaw fit:** Best public corpus to further pre-train AgriClaw's own models.

### I.6 PhilEO Bench (ESA)

- **Purpose:** Geospatial Foundation Model benchmark (dense regression + segmentation).
- **URL:** <https://www.philab.esa.int/> (Φ-lab).

### I.7 DOFA (Dynamic One-For-All)

- **Research 2024-2025:** Multi-modal foundation model handling S-1, S-2, RGB, hyperspectral in one model.
- **Status:** Active research; promising for AgriClaw multi-sensor fusion.

### I.8 Specialised models

- **DeepLabV3+** with Sentinel-2 — baseline for crop segmentation.
- **EuroSAT / BigEarthNet** — benchmark datasets for classification.
- **Ag-Net, CropNet** — crop-type classification research heads.
- **AgriSAT / AgriFM** — domain-specific foundation models for agriculture.

### I.9 Model-serving patterns

- **Modal / Runpod** — serverless GPU.
- **HuggingFace Inference Endpoints.**
- **Vertex AI / SageMaker** — GPU-backed endpoints.
- **ONNX / Triton** — CPU inference where possible; 5-band NDVI networks run easily on CPU.

---

## 11. Section 11 — Cost Matrix (5 ha / 50 ha / 500 ha, per year)

Using typical small-to-medium Polish farm sizes.

| Provider | 5 ha | 50 ha | 500 ha | Notes |
|---|---|---|---|---|
| Sentinel-2 (CDSE) | **$0** | **$0** | **$0** | Free; limited revisit |
| Landsat 8/9 | $0 | $0 | $0 | Free |
| Copernicus DEM | $0 | $0 | $0 | Free |
| GUGiK orthophoto 25 cm | $0 | $0 | $0 | Free (PL only) |
| Hydrosat IrriWatch | ~$20 | ~$150 | ~$1,500 | $3-6/ha/year subscription |
| PlanetScope | (below min) | ~$500 (min 100 ha pkg) | ~$1,500-3,000 | Hectares Under Management |
| Satellogic on-demand | $400 (50 km² min) | $400 (still min) | $400-800 | $8/km², 50 km² min |
| Maxar Legion archive | $60 (one scene) | ~$100 | ~$200 | $12-20/km² min 5 km² |
| Maxar Legion tasking | $120 | $160 | $300 | $22-40/km² |
| Airbus Pléiades Neo tasking | $90 | $150 | $450 | $15-30/km² |
| Pixxel hyperspectral | $75-175 | $75-175 | $150-350 | $15-35/km²; 25 km² min typical |
| Wyvern hyperspectral | $110-175 | $110-175 | $220-700 | $22-35/km² |
| Capella / ICEYE 25 cm SAR | $160-300 /img | $160-300 /img | $300-500 /img | per scene |
| Google Earth Engine | $500/mo minimum | $500/mo | $500/mo | Commercial basic tier |
| UP42 aggregator | varies | varies | varies | Per-km² pass-through |

Interpretation: **For ≤50 ha Polish farms, free sources + PlanetScope cluster pricing + optional Hydrosat IrriWatch is the sweet spot.** For 500+ ha, Hydrosat is viable standalone; PlanetScope clearly worth it; hyperspectral on-demand attractive 2-4×/season.

---

## 12. Licensing & Commercial Re-Use Guide

Important when selling AgriClaw SaaS: **can we re-display, re-process, re-distribute the imagery to the farmer?**

| Source | AgriClaw internal use | Display to farmer | Redistribute / export | Notes |
|---|---|---|---|---|
| Sentinel (all) | ✅ | ✅ | ✅ | Copernicus licence — unrestricted |
| Landsat | ✅ | ✅ | ✅ | US public domain |
| Copernicus DEM | ✅ | ✅ | ✅ with attribution | Free for commercial |
| GUGiK (PL) | ✅ | ✅ | ✅ with attribution | Free, open since 2020 |
| ARiMR parcel data | ✅ (farmer's own) | ✅ | ⚠️ only back to farmer | Personal data |
| PlanetScope | ✅ per seat | ✅ per seat | ❌ needs Partner Program | Value-added allowed |
| Maxar | ✅ | ✅ display | ❌ distribute | Requires reseller agreement |
| Airbus Pléiades Neo | ✅ | ✅ | ❌ | OneAtlas licence |
| Satellogic | ✅ | ✅ | ❌ raw distribution | Value-added OK per contract |
| Capella / ICEYE / Umbra | ✅ | ✅ | ❌ | per contract |
| Pixxel / Wyvern | ✅ | ✅ | per contract | Clarify before launch |
| Hydrosat products | ✅ as layer | ✅ | ❌ raw | Derived indices OK |
| Umbra Open Data | ✅ | ✅ | ✅ | CC-BY 4.0 |
| ICEYE Open Data | ✅ | ✅ | ✅ | CC-BY 4.0 |

**Action for AgriClaw legal:** Before going GA, draft a Partner Program application with Planet and a reseller agreement with at least one of UP42 / EUSI / SkyWatch. Without a Partner licence, PlanetScope cannot be pushed as a user-visible tile service to many paying farmers in some tiers.

---

## 13. Licensing & Commercial Re-Use Guide (continued) + rate limits

### 13.1 Rate limits & quota cheat-sheet (April 2026)

- **CDSE Sentinel Hub:** Processing Units; free tier ~30 k/month, rate ~10 req/s burst. Paid tiers up to 1 req/s sustained.
- **CDSE OData / STAC:** ~1,000 requests / user / hour soft cap.
- **CDSE bulk download:** 20 GB/hour per account; exceed → throttled interface.
- **Planet API:** 10-100 req/s tier-dependent; Orders API concurrency 5-25.
- **Google Earth Engine:** Batch 100 EECU-hours/month basic; real-time < 30 s per request.
- **Microsoft Planetary Computer:** Free Hub 1 Jupyter session / user; Pro Azure-metered.
- **UP42:** Async orders; no published per-user rate limit beyond order concurrency.
- **Maxar eAPI:** Tasking requires approval; archive queries rate-limited per contract.

### 13.2 Authentication matrix

| Platform | Auth method | Credentials location |
|---|---|---|
| CDSE | OAuth2 client credentials | identity.dataspace.copernicus.eu |
| Sentinel Hub (legacy) | OAuth2 | services.sentinel-hub.com |
| Planet | API key (`api-key <key>`) | account.planet.com |
| Maxar | OAuth2 + API key | maxar eAPI |
| UP42 | API key + workspace ID | console.up42.com |
| Capella | OAuth2 | console.capellaspace.com |
| ICEYE | API key | iceye.com |
| USGS Landsat | ERS M2M token | ers.cr.usgs.gov |
| Google Earth Engine | GCP service account | cloud.google.com |
| Planetary Computer | SAS token per asset | planetarycomputer.microsoft.com |

---

## 14. RECOMMENDATION — 5 NEW sources for AgriClaw in Q2-Q4 2026

This is the decisive part. Below are the top-5 data sources AgriClaw should integrate in priority order, with business rationale and required effort.

### RECOMMENDATION #1 — **PlanetScope (Planet Insights Platform) — P0 / Q2 2026**

**Why first:** The difference between "5-day Sentinel-2" and "daily PlanetScope" is the single biggest perceived-quality gap vs Taranis, xarvio and OneSoil. Closes our largest competitive weakness for farms > 50 ha.

**What we get:**
- Daily 3 m 8-band imagery over every Polish farm on plan.
- Planet Insights "field boundaries" analytic layer (worldwide).
- Planet Basemaps (cloud-free monthly mosaics) for pretty dashboards.

**Commercial path:**
- **Target contract:** Planet Partner Program (Agri track). Starts ~$25-40 k/year for a reseller slice; negotiate Hectares Under Management (HUM) commitment growing with customer base.
- **Fallback:** Buy through UP42 on-demand pay-per-ha until volume justifies direct.

**Effort:** 6-8 engineering weeks (new STAC source, new tile proxy, auth integration, UX in AgriClaw for daily layer switching). Legal: Partner Program application (2-3 months).

**Risk:** Planet acquired Sentinel Hub → theoretical conflict of interest with CDSE, but in practice they still run both. Contract terms negotiable.

### RECOMMENDATION #2 — **GUGiK 25 cm Orthophoto + eWniosekPlus import — P0 / Q2 2026**

**Why first (tied with #1):** This is the **unique Polish/CEE differentiator**. No international competitor can show farmers a 25 cm ortho of their field stitched with a real-time Sentinel NDVI. Combined with eWniosekPlus parcel import, we reduce farmer onboarding from 15 min to 30 s.

**What we get:**
- GUGiK orthophoto WMS/WMTS as a base map.
- LiDAR DTM/DSM layer at 1 m → slope, aspect, hydrology.
- BDOT10k topographic vectors.
- ARiMR eWniosekPlus parcel GeoJSON import flow (farmer-initiated).
- IUNG soil map overlay.

**Commercial path:** Free — just engineering and UX.

**Effort:** 4-5 weeks (WMTS integration, tile caching on edge CDN, GeoJSON SHP importer with schema mapping, parcel deduplication, IUNG soil layer geocoding).

**Risk:** ARiMR doesn't yet expose a farmer-auth API for parcel retrieval; we start with manual GeoJSON/SHP upload and pursue API partnership.

### RECOMMENDATION #3 — **Hydrosat IrriWatch (Evapotranspiration + Root-Zone Soil Moisture) — P1 / Q3 2026**

**Why:** Thermal ET and soil-moisture are the highest-ROI signals for irrigation decisions. Poland's drought frequency is rising (2018, 2019, 2022, 2024, 2025 all severe). A premium "AgriClaw Irrigation Copilot" layer built on Hydrosat could be a $150-300/year upsell per 100 ha.

**What we get:**
- Daily ET (actual + reference) at field scale.
- Root-zone soil moisture.
- Crop Water Stress Index.
- Irrigation prescription maps (zonal).

**Commercial path:**
- Enterprise subscription or per-parcel API.
- Pilot: 10-20 farms, Q3 2026. Negotiate based on forecast adoption.

**Effort:** 3-4 weeks integration (Hydrosat API is modern REST/GeoJSON).

**Risk:** Still a small provider with 2 operational satellites → revisit may be below daily in cloudy weeks. Complement with Landsat TIRS fallback.

### RECOMMENDATION #4 — **SAR — ICEYE "Persistent Monitoring" or Umbra Open+Commercial — P1 / Q3-Q4 2026**

**Why:** For Polish autumn/winter/early spring (Oct-Feb) cloud cover can exceed 70 %. Sentinel-1 alone at 10 m is not always enough for insurance-grade change detection (ploughing verification, storm damage, harvest dates). Commercial SAR at 50 cm-1 m closes this.

**What we get:**
- All-weather change detection.
- Flood damage extents (for crop insurance tie-in).
- Harvest-date verification for CAP compliance.
- Optional: Mowing detection for grassland.

**Commercial path (two viable routes):**
1. **ICEYE Persistent Monitoring subscription** — ~€50-100 k/year for a PL national-scale persistent monitoring contract. Best revisit.
2. **Umbra via Open Data for model dev + pay-per-scene commercial for production.** Lowest entry cost. Uses Umbra's unique 16 cm Spotlight Ultra when needed.

**Effort:** 4-6 weeks (new STAC source, SAR-specific processing chain: despeckling, multi-temporal stack, change-detection algo).

### RECOMMENDATION #5 — **Hyperspectral — Pixxel (primary) + Wyvern (fallback) — P2 / Q4 2026**

**Why:** Hyperspectral detects crop stress 2-3 weeks before NDVI; nutrient levels (N, P, K); soil organic carbon; disease at emergence. This is the **next frontier differentiator** and will become commodity by 2028 when CHIME launches. Being early here means AgriClaw is positioned as the CEE leader.

**What we get:**
- 5 m, 150+ band imagery on-demand 2-4×/season per farm.
- Nutrient (NDRE + red-edge derived) maps.
- Disease/pest early-warning (e.g., wheat yellow rust, potato blight).
- Soil OC mapping for Carbon Credits / ESG.

**Commercial path:**
- Pilot programme Q4 2026 — 3-5 "premium" clients, Pixxel tasking at $20-30/km² for 50-100 km² blocks.
- Wyvern for price-sensitive fallback at $22-35/km².
- UP42 for elastic ordering.

**Effort:** 6-8 weeks (hyperspectral pipeline = 150 bands — storage architecture changes; model training for band-subset selection; new UI for spectral-signature products).

**Risk:** Pixxel still scaling; contract terms may shift. Plan dual-sourcing with Wyvern.

---

### Honourable mentions (2027+)

- **Satellogic Merlin daily 1 m** — once operational, potentially replaces or augments PlanetScope with better resolution at comparable price.
- **NISAR L-band SAR free** — free soil moisture under canopy; worth a dedicated product-layer in 2027.
- **Copernicus CHIME hyperspectral (2028)** — will commoditise what we're paying Pixxel/Wyvern for.
- **Copernicus LSTM (2028)** — free ET; replaces Hydrosat for basic needs.
- **NASA SBG** — hyperspectral + thermal free in 2029-2030.

---

## 15. References & Further Reading

### Copernicus Data Space Ecosystem (CDSE)

- Documentation: <https://documentation.dataspace.copernicus.eu>
- APIs: <https://dataspace.copernicus.eu/analyse/apis>
- Quotas: <https://documentation.dataspace.copernicus.eu/Quotas.html>
- Sentinel-2 mission: <https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-2>
- Sentinel Hub docs: <https://docs.sentinel-hub.com/api/latest/>

### ESA / EUMETSAT / Copernicus missions

- Sentinel-4: <https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-4>
- CHIME: <https://www.eoportal.org/satellite-missions/chime-copernicus>
- LSTM: <https://sentiwiki.copernicus.eu/web/lstm>
- CO2M: <https://sentiwiki.copernicus.eu/web/co2m>
- Sentinel Expansion Missions: <https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Copernicus_Sentinel_Expansion_missions>

### NASA / USGS

- NASA Earthdata CSDA Planet vendor: <https://www.earthdata.nasa.gov/about/csda/vendor-planet>
- Landsat missions: <https://www.usgs.gov/landsat-missions>
- NISAR overview: <https://science.nasa.gov/mission/nisar/mission-overview/>
- SBG mission: <https://sbg.jpl.nasa.gov/>
- Prithvi-EO: <https://huggingface.co/ibm-nasa-geospatial>

### Commercial providers

- Planet pricing: <https://www.planet.com/pricing/>
- Planet docs: <https://docs.planet.com/develop/apis/>
- Maxar Legion: <https://www.euspaceimaging.com/blog/2024/11/29/worldview-legion-launch-and-applications/>
- Airbus Pléiades Neo: <https://space-solutions.airbus.com/imagery/our-optical-and-radar-satellite-imagery/pleiades-neo/>
- Satellogic pricing: <https://satellogic.com/2023/01/24/now-you-see-transparent-pricing-for-eo-market-growth/>
- Satellogic Merlin: <https://satellogic.com/news/press-releases/satellogic-introduces-merlin-constellation-for-daily-global-monitoring-at-one-meter-resolution/>
- Capella Space: <https://www.capellaspace.com>
- ICEYE: market overview via New Space Economy 2026 <https://newspaceeconomy.ca/2026/03/30/the-dual-use-sar-market-how-companies-like-iceye-are-selling-the-same-constellation-to-governments-and-insurers/>
- Umbra Open Data: <https://registry.opendata.aws/umbra-open-data/>
- Synspective StriX: <https://synspective.com/satellite/>
- Pixxel Firefly: <https://www.pixxel.space/firefly>
- Wyvern: <https://www.wyvern.space/technology>
- Planet Tanager: <https://docs.planet.com/data/imagery/tanager/>
- Hydrosat: <https://hydrosat.com/>
- SatVu HotSat: <https://www.satellitevu.com/>
- Albedo Clarity: <https://albedo.com/>
- BlackSky Gen-3: <https://blacksky.com/gen-3/>

### Aggregators / Platforms

- UP42: <https://up42.com/>
- SkyWatch EarthCache: <https://skywatch.com/earthcache/>
- Google Earth Engine: <https://earthengine.google.com/>
- GEE pricing: <https://cloud.google.com/earth-engine/pricing>
- Microsoft Planetary Computer: <https://planetarycomputer.microsoft.com/>
- AWS Earth Search: <https://earth-search.aws.element84.com/v1>
- OpenEO: <https://openeo.org/>

### Poland institutional

- GUGiK: <https://www.gugik.gov.pl/> and <https://mapy.geoportal.gov.pl/>
- QGIS GUGiK downloader plugin: <https://plugins.qgis.org/plugins/pobieracz_danych_gugik/>
- ARiMR: <https://www.gov.pl/web/arimr>
- eWniosekPlus: <https://epue.arimr.gov.pl/>
- IMGW: <https://danepubliczne.imgw.pl/>
- IUNG-PIB: <https://www.iung.pl/>
- GDOŚ: <https://www.gov.pl/web/gdos>

### Drones

- DJI Mavic 3M: <https://ag.dji.com/mavic-3-m>
- DJI Agras T40: <https://farmonaut.com/precision-farming/dji-agras-t40-price-dji-agras-t10-price-2026-guide>
- Parrot ANAFI: <https://www.parrot.com/en/drones/anafi-usa>
- Wingtra: <https://wingtra.com/>

### Data formats & standards

- STAC: <https://stacspec.org/>
- COG: <https://www.cogeo.org/>
- OGC: <https://www.ogc.org/standards/>
- GeoParquet: <https://geoparquet.org/>
- Zarr: <https://zarr.dev/>

### ML foundation models

- Prithvi Geospatial: <https://research.ibm.com/blog/prithvi2-geospatial>
- Clay Foundation Model: <https://clay-foundation.github.io/model/>
- SatlasPretrain (Allen AI): <https://satlas-pretrain.allen.ai/>
- Source Cooperative (training data): <https://source.coop/>
- ESA Φ-lab: <https://www.philab.esa.int/>
- SAM for satellite imagery: <https://arxiv.org/html/2506.16318v1>

---

## Appendix A — STAC query examples

**Sentinel-2 last 7 days, low cloud:**
```bash
curl -X POST https://catalogue.dataspace.copernicus.eu/stac/search \
  -H "Content-Type: application/json" \
  -d '{
    "collections":["SENTINEL-2"],
    "bbox":[20.0,51.5,22.0,53.0],
    "datetime":"2026-04-11T00:00:00Z/2026-04-18T23:59:59Z",
    "query":{"eo:cloud_cover":{"lt":20}},
    "limit":10
  }'
```

**Planet PlanetScope PSScene search:**
```bash
curl -X POST https://api.planet.com/data/v1/quick-search \
  -u $PLANET_API_KEY: \
  -H "Content-Type: application/json" \
  -d '{
    "item_types":["PSScene"],
    "filter":{
      "type":"AndFilter",
      "config":[
        {"type":"GeometryFilter","field_name":"geometry","config":{"type":"Polygon","coordinates":[[[20.9,52.2],[21.1,52.2],[21.1,52.3],[20.9,52.3],[20.9,52.2]]]}},
        {"type":"DateRangeFilter","field_name":"acquired","config":{"gte":"2026-04-10T00:00:00Z","lte":"2026-04-18T23:59:59Z"}},
        {"type":"RangeFilter","field_name":"cloud_cover","config":{"lte":0.2}}
      ]
    }
  }'
```

**Microsoft Planetary Computer STAC (Sentinel-2 L2A):**
```python
import pystac_client
catalog = pystac_client.Client.open(
    "https://planetarycomputer.microsoft.com/api/stac/v1"
)
items = catalog.search(
    collections=["sentinel-2-l2a"],
    bbox=[20.0,51.5,22.0,53.0],
    datetime="2026-04-11T00:00:00Z/2026-04-18T23:59:59Z",
    query={"eo:cloud_cover": {"lt": 20}},
).item_collection()
```

## Appendix B — Sentinel Hub example: NDVI evalscript

```javascript
// NDVI evalscript for Sentinel-2 L2A
//VERSION=3
function setup() {
  return {
    input: [{bands: ["B04","B08","dataMask"]}],
    output: {bands: 4}
  };
}
function evaluatePixel(s) {
  const ndvi = (s.B08 - s.B04)/(s.B08 + s.B04);
  const c = ndvi < 0 ? [0,0,0] :
            ndvi < 0.2 ? [0.8,0.5,0.2] :
            ndvi < 0.4 ? [0.9,0.9,0.2] :
            ndvi < 0.6 ? [0.4,0.8,0.3] :
                         [0.1,0.5,0.1];
  return [...c, s.dataMask];
}
```

## Appendix C — Glossary

- **ARD** — Analysis-Ready Data (atm. corrected, radiometric, geometric).
- **AOI** — Area of Interest.
- **CAP** — Common Agricultural Policy (EU).
- **CDSE** — Copernicus Data Space Ecosystem.
- **COG** — Cloud-Optimized GeoTIFF.
- **CWSI** — Crop Water Stress Index.
- **DSM/DTM/DEM** — Digital Surface / Terrain / Elevation Model.
- **EFA** — Ecological Focus Area.
- **ET/ETa/ET0** — Evapotranspiration (actual / reference).
- **GRD** — Ground Range Detected (SAR product).
- **GSD** — Ground Sample Distance.
- **HLS** — Harmonized Landsat-Sentinel.
- **IACS** — Integrated Administration & Control System (EU CAP).
- **JPO** — jednolita płatność obszarowa (single area payment, PL).
- **LPIS** — Land Parcel Identification System.
- **MS** — Multispectral.
- **NDVI / NDRE / NDMI** — Normalised Difference Vegetation / Red-Edge / Moisture Index.
- **OGC** — Open Geospatial Consortium.
- **Pan** — Panchromatic.
- **SAR** — Synthetic Aperture Radar.
- **SCL** — Scene Classification Layer.
- **STAC** — SpatioTemporal Asset Catalog.
- **SLC** — Single-Look Complex (SAR).
- **SWIR / TIR / VNIR** — Short-wave / Thermal / Visible-Near-Infrared.
- **UDM** — Usable Data Mask (Planet).
- **VRA** — Variable-Rate Application.
- **WMS/WMTS/WFS/WCS** — OGC web services (map/tiles/features/coverages).

---

*End of main body. Appendices continue below.*

---

## Appendix D — Deep-Dive Comparisons

### D.1 Sentinel-2 vs PlanetScope vs Satellogic — side-by-side for a 100 ha Polish wheat farm

| Dimension | Sentinel-2 | PlanetScope | Satellogic |
|---|---|---|---|
| Cost / year | $0 | ~$200-400 (on 100 ha HUM pkg, prorated) | Effectively $400/image × 3-4 tasked acquisitions = $1.2-1.6 k |
| Resolution | 10 m (20 m red-edge) | 3 m | 70 cm |
| Revisit | 5 d | 1 d | On-demand (1-3 d tasked) |
| Bands | 13 | 8 | 4 + pan |
| Red-edge | 3 bands (B5, B6, B7) | 1 band | Limited |
| Typical images per season (Mar-Oct) | 20-25 usable (cloud filter) | 90-120 usable | 3-5 tasked |
| Use case fit | Season-long trend | Real-time stress response | Premium inspection moments |

**Interpretation:** Sentinel-2 remains the **trend engine**; PlanetScope fills the **daily response** gap; Satellogic is the **surgical tool** at key stages (pre-planting, canopy closure, pre-harvest).

### D.2 SAR deep-dive — what Sentinel-1 can't do that commercial can

- **Revisit:** Sentinel-1C at 6 d globally, 3 d in Europe. Insurance-grade change detection often needs hours, not days.
- **Resolution:** Sentinel-1 IW at 10 m vs. ICEYE/Capella at 25-50 cm Spot. A fallen 2-m-diameter silo is invisible at S-1; visible at commercial SAR.
- **Polarisation:** Sentinel-1 has VV+VH; commercial SAR offers multi-pol (HH, VH, HV) on demand for better scattering analysis.
- **Incidence angle flexibility:** Commercial can pick incidence angle on demand (good for detecting specific crop canopies). Sentinel-1 fixed track.

### D.3 Hyperspectral vs multispectral for nutrient detection

| Indicator | Sentinel-2 capability | Hyperspectral capability |
|---|---|---|
| Nitrogen status | NDRE (B5/B8), CIgreen | Bands @ 710, 755, 805 nm (sharp red-edge slope) — 30 % better accuracy |
| Chlorophyll | B5, B6, B7 | Bands @ 670, 690, 740 nm direct |
| Water content | NDMI (B8/B11) | Liquid water absorption 970, 1200, 1450, 1940 nm |
| Organic carbon | SWIR B11/B12 proxy | 2200, 2250 nm lignin/cellulose absorption — direct |
| Disease/pathogen | Broad NDVI drop | Specific absorption features (early, pre-visual) |

Research consistently shows hyperspectral outperforms multispectral by 15-40 % for specific biochemical targets.

---

## Appendix E — Polish market sizing context (as of April 2026)

- **Number of farms in Poland:** ~1.3 million farms (GUS). ~300 k are commercial (> 10 ha).
- **UAA:** ~14.6 M ha total utilised agricultural area.
- **CAP payments 2023-2027 envelope:** ~€25 B direct + €12 B rural development.
- **Digitalisation:** ARiMR eWniosekPlus adoption > 98 % since 2022 (mandatory).
- **Broadband in rural areas:** > 85 % households with 100 Mbps (KPO programme).
- **Mobile data:** LTE/5G coverage > 98 % populated areas; RTK networks (ASG-EUPOS) free to licensed users.
- **Typical Polish farm income:** €25 k-80 k/year for 50-200 ha farm. Addressable SaaS spend: €300-2000/year per farm.

**Insight:** Farmers at 50-300 ha are the AgriClaw sweet spot. At 500+ ha, they likely already use xarvio or FieldView; at < 20 ha, value perception is low. Aim for €500-1,200 ARR per farm initially.

---

## Appendix F — Known-unknowns & open questions for Q2 2026

1. **Planet Partner Program vs UP42 re-seller** — which gives better unit economics at 5k farms? Need a financial model.
2. **Hydrosat availability in Poland** — currently their reference customers are ES, IT, IN, US, LATAM. Need to confirm operational coverage in 52° N latitude and Oct-Feb utility.
3. **Pixxel commercial terms** — contact sales for EU-AOI tasking pricing; negotiate minimum order.
4. **ARiMR API partnership** — can we get read-only API access to eWniosekPlus parcels (with farmer consent token)? Involves Min. Rolnictwa.
5. **Sentinel Hub lock-in risk post Planet acquisition** — continuity plan if Planet changes pricing / API. OpenEO is the portable fallback.
6. **GDPR & data-residency for non-EU providers** — Maxar/Planet/Satellogic are US. Add DPA clauses; consider EU-only fallback.
7. **Drone regulatory (EASA A1/A2/A3):** Farmers must be certified; AgriClaw should provide a compliance guide.

---

## Appendix G — Evaluation checklist for a new data source

Before integrating any new source into AgriClaw, score it:

- [ ] Is the data licence compatible with SaaS redistribution?
- [ ] Is there a STAC endpoint? If not, can we build a normaliser in ≤ 2 weeks?
- [ ] Does the API support async batch & polygon-clip or must we download full tiles?
- [ ] What is the cost per ha for a 100 ha farm over 12 months?
- [ ] Revisit: does it add coverage our existing stack lacks?
- [ ] Cloud/weather independence?
- [ ] Coverage over Poland & CEE specifically?
- [ ] Data volume per month (storage cost)?
- [ ] Does the provider have an SLA? What's their historical uptime?
- [ ] Does customer support cover Europe TZ?
- [ ] Is the provider VC-funded, profitable, or at risk of shutdown?
- [ ] Does it integrate with Prithvi / Clay / SAM for ML?

At least 9 of 12 should be green to proceed.

---

## Appendix H — Environmental & carbon-accounting angle (2026+)

European farmers are increasingly required to report carbon intensity (Scope 3 for food buyers; CSRD for 2026+). Satellite data powers:

- **Soil organic carbon (SOC)** — hyperspectral SWIR absorption (Pixxel, Wyvern, PRISMA) + modelling (e.g. Cool Farm Tool).
- **Methane emissions from livestock** — Sentinel-5P TROPOMI, Tanager-1, GHGSat, CO2M (2026).
- **Forest sequestration** — GEDI lidar, NISAR L-SAR, Prithvi-EO Carbon head.
- **Land-use change baselines** — Landsat time-series (back to 1985).
- **Biodiversity (EUDR compliance)** — ESA WorldCover, Dynamic World, drone RGB.

**AgriClaw product idea:** "Carbon-Ready Farm" — an add-on layer generating an ESG report monthly, pulling from Hydrosat (irrigation), Pixxel (SOC), Sentinel-2 (land-use stability), Sentinel-5P (methane intensity).

---

## Appendix I — Technical integration effort estimates

Relative weeks of one senior platform engineer.

| Source | STAC | Auth | Tiles | Analytics | Total (weeks) |
|---|---|---|---|---|---|
| PlanetScope (direct API) | 2 | 1 | 2 | 3 | **8** |
| PlanetScope via UP42 | 1 | 0.5 | 1 | 1 | **3.5** |
| GUGiK ortho + LiDAR | 0.5 | 0 | 1 | 1 | **2.5** |
| ARiMR eWniosek GeoJSON import | 0 | 0 | 0 | 1 | **1** |
| Hydrosat IrriWatch | 1 | 0.5 | 0.5 | 2 | **4** |
| ICEYE SAR persistent | 1 | 0.5 | 1 | 3 | **5.5** |
| Umbra Open + commercial | 1 | 0.5 | 1 | 2 | **4.5** |
| Pixxel hyperspectral | 1.5 | 0.5 | 1 | 4 | **7** |
| Landsat TIRS for thermal baseline | 0.5 | 0 | 0.5 | 1 | **2** |
| Copernicus DEM overlay | 0.5 | 0 | 0.5 | 0.5 | **1.5** |
| IMGW weather API cache | 0 | 0 | 0 | 2 | **2** |
| IUNG soil layer | 0.5 | 0 | 0.5 | 0.5 | **1.5** |

Capacity planning: 2 engineers full-time, Q2-Q4 2026 ≈ 78 engineer-weeks available. Budget 20 % buffer → 62 deliverable weeks → comfortably covers all 5 P0/P1/P2 recommendations.

---

## Appendix J — Historical context: why 2026 is a unique inflection

The commercial EO industry is at an inflection point due to four compounding shifts in 2024-2026:

1. **Rideshare cadence normalised.** SpaceX Transporter missions (now ~quarterly at 100+ smallsats each) dropped cost-to-orbit from $40 k/kg (2015) to $5 k/kg (2025). Small EO startups ship constellations in months.
2. **CMOS sensor density crossed the hyperspectral threshold.** Pushbroom spectrometers with 200+ bands fit in 12U CubeSats in 2024-2025 (Pixxel, Wyvern).
3. **Foundation models generalised.** Prithvi, Clay, and SAM have pushed zero-shot field-segmentation IoU from ~0.6 (2022) to 0.86 (2025-2026), meaning new markets like Poland can be onboarded without building country-specific labelled datasets.
4. **EU regulation drove demand.** CAP AMS (Sentinel-1/2 based) in 2023, CSRD in 2024-2025, EUDR in 2025, SUR in 2026-2027 all require satellite-verified compliance.

This convergence means that **2026 is the year to ship the premium agri-analytics stack in CEE** — competitors won't have time to catch up if we execute the 5-recommendation roadmap decisively.

---

## Appendix K — FAQ: which satellite for which question?

| Question a farmer asks | Best data source(s) |
|---|---|
| "How's my wheat doing this week?" | PlanetScope NDVI (3 m daily) or Sentinel-2 (5 d) |
| "Did my neighbour plough the buffer strip?" | GUGiK 25 cm ortho (latest year), Sentinel-1 SAR backscatter |
| "Was there hail damage last night?" | ICEYE/Capella SAR < 12 h revisit or Mavic 3M flight next morning |
| "How much nitrogen does this field need?" | Hyperspectral (Pixxel/Wyvern) + soil samples + IUNG soil map |
| "Should I irrigate tomorrow?" | Hydrosat ET + IMGW forecast + SMAP regional |
| "How much carbon is my soil storing?" | Hyperspectral SOC model + Landsat time-series |
| "Is my grassland cut before the CAP deadline?" | Sentinel-1 mowing detection + ARiMR AMS check |
| "What crop was on this field last year?" | Sentinel-2 time-series + Prithvi crop head + ARiMR historical |
| "How much did my yield drop due to drought?" | Sentinel-3 OLCI + MODIS + Landsat LAI modelling |
| "Can I plant here?" | Copernicus DEM + IUNG soil + IMGW climate + Natura 2000 overlay |

---

## Appendix L — Data lake architecture reference (target Q4 2026)

```
┌─────────────────────────────────────────────────────────────┐
│                    AgriClaw Data Lake (AWS eu-central-1)    │
├─────────────────────────────────────────────────────────────┤
│ S3 bucket layout:                                           │
│   raw/sentinel-2/{date}/{tile}/...                          │
│   raw/planetscope/{date}/{scene}/...                        │
│   raw/hydrosat/{date}/{tile}/...                            │
│   raw/pixxel/{date}/{scene}/...                             │
│   raw/umbra-open-data/...                                   │
│   raw/gugik/ortho/{year}/{voivodship}/...                   │
│   ard/{source}/{date}/{aoi}/... (COG, analysis-ready)       │
│   zarr/parcels/{parcel_id}/ndvi.zarr                        │
│   vectors/parcels.geoparquet                                │
│   vectors/events.geoparquet                                 │
│   stac/catalog.json (root) + pgstac DB                      │
├─────────────────────────────────────────────────────────────┤
│ Compute:                                                    │
│   AWS Batch + Dask on EKS for ingestion & processing        │
│   TiTiler-PgSTAC for tile serving                           │
│   Lambda-based thumbnailer                                  │
│   Modal / RunPod for GPU inference (Prithvi/SAM)            │
│   CloudFront CDN for ortho/tile caching                     │
├─────────────────────────────────────────────────────────────┤
│ Serving to Next.js app:                                     │
│   tRPC API → PostGIS + S3 presigned                         │
│   MapLibre GL tiles from CloudFront                         │
│   NDVI/NDRE computed server-side via evalscript             │
└─────────────────────────────────────────────────────────────┘
```

Stack: AWS + Kubernetes + Dask + DuckDB + PostGIS + TiTiler + pgstac. Cost target: < $0.05 per farm per month raster storage + compute at 10 k farms, excluding 3rd-party data subscriptions.

---

## Appendix M — Competitive intelligence snapshot (April 2026)

| Competitor | Data sources used | Differentiator | Gap vs AgriClaw |
|---|---|---|---|
| **Taranis** (US/IL) | PlanetScope, aerial, drone | AI leaf-level scouting | High cost; drone-heavy |
| **xarvio Field Manager** (BASF) | Sentinel-2, Landsat, weather | Agronomic models; chem recommendations | Tied to BASF product catalogue |
| **Climate FieldView** (Bayer) | PlanetScope, Sentinel, on-farm sensors | Planter/combine integration | N. America-first; weak in EU |
| **OneSoil** (PL/LT) | Sentinel-2 | Crop classification for all of Europe | Free tier = freemium hook; limited paid features |
| **Agremo** | Sentinel-2, drones | Cheap; MS-friendly UI | Shallow analytics |
| **EOS Data Analytics** (Crop Monitoring) | Sentinel, Landsat, PlanetScope | Global; robust API | Competitive price; not PL-focused |
| **CropX** (IL) | On-ground probes + satellite | Soil sensor hardware | Hardware-heavy, not SaaS-pure |
| **Farmonaut** (IN) | Sentinel-2, Landsat, AI | Cheap; global; multi-language | Thin UI; limited customer success in EU |

**Where AgriClaw wins:**
- GUGiK 25 cm ortho integration = unique Polish ground-truth.
- Hydrosat ET + Pixxel hyperspectral = premium upsell nobody in PL does yet.
- Polish-first UX + ARiMR eWniosek integration.
- Modern stack (Next.js, STAC, COG) vs legacy desktop tools.

---

## Appendix N — Go-to-market positioning for each new source

| Source | Pricing anchor (to farmer) | Positioning |
|---|---|---|
| PlanetScope daily | +€15/ha/year | "See your fields every day" |
| GUGiK ortho | included | "Your farm in photographic detail" |
| Hydrosat ET | +€8/ha/year | "Irrigate only what needs water" |
| SAR (ICEYE/Umbra) | +€5/ha/year | "No more cloudy weeks" |
| Pixxel hyperspectral | +€20/ha on-demand 2×/year | "Know your nutrients before you spray" |

Target: €50-80/ha/year gross for "AgriClaw Pro" tier (vs €15-25/ha for "AgriClaw Basic" = Sentinel-2 only).

---

## Appendix O — Security & compliance notes

- **EU data-residency:** Store all farmer PII + ARiMR-derived parcels in eu-central-1 (Frankfurt) or eu-north-1.
- **Planet / Maxar DPAs:** Standard contractual clauses; check if imagery containing farms counts as "personal data" under GDPR (possibly, if combined with farmer identity).
- **Sentinel data:** No PII concerns.
- **GUGiK:** Public data; attribution required.
- **Copernicus licence:** Attribution "Contains modified Copernicus Sentinel data [Year] / Copernicus Service information [Year]".
- **NIS2:** As a digital service to agriculture (medium entity), NIS2 compliance from Oct 2024 — needs ISO 27001 path.
- **ISO 27001:** Recommended for enterprise B2B sales.
- **SOC 2 Type II:** Target for US/non-EU customers if we expand.

---

## Appendix P — Data-volume estimates (per farm / per month)

| Source | Avg. monthly volume (10 ha farm) | Compressed COG |
|---|---|---|
| Sentinel-2 L2A (2 scenes 10 ha clipped) | 25 MB | 8 MB |
| Sentinel-1 GRD (5 scenes 10 ha clipped) | 40 MB | 15 MB |
| PlanetScope daily (20 scenes 10 ha clip) | 100 MB | 35 MB |
| GUGiK ortho 25 cm (static per farm) | 150 MB once | 50 MB once |
| DEM (static per farm) | 1 MB once | < 1 MB |
| Hydrosat daily ET (70 m, tiny footprint) | 5 MB | 2 MB |
| SAR tasking 1 image/quarter | 30 MB/scene | 10 MB |
| Hyperspectral on-demand 4/year | 200 MB/scene | 60 MB |

At 10 k farms × 100 MB/mo hot + 200 MB cold = ~3 TB hot monthly. With CDN caching, egress < $500/month on AWS.

---

*End of AgriClaw Satellite & Aerial Data Catalog — April 2026. Next revision: July 2026 (post Q2 integrations).*

