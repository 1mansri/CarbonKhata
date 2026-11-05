> Compiled on 2026-11-05 by research agents from open-access papers, government documents and EPDs.
> Each source is marked FT (full text read), FT+SI, ABS (abstract only) or PW (paywalled, not read).
> Verify a citation against the original before quoting it in the BTP report; items marked "not verified" are leads, not facts.

# Embodied Carbon of Construction Materials in India: A Literature Review to Justify and Design an Open, ISO 14044-Aligned Calculator

*Prepared 5 November 2026 for a B.Tech project (BTP). Scope: Indian LCA and embodied-carbon studies of cement, concrete, masonry, walls and buildings; what goes wrong in current practice; Indian policy for 2023–2026; and open-access studies that can be used to validate the calculator.*

---

## 0. How this review was done

**Searching.**
- I used the OpenAlex API with the open-access filter, limited to 2014–2026.
- I also used the Semantic Scholar search API, but it returned HTTP 429 (rate-limited) for most of the session. Web search filled the gap.
- Full texts came from publisher open-access pages (MDPI, Springer/Nature, IOP, E3S, ACS, SCIRP), PMC/Europe PMC, author repositories (IIT Madras), the Wayback Machine, and government sites.
- Reading was split between me and three research sub-agents. All of us worked under the same rule: report only what was actually opened.

**My own checks.** I re-checked the load-bearing numbers myself against the downloaded files:
- the Chaudhary & Akhtar supplementary workbook;
- Pillai et al. Tables 2 and 3;
- Patil et al. Tables 1–3;
- the Gettu et al. cement values;
- IFC ICMD Table 14;
- CEA v22.

**Read-status codes** used in every table:

| Code | Meaning |
|---|---|
| **FT** | full text read |
| **FT+SI** | full text plus supplementary data |
| **ABS** | abstract only |
| **PW** | paywalled, not read |
| **Sn** | search snippet only |

**Access gaps.** These important Indian papers are verified to exist but are paywalled and were **not** read:
- Praseeda, Reddy & Mani 2015, *Energy Build.* 86:677–686 (doi:10.1016/j.enbuild.2014.10.042)
- Gettu et al. 2019, *Mater. Struct.* 52:10 (doi:10.1617/s11527-019-1321-5)
- Prakasan, Palaniappan & Gettu 2020, *J. Inst. Eng. India A* 101:221–232 (doi:10.1007/s40030-019-00409-4)
- Kulkarni & Rao 2016, *J. Clean. Prod.* (doi:10.1016/j.jclepro.2016.06.152)

---

## 1. Current practice: how Indian studies compute embodied carbon

### 1.1 Synthesis

**Tools.**
- Concrete and cement studies from IIT Madras use SimaPro (v8.0.5.13) with ecoinvent background data plus primary data from a cement plant in Tamil Nadu [1–3].
- Other tools seen: SimaPro 7.3.3 [13], SimaPro 9.2 [8], UMBERTO NXT [4] and openLCA [12].
- A large and growing share of recent work is plain spreadsheet arithmetic [6, 7, 14, 17, 20]. Chaudhary & Akhtar explicitly publish an *Excel* template [17].
- One Click LCA appears in practitioner reports [22].
- **No study we read used EDGE as its calculation engine.** EDGE matters only because it hosts the IFC India Construction Materials Database (ICMD) [16].

**Data sources.**
- ecoinvent (v2.2 to v3.8) is the default background database. A review of 71 South Asian building-LCA papers found that "the life cycle inventory database used was always Eco-invent" [23].
- Since 2017 the IFC/thinkstep **ICMD** has become the de facto Indian factor source [17, 18, 20, 21]. It was built in GaBi to EN 15804 (A1–A3), with IPCC AR5 GWP100.
- Other sources: ICE (Bath) [20, 21, 17]; EPDs, including JSW [21]; Portuguese inventories [6]; and factors attributed only to "literature" [7].

**Functional units.**
- 1 t cement [1, 2]
- 1 m³ concrete, sometimes also per MPa [1–3, 6–12]
- per brick, per kg brick or per 1000 bricks [13, 14]
- 1 m³ of wall [18]
- m² of built-up area (BUA) [20, 21]
- whole building [17]

Talpur et al. report that 70% of the South Asian studies they reviewed use m² [23].

**System boundaries.**
- Almost always cradle-to-gate (A1–A3).
- A few add transport: to the RMC plant [3], 30 km distribution [14], or A4–A5 transport plus on-site diesel [17].
- **None of the material-level studies we read quantified end of life (C1–C4) or module D.**

### 1.2 Representative Indian studies

**Table 1. Representative Indian studies (20).** Full references are in Section 7. "n.s." means not stated.

