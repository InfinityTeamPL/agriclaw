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

