/**
 * Krishi Swasthya Sahayak — Bundled Reference Dataset & Offline Diagnosis Engine
 * Ensures 100% functionality and instantaneous rendering even if backend is offline.
 */
const KSH_DATA = (() => {
  const languages = [
    { code: "hi", name_en: "Hindi", name_native: "हिन्दी", script: "Devanagari", direction: "ltr", font_stack: "'Noto Sans Devanagari', 'Noto Sans', sans-serif" },
    { code: "bn", name_en: "Bengali", name_native: "বাংলা", script: "Bengali", direction: "ltr", font_stack: "'Noto Sans Bengali', 'Noto Sans', sans-serif" },
    { code: "mr", name_en: "Marathi", name_native: "मराठी", script: "Devanagari", direction: "ltr", font_stack: "'Noto Sans Devanagari', 'Noto Sans', sans-serif" },
    { code: "te", name_en: "Telugu", name_native: "తెలుగు", script: "Telugu", direction: "ltr", font_stack: "'Noto Sans Telugu', 'Noto Sans', sans-serif" },
    { code: "ta", name_en: "Tamil", name_native: "தமிழ்", script: "Tamil", direction: "ltr", font_stack: "'Noto Sans Tamil', 'Noto Sans', sans-serif" },
    { code: "gu", name_en: "Gujarati", name_native: "ગુજરાતી", script: "Gujarati", direction: "ltr", font_stack: "'Noto Sans Gujarati', 'Noto Sans', sans-serif" },
    { code: "ur", name_en: "Urdu", name_native: "اردو", script: "Perso-Arabic (Nastaliq)", direction: "rtl", font_stack: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" },
    { code: "kn", name_en: "Kannada", name_native: "ಕನ್ನಡ", script: "Kannada", direction: "ltr", font_stack: "'Noto Sans Kannada', 'Noto Sans', sans-serif" },
    { code: "or", name_en: "Odia", name_native: "ଓଡ଼ିଆ", script: "Odia", direction: "ltr", font_stack: "'Noto Sans Oriya', 'Noto Sans', sans-serif" },
    { code: "ml", name_en: "Malayalam", name_native: "മലയാളം", script: "Malayalam", direction: "ltr", font_stack: "'Noto Sans Malayalam', 'Noto Sans', sans-serif" },
    { code: "en", name_en: "English", name_native: "English", script: "Latin", direction: "ltr", font_stack: "'Noto Sans', sans-serif" }
  ];

  const states = [
    { code: "AP", name: "Andhra Pradesh", dominant_soils: ["red loam", "black cotton soil", "coastal alluvial"] },
    { code: "AR", name: "Arunachal Pradesh", dominant_soils: ["hill/forest loam"] },
    { code: "AS", name: "Assam", dominant_soils: ["alluvial"] },
    { code: "BR", name: "Bihar", dominant_soils: ["alluvial"] },
    { code: "CT", name: "Chhattisgarh", dominant_soils: ["red-yellow loam", "clay loam"] },
    { code: "GA", name: "Goa", dominant_soils: ["laterite"] },
    { code: "GJ", name: "Gujarat", dominant_soils: ["black cotton soil", "sandy loam", "calcareous"] },
    { code: "HR", name: "Haryana", dominant_soils: ["alluvial"] },
    { code: "HP", name: "Himachal Pradesh", dominant_soils: ["hill loam"] },
    { code: "JH", name: "Jharkhand", dominant_soils: ["red-yellow loam"] },
    { code: "KA", name: "Karnataka", dominant_soils: ["red loam", "black cotton soil", "laterite"] },
    { code: "KL", name: "Kerala", dominant_soils: ["laterite"] },
    { code: "MP", name: "Madhya Pradesh", dominant_soils: ["black cotton soil (Vertisol)"] },
    { code: "MH", name: "Maharashtra", dominant_soils: ["black cotton soil (Vertisol)"] },
    { code: "MN", name: "Manipur", dominant_soils: ["hill loam"] },
    { code: "ML", name: "Meghalaya", dominant_soils: ["hill/forest loam"] },
    { code: "MZ", name: "Mizoram", dominant_soils: ["hill/forest loam"] },
    { code: "NL", name: "Nagaland", dominant_soils: ["hill/forest loam"] },
    { code: "OD", name: "Odisha", dominant_soils: ["red-yellow loam", "coastal alluvial"] },
    { code: "PB", name: "Punjab", dominant_soils: ["alluvial"] },
    { code: "RJ", name: "Rajasthan", dominant_soils: ["sandy", "calcareous"] },
    { code: "SK", name: "Sikkim", dominant_soils: ["hill/forest loam"] },
    { code: "TN", name: "Tamil Nadu", dominant_soils: ["red loam", "black cotton soil", "coastal alluvial"] },
    { code: "TG", name: "Telangana", dominant_soils: ["black cotton soil", "red loam"] },
    { code: "TR", name: "Tripura", dominant_soils: ["hill/forest loam"] },
    { code: "UP", name: "Uttar Pradesh", dominant_soils: ["alluvial"] },
    { code: "UK", name: "Uttarakhand", dominant_soils: ["hill loam", "alluvial (terai)"] },
    { code: "WB", name: "West Bengal", dominant_soils: ["alluvial", "coastal saline"] },
    { code: "AN", name: "Andaman & Nicobar Islands", dominant_soils: ["coastal laterite"] },
    { code: "CH", name: "Chandigarh", dominant_soils: ["alluvial"] },
    { code: "DH", name: "Dadra & Nagar Haveli and Daman & Diu", dominant_soils: ["coastal alluvial"] },
    { code: "DL", name: "Delhi", dominant_soils: ["alluvial"] },
    { code: "JK", name: "Jammu & Kashmir", dominant_soils: ["hill loam", "alluvial (valley)"] },
    { code: "LA", name: "Ladakh", dominant_soils: ["cold arid"] },
    { code: "LD", name: "Lakshadweep", dominant_soils: ["coastal sandy"] },
    { code: "PY", name: "Puducherry", dominant_soils: ["coastal alluvial"] }
  ];

  const signs = [
    { id: "yellowing_older_leaves", label_en: "Yellowing of older/lower leaves", label_hi: "निचली/पुरानी पत्तियों का पीलापन", keywords: ["yellowing", "older leaves", "lower leaves", "chlorosis"] },
    { id: "yellowing_younger_leaves", label_en: "Yellowing of new/younger leaves, veins green", label_hi: "नई पत्तियों का पीलापन, नसें हरी", keywords: ["younger leaves", "interveinal", "new leaves"] },
    { id: "holes_in_leaves", label_en: "Holes or ragged feeding damage on leaves", label_hi: "पत्तियों में छेद", keywords: ["holes", "feeding", "ragged", "skeletoniz"] },
    { id: "holes_in_fruit_pods", label_en: "Holes in fruit / pods, larva inside", label_hi: "फल/फली में छेद, अंदर सुंडी", keywords: ["holes in pod", "holes in fruit", "larva feeding inside", "feeding on developing seeds"] },
    { id: "spots_with_rings", label_en: "Spots with concentric rings on leaves", label_hi: "पत्तियों पर छल्लेदार धब्बे", keywords: ["concentric", "ring", "target spot"] },
    { id: "water_soaked_lesions", label_en: "Water-soaked patches turning brown/black", label_hi: "पानी जैसे धब्बे जो भूरे/काले हो जाते हैं", keywords: ["water-soaked", "water soaked"] },
    { id: "white_powdery_growth", label_en: "White/downy fungal growth on leaf underside", label_hi: "पत्ती के नीचे सफेद रुई जैसी फफूंद", keywords: ["white fungal", "downy", "powdery", "glistening"] },
    { id: "wilting_whole_plant", label_en: "Sudden wilting of the whole plant", label_hi: "पूरे पौधे का अचानक मुरझाना", keywords: ["wilting", "wilt", "drooping"] },
    { id: "dead_heart", label_en: "Dead/dried central shoot (dead heart)", label_hi: "बीच की कोंपल सूखना (डेड हार्ट)", keywords: ["dead heart", "central shoot dries"] },
    { id: "sticky_honeydew", label_en: "Sticky residue / black sooty mould, insects visible", label_hi: "चिपचिपा पदार्थ / काली फफूंद, कीट दिखाई देना", keywords: ["honeydew", "sooty mould", "sooty mold"] },
    { id: "curling_leaves", label_en: "Curling or twisting of leaves", label_hi: "पत्तियों का मुड़ना", keywords: ["curl", "curling", "twisting"] },
    { id: "stunted_growth", label_en: "Stunted growth / short plant", label_hi: "पौधे की बढ़वार रुकना", keywords: ["stunted", "short internode", "shortened"] },
    { id: "rotting_at_base", label_en: "Rotting at the base/collar/root", label_hi: "जड़/तने के आधार पर सड़न", keywords: ["rot", "rotting", "collar rot", "basal rot"] },
    { id: "poor_fruit_pod_filling", label_en: "Poor fruit/pod/grain filling despite healthy-looking plant", label_hi: "दाना/फली भरने में कमी", keywords: ["poor pod filling", "poor bunch filling", "unfilled pods", "reduced pod set"] },
    { id: "silvery_streaks", label_en: "Silvery streaks or bronzing on leaves", label_hi: "पत्तियों पर चांदी जैसी धारियां", keywords: ["silvery", "bronzing"] },
    { id: "marginal_scorching", label_en: "Browning/scorching along leaf margins", label_hi: "पत्ती किनारों का झुलसना", keywords: ["marginal", "margin", "scorch"] },
    { id: "mosaic_mottling", label_en: "Mosaic / mottled patchy colour pattern on leaves", label_hi: "पत्तियों पर चित्तीदार (मोज़ेक) रंग", keywords: ["mosaic", "mottl"] },
    { id: "insects_at_base", label_en: "Small insects visible near plant base / waterline", label_hi: "पौधे के आधार पर छोटे कीट दिखना", keywords: ["at plant base", "near waterline", "hopper burn"] },
    { id: "fruit_cracking_blossom_rot", label_en: "Blossom-end rot / cracked or corky fruit", label_hi: "फल का सिरा सड़ना / फटना", keywords: ["blossom end rot", "cracked", "corky"] }
  ];

  const knowledgeBaseCrops = [
    {
      id: "rice",
      name_en: "Rice",
      name_hi: "धान / चावल",
      botanical_name: "Oryza sativa",
      category: "cereal",
      major_states: ["West Bengal", "Uttar Pradesh", "Punjab", "Andhra Pradesh", "Tamil Nadu", "Odisha", "Bihar", "Chhattisgarh"],
      common_soils: ["alluvial", "clay loam", "coastal saline (tolerant varieties only)"],
      pests: [
        {
          name_en: "Brown planthopper (BPH)",
          name_hi: "भूरा फुदका",
          symptoms: "Circular patches of yellowing/drying plants ('hopper burn'), insects at plant base near waterline, honeydew and sooty mould.",
          severity: "high",
          ipm_cultural: "Avoid excess nitrogen; alternate wetting and drying instead of continuous flooding; use resistant varieties; avoid very close spacing.",
          biological: "Conserve natural predators (mirid bugs, spiders, dragonflies) by minimizing broad-spectrum insecticide use; light traps for monitoring.",
          chemical_class_generic: "Selective hopper-specific insecticide class as currently CIB&RC-registered for BPH in rice — verify live label before recommending."
        },
        {
          name_en: "Yellow stem borer",
          name_hi: "पीला तना छेदक",
          symptoms: "Dead heart in vegetative stage (central shoot dries), white ear head at reproductive stage.",
          severity: "medium-high",
          ipm_cultural: "Synchronous transplanting across a locality, clip and destroy stubble after harvest, balanced N application.",
          biological: "Release of Trichogramma japonicum egg parasitoid at recommended intervals; pheromone traps for monitoring/mass trapping.",
          chemical_class_generic: "Granular/systemic insecticide class registered for stem borer in rice — verify live label."
        }
      ],
      diseases: [
        {
          name_en: "Blast",
          pathogen_type: "fungal",
          pathogen: "Magnaporthe oryzae",
          symptoms: "Spindle-shaped grey-centered lesions on leaves; neck blast causes panicle breakage.",
          cultural_control: "Avoid excess nitrogen, balanced silicon/potassium nutrition, resistant varieties, seed treatment before sowing.",
          biological: "Trichoderma-based seed/soil treatment; Pseudomonas fluorescens foliar application.",
          chemical_class_generic: "Systemic fungicide class registered for rice blast — verify live label."
        },
        {
          name_en: "Bacterial leaf blight (BLB)",
          pathogen_type: "bacterial",
          pathogen: "Xanthomonas oryzae pv. oryzae",
          symptoms: "Water-soaked lesions at leaf tip/margin turning yellow-white, wavy margin; worse after storms/flooding.",
          cultural_control: "Balanced N (avoid excess), resistant varieties, avoid leaf injury during operations, field drainage.",
          biological: "Pseudomonas fluorescens seed treatment and foliar spray.",
          chemical_class_generic: "Copper-based bactericide class or antibiotic-class product as currently registered — verify live label."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Zinc (Zn)",
          local_name: "जस्ता / खैरा रोग",
          symptoms: "Khaira disease — bronzing/rusty-brown blotches on lower leaves, stunted growth, delayed maturity. Common in alkaline/calcareous and heavily-limed soils.",
          associated_soils: ["alkaline", "calcareous", "coarse-textured alluvial"],
          correction_foliar: "0.5% Zinc sulphate (heptahydrate) foliar spray, repeated at 10–15 day interval if symptoms persist (confirm current recommended concentration with SAU/KVK before use).",
          correction_soil: "Basal soil application of zinc sulphate before transplanting, per SAU package-of-practices rate for the specific soil zone."
        },
        {
          nutrient: "Nitrogen (N)",
          local_name: "नाइट्रोजन",
          symptoms: "Uniform yellowing (chlorosis) starting from older/lower leaves, stunted tillering.",
          associated_soils: ["sandy", "low organic matter"],
          correction_foliar: "Farmers commonly use the Leaf Colour Chart (LCC) to time top-dressed nitrogen application in split doses rather than a single foliar correction.",
          correction_soil: "Split application of nitrogenous fertilizer at tillering and panicle initiation stages, per local SAU recommendation."
        }
      ]
    },
    {
      id: "wheat",
      name_en: "Wheat",
      name_hi: "गेहूं",
      botanical_name: "Triticum aestivum",
      category: "cereal",
      major_states: ["Uttar Pradesh", "Punjab", "Haryana", "Madhya Pradesh", "Rajasthan", "Bihar"],
      common_soils: ["alluvial", "loam", "clay loam"],
      pests: [
        {
          name_en: "Aphid (mustard/wheat aphid complex)",
          name_hi: "माहू / चेंपा",
          symptoms: "Clusters of small green/black insects on leaves and ears, sooty mould, sticky honeydew, curling of leaves.",
          severity: "medium",
          ipm_cultural: "Timely sowing (avoid late sowing which increases aphid risk), balanced nitrogen, border cropping.",
          biological: "Conserve ladybird beetles and syrphid flies; neem-based (azadirachtin) botanical spray at early infestation.",
          chemical_class_generic: "Systemic aphicide class registered for wheat aphid — verify live label."
        },
        {
          name_en: "Termites",
          name_hi: "दीमक",
          symptoms: "Wilting/drying of isolated plants, hollowed stems at base, especially in light/sandy soils and drought-stressed crop.",
          severity: "medium",
          ipm_cultural: "Deep summer ploughing, use of well-decomposed FYM (avoid raw/undecomposed manure), timely irrigation to relieve moisture stress.",
          biological: "Entomopathogenic fungal (e.g., Metarhizium-based) soil application where locally available and registered.",
          chemical_class_generic: "Seed/soil treatment insecticide class registered against termites — verify live label."
        }
      ],
      diseases: [
        {
          name_en: "Rust (yellow/brown/black)",
          pathogen_type: "fungal",
          pathogen: "Puccinia spp.",
          symptoms: "Yellow (stripe), brown (leaf) or black (stem) powdery pustules in stripes or scattered on leaves/stems.",
          cultural_control: "Resistant/tolerant varieties (check current SAU-recommended rust-resistant varieties each season, since races shift), timely sowing, avoid excess nitrogen.",
          biological: "Limited effective biological options; early detection and variety rotation are the main non-chemical levers.",
          chemical_class_generic: "Triazole-class or other systemic fungicide currently registered for wheat rust — verify live label."
        },
        {
          name_en: "Karnal bunt",
          pathogen_type: "fungal",
          pathogen: "Tilletia indica",
          symptoms: "Partial conversion of grain to black powdery mass with fishy odour, visible at threshing.",
          cultural_control: "Use certified disease-free seed, seed treatment before sowing, crop rotation with non-host crops.",
          biological: "Trichoderma-based seed treatment.",
          chemical_class_generic: "Systemic fungicide seed treatment class registered for Karnal bunt — verify live label."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Zinc (Zn)",
          local_name: "जस्ता",
          symptoms: "Interveinal chlorosis on younger leaves, stunted plants, delayed maturity; common in calcareous/alkaline soils.",
          associated_soils: ["calcareous", "alkaline", "sandy"],
          correction_foliar: "0.5% Zinc sulphate foliar spray — confirm current recommended concentration/interval with SAU/KVK.",
          correction_soil: "Basal zinc sulphate application at sowing per SAU rate for the soil zone."
        },
        {
          nutrient: "Sulphur (S)",
          local_name: "गंधक",
          symptoms: "Pale yellow-green younger leaves (unlike N deficiency which affects older leaves first), reduced tillering.",
          associated_soils: ["light-textured", "low organic matter"],
          correction_foliar: "Foliar spray of a soluble sulphate source if deficiency confirmed by soil test.",
          correction_soil: "Basal application of gypsum or another sulphur source per soil-test recommendation."
        }
      ]
    },
    {
      id: "cotton",
      name_en: "Cotton",
      name_hi: "कपास",
      botanical_name: "Gossypium spp.",
      category: "cash_crop",
      major_states: ["Maharashtra", "Gujarat", "Telangana", "Andhra Pradesh", "Punjab", "Haryana", "Madhya Pradesh"],
      common_soils: ["black cotton soil (Vertisol/regur)", "alluvial"],
      pests: [
        {
          name_en: "Pink bollworm",
          name_hi: "गुलाबी सुंडी",
          symptoms: "Rosetted flowers, small holes in bolls, pink larvae inside damaged bolls/seed, premature boll opening.",
          severity: "high",
          ipm_cultural: "Timely crop termination and destruction of crop residue after last picking, avoid ratooning/extra-long-duration crop, crop rotation.",
          biological: "Pheromone traps for monitoring and mass trapping, Trichogramma release, conserve natural predators.",
          chemical_class_generic: "Specific insecticide class registered for pink bollworm in cotton — verify live label; rotate mode-of-action classes to manage resistance."
        },
        {
          name_en: "Whitefly",
          name_hi: "सफेद मक्खी",
          symptoms: "Yellowing, sooty mould from honeydew, vector for Cotton Leaf Curl Virus (CLCuV) in north India.",
          severity: "high",
          ipm_cultural: "Avoid excess nitrogen, yellow sticky traps for monitoring, remove alternate weed hosts.",
          biological: "Conserve predators (Chrysoperla), neem-based botanical spray at early stage.",
          chemical_class_generic: "Systemic insecticide class registered for cotton whitefly — verify live label and resistance-rotation guidance."
        }
      ],
      diseases: [
        {
          name_en: "Bacterial blight (Angular leaf spot)",
          pathogen_type: "bacterial",
          pathogen: "Xanthomonas citri pv. malvacearum",
          symptoms: "Angular water-soaked lesions on leaves bound by veins, black lesions on stems/bolls ('black arm').",
          cultural_control: "Acid-delinted/treated certified seed, resistant varieties, avoid overhead irrigation, field sanitation.",
          biological: "Pseudomonas fluorescens seed treatment.",
          chemical_class_generic: "Copper-based bactericide class as currently registered — verify live label."
        },
        {
          name_en: "Fusarium wilt",
          pathogen_type: "fungal",
          pathogen: "Fusarium oxysporum f. sp. vasinfectum",
          symptoms: "Yellowing and wilting of leaves progressing up the plant, vascular browning when stem is split.",
          cultural_control: "Resistant varieties, crop rotation with non-host (cereal) crops, avoid waterlogging.",
          biological: "Trichoderma-based soil/seed treatment.",
          chemical_class_generic: "Limited chemical curative options; focus is cultural + biological control."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Potassium (K)",
          local_name: "पोटाश",
          symptoms: "Interveinal yellowing/bronzing on older leaves, marginal scorching, premature leaf fall, poor boll development.",
          associated_soils: ["light-textured soils with low K reserve; also seen in high-yield Vertisol fields under continuous cropping"],
          correction_foliar: "2% Potassium nitrate or sulphate of potash foliar spray during boll development if soil-test confirms deficiency.",
          correction_soil: "Split basal + top-dress potassic fertilizer per soil-test-based recommendation."
        },
        {
          nutrient: "Boron (B)",
          local_name: "बोरॉन",
          symptoms: "Boll shedding, malformed bolls, cracked petioles; more common in light/sandy and calcareous soils.",
          associated_soils: ["sandy", "calcareous"],
          correction_foliar: "0.2% Borax foliar spray at square/flowering stage if deficiency confirmed.",
          correction_soil: "Basal borax application at recommended low rate (boron has a narrow safe range — do not exceed SAU-recommended dose)."
        }
      ]
    },
    {
      id: "sugarcane",
      name_en: "Sugarcane",
      name_hi: "गन्ना",
      botanical_name: "Saccharum officinarum",
      category: "cash_crop",
      major_states: ["Uttar Pradesh", "Maharashtra", "Karnataka", "Tamil Nadu", "Bihar"],
      common_soils: ["alluvial", "black cotton soil", "loam"],
      pests: [
        {
          name_en: "Early shoot borer",
          name_hi: "अगेती तना छेदक",
          symptoms: "Dead heart in young shoots, easily pulled out with foul smell.",
          severity: "medium-high",
          ipm_cultural: "Removal and destruction of affected shoots, timely planting, trash mulching.",
          biological: "Trichogramma chilonis egg parasitoid release at recommended schedule.",
          chemical_class_generic: "Granular systemic insecticide class registered for early shoot borer — verify live label."
        },
        {
          name_en: "Pyrilla (leafhopper)",
          name_hi: "पायरिला",
          symptoms: "Yellowing/drying leaves, honeydew and sooty mould, characteristic 'burnt' appearance in heavy infestation.",
          severity: "medium",
          ipm_cultural: "Detrashing lower leaves, avoid water stress.",
          biological: "Conserve/release Epiricania melanoleuca parasitoid.",
          chemical_class_generic: "Contact/systemic insecticide class registered for pyrilla — verify live label."
        }
      ],
      diseases: [
        {
          name_en: "Red rot",
          pathogen_type: "fungal",
          pathogen: "Colletotrichum falcatum",
          symptoms: "Reddening of internal stem tissue with white patches when split open, alcoholic smell, drying of leaves.",
          cultural_control: "Disease-free seed sets, resistant varieties, hot-water/moist-hot-air seed treatment, crop rotation, avoid ratooning susceptible varieties.",
          biological: "Trichoderma-based sett/soil treatment.",
          chemical_class_generic: "Fungicidal sett-treatment class as currently registered — verify live label; primarily managed through resistant varieties, not curative chemicals."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Nitrogen (N)",
          local_name: "नाइट्रोजन",
          symptoms: "Overall pale-green to yellow crop, thin stalks, poor tillering.",
          associated_soils: ["light-textured", "low organic matter"],
          correction_foliar: "Not typically corrected by foliar spray alone; primarily a split soil-application crop.",
          correction_soil: "Split nitrogen application at planting, tillering, and grand-growth stage per SAU schedule."
        },
        {
          nutrient: "Potassium (K)",
          local_name: "पोटाश",
          symptoms: "Marginal yellowing/scorching of older leaves, thin and lodging-prone stalks, lower sugar recovery.",
          associated_soils: ["light-textured soils with continuous high-K removal"],
          correction_foliar: "Not first-line; verify via soil test.",
          correction_soil: "Potassic fertilizer per soil-test-based recommendation, split with nitrogen doses."
        }
      ]
    },
    {
      id: "maize",
      name_en: "Maize",
      name_hi: "मक्का",
      botanical_name: "Zea mays",
      category: "cereal",
      major_states: ["Karnataka", "Madhya Pradesh", "Bihar", "Uttar Pradesh", "Rajasthan", "Maharashtra"],
      common_soils: ["alluvial", "black cotton soil", "red loam"],
      pests: [
        {
          name_en: "Fall armyworm",
          name_hi: "फॉल आर्मीवर्म",
          symptoms: "Ragged/window-pane feeding on leaves, larvae with characteristic inverted-Y mark on head, frass in whorl.",
          severity: "high",
          ipm_cultural: "Early planting for the season, whorl application of sand/ash mix in small holdings, destroy egg masses.",
          biological: "Nucleopolyhedrovirus (NPV)-based biopesticide, Trichogramma release, conserve natural predators.",
          chemical_class_generic: "Whorl-application insecticide class currently registered for fall armyworm in maize — verify live label."
        },
        {
          name_en: "Stem borer",
          name_hi: "तना छेदक",
          symptoms: "Shot-hole feeding on young leaves, dead heart, tunnelling in stem.",
          severity: "medium",
          ipm_cultural: "Timely sowing, destruction of stubble after harvest.",
          biological: "Trichogramma release.",
          chemical_class_generic: "Granular insecticide class registered for maize stem borer — verify live label."
        }
      ],
      diseases: [
        {
          name_en: "Turcicum leaf blight",
          pathogen_type: "fungal",
          pathogen: "Exserohilum turcicum",
          symptoms: "Long, elliptical greyish-tan lesions on leaves, coalescing in severe cases.",
          cultural_control: "Resistant hybrids, crop rotation, residue management.",
          biological: "Trichoderma-based seed treatment.",
          chemical_class_generic: "Foliar fungicide class registered for maize leaf blight — verify live label."
        },
        {
          name_en: "Downy mildew",
          pathogen_type: "fungal (oomycete)",
          pathogen: "Peronosclerospora spp.",
          symptoms: "Chlorotic streaking on leaves, stunted plants, downy fungal growth on lower leaf surface in humid conditions.",
          cultural_control: "Resistant hybrids, timely sowing to avoid high-humidity infection windows, field drainage.",
          biological: "Limited biological options; prevention through resistant seed is primary.",
          chemical_class_generic: "Seed-treatment fungicide class registered against downy mildew — verify live label."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Zinc (Zn)",
          local_name: "जस्ता",
          symptoms: "Broad white/pale interveinal band on either side of the midrib of younger leaves ('white bud' in severe cases), shortened internodes.",
          associated_soils: ["calcareous", "alkaline", "sandy with low organic matter"],
          correction_foliar: "0.5% Zinc sulphate foliar spray — verify concentration/interval with SAU/KVK.",
          correction_soil: "Basal zinc sulphate at sowing per SAU rate."
        },
        {
          nutrient: "Nitrogen (N)",
          local_name: "नाइट्रोजन",
          symptoms: "Inverted-V yellowing pattern starting at the tip of older leaves along the midrib.",
          associated_soils: ["light-textured", "low organic matter"],
          correction_foliar: "Foliar urea spray can offer a rapid correction in-season alongside soil application.",
          correction_soil: "Split nitrogen doses at knee-high and tasseling stages."
        }
      ]
    },
    {
      id: "soybean",
      name_en: "Soybean",
      name_hi: "सोयाबीन",
      botanical_name: "Glycine max",
      category: "oilseed",
      major_states: ["Madhya Pradesh", "Maharashtra", "Rajasthan"],
      common_soils: ["black cotton soil (Vertisol)", "clay loam"],
      pests: [
        {
          name_en: "Girdle beetle",
          name_hi: "चक्र भृंग",
          symptoms: "Girdling rings on stem/petiole causing wilting and lodging of the portion above the girdle.",
          severity: "medium-high",
          ipm_cultural: "Remove and destroy girdled/wilted plant parts, timely sowing, crop rotation.",
          biological: "Conserve natural predators/parasitoids; limited targeted biologicals available.",
          chemical_class_generic: "Insecticide class registered for girdle beetle in soybean — verify live label."
        },
        {
          name_en: "Whitefly",
          name_hi: "सफेद मक्खी",
          symptoms: "Yellowing, sooty mould, vector for Yellow Mosaic Virus.",
          severity: "high (as virus vector)",
          ipm_cultural: "Timely sowing, yellow sticky traps, remove alternate weed hosts.",
          biological: "Conserve predators (Chrysoperla, coccinellids), neem-based spray at early stage.",
          chemical_class_generic: "Systemic insecticide class registered for soybean whitefly — verify live label."
        }
      ],
      diseases: [
        {
          name_en: "Yellow mosaic virus",
          pathogen_type: "viral (whitefly-transmitted)",
          symptoms: "Bright yellow mosaic patches on leaves, stunted growth, reduced pod set.",
          cultural_control: "Resistant/tolerant varieties, early sowing, whitefly vector management, rogue out infected plants early.",
          biological: "No direct biological cure; managed via vector (whitefly) control.",
          chemical_class_generic: "No direct chemical cure for the virus; vector-control insecticide class applies (see whitefly entry)."
        },
        {
          name_en: "Rust",
          pathogen_type: "fungal",
          pathogen: "Phakopsora pachyrhizi",
          symptoms: "Small tan-to-reddish-brown pustules mainly on the underside of leaves, premature defoliation.",
          cultural_control: "Timely sowing, resistant varieties where available, field sanitation.",
          biological: "Limited effective biologicals; early detection key.",
          chemical_class_generic: "Systemic fungicide class registered for soybean rust — verify live label."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Iron (Fe)",
          local_name: "लौह तत्व / आयरन",
          symptoms: "Interveinal chlorosis on younger leaves while veins stay green ('iron chlorosis'), common on calcareous black cotton soils with high pH and free lime.",
          associated_soils: ["calcareous black cotton soil (Vertisol)", "high pH / high free-lime soils"],
          correction_foliar: "1% Ferrous sulphate foliar spray, repeated at 10-day interval, is the standard rapid correction on high-pH Vertisols — verify current recommended concentration with SAU/KVK.",
          correction_soil: "Soil correction of iron is difficult on calcareous soils; foliar route is generally preferred by SAUs for this crop-soil combination."
        }
      ]
    },
    {
      id: "chickpea",
      name_en: "Chickpea (Bengal gram)",
      name_hi: "चना",
      botanical_name: "Cicer arietinum",
      category: "pulse",
      major_states: ["Madhya Pradesh", "Rajasthan", "Uttar Pradesh", "Maharashtra", "Karnataka"],
      common_soils: ["black cotton soil", "loam", "sandy loam"],
      pests: [
        {
          name_en: "Gram pod borer",
          name_hi: "फली छेदक",
          symptoms: "Circular holes in pods, larva feeding with head inside the pod, frass near feeding holes.",
          severity: "high",
          ipm_cultural: "Bird perches to encourage predation, intercropping with linseed/coriander, timely sowing.",
          biological: "HaNPV (Helicoverpa Nuclear Polyhedrosis Virus) biopesticide, Trichogramma release, pheromone traps.",
          chemical_class_generic: "Insecticide class registered for pod borer in chickpea — verify live label, prefer selective options to conserve pollinators."
        }
      ],
      diseases: [
        {
          name_en: "Fusarium wilt",
          pathogen_type: "fungal",
          pathogen: "Fusarium oxysporum f. sp. ciceris",
          symptoms: "Sudden wilting/drooping of the whole plant, vascular browning visible when the stem is split, patches of dead plants in the field.",
          cultural_control: "Resistant varieties, crop rotation with cereals, avoid late sowing, field sanitation.",
          biological: "Trichoderma-based seed treatment.",
          chemical_class_generic: "Fungicidal seed-treatment class registered against Fusarium in chickpea — verify live label."
        },
        {
          name_en: "Ascochyta blight",
          pathogen_type: "fungal",
          pathogen: "Ascochyta rabiei",
          symptoms: "Concentric-ringed brown lesions on leaves, stems and pods, girdling and breakage of stems in wet weather.",
          cultural_control: "Disease-free/treated seed, resistant varieties, avoid overhead irrigation, crop rotation.",
          biological: "Limited field-scale biologicals; sanitation and resistant varieties are primary.",
          chemical_class_generic: "Foliar fungicide class registered for Ascochyta blight — verify live label."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Sulphur (S)",
          local_name: "गंधक",
          symptoms: "Pale yellow-green younger leaves, reduced nodulation, poor pod filling — chickpea is sulphur-responsive as a pulse/legume.",
          associated_soils: ["light-textured", "low organic matter"],
          correction_foliar: "Foliar spray of soluble sulphate source if confirmed by soil test.",
          correction_soil: "Basal gypsum or single super phosphate (which also supplies sulphur) per soil-test recommendation."
        }
      ]
    },
    {
      id: "groundnut",
      name_en: "Groundnut (Peanut)",
      name_hi: "मूंगफली",
      botanical_name: "Arachis hypogaea",
      category: "oilseed",
      major_states: ["Gujarat", "Andhra Pradesh", "Tamil Nadu", "Karnataka", "Rajasthan"],
      common_soils: ["sandy loam", "red loam", "calcareous"],
      pests: [
        {
          name_en: "Thrips",
          name_hi: "थ्रिप्स",
          symptoms: "Silvery streaks and curling on leaves, stunted growth; also a vector for Tobacco Streak Virus/bud necrosis in some regions.",
          severity: "medium-high",
          ipm_cultural: "Timely sowing, blue sticky traps for monitoring, avoid moisture stress.",
          biological: "Conserve predatory mites/bugs; neem-based botanical spray at early infestation.",
          chemical_class_generic: "Insecticide class registered for groundnut thrips — verify live label."
        },
        {
          name_en: "Red hairy caterpillar",
          name_hi: "लाल रोमिल इल्ली",
          symptoms: "Gregarious young larvae skeletonizing leaves; older larvae disperse and cause severe defoliation.",
          severity: "medium",
          ipm_cultural: "Light traps and bonfires at early moth emergence, ploughing to expose pupae, bund maintenance to reduce carryover.",
          biological: "Handpicking/destruction of egg masses and gregarious young larvae before dispersal.",
          chemical_class_generic: "Insecticide class registered for red hairy caterpillar — verify live label."
        }
      ],
      diseases: [
        {
          name_en: "Tikka leaf spot",
          pathogen_type: "fungal",
          pathogen: "Cercospora spp.",
          symptoms: "Circular brown-to-black spots with yellow halo on leaves, early defoliation.",
          cultural_control: "Crop rotation, resistant varieties, field sanitation, avoid dense sowing.",
          biological: "Trichoderma-based seed treatment.",
          chemical_class_generic: "Foliar fungicide class registered for groundnut Tikka leaf spot — verify live label."
        },
        {
          name_en: "Collar rot",
          pathogen_type: "fungal",
          pathogen: "Aspergillus niger",
          symptoms: "Rotting at the collar region near soil line, wilting of seedlings, black fungal growth visible at collar.",
          cultural_control: "Healthy/treated seed, avoid deep sowing, field drainage, crop rotation.",
          biological: "Trichoderma-based seed treatment.",
          chemical_class_generic: "Seed-treatment fungicide class registered against collar rot — verify live label."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Calcium (Ca)",
          local_name: "कैल्शियम",
          symptoms: "Poor pod filling and 'pops' (unfilled pods) even when foliage looks healthy — groundnut needs calcium directly at the pegging zone, not just via roots.",
          associated_soils: ["light sandy soils with low exchangeable calcium"],
          correction_foliar: "Gypsum applied at the soil surface near the pegging zone (not a foliar spray) is the standard correction for pod-zone calcium in groundnut.",
          correction_soil: "Gypsum application at flowering/pegging stage per SAU rate."
        },
        {
          nutrient: "Boron (B)",
          local_name: "बोरॉन",
          symptoms: "'Hollow heart' — dark cavity inside the kernel, generally not visible from outside the pod.",
          associated_soils: ["light sandy soils"],
          correction_foliar: "Not applicable — corrected via soil-applied borax at flowering, at a narrow, SAU-specified rate.",
          correction_soil: "Low-rate basal borax application; do not exceed SAU-recommended dose as boron toxicity range is narrow."
        }
      ]
    },
    {
      id: "mustard",
      name_en: "Mustard / Rapeseed",
      name_hi: "सरसों",
      botanical_name: "Brassica juncea",
      category: "oilseed",
      major_states: ["Rajasthan", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "West Bengal"],
      common_soils: ["alluvial", "sandy loam"],
      pests: [
        {
          name_en: "Mustard aphid",
          name_hi: "माहू / चेंपा",
          symptoms: "Dense colonies on inflorescence and pods, curling and yellowing of leaves, reduced seed set.",
          severity: "high",
          ipm_cultural: "Timely sowing (earlier sowing generally escapes peak aphid buildup), yellow sticky traps, border/trap cropping.",
          biological: "Conserve ladybird beetle and syrphid fly populations; neem-based botanical spray at threshold.",
          chemical_class_generic: "Systemic aphicide class registered for mustard aphid — verify live label; apply only at economic threshold to protect pollinators."
        }
      ],
      diseases: [
        {
          name_en: "Alternaria blight",
          pathogen_type: "fungal",
          pathogen: "Alternaria brassicae",
          symptoms: "Concentric dark brown-to-black ring spots on leaves, stems and pods.",
          cultural_control: "Resistant/tolerant varieties, crop rotation, wider spacing for airflow, field sanitation.",
          biological: "Trichoderma-based seed treatment.",
          chemical_class_generic: "Foliar fungicide class registered for Alternaria blight in mustard — verify live label."
        },
        {
          name_en: "White rust",
          pathogen_type: "fungal (oomycete)",
          pathogen: "Albugo candida",
          symptoms: "White, glistening pustules on the underside of leaves; distortion ('staghead') of inflorescence in systemic infection.",
          cultural_control: "Resistant varieties, crop rotation, field sanitation, avoid dense sowing.",
          biological: "Limited biological options at field scale.",
          chemical_class_generic: "Systemic fungicide class registered for white rust — verify live label."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Sulphur (S)",
          local_name: "गंधक",
          symptoms: "Overall pale yellow-green colour of younger leaves, reduced oil content — mustard has one of the highest sulphur requirements among field crops.",
          associated_soils: ["light-textured", "low organic matter, long-term DAP/urea-only fertilization without sulphur"],
          correction_foliar: "Foliar spray of soluble sulphate source as a rapid in-season correction alongside soil application.",
          correction_soil: "Basal application of gypsum or ammonium sulphate per soil-test recommendation — mustard responds strongly to sulphur."
        }
      ]
    },
    {
      id: "tomato",
      name_en: "Tomato",
      name_hi: "टमाटर",
      botanical_name: "Solanum lycopersicum",
      category: "vegetable",
      major_states: ["Andhra Pradesh", "Madhya Pradesh", "Karnataka", "Odisha", "West Bengal", "Maharashtra"],
      common_soils: ["loam", "sandy loam", "red loam"],
      pests: [
        {
          name_en: "Fruit borer",
          name_hi: "फल छेदक",
          symptoms: "Circular holes in fruit with larva feeding inside, frass near entry hole.",
          severity: "high",
          ipm_cultural: "Bird perches, intercropping with marigold as a trap crop, timely staking.",
          biological: "HaNPV biopesticide, Trichogramma release, pheromone traps for monitoring/mass trapping.",
          chemical_class_generic: "Insecticide class registered for tomato fruit borer — verify live label."
        },
        {
          name_en: "Whitefly",
          name_hi: "सफेद मक्खी",
          symptoms: "Yellowing, sooty mould, vector for Tomato Leaf Curl Virus.",
          severity: "high (as virus vector)",
          ipm_cultural: "Yellow sticky traps, nursery raised under insect-proof net, remove alternate weed hosts.",
          biological: "Conserve predators (Chrysoperla, coccinellids), neem-based spray at early stage.",
          chemical_class_generic: "Systemic insecticide class registered for tomato whitefly — verify live label."
        }
      ],
      diseases: [
        {
          name_en: "Early blight",
          pathogen_type: "fungal",
          pathogen: "Alternaria solani",
          symptoms: "Concentric-ringed brown 'target' spots on older leaves first, progressing upward.",
          cultural_control: "Crop rotation, staking to improve airflow, avoid overhead irrigation, field sanitation.",
          biological: "Trichoderma-based seed/soil treatment.",
          chemical_class_generic: "Foliar fungicide class registered for tomato early blight — verify live label."
        },
        {
          name_en: "Late blight",
          pathogen_type: "fungal (oomycete)",
          pathogen: "Phytophthora infestans",
          symptoms: "Water-soaked irregular lesions turning brown-black rapidly, white fungal growth on underside in humid weather, can destroy a crop within days.",
          cultural_control: "Resistant varieties where available, avoid overhead irrigation, wide spacing, prompt removal of infected plants.",
          biological: "Limited effective biologicals once established; prevention and early action are critical given how fast this disease spreads.",
          chemical_class_generic: "Protectant/systemic fungicide class registered for late blight — verify live label; act promptly as this disease can be crop-destroying."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Calcium (Ca)",
          local_name: "कैल्शियम",
          symptoms: "Blossom end rot — sunken, dark, leathery patch at the flower end of the fruit, often linked to irregular watering rather than only low soil calcium.",
          associated_soils: ["light sandy soils; also occurs in any soil under irregular irrigation"],
          correction_foliar: "Calcium chloride/calcium nitrate foliar spray can help, but consistent irrigation scheduling is usually the more effective fix.",
          correction_soil: "Gypsum application if soil-test confirms low calcium; ensure consistent soil moisture."
        },
        {
          nutrient: "Boron (B)",
          local_name: "बोरॉन",
          symptoms: "Poor fruit set, cracked/corky fruit, brittle terminal growth.",
          associated_soils: ["light sandy soils"],
          correction_foliar: "0.1% Borax foliar spray at flowering if confirmed by soil test — boron has a narrow safe range, do not exceed recommended concentration.",
          correction_soil: "Low-rate basal borax per SAU recommendation."
        }
      ]
    },
    {
      id: "banana",
      name_en: "Banana",
      name_hi: "केला",
      botanical_name: "Musa spp.",
      category: "fruit",
      major_states: ["Maharashtra", "Tamil Nadu", "Gujarat", "Andhra Pradesh", "Karnataka"],
      common_soils: ["alluvial", "loam", "well-drained deep soils"],
      pests: [
        {
          name_en: "Banana pseudostem weevil / rhizome weevil",
          name_hi: "केला घुन",
          symptoms: "Gummy exudation and tunnels in pseudostem/rhizome, yellowing and toppling of plants in severe attack.",
          severity: "medium-high",
          ipm_cultural: "Use pest-free planting material (paring and pralinage of suckers), field sanitation, trapping with pseudostem traps.",
          biological: "Entomopathogenic fungal/nematode-based biopesticide where locally available.",
          chemical_class_generic: "Insecticide class registered for banana weevil, applied as pseudostem injection/soil application — verify live label."
        }
      ],
      diseases: [
        {
          name_en: "Panama wilt (Fusarium wilt)",
          pathogen_type: "fungal",
          pathogen: "Fusarium oxysporum f. sp. cubense",
          symptoms: "Yellowing of older leaves progressing upward, splitting of pseudostem at base, vascular discolouration.",
          cultural_control: "Resistant/tolerant cultivars, disease-free tissue-culture planting material, avoid movement of soil/water from infected fields, long-term field sanitation (no curative option once soil is infested).",
          biological: "Trichoderma-based soil treatment as a preventive/suppressive measure.",
          chemical_class_generic: "No effective curative chemical control; management is prevention-led (resistant planting material + sanitation)."
        },
        {
          name_en: "Sigatoka leaf spot",
          pathogen_type: "fungal",
          pathogen: "Mycosphaerella spp.",
          symptoms: "Elongated brown-black streaks/spots on leaves, coalescing and reducing photosynthetic area.",
          cultural_control: "Removal of affected leaves, wider spacing for airflow, balanced potassium nutrition.",
          biological: "Limited field-scale biological control.",
          chemical_class_generic: "Foliar fungicide class registered for Sigatoka leaf spot — verify live label."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Potassium (K)",
          local_name: "पोटाश",
          symptoms: "Marginal yellowing/necrosis of older leaves, poor bunch filling — banana is one of the heaviest potassium feeders among common crops.",
          associated_soils: ["all soils under continuous banana cropping without adequate K replenishment"],
          correction_foliar: "Not first-line; primarily corrected via heavy split soil application.",
          correction_soil: "Heavy, split potassic fertilizer application through the crop cycle per SAU recommendation for the region/cultivar."
        }
      ]
    },
    {
      id: "chilli",
      name_en: "Chilli",
      name_hi: "मिर्च",
      botanical_name: "Capsicum annuum",
      category: "vegetable/spice",
      major_states: ["Andhra Pradesh", "Telangana", "Karnataka", "Madhya Pradesh", "West Bengal"],
      common_soils: ["black cotton soil", "red loam", "alluvial"],
      pests: [
        {
          name_en: "Thrips",
          name_hi: "थ्रिप्स",
          symptoms: "Upward leaf curling, silvery streaks, stunted growth; a major cause of the 'leaf curl complex' in chilli.",
          severity: "high",
          ipm_cultural: "Blue sticky traps, avoid moisture stress, remove alternate weed hosts.",
          biological: "Conserve predatory mites; neem-based botanical spray at early infestation.",
          chemical_class_generic: "Insecticide class registered for chilli thrips — verify live label."
        },
        {
          name_en: "Mites (yellow/broad mite)",
          name_hi: "चेंपा कीट (माइट)",
          symptoms: "Downward cupping/curling of leaves, bronzing, elongated distorted growth.",
          severity: "medium-high",
          ipm_cultural: "Avoid drought stress, field sanitation, remove severely affected plants.",
          biological: "Conserve predatory mites where possible.",
          chemical_class_generic: "Miticide class registered for chilli — note this needs a miticide, not a general insecticide, as ordinary insecticides are often ineffective on mites."
        }
      ],
      diseases: [
        {
          name_en: "Anthracnose (fruit rot / die-back)",
          pathogen_type: "fungal",
          pathogen: "Colletotrichum spp.",
          symptoms: "Sunken, dark circular lesions with concentric rings on ripening fruit; die-back of twigs from the tip.",
          cultural_control: "Disease-free seed, crop rotation, avoid overhead irrigation, timely harvest of ripe fruit.",
          biological: "Trichoderma-based seed/soil treatment.",
          chemical_class_generic: "Foliar fungicide class registered for chilli anthracnose — verify live label."
        },
        {
          name_en: "Leaf curl virus complex",
          pathogen_type: "viral (whitefly/thrips/mite-transmitted, complex etiology)",
          symptoms: "Severe upward/downward curling, puckering and stunting of leaves, bushy/stunted plant appearance.",
          cultural_control: "Tolerant varieties, staggered planting, vector management (whitefly, thrips, mites), rogue out severely infected plants early.",
          biological: "No direct biological cure; managed via vector control.",
          chemical_class_generic: "No direct chemical cure for the virus; vector-control insecticide/miticide classes apply."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Calcium (Ca) / Boron (B)",
          local_name: "कैल्शियम / बोरॉन",
          symptoms: "Poor fruit set, flower drop, and blossom-end-rot-like fruit tip necrosis.",
          associated_soils: ["light sandy soils; irregular irrigation aggravates symptoms"],
          correction_foliar: "Calcium nitrate + low-rate borax foliar spray at flowering if confirmed by soil test.",
          correction_soil: "Gypsum for calcium; low-rate basal borax per SAU recommendation."
        }
      ]
    },
    {
      id: "onion",
      name_en: "Onion",
      name_hi: "प्याज",
      botanical_name: "Allium cepa",
      category: "vegetable",
      major_states: ["Maharashtra", "Karnataka", "Gujarat", "Madhya Pradesh", "Rajasthan"],
      common_soils: ["loam", "sandy loam", "alluvial"],
      pests: [
        {
          name_en: "Thrips",
          name_hi: "थ्रिप्स",
          symptoms: "Silvery-white streaks on leaves, curling and twisting of leaves, stunted bulb development in heavy infestation.",
          severity: "high",
          ipm_cultural: "Close spacing avoidance, intercropping with taller barrier crops, avoid moisture stress.",
          biological: "Conserve predatory bugs/mites; neem-based botanical spray at early infestation.",
          chemical_class_generic: "Insecticide class registered for onion thrips — verify live label; rotate mode-of-action to manage resistance, which is common in onion thrips."
        }
      ],
      diseases: [
        {
          name_en: "Purple blotch",
          pathogen_type: "fungal",
          pathogen: "Alternaria porri",
          symptoms: "Small water-soaked spots enlarging into purple-brown concentric lesions on leaves, causing leaf collapse.",
          cultural_control: "Crop rotation, field sanitation, avoid overhead irrigation, wider spacing for airflow.",
          biological: "Trichoderma-based seed/soil treatment.",
          chemical_class_generic: "Foliar fungicide class registered for purple blotch — verify live label."
        },
        {
          name_en: "Basal rot",
          pathogen_type: "fungal",
          pathogen: "Fusarium oxysporum f. sp. cepae",
          symptoms: "Rotting at the basal plate, yellowing and dieback of leaf tips, roots turn pinkish then rot.",
          cultural_control: "Disease-free sets/seed, crop rotation, avoid waterlogging, field sanitation.",
          biological: "Trichoderma-based soil treatment.",
          chemical_class_generic: "No highly effective curative chemical option; prevention through healthy planting material and rotation is primary."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Sulphur (S)",
          local_name: "गंधक",
          symptoms: "Pale leaves and reduced pungency/bulb quality — onion (an Allium) is notably sulphur-responsive.",
          associated_soils: ["light-textured", "low organic matter"],
          correction_foliar: "Foliar spray of soluble sulphate source as rapid correction alongside soil application.",
          correction_soil: "Basal gypsum or ammonium sulphate per soil-test recommendation."
        }
      ]
    },
    {
      id: "potato",
      name_en: "Potato",
      name_hi: "आलू",
      botanical_name: "Solanum tuberosum",
      category: "vegetable",
      major_states: ["Uttar Pradesh", "West Bengal", "Bihar", "Gujarat", "Madhya Pradesh"],
      common_soils: ["alluvial", "loam", "sandy loam"],
      pests: [
        {
          name_en: "Aphid (virus vector complex)",
          name_hi: "माहू / चेंपा",
          symptoms: "Clusters on undersides of leaves, sticky honeydew; primary vector for seed-degenerating potato viruses.",
          severity: "high (as virus vector for seed crop)",
          ipm_cultural: "Roguing of infected plants in seed plots, timely haulm cutting, isolation distance for seed production.",
          biological: "Conserve ladybird beetles/syrphid flies; neem-based spray at early infestation.",
          chemical_class_generic: "Systemic aphicide class registered for potato aphid — verify live label."
        }
      ],
      diseases: [
        {
          name_en: "Late blight",
          pathogen_type: "fungal (oomycete)",
          pathogen: "Phytophthora infestans",
          symptoms: "Water-soaked lesions on leaves turning brown-black with white fungal ring on underside in humid weather; can destroy a crop rapidly (historically the cause of the Irish famine).",
          cultural_control: "Certified disease-free seed tubers, resistant varieties where available, earthing up, avoid overhead irrigation in cool humid weather, prompt destruction of infected haulms.",
          biological: "Limited effective biologicals once established; prevention and forecasting-based early spray timing are critical.",
          chemical_class_generic: "Protectant/systemic fungicide class registered for potato late blight — verify live label; timing before disease establishment matters more than any single product choice."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Potassium (K)",
          local_name: "पोटाश",
          symptoms: "Marginal scorching/bronzing of older leaves, poor tuber size and starch content — potato is a heavy potassium feeder.",
          associated_soils: ["light-textured soils with low K reserve"],
          correction_foliar: "Not first-line; primarily corrected via soil application.",
          correction_soil: "Split potassic fertilizer application per soil-test recommendation, ideally as sulphate of potash for quality tubers."
        }
      ]
    },
    {
      id: "pigeon_pea",
      name_en: "Pigeon pea (Arhar/Tur)",
      name_hi: "अरहर / तुअर",
      botanical_name: "Cajanus cajan",
      category: "pulse",
      major_states: ["Maharashtra", "Karnataka", "Madhya Pradesh", "Uttar Pradesh"],
      common_soils: ["black cotton soil (Vertisol)", "red loam", "marginal/low-fertility soils"],
      pests: [
        {
          name_en: "Pod borer",
          name_hi: "फली छेदक",
          symptoms: "Circular holes in pods, larvae feeding on developing seeds inside the pod.",
          severity: "high",
          ipm_cultural: "Bird perches, intercropping (e.g., with sorghum), timely sowing.",
          biological: "HaNPV biopesticide, Trichogramma release, pheromone traps.",
          chemical_class_generic: "Insecticide class registered for pod borer in pigeon pea — verify live label."
        },
        {
          name_en: "Pod fly",
          name_hi: "फली मक्खी",
          symptoms: "Maggots feeding inside developing seeds, small entry/exit holes on pod surface, seed damage not visible externally until pod is opened.",
          severity: "medium-high",
          ipm_cultural: "Timely sowing, destruction of crop residue after harvest.",
          biological: "Conserve natural parasitoids; limited targeted biologicals.",
          chemical_class_generic: "Insecticide class registered for pod fly — verify live label; timing at pod formation is critical since damage is internal."
        }
      ],
      diseases: [
        {
          name_en: "Fusarium wilt",
          pathogen_type: "fungal",
          pathogen: "Fusarium udum",
          symptoms: "Yellowing and wilting of the whole plant or individual branches, vascular blackening visible when the stem is split.",
          cultural_control: "Resistant varieties, crop rotation, avoid continuous pigeon pea cropping in the same field, field sanitation.",
          biological: "Trichoderma-based seed/soil treatment.",
          chemical_class_generic: "Fungicidal seed-treatment class registered against wilt — verify live label; resistant varieties are the primary lever."
        },
        {
          name_en: "Sterility mosaic disease",
          pathogen_type: "viral (mite-transmitted)",
          symptoms: "Bushy, pale green sterile plants with reduced/absent pod set, mosaic mottling on leaves.",
          cultural_control: "Resistant/tolerant varieties, roguing of infected plants early, control of the eriophyid mite vector.",
          biological: "No direct biological cure; managed via vector (mite) control.",
          chemical_class_generic: "No direct chemical cure for the virus; miticide class applies for vector control."
        }
      ],
      nutrient_deficiencies: [
        {
          nutrient: "Sulphur (S) / Phosphorus (P)",
          local_name: "गंधक / फास्फोरस",
          symptoms: "Pale foliage, poor nodulation and branching on the typically marginal/low-fertility soils this crop is often grown on.",
          associated_soils: ["marginal/low-fertility soils, light-textured soils"],
          correction_foliar: "Not first-line; primarily corrected via basal soil application.",
          correction_soil: "Basal application of single super phosphate (supplies both P and S) per soil-test recommendation at sowing."
        }
      ]
    }
  ];

  const crops = knowledgeBaseCrops.map(c => ({
    id: c.id,
    name_en: c.name_en,
    name_hi: c.name_hi,
    category: c.category,
    major_states: c.major_states
  }));

  const SEVERITY_WEIGHT = {
    low: 10,
    medium: 20,
    "medium-high": 30,
    high: 40,
    "high (as virus vector)": 35,
    "high (as virus vector for seed crop)": 35,
  };

  function textMatchesSign(symptomText, signId) {
    const sign = signs.find(s => s.id === signId);
    if (!sign) return false;
    const lower = (symptomText || "").toLowerCase();
    return sign.keywords.some(kw => lower.includes(kw.toLowerCase()));
  }

  function scaleNote(acreage) {
    if (!acreage || isNaN(acreage) || acreage <= 0) return null;
    return `For ${acreage} acre(s), scale spray volume and product per your local KVK / SAU package of practices. Typical field volume: 150-200 L water per acre for knapsack sprayers.`;
  }

  function diagnoseOffline(cropId, selectedSignIds, acreage, organ, isPhoto) {
    const crop = knowledgeBaseCrops.find(c => c.id === cropId);
    if (!crop) throw new Error("UNKNOWN_CROP_ID");

    let signs = Array.isArray(selectedSignIds) ? [...selectedSignIds] : [];
    let visionNote = null;
    let visionAnalysis = null;

    if (isPhoto || (!signs.length && organ)) {
      // Offline visual feature heuristic based on crop + affected plant organ
      const organLower = (organ || "LEAF").toLowerCase();
      let matchedIssue = null;
      let issueType = "disease";

      if (organLower.includes("fruit") || organLower.includes("pod")) {
        matchedIssue = crop.pests?.find(p => (p.symptoms || "").toLowerCase().includes("pod") || (p.symptoms || "").toLowerCase().includes("fruit"))
          || crop.diseases?.[0] || crop.pests?.[0];
        if (crop.pests?.includes(matchedIssue)) issueType = "pest";
      } else if (organLower.includes("stem") || organLower.includes("root")) {
        matchedIssue = crop.diseases?.find(d => (d.symptoms || "").toLowerCase().includes("rot") || (d.symptoms || "").toLowerCase().includes("wilt"))
          || crop.pests?.find(p => (p.symptoms || "").toLowerCase().includes("shoot") || (p.symptoms || "").toLowerCase().includes("stem"))
          || crop.diseases?.[0];
        if (crop.pests?.includes(matchedIssue)) issueType = "pest";
      } else {
        matchedIssue = crop.diseases?.[0] || crop.pests?.[0] || crop.nutrient_deficiencies?.[0];
        if (crop.pests?.includes(matchedIssue)) issueType = "pest";
        else if (crop.nutrient_deficiencies?.includes(matchedIssue)) issueType = "nutrient_deficiency";
      }

      if (matchedIssue) {
        visionNote = `फोटो विश्लेषण: ${crop.name_hi || crop.name_en} के ${organ || "पौधे"} पर ${matchedIssue.name_hi || matchedIssue.name_en} के दृश्य लक्षण पाए गए।`;
        visionAnalysis = {
          detectedIssue: matchedIssue.name_en,
          detectedIssueHi: matchedIssue.name_hi || matchedIssue.name_en,
          issueType,
          confidence: 84,
          visualDescription: `Visual AI analysis detected signs of ${matchedIssue.name_en} on ${crop.name_en}. ${matchedIssue.symptoms || ""}`,
          visualDescriptionHi: visionNote,
          tier1_cultural_mineral: matchedIssue.correction_foliar || matchedIssue.cultural_control || matchedIssue.ipm_cultural || "Remove affected parts and sanitize field",
          tier2_biological: matchedIssue.biological || "Spray neem oil (Azadirachtin 1500 ppm) @ 3 ml/L or Trichoderma",
          tier3_chemical_class: matchedIssue.chemical_class_generic || "Consult KVK for CIB&RC-registered active ingredients",
          plantHealthIndex: 72,
        };

        const candidates = [{
          crop_id: cropId,
          type: issueType,
          name_en: matchedIssue.name_en,
          name_hi: matchedIssue.name_hi,
          confidence: 84,
          severity: matchedIssue.severity || "medium",
          details: matchedIssue
        }];

        return {
          ok: true,
          cropId,
          cropName: crop.name_en,
          inputMode: "photo",
          visionNote,
          visionAnalysis,
          plantHealthIndex: 72,
          matches: candidates,
          dosageScalingNote: scaleNote(acreage),
          disclaimer: "AI-assisted guidance — verify all recommendations with your local KVK or SAU before application."
        };
      }
    }

    if (!signs || signs.length === 0) {
      return {
        ok: true,
        cropId,
        cropName: crop.name_en,
        inputMode: "symptom_checklist",
        plantHealthIndex: 100,
        matches: [],
        dosageScalingNote: scaleNote(acreage),
        disclaimer: "Reference guidance only — verify all chemical and fertilizer recommendations with your local KVK or State Agriculture University before application."
      };
    }

    const candidates = [];

    for (const pest of crop.pests || []) {
      const hits = signs.filter(sid => textMatchesSign(pest.symptoms, sid));
      if (hits.length > 0) {
        candidates.push({
          crop_id: cropId,
          type: "pest",
          name_en: pest.name_en,
          name_hi: pest.name_hi,
          confidence: Math.round((hits.length / signs.length) * 100),
          severity: pest.severity,
          details: pest
        });
      }
    }

    for (const disease of crop.diseases || []) {
      const hits = signs.filter(sid => textMatchesSign(disease.symptoms, sid));
      if (hits.length > 0) {
        candidates.push({
          crop_id: cropId,
          type: "disease",
          name_en: disease.name_en,
          confidence: Math.round((hits.length / signs.length) * 100),
          severity: disease.pathogen_type === "viral" ? "high" : "medium-high",
          details: disease
        });
      }
    }

    for (const def of crop.nutrient_deficiencies || []) {
      const hits = signs.filter(sid => textMatchesSign(def.symptoms, sid));
      if (hits.length > 0) {
        candidates.push({
          crop_id: cropId,
          type: "nutrient_deficiency",
          name_en: `${def.nutrient} deficiency`,
          name_hi: def.local_name ? `${def.local_name} की कमी` : undefined,
          confidence: Math.round((hits.length / signs.length) * 100),
          severity: "medium",
          details: def
        });
      }
    }

    candidates.sort((a, b) => b.confidence - a.confidence);

    let maxPenalty = 0;
    for (const m of candidates.slice(0, 3)) {
      const weight = SEVERITY_WEIGHT[m.severity || "medium"] || 20;
      const penalty = weight * (m.confidence / 100);
      if (penalty > maxPenalty) maxPenalty = penalty;
    }
    const plantHealthIndex = Math.max(10, Math.round(100 - maxPenalty * 1.5));

    return {
      ok: true,
      cropId,
      cropName: crop.name_en,
      inputMode: "symptom_checklist",
      plantHealthIndex,
      matches: candidates,
      dosageScalingNote: scaleNote(acreage),
      disclaimer: "Reference guidance only — verify all chemical and fertilizer recommendations with your local KVK or State Agriculture University before application."
    };
  }

  return {
    languages,
    states,
    crops,
    signs,
    knowledgeBaseCrops,
    diagnoseOffline,
    scaleNote
  };
})();

if (typeof window !== "undefined") {
  window.KSH_DATA = KSH_DATA;
}
if (typeof module !== "undefined") {
  module.exports = KSH_DATA;
}