| # | Study | Read | Topic | Tool | Data / factor sources | Functional unit | Boundary | Headline result |
|---|---|---|---|---|---|---|---|---|
| 1 | Gettu et al. 2016, SCMT4 [1] | FT | OPC/PPC/PSC/LC3 cements; M30 and M50 concrete | SimaPro | ecoinvent 3 plus Tamil Nadu cement-plant data; IPCC 2013 | 1 t cement; 1 m³ | Ground-to-gate (A1–A3) | **OPC 870, PPC 660, PSC 730, LC3 590 kg CO2/t.** Against OPC concrete: fly ash −22% (M30) and −26% (M50); GGBS −6% and −21% |
| 2 | Gettu et al. 2018, *Mater. Struct.* [2] | FT | 30 mixes: 0–50% fly ash/GGBS, ternary, LC3 | SimaPro 8.0.5.13 | Plant data plus ecoinvent | 1 t cement; 1 m³ | Ground-to-gate | Clinker 910. **OPC 930, PPC 690, PSC 550, LC3 610 kg CO2e/t.** GGBS ≈70 kg/t (ecoinvent value: 63) |
| 3 | Pillai et al. 2019, *CCR* [3] | FT | OPC, 30% fly ash and LC3 concrete; M35 and M50 | SimaPro 8.0.5.13 (for gaps only) | Ariyalur plant data, ecoinvent 3.3, IPCC/EPA; grid 1.38 kg/kWh | 1 m³ | A1–A3 plus transport to RMC plant | **M35:** OPC 335, fly ash 290, LC3 255/280. **M50:** 380/300/270 kg CO2e/m³ |
| 4 | Bajpai et al. 2020, *JCP* [4] | ABS (PW) | Fly ash and fly ash + silica fume geopolymer vs OPC | UMBERTO NXT | ecoinvent 3.0; ReCiPe | 1 m³ | n.s. | Activators dominate the impact. No GWP number in the abstract |
| 5 | Meshram & Kumar 2021, *IJEST* [5] | ABS | Fly ash–slag geopolymer **cement**, 5 t/day pilot plant | n.s. | Pilot primary data | n.s. in abstract | Cradle-to-gate | 267 kg CO2-eq (basis not stated in abstract), about 70% below OPC |
| 6 | Bhagat & Savoikar 2021, *IOP EES* [6] | FT | Fly ash and recycled-aggregate concrete | Spreadsheet | **Portuguese** inventory | 1 m³ | Cradle-to-gate | 144.44–359.57 kg CO2e/m³ |
| 7 | Patil et al. 2023, *E3S* [7] | FT | Fly ash/GGBS geopolymer concrete (GPC) vs OPC; rigid pavement | Spreadsheet | Unattributed "literature" factors | 1 m³; 1 km road | A1–A3 plus batching, transport, placing | **GPC 306.83 vs OPC 373.85 kg CO2e/m³** (−18%) |
| 8 | Omran et al. 2026, *Sci. Rep.* [8] | FT | M25 with e-plastic fine aggregate, with or without silica fume (Chennai) | SimaPro 9.2 | ecoinvent (version n.s.); ReCiPe 2016 | 1 m³ and per MPa | Cradle-to-gate, excluding transport to site | Control 373.04; lowest 251.21 kg CO2e/m³. Tables contradict each other (see §2.4) |
| 9 | Padavala et al. 2026a, *Sci. Rep.* [9] | FT | Self-compacting GPC (fly ash + silica fume) vs OPC self-compacting concrete | n.s. | Factor *ranges* from ecoinvent 3.8, IPCC 2019 and the GNR database; grid 0.82 kg/kWh | 1 m³ | Cradle-to-gate | OPC mix 368 kg CO2e/m³; GPC 30–45% lower |
| 10 | Kar et al. 2026, preprint [12] | FT | High-volume fly ash (50–90%) and GPC (Kolkata) | openLCA | "Typical" ecoinvent data | 1 m³ | Cradle-to-gate | ≈425 (OPC), ≈225–95 (high-volume fly ash), ≈75 (GPC) kg CO2e/m³ |
| 11 | Kumbhar et al. 2014, *Energy Procedia* [13] | FT | Clamp-fired bricks, 16 clamps in Sangli/Satara | SimaPro 7.3.3 | ecoinvent 2.2; Eco-indicator 99; IPCC coal formula | 1000 bricks | Cradle-to-gate | **No kg CO2e reported**; climate change given only as 244.5 Eco-indicator points |
| 12 | Singh et al. 2024, *Sci. Rep.* (CSIR-CBRI) [14] | FT | Burnt clay brick vs waste-based fly-ash brick | Hand calculation | European and Indian factor sets | Per brick, per kg | Cradle-to-gate plus 30 km | Clay brick **290 g CO2/brick** (97.08 g/kg); fly-ash brick 43.28 g/brick |
| 13 | Tibrewal et al. 2023, *Nat. Sustain.* [15] | FT+SI | Energy use of brick kilns nationally; more than 500 kilns surveyed | Survey plus Monte Carlo | Primary measurements | MJ per kg fired brick | Firing | Specific energy: Bull's trench kiln (BTK) **1.30 ± 0.25**, zigzag **1.19 ± 0.17**, clamp **1.58 ± 0.54** MJ/kg; 233 ± 15 billion bricks/yr |
| 14 | IFC/thinkstep 2017, ICMD [16] | FT | National factor database | GaBi ts | GaBi plus Indian data; IPCC AR5 | 1 kg | A1–A3 (EN 15804) | kg CO2e/kg: OPC 0.91, PPC 0.64, PSC 0.69; OPC ready-mix (M40) 0.11; bricks: BTK 0.32, clamp 0.57, zigzag 0.59; AAC 0.50; fly ash–lime–gypsum (FaLG) block 0.20; rebar 2.6 |
| 15 | Chaudhary & Akhtar 2022, *ACS Environ. Au* [17] | FT+SI | Residential quarters at a sub-divisional hospital, Bihar | **Excel** | ICMD plus EPDs, Ökobaudat, ICE, ecoinvent (diesel); quantities from CPWD Delhi Analysis of Rates 2021 | Whole building | **A1–A5** (cradle-to-site) | **936 t CO2e**: A1–A3 899, A4 24.6, A5 12. Brick 1.12 kg CO2e per brick |
| 16 | Jain et al. 2024, *Curr. World Environ.* [18] | FT | Walling for affordable housing, Delhi | DesignBuilder (thermal only) | ICMD coefficients | 1 m³ wall | A1–A3, **energy only** | MJ/m³: burnt clay brick 9652.87; AAC 3112.19; fly-ash brick 2203.88; precast RC 6584.03 |
| 17 | Ramesh et al. 2013, *OJEE* [19] | FT | Multifamily residence, Allahabad (2960 m²) | eQuest (operational energy) | Indian embodied-energy coefficients | m² usable area | Life cycle, **energy only** | Initial embodied energy 7.35 GJ/m²; life-cycle energy 75.07 GJ/m² over 75 years |
| 18 | Akshatha et al. 2025, WCS [20] | FT | 30-storey shear-wall residential tower, BUA 82,902 m² | Spreadsheet | **Four** factor sets: ICE v2.0, EPiC, IFC ICMD, in-house | m² BUA | A1–A3 | **373 (IFC) to 530 (EPiC) kg CO2e/m²**; mean 454; coefficient of variation 14.4% |
| 19 | Zakai et al. 2025, *J. Phys. Conf. Ser.* [21] | FT | RCC residential buildings, Ahmedabad; floor area ratio 1–5.5; seismic zones II–V | n.s. | IFC, ICE, JSW EPDs | m² BUA | A1–A3, structure only | Results in charts only. From zone II to zone V, steel rises 39.19 → 59.59 kg/m² and concrete 926 → 1241 kg/m² |
| 20 | AEEE & Saint-Gobain Research India 2024 [22] | FT (relevant sections) | 288 m² office building, plus a review of Indian building LCA | One Click LCA vs IFC dataset | One Click (foreign factors adjusted to the Indian grid) vs ICMD | Building | A1–A3 | **About 17% difference** in upfront embodied carbon between datasets; brick 0.24 vs 0.39 kg CO2e/kg |

---

## 2. Pain points, each backed by a cited source

### 2.1 No India-specific inventory data, so studies fall back on foreign databases

- **Talpur et al. 2023** (FT) [23]: "The majority of LCAs performed on Indian systems or products used databases that do not support regional Indian products and materials… A national database specifically for South Asian countries has not yet been launched."
- **Chaudhary & Akhtar** (FT) [17]:
  - Factors in earlier studies "were not representative of Indian manufacturing and construction practices but taken from studies published in other countries. Using generic data or data from other geographical regions can give misleading results."
  - Example: ICE gives aggregate at 0.0028 kg CO2e/kg, against India-specific 0.009.
- **Bhagat & Savoikar** (FT) [6]:
  - "LCA studies in India are at infancy stage"
  - ecoinvent "is entirely based on European context"
  - "It is unjustified to use foreign context for LCA of concrete in India."
- **Gettu et al. 2016** (FT) [1]: compiling Indian plant inventories "is not easy or even feasible most of the time"; "the need to generate more relevant data sets for the Indian context is recognized."
- **Zakai et al. 2025** (FT) [21]: "constrained by the absence of a national material emissions database, limited environmental declarations, voluntary reporting."
- **AEEE 2024** (FT) [22]: Indian building LCAs "rely primarily on non-Indian data sources."
- **Meshram & Kumar** (ABS) [5]: "there is no standard data available for geopolymer cement production."
- **Karadumpa & Pancharathi 2024** (ABS) [35]: "The main challenge in Indian scenario is the absence of database for LCA study."

### 2.2 The one Indian database is dated, opaque and sometimes contradicted by field data

The ICMD [16] (FT) has several problems:
- Its cover reads "DRAFT… Strictly Not for Public Distribution", even though it is publicly hosted on edgebuildings.com.
- It is built on confidential GaBi processes.
- It gives mean values only, per kg.
- Its electricity comes from a GaBi 2016 dataset "based on production of electricity in India for the year 2012" [16].
- AEEE notes it "has been published in 2017 and no further revisions have happened" [22].
- Chaudhary & Akhtar could not compute confidence intervals because "the ICMD only provides mean values" [17].

**Kiln ranking conflict.** The ICMD ranks zigzag-kiln brick as the *worst* kiln type:

| Kiln | ICMD (A1–A3 primary energy) | ICMD (GWP) | Tibrewal et al. field survey (firing energy only) [15] |
|---|---|---|---|
| Bull's trench | 3.6 MJ/kg | 0.32 kg CO2e/kg | 1.30 MJ/kg |
| Clamp | 6.3 MJ/kg | 0.57 kg CO2e/kg | 1.58 MJ/kg |
| Zigzag | 6.5 MJ/kg | 0.59 kg CO2e/kg | 1.19 MJ/kg |

The two energy measures differ in scope, so the absolute values are not directly comparable. **The reversed ranking is the substantive conflict:** zigzag is worst in ICMD and most efficient in the field. Tibrewal et al. also report that energy estimates for the sector differ "by a factor of 10–100 from those reported in official statistics" and that "an extreme paucity of datasets has impeded robust energy benchmarking" [15].

### 2.3 Results for the same material are inconsistent

**Table 2. Spread of inputs and results across the studies we read.**

| Quantity | Values found (source) | Spread |
|---|---|---|
| OPC cement, kg CO2e/kg | 0.82 [3, 7]; 0.85–0.95 [9]; 0.870 [1]; 0.91 [16]; 0.930 [2] | 1.13× |
| Fly ash, kg CO2e/kg | 0 [3]; 0.009 [11]; 0.027 [7]; 0.03–0.05 [9]; 0.064 [16] | 0 to 0.064 (allocation choice) |
| GGBS / blast-furnace slag, kg CO2e/kg | 0.035 [7]; 0.066 [16]; 0.07 [2, 11] | 2× |
| NaOH, kg CO2e/kg | 0.603 [7]; 1.215 [9]; 1.50 [11]; 1.915 [14] | **3.2×** |
| Sodium silicate, kg CO2e/kg | 0.85–1.00 [9]; 1.20 [11]; 1.26 [7] | 1.5× |
| Coarse aggregate, kg CO2e/kg | 0.0028 (ICE, as cited in [17]); 0.00419 [3]; 0.005 [11]; 0.009 [16]; 0.0408 [7] | **14.6×** |
| Grid electricity, kg CO2/kWh | 1.38 (ecoinvent, in [3]); 0.82 [9]; 0.675 (CEA weighted average for FY2025-26; generation CO2 only) [41] | 2× |
| Fired clay brick, kg CO2e/kg | 0.097 [14]; 0.24 (One Click, in [22]); 0.31–0.59 depending on kiln [16]; 0.39 [16, 22] | **6×** |
| Same 230 mm brick wall, kg CO2e/m² (CPWD quantities from [17]; only the brick factor changed) | 46.9 (factor from [14]) to 248.6 (ICMD zigzag) | **5.3×** (our calculation) |
| Same high-rise building, kg CO2e/m² BUA | 373–530 across four datasets [20] | 1.42× |
| Same building, One Click vs IFC data | about 17% [22] | — |
| Indian OPC concrete, kg CO2e/m³ | 335–380 [3]; 368 [9]; 373.04 [8]; 373.85 [7]; ≈425 [12] | 1.27× |
| International: OPC cement, kg CO2e/t | 691–1452 across 25 papers [26] | 2.1× |
| International: same office building under different national methods | 10–71 kg CO2e/m²·a [27] | 7× |

Further international evidence:
- Hafez et al. (FT) identify "13 main sources of discrepancies" across 146 green-concrete LCAs [26].
- Pomponi & Moncaster (ABS) note results "may differ by two orders of magnitude" [28].
- Abey & Anand (FT; Indian authors) report embodied energy "from 1 GJ/m2… up to 14 GJ/m2" [29].

### 2.4 Low transparency and poor reproducibility: our own audit

We re-did the arithmetic of every Indian study that printed enough data.

**Table 3. Reproducibility audit.**

| Study | Inventory printed | Factors printed with source | Does the published result reproduce? | Uncertainty reported |
|---|---|---|---|---|
| Chaudhary & Akhtar 2022 [17] | Yes, full bill of quantities and bill of materials (SI) | Yes, a URL for every factor (one mis-cited) | **Yes: 936.1 t vs 936 t** | No (lack of data acknowledged) |
| Pillai et al. 2019 [3] | Yes | Yes | Ranking yes; published values are **42–48 kg/m³ above** our recomputation | No |
| Patil et al. 2023 [7] | Yes | Values yes, sources no | **Yes, exactly** | No |
| Bhagat & Savoikar 2021 [6] | Yes | Yes (Portuguese) | About 97%; transport not disclosed | No |
| Singh et al. 2024 [14] | Partly | Partly | Column sums yes; 97.08 g/kg × 2.8 kg = 271.8, but 290 g/brick is printed | No |
| Ansari et al. 2026 [11] | Yes | Yes | **No**: the printed formula gives 386.88, not the stated 302.64 | No |
| Padavala et al. 2026a [9] | Yes, but activator dose inconsistent | Ranges only | **No**: OPC alone (450 × 0.85 = 382.5) already exceeds the 368 total | No |
| Omran et al. 2026 [8] | Yes | No | Cannot be tested; Tables 7 and 8 disagree (M6: 363.04 vs 373.04) | No |
| Kumbhar et al. 2014 [13] | Activity data | ecoinvent | No kg CO2e reported | No |

The international literature points the same way:
- "many published assessments lack the necessary transparency to fully understand system boundaries" [31] (FT).
- There is "no consensus on how this should be carried out in practice", and a "transparent and simplified methodology" is recommended [32] (ABS).
- AEEE: "lack of standardization leads to inconsistency in LCA methodologies across projects" [22].

### 2.5 Data quality and uncertainty are rarely reported

Apart from Tibrewal et al., who ran a Monte Carlo analysis [15], **no Indian study in Table 1 reports uncertainty**. Chaudhary & Akhtar state they "could not calculate the confidence intervals… due to a lack of uncertainty data" [17].

Marsh et al. (ABS) show that single-point embodied-carbon values "contain a high degree of variability which is typically unacknowledged". Monte Carlo ranges run from 50% to 140% of the deterministic result [30].

Rawal et al. propose an ISO 14044 pedigree-matrix score for an Indian database [24] (FT).

### 2.6 Key method choices go undocumented

**Allocation.**
- Only "14 (25%)" of 59 SCM studies included allocation at all [26].
- Pillai et al. treat fly ash as burden-free "though others have advocated the allocation of some impact" [3].
- ICMD uses economic allocation [16].
- Padavala et al. 2026b mass-allocate GGBS, which makes their GGBS-rich mixes come out worst [10].
- Gettu et al.'s PSC figure moves from 730 kg/t (ecoinvent default) [1] to 550 kg/t (plant data, GGBS ≈70 kg/t) [2].

**Functional unit.** Using kg CO2e per m³ per MPa instead of per m³ shifts the optimum SCM dose [26].

**Grid factor.** Values in Indian papers range from 1.38 to 0.82 kg/kWh, while CEA's latest weighted average is 0.675 t/MWh [41]. It had been 0.774 in FY2013-14.

### 2.7 Manual, time-consuming spreadsheet work

- Indian data collection "is done manually… a lot of effort, error-prone, and difficult for quality assurance" (Ciroth et al., GreenDelta slides) [33] (FT).
- Process analysis is "time-consuming, data-intensive, and prone to truncation errors" [22].
- Transport and site energy are often left out "as their assessment is tedious" [29].
- Practitioners still rely on "email, Excel spreadsheets" [31].
- In practice, Chaudhary & Akhtar needed **145 BoQ items, CPWD rate-analysis coefficients and 78 material factors** to obtain one number [17].

### 2.8 Licences and proprietary data (weaker evidence; there is a counter-argument)

**We found no peer-reviewed Indian source that quantifies licence cost as a barrier.** The better-evidenced problem is *closed data*:
- Practitioners use "data that was available through the LCA software license" [25] (FT).
- "The proprietary nature of these datasets limits their availability in LCA studies" [24].

The counter-argument: ecoinvent states that "free-of-charge licenses are available for universities and schools in low- and low-middle-income countries" [38] (FT). In other words, a cheap licence does not by itself make results transparent or reproducible; that problem remains (see Table 3).

### 2.9 Few Indian EPDs

- AEEE: "many construction materials… did not have EPDs, so values from… Gabi, Ecoinvent, One Click LCA, ICE and IFC datasets were used" [22].
- A GRIHA stakeholder study found "lot of data… however, there is no proper directory". More than 70% of over 50 stakeholders want India-specific numbers [34] (FT).
- EPD India accounted for about 1.7% of the 9,395 EPDs the International EPD System published in 2025 [P24].

### 2.10 Explicit calls for an Indian inventory database or open tools

1. **CSIR-NEERI & CII National LCA Database Roadmap**, for UNEP Life Cycle Initiative/GLAD, 2019 [25] (FT):
   - "no Indian organization has, on its own, taken initiatives to develop local datasets"
   - 395 Indian datasets sit inside ecoinvent/GaBi
   - CSIR-NEERI is designated as focal point
2. **Rawal et al. (CEPT University), 2024** [24] (FT): a framework for an "openly available" embodied-energy database for India, with pedigree scoring.
3. **AEEE & SGRI 2024** [22]: "Support development of India-specific embodied carbon dataset"; voluntary EPD disclosure.
4. **Gaur et al. 2025** (GRIHA) [34]: "A national database of validated GWP numbers, accessible to all."
5. **NITI Aayog, February 2026** [P20]: phased mandatory EPDs, a standard LCA method and a public EPD register.
6. Also: Talpur et al. [23], Chaudhary & Akhtar [17], and Ciroth et al.'s openLCA-compatible Indian database proposal [33].

---

## 3. Policy and current scenario in India, 2023–2026

*These facts come from a dedicated policy sub-review that read primary documents (gazettes, PIB, BEE, BIS, EU) unless marked Sn.*

**Carbon Credit Trading Scheme (CCTS).**
- Notified as **S.O. 2825(E), 28 June 2023** [P1]. It is an intensity-based baseline-and-credit scheme, and one carbon credit certificate equals 1 tCO2e.
- **GHG Emission Intensity Target Rules, notified 8 October 2025** (draft 16 April 2025). They cover **282 units, 186 of them cement**, plus aluminium, pulp & paper and chlor-alkali (sector split is Sn) [P3].
- Baseline is FY2023-24; targets are for FY2025-26 and FY2026-27. Average cuts to 2027 are **2.7% for integrated cement plants and 6.6% for grinding units** [P2].
- Missing a target incurs environmental compensation of twice the average certificate price [P3].
- A January 2026 amendment added refineries, petrochemicals, textiles and secondary aluminium, bringing the total to 490 entities [P4].
- **Iron & steel targets are still a draft.** The revised draft of 26 June 2026 covers 255 units with cuts of 2.1–9.3% [P5].
- BEE issued a trading procedure in October 2026; no trade had been reported by 2 November 2026 [P6].

**Green steel and cement.**
- **Green Steel Taxonomy (Ministry of Steel), 12 December 2024** [P7]:
  - "green" means below 2.2 tCO2e per tonne of finished steel;
  - 5-star below 1.6, 4-star 1.6–2.0, 3-star 2.0–2.2;
  - boundary is Scope 1, Scope 2 and limited Scope 3;
  - NISST certifies.
- 89 units (12.34 Mt) had been certified by 31 March 2026 [P8].
- Indian crude steel averages **2.54 tCO2/t, against a global average of 1.91** [P9].
- There is no government green-cement taxonomy yet. NITI Aayog's cement roadmap targets a fall from 0.63 to 0.09–0.13 tCO2e per tonne of cement by 2070 [P10].
- IS 18189:2023 (LC3) exists (Sn).

**EU CBAM.**
- The transitional phase ran from October 2023 to December 2025; the **definitive phase began 1 January 2026**. It covers cement, iron & steel, aluminium, fertilisers, electricity and hydrogen [P11].
- Regulation (EU) 2025/2083 added a 50 t/yr exemption threshold [P12]. Certificate sales start 1 February 2027 (secondary source).
- GTRI estimates Indian steel exporters may need to cut prices by 15–22% [P13].
- The India–EU FTA, concluded 27 January 2026, gives **no CBAM exemption** [P14].

**Building codes and ratings.**
- **ECSBC 2024, Appendix A6** asks buildings to report embodied carbon in **kgCO2-eq/m², A1–A3, per EN 15978**, covering structure and envelope, with EPDs accepted. The code says plainly: *"The provisions of this section are voluntary"* [P15].
- Eco-Niwas Samhita 2024 has no embodied-carbon requirement [P16].
- A June 2026 **draft** Ministry of Power notification would make a green rating mandatory for buildings of 20,000 m² BUA or more [P17].
- **GRIHA v2019, Criterion 20**: up to 5 points for cutting GWP against the GRIHA LCA benchmark, using a third-party LCA calculator plus EPDs [P18].
- **IGBC Net Zero Carbon** (pilot): design-stage embodied carbon must be at most 700 kgCO2e/m² [P19].
- NITI Aayog (February 2026): buildings produce about 30% of India's GHG emissions, and **48% of building emissions are embodied** [P20].

**Standards and EPDs.**
- BIS adopted **IS/ISO 14040:2006 and IS/ISO 14044:2006** as identical standards, published September 2009 [P21]. IS/ISO 14025:2006 and IS/ISO 14067:2018 are also adopted. **No Indian adoption of EN 15804 or ISO 21930 was found** [P22].
- **EPD India** is the International EPD System's regional partner [P23].
- Indian company EPDs exist, for example UltraTech (OPC, PPC, PSC, PCC; 2022) [P26] and Tata Steel (2025) [P27].

**Implication for the tool.** The policy direction (ECSBC A6, GRIHA Criterion 20, IGBC NZC, NITI's EPD register, CBAM) asks for exactly what Indian research tools do not yet produce: transparent A1–A3 kgCO2e/m² figures under EN 15804/15978, with traceable factors.

---

## 4. Validation case study

### 4.1 Candidate A (recommended): Chaudhary & Akhtar 2022

**Citation.** Chaudhary A., Akhtar A. "Template for Evaluating Cradle-to-Site Environmental Life Cycle Impacts of Buildings in India." *ACS Environ. Au* 3(2):94–104, 2023 (online 29 November 2022). doi:10.1021/acsenvironau.2c00035.
- OA copy: https://pmc.ncbi.nlm.nih.gov/articles/PMC10125340/ (CC BY-NC-ND 4.0).
- Read status: FT+SI. I recomputed the totals from the supplementary XLSX myself.

**Case.** Medical-officer residence and nurses' quarters at the sub-divisional hospital in Jagdishpur (Bhojpur), Bihar; the bill of quantities dates from 2012–13.
- The abstract says "North-East India", but the body says Bihar.
- Quantities: 145 BoQ items were converted to 78 materials using **CPWD Delhi Analysis of Rates (DAR) 2021** coefficients.

**Inventory and factors** (Table S4, key rows; these five materials make up 87.6% of the A1–A3 total):

| Material | Quantity | Unit | GWP factor (kg CO2e/unit) | Factor basis | GWP (kg CO2e) |
|---|---|---|---|---|---|
| Common burnt clay bricks, class 7.5 | 312.71386 | 1000 nos | 1120 | ICMD BTK 0.32 kg/kg × 3.5 kg/brick | 350,239.5 |
| Portland cement (inside concrete and mortar) | 345.63279 | t | 910 | ICMD 0.91 kg/kg | 314,525.8 |
| Twisted steel / deformed bars | 346.4832 | quintal | 260 | 2.6 kg/kg (equals ICMD rebar). **Cited URL is a PVC-pipe EPD** | 90,085.6 |
| Aluminium T/L sections | 701.7192 | kg | 33 | ICMD | 23,156.7 |
| Coarse sand (zone III) | 690.02965 | m³ | 14.679 | ICMD 0.009 kg/kg (sand) | 10,128.9 |
| Diesel (transport and site plant) | — | L | 3.265 | ecoinvent | — |

Derived factors: mortar CM 1:6 = 243.20653 kg CO2e/m³; CM 1:4 = 361.50653 kg CO2e/m³.

Transport inputs (A4): 10 t trucks at 3.5 km/L, with a distance per material; for example, bricks 1095 t over 8 km and tiles 29 t over 270 km.

**Published results** (Table 3 of the paper), in t CO2e:

| Stage | Published |
|---|---|
| Material production (A1–A3) | 899 (96%) |
| Transport (A4) | 24.6 |
| On-site construction (A5) | 12 |
| **Total** | **936** |

Energy use is 9.8 million MJ.

**Our recomputation from the workbook:**
- Sum of Table S4: **899,412.4 kg**
- Table S5 (transport): 24,631.2 kg
- Table S6 (on-site): 12,075.0 kg
- **Total 936,118.6 kg**, which matches the published 936 t.

**Wall-level sub-tests.** These are our own calculations from the paper's CPWD coefficients and factors:
- **230 mm brick wall in CM 1:6:** 494 bricks/m³ × 1.12 + 0.25 m³ × 243.207 = 614.08 kg CO2e/m³, which is **141.24 kg CO2e/m²**.
- **115 mm wall in CM 1:4:** 56.5 bricks/m² × 1.12 + 0.028 m³ × 361.507 = **73.40 kg CO2e/m²**, or 76.83 with the 1.32 kg/m² of 6 mm bars.

**Caveats.**
- **Mortar double count.** Mortar is counted again on the "Extra for brickwork in superstructure" items, adding about 39.4 t (4.2%). We infer this is a double count.
- The rebar source is mis-cited.
- Timber is given a factor of 0.
- No floor area is reported, so kg/m² BUA cannot be computed.
- **Reuse.** The CC BY-NC-ND licence allows citing the numbers and using them as test cases. Do not redistribute modified copies of the supplementary file.

### 4.2 Candidate B: Pillai et al. 2019 (concrete mixes with Indian plant data)

**Citation.** Pillai R.G., Gettu R., Santhanam M., Rengaraju S., Dhandapani Y., Rathnarajan S., Basavaraj A.S. "Service life and life cycle assessment of reinforced concrete systems with limestone calcined clay cement (LC3)." *Cem. Concr. Res.* 118:111–119, 2019. doi:10.1016/j.cemconres.2018.11.019.
- Journal version is paywalled. Full text was read from the author-hosted copy (IIT Madras faculty page).

**Inventory** (Table 2, kg/m³). The PFA mixes use 70% OPC + 30% fly ash. The LC3 binder is 50% clinker, 31% calcined clay, 15% limestone and 4% gypsum.

| | OPC-1 | PFA-1 | LC3-1S | LC3-1P | OPC-2 | PFA-2 | LC3-2 |
|---|---|---|---|---|---|---|---|
| Grade | M35 | M35 | M35 | M35 | M50 | M50 | M50 |
| Binder | 310 | 360 | 310 | 360 | 360 | 380 | 340 |
| Water | 155 | 162 | 155 | 162 | 144 | 133 | 136 |
| Fine aggregate | 695 | 721 | 708 | 687 | 703 | 699 | 704 |
| Coarse aggregate, 10 mm | 496 | 463 | 491 | 476 | 477 | 475 | 488 |
| Coarse aggregate, 20 mm | 744 | 694 | 736 | 715 | 716 | 713 | 732 |
| f28 (MPa) | 45.4 | 37.6 | 38.8 | 40.7 | 60 | 54.6 | 56.7 |
| **Published, kg CO2e/m³** | **335** | **290** | **255** | **280** | **380** | **300** | **270** |
| Our recomputation | 291.9 | 242.4 | 209.6 | 237.8 | 334.0 | 254.1 | 226.9 |
| Gap | +43.1 | +47.6 | +45.4 | +42.2 | +46.0 | +45.9 | +43.1 |

**Factors** (Table 3, kg CO2e/kg unless stated):

| Item | Factor |
|---|---|
| OPC cement | 0.82 |
| LC3 cement | 0.554 |
| Fine and coarse aggregate | 0.00419 |
| Water | 0.000658 |
| Truck transport | 0.0924 kg CO2e/t-km |
| Electricity | 1.38 kg CO2e/kWh |
| Clinker | 0.85 |
| Calcined clay | 0.127 |
| Fly ash | 0 |

One-way transport distances: cement 300 km, sand 192 km, coarse aggregate 75 km.

**Assessment.** The factors are Indian and printed, and the **ranking reproduces**. However, a near-constant gap of 42–48 kg/m³ remains unexplained. Possible causes, which the paper does not report, are RMC-plant electricity, fly-ash haulage and admixture. Reproducibility is medium.

### 4.3 Candidate C: Patil et al. 2023 (arithmetic unit test for geopolymer concrete)

**Citation.** Patil S., Joshi D.A., Menon R., Wadhwa L.K. "Environmental Impact Assessment of fly ash and GGBS based Geopolymer Concrete in Road Construction." *E3S Web Conf.* 405:03021, 2023. doi:10.1051/e3sconf/202340503021 (CC BY). Read status: FT.

**Inventory, factors and results** (Tables 1 and 2):

| Material | Factor (kg CO2e/kg) | GPC (kg/m³) | OPC (kg/m³) | GPC (kg CO2e/m³) | OPC (kg CO2e/m³) |
|---|---|---|---|---|---|
| NaOH | 0.603 | 64 | – | 38.592 | 0 |
| Na2SiO3 | 1.26 | 160 | – | 201.6 | 0 |
| Fly ash | 0.027 | 448 | – | 12.096 | 0 |
| GGBS | 0.035 | 112 | – | 3.92 | 0 |
| Fine aggregate | 0.0139 | 564 | 711 | 7.84 | 9.883 |
| Coarse aggregate | 0.0408 | 1048 | 1283 | 42.759 | 52.347 |
| Cement | 0.82 | – | 380 | 0 | 311.6 |
| **Materials total** | | | | **306.807** | **373.83** |

**Operations** (Table 3): batching 0.004, transport 0.01, placing 0.009 kg CO2e/m³.

**Published totals: 306.830 and 373.853 kg CO2e/m³.** Our check reproduces both exactly.

**Weaknesses.**
- No factor is individually sourced.
- No grade, water or admixture is stated.
- The operations terms are implausibly small (0.023 kg/m³ in total).

**Use:** as a pure arithmetic test case, not as a source of reference data.

**Rejected candidates.**
- Ansari et al. 2026 [11]: its own formula does not reproduce its result.
- Bhagat & Savoikar 2021 [6]: the factors are Portuguese.
- Singh et al. 2024 [14]: unit and per-brick conversion errors.
- Padavala et al. 2026a [9]: the result is implausible against its own factors.
- Omran et al. 2026 [8]: no factors are printed.

### 4.4 Choice: Chaudhary & Akhtar 2022

It is the **only open-access Indian study we found** that meets all of the following:
1. It publishes the *complete* inventory: BoQ, then BoM, then quantities.
2. It gives a factor *with a source* for every material.
3. It reports results by EN 15804-style stage (A1–A3, A4, A5).
4. **It reproduces to within 0.01%.**

Its factors come mostly from the ICMD, the Indian dataset the tool is most likely to ship. Any mismatch would therefore expose calculator logic rather than data differences.

It also exercises the exact workflow Indian scholars now do in Excel:
- unit conversions across 1000 nos, quintals, m³ and litres;
- CPWD rate-analysis coefficients;
- transport by truck trip.

On top of that, it yields wall-level sub-tests.

**Recommended regression suite:**
- Chaudhary (936.1 t total, plus the two wall cases);
- Pillai (7 Indian concrete mixes; the ranking must match, and the gap must be documented);
- Patil (2 mixes; must match exactly).

---

## 5. What the literature implies for the tool's features

| Pain point (section) | Feature it implies |
|---|---|
| No Indian data; stale ICMD (§2.1–2.2) | A factor library in which each factor carries its source, year, geography, boundary, allocation method and a pedigree score. Several selectable factor sets (ICMD 2017, ICE, Indian literature, EPDs). CEA grid factor by fiscal year (0.675 t/MWh for FY2025-26). Brick factor by kiln type |
| Inconsistent results (§2.3) | A "factor-set comparison" view showing min, mean and max for the same inventory. A result reported without its spread is incomplete |
| Not reproducible (§2.4) | Every result exports its full inventory × factor table, so another researcher can audit it |
| Uncertainty not reported (§2.5) | Ranges and Monte Carlo built from the factor spreads |
| Undocumented allocation and FU choices (§2.6) | Explicit toggles: fly ash/GGBS allocation (zero / mass / economic); FU per m³, per m³·MPa, per m² wall, per m² BUA |
| Manual Excel work (§2.7) | Templates for mix design per m³ (IS 10262), CPWD DAR wall items per m² or m³, and BoQ import |
| ISO 14044 reporting and Indian codes (§2.4, §3) | An auto-generated report following ISO 14044 reporting items, with EN 15804 modules. Output aligned to ECSBC A6 (A1–A3 kgCO2e/m²), GRIHA Criterion 20 and the IGBC NZC 700 kg/m² benchmark |
| Few EPDs (§2.9) | A slot for user-entered EPD values with a declared-unit check |

---

## 6. Limitations of this review

- Several core Indian papers are paywalled and unread (see §0).
- Semantic Scholar was rate-limited throughout, and OpenAlex intermittently.
- ScienceDirect blocked automated access, so Elsevier subscription papers are under-represented.
- No Shodhganga theses were located.
- Some policy details are snippet-level only: gazette serial numbers G.S.R. 739(E), 25(E) and 517(E); plant-level cement targets; the EU's share of Indian steel exports; the EPD India launch date; and the IGBC Green New Buildings v4 embodied-carbon credit. **Verify these before quoting them.**
- The wall-level figures, the factor spreads and the reproducibility checks are our own calculations from the published data.

---

## 7. References

All DOIs were checked against Crossref or OpenAlex by the reading agents. FT = full text read, ABS = abstract only, PW = paywalled, Sn = snippet only.

**Indian studies**
1. Gettu R., Patel A., Rathi V., Prakasan S., Basavaraj A.S., Maity S. (2016). Sustainability Assessment of Cements and Concretes in the Indian Context: Influence of Supplementary Cementitious Materials. *Proc. SCMT4*, pp. 1061–1068. doi:10.18552/2016/SCMT4S299. http://www.claisse.info/2016%20papers/S299.pdf — FT
2. Gettu R., Pillai R.G., Santhanam M., Basavaraj A.S., Rathnarajan S., Dhanya B.S. (2018). Sustainability-based decision support framework for choosing concrete mixture proportions. *Materials and Structures* 51:165. doi:10.1617/s11527-018-1291-z — FT
3. Pillai R.G. et al. (2019). Service life and life cycle assessment of reinforced concrete systems with limestone calcined clay cement (LC3). *Cem. Concr. Res.* 118:111–119. doi:10.1016/j.cemconres.2018.11.019 — FT (author copy)
4. Bajpai R., Choudhary K., Srivastava A., Sangwan K.S., Singh M. (2020). Environmental impact assessment of fly ash and silica fume based geopolymer concrete. *J. Clean. Prod.* 254:120147. doi:10.1016/j.jclepro.2020.120147 — ABS
5. Meshram R.B., Kumar S. (2021). Comparative life cycle assessment (LCA) of geopolymer cement manufacturing with Portland cement in Indian context. *Int. J. Environ. Sci. Technol.* doi:10.1007/s13762-021-03336-9 — ABS
6. Bhagat G.V., Savoikar P.P. (2021). Auditing carbon reduction potential of green concrete using life cycle assessment methodology. *IOP Conf. Ser.: Earth Environ. Sci.* 850:012002. doi:10.1088/1755-1315/850/1/012002 — FT
7. Patil S., Joshi D.A., Menon R., Wadhwa L.K. (2023). Environmental Impact Assessment of fly ash and GGBS based Geopolymer Concrete in Road Construction. *E3S Web Conf.* 405:03021. doi:10.1051/e3sconf/202340503021 — FT
8. Omran S., Sisupalan S., Alyaseen A., Khan A.H. (2026). Utilization of electronic plastic waste as fine aggregate with and without silica fume in concrete: experimentation and life cycle assessment. *Sci. Rep.* 16:5723. doi:10.1038/s41598-026-35491-9 — FT
9. Padavala S.S.A.B., Avudaiappan S., Prathipati S.R.R.T., Paluri Y., Sainath V., Kumara A.M. (2026). Integrated experimental, machine learning, and life-cycle assessment of fly ash–silica fume based self-compacting geopolymer concrete. *Sci. Rep.* 16:12845. doi:10.1038/s41598-026-43052-3 — FT
10. Padavala S.S.A.B., Kothuri D., Gashe A.M. (2026). Explainable machine learning based optimization of strength, durability, and carbon efficiency of fly ash–GGBS geopolymer concrete. *Sci. Rep.* 16:18543. doi:10.1038/s41598-026-48502-6 — FT
11. Ansari S.S., Ansari M.A., Ibrahim S.M. (2026). Explainable Predictive Modelling of Sustainable Slag–Fly Ash Based Geopolymer Concrete with Life Cycle and Carbon-Neutrality Assessment. *Bull. Comput. Intell.* 2(1):54–82. doi:10.53941/bci.2026.100004 — FT
12. Kar S., Mandal A.K., Sengupta H. (2026). Sustainability Assessment and Life Cycle Analysis of High-Volume Fly Ash and Geopolymer Concrete. Research Square preprint, not peer-reviewed. doi:10.21203/rs.3.rs-8440633/v1 — FT
13. Kumbhar S., Kulkarni N., Rao A.B., Rao B. (2014). Environmental Life Cycle Assessment of Traditional Bricks in Western Maharashtra, India. *Energy Procedia* 54:260–269. doi:10.1016/j.egypro.2014.07.269 — FT
14. Singh S., Maiti S., Bisht R.S., Panigrahi S.K., Yadav S. (2024). Large CO2 reduction and enhanced thermal performance of agro-forestry, construction and demolition waste based fly ash bricks for sustainable construction. *Sci. Rep.* 14:8368. doi:10.1038/s41598-024-59012-8 — FT
15. Tibrewal K., Venkataraman C., … Maithel S., et al. (2023). Reconciliation of energy use disparities in brick production in India. *Nature Sustainability* 6:1248–1257. doi:10.1038/s41893-023-01165-x — FT+SI
16. thinkstep for IFC (2017). *India Construction Materials Database of Embodied Energy and Global Warming Potential — Methodology Report* v1.0, 30 November 2017 (marked "DRAFT"). https://edgebuildings.com/ifc-india-construction-materials-database-methodology-report/ — FT
17. Chaudhary A., Akhtar A. (2023). Template for Evaluating Cradle-to-Site Environmental Life Cycle Impacts of Buildings in India. *ACS Environ. Au* 3(2):94–104. doi:10.1021/acsenvironau.2c00035 — FT+SI
18. Jain G., Manchanda S., Singh M. (2024). Embodied Energy and Thermal Performance of Alternate Walling Materials in Affordable Housing in the Composite Climate of Delhi. *Curr. World Environ.* 19(1):146–155. doi:10.12944/CWE.19.1.13 — FT
19. Ramesh T., Prakash R., Shukla K.K. (2013). Life Cycle Energy Analysis of a Multifamily Residential House: A Case Study in Indian Context. *Open J. Energy Effic.* 2:34–41. doi:10.4236/ojee.2013.21006 — FT
20. Akshatha K.G., Palaniappan S., Pradeep Kumara Rao M.K. (2025). Embodied carbon variability in Indian high-rise residential buildings: A case-based assessment. *Proc. 13th World Construction Symposium*, pp. 623–634. doi:10.31705/WCS.2025.47 — FT
21. Zakai Z., Das D., Rawal R., Patel B. (2025). Embodied carbon assessment of RCC residential buildings: Impact of varying seismic zones and floor area ratio in India. *J. Phys.: Conf. Ser.* 3140:132022. doi:10.1088/1742-6596/3140/13/132022 — FT
22. AEEE & Saint-Gobain Research India (2024). *Life Cycle Assessment of Carbon Emissions: Progress and Barriers in Indian Building Sector* (Di-Carb project). https://aeee.in/wp-content/uploads/2024/08/life-cycle-assessment-of-carbon-emissions.pdf — FT (relevant sections)

**Reviews, roadmaps and methods**

23. Talpur B.D., Liuzzi S., Rubino C., Cannavale A., Martellotta F. (2023). Life Cycle Assessment and Circular Building Design in South Asian Countries: A Review of the Current State of the Art and Research Potentials. *Buildings* 13:3045. doi:10.3390/buildings13123045 — FT
24. Rawal R., Shukla Y., Shivani S., Nathani S., Kumar S., Asrani S. (2024). Developing an Embodied Energy Database for Construction Materials in India. *Energise 2023 Proc.*, pp. 117–126. doi:10.62576/WKVZ5438 — FT
25. Siluvai Antony P., Jayaram N. (2019). *Development of National LCA Database Roadmaps… D4.2: Final roadmap report… for India.* CSIR-NEERI & CII for UNEP Life Cycle Initiative. doi:10.5281/zenodo.18509407 — FT
26. Hafez H., Kurda R., Cheung W.M., Nagaratnam B. (2019). A Systematic Review of the Discrepancies in Life Cycle Assessments of Green Concrete. *Appl. Sci.* 9:4803. doi:10.3390/app9224803 — FT
27. Frischknecht R. et al. (2019). Comparison of the environmental assessment of an identical office building with national methods. *IOP Conf. Ser.: Earth Environ. Sci.* 323:012037. doi:10.1088/1755-1315/323/1/012037 — FT
28. Pomponi F., Moncaster A. (2018). Scrutinising embodied carbon in buildings: The next performance gap made manifest. *Renew. Sustain. Energy Rev.* 81:2431–2442. doi:10.1016/j.rser.2017.06.049 — ABS
29. Abey S.T., Anand K.B. (2019). Embodied Energy Comparison of Prefabricated and Conventional Building Construction. *J. Inst. Eng. India Ser. A* 100(4):777–790. doi:10.1007/s40030-019-00394-8 — FT
30. Marsh E., Orr J., Ibell T. (2021). Quantification of uncertainty in product stage embodied carbon calculations for buildings. *Energy Build.* 251:111340. doi:10.1016/j.enbuild.2021.111340 — ABS
31. Jayathilaka G., Thurairajah N., Rathnasinghe A. (2024). Digital Data Management Practices for Effective Embodied Carbon Estimation… *Sustainability* 16:236. doi:10.3390/su16010236 — FT
32. De Wolf C., Pomponi F., Moncaster A. (2017). Measuring embodied carbon dioxide equivalent of buildings: A review and critique of current industry practice. *Energy Build.* 140:68–80. doi:10.1016/j.enbuild.2017.01.075 — ABS
33. Ciroth A., Srocka M., Burhan S. (2018). *A new LCI database for India* (slides), ILCM Mumbai. greendelta.com — FT (grey literature)
34. Gaur, Bhalla, Sethi (2025). Life Cycle Assessment of Sustainable Materials. *SACE 2025*, Atlantis Highlights in Sustainable Development 6, pp. 316–327. doi:10.2991/978-94-6463-964-3_15 — FT
35. Karadumpa C.S., Pancharathi R.K. (2024). Study on energy use and carbon emission from manufacturing of OPC and blended cements in India. *Environ. Sci. Pollut. Res.* 31:5364–5383. doi:10.1007/s11356-023-31593-3 — ABS
36. Anderson J., Moncaster A. (2020). Embodied carbon of concrete in buildings, Part 1: analysis of published EPD. *Buildings & Cities* 1:198–217. doi:10.5334/bc.59 — FT
37. Mba Wright M. et al. (2024). Life Cycle Inventory Availability: Status and Prospects for Leveraging New Technologies. *ACS Sustain. Chem. Eng.* 12(34):12708–12718. doi:10.1021/acssuschemeng.4c02519 — FT
38. ecoinvent. Licences support page (dated 9 February 2026). https://support.ecoinvent.org/licenses — FT
39. Safaei A. (2016). *Life Cycle Inventory for India* (ecoinvent slides, GreenCo summit). forum.ecoinvent.org — FT (grey literature)
40. Asdrubali F. et al. (2023). Sustainability of Building Materials: Embodied Energy and Embodied Carbon of Masonry. *Energies* 16:1846. doi:10.3390/en16041846 — FT
41. Central Electricity Authority (2026). *CO2 Baseline Database for the Indian Power Sector, User Guide v22.0* (August 2026). Table S: FY2025-26 weighted average 0.675 tCO2/MWh — FT (local copy)

**Policy**

- P1. CCTS 2023, S.O. 2825(E), 28 June 2023 (BEE gazette copy via Wayback) — FT
- P2. ICAP, India CCTS factsheet. https://icapcarbonaction.com/en/ets-pdf-download/125 — FT
- P3. GHG Emission Intensity Target Rules 2025 coverage: globalcement.com news 19969; corporateprofessionals.com; legal500.com — secondary, FT
- P4. PIB PRID 2217239 (January 2026 amendment) — FT
- P5. DownToEarth and SteelOrbis on the iron & steel draft (June 2026) — secondary, FT
- P6. Energetica India, BEE trading schedule (October 2026) — secondary, FT
- P7. PIB PRID 2083839 (Green Steel Taxonomy, 12 December 2024) — FT
- P8. PIB PRID 2258028 (green steel certifications) — FT
- P9. Ministry of Steel, *Greening the Steel Sector in India: Roadmap and Action Plan* (2024). steel.gov.in — FT (executive summary)
- P10. PIB PRID 2217063 (NITI Aayog cement roadmap, January 2026) — FT
- P11. European Commission, CBAM page. taxation-customs.ec.europa.eu — FT
- P12. European Commission, "Officially published simplifications to CBAM" (20 October 2025) — FT
- P13. GTRI via Lokmat Times (December 2025) — secondary, FT
- P14. Department of Commerce, India–EU FTA concluded (27 January 2026) — FT
- P15. BEE, *ECSBC 2024* (Wayback copy) — FT (relevant sections)
- P16. BEE, *Eco-Niwas Samhita 2024* (Wayback copy) — FT
- P17. Ministry of Power, draft notification (June 2026). powermin.gov.in — FT
- P18. GRIHA v2019 Manual, Vol. 1. grihaindia.org — FT
- P19. IGBC Net Zero Carbon rating. igbc.in — FT
- P20. NITI Aayog (February 2026), *Scenarios Towards Viksit Bharat and Net Zero — Sectoral Insights: Buildings* — FT (relevant sections)
- P21. BIS, IS/ISO 14040:2006 and IS/ISO 14044:2006 (national forewords, mirror copies) — FT
- P22. BIS programme of work, committees EED 1 and EED 7. services.bis.gov.in — FT
- P23. International EPD System, regional partners page. environdec.com — FT
- P24. International EPD System, "EPD development 2025". environdec.com — FT
- P25. CII-GBC GreenPro. greenbusinesscentre.com — FT
- P26. Global Cement news 14746 (UltraTech EPDs) — secondary, FT
- P27. SteelOrbis (Tata Steel EPD, August 2025) — secondary, FT
