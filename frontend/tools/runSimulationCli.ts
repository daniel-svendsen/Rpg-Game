import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeCharacterRecord } from "../src/game/domain/player/playerTypes";
import { formatSimulationSummary, simulateMapRuns } from "../src/game/simulation";
import type { SimulationBalanceOverrides } from "../src/game/simulation";
import type { CharacterRecord, CharacterStats, InventoryItem, ItemRarity } from "../src/shared/types/saveTypes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");
const defaultProfilesDirectory = path.resolve(frontendRoot, "sim-profiles");

const helpText = `
Shardborne simulation tool

Examples:
  npm run sim -- --email you@example.com --password secret --map trainingGrounds --runs 100
  npm run sim -- --profile daniel-current-build --map tier3Map --runs 500 --output reports/tier3.json
  npm run sim -- --profile daniel-current-build --map tier5Map --runs 200 --overrides sim-overrides/example-balancedrops.json
  npm run sim -- --benchmark-tier 4 --map tier4Map --runs 200
  npm run sim:bench

Required:
  --map <mapId>                     trainingGrounds, tier1Map, tier2Map, ...
                                      not required when using --write-tier-benchmarks

Character source:
  --profile <name-or-path>          load a saved simulation profile JSON
  --email <email> --password <pw>   login to the backend and use the current saved character
  --benchmark-tier <tier>           build a rough tier benchmark from starter-caster
  --write-tier-benchmarks <maxTier> write benchmark-tier1..N profiles to sim-profiles/

Optional:
  --api-base-url <url>              backend URL, default http://localhost:8080
  --runs <count>                    default 100
  --shop-samples <count>            sample shop stock this many times (optional)
  --shop-tier <tier>                shop tier override (default highestUnlockedTier+1)
  --output <path>                   write the full JSON report to a file
  --save-profile <path>             save the loaded character as a local simulation profile JSON
  --overrides <path>                load balance override JSON
  --step-ms <count>                 simulation step in milliseconds, default 50
  --max-run-seconds <count>         max time per run, default 240
  --flask-threshold <0-1|none>      auto-use life flask threshold, default 0.45
  --help                            show this help
`.trim();

type ParsedArgs = {
  mapId: string | null;
  profile: string | null;
  email: string | null;
  password: string | null;
  apiBaseUrl: string;
  runs: number;
  shopSamples: number;
  shopTier: number | null;
  output: string | null;
  saveProfile: string | null;
  overrides: string | null;
  stepMs: number;
  maxRunSeconds: number;
  flaskThreshold: number | null;
  benchmarkTier: number | null;
  writeTierBenchmarks: number | null;
};

const parseNumber = (value: string, name: string): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid value for ${name}: ${value}`);
  }

  return parsed;
};

const parseArgs = (argv: string[]): ParsedArgs => {
  const parsed: ParsedArgs = {
    mapId: null,
    profile: null,
    email: null,
    password: null,
    apiBaseUrl: "http://localhost:8080",
    runs: 100,
    shopSamples: 0,
    shopTier: null,
    output: null,
    saveProfile: null,
    overrides: null,
    stepMs: 50,
    maxRunSeconds: 240,
    flaskThreshold: 0.45,
    benchmarkTier: null,
    writeTierBenchmarks: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    switch (current) {
      case "--help":
        console.log(helpText);
        process.exit(0);
        break;
      case "--map":
        parsed.mapId = next ?? null;
        index += 1;
        break;
      case "--profile":
        parsed.profile = next ?? null;
        index += 1;
        break;
      case "--email":
        parsed.email = next ?? null;
        index += 1;
        break;
      case "--password":
        parsed.password = next ?? null;
        index += 1;
        break;
      case "--api-base-url":
        parsed.apiBaseUrl = next ?? parsed.apiBaseUrl;
        index += 1;
        break;
      case "--runs":
        parsed.runs = parseNumber(next ?? "", "--runs");
        index += 1;
        break;
      case "--shop-samples":
        parsed.shopSamples = parseNumber(next ?? "", "--shop-samples");
        index += 1;
        break;
      case "--shop-tier":
        parsed.shopTier = parseNumber(next ?? "", "--shop-tier");
        index += 1;
        break;
      case "--output":
        parsed.output = next ?? null;
        index += 1;
        break;
      case "--save-profile":
        parsed.saveProfile = next ?? null;
        index += 1;
        break;
      case "--benchmark-tier":
        parsed.benchmarkTier = parseNumber(next ?? "", "--benchmark-tier");
        index += 1;
        break;
      case "--write-tier-benchmarks":
        parsed.writeTierBenchmarks = parseNumber(next ?? "", "--write-tier-benchmarks");
        index += 1;
        break;
      case "--overrides":
        parsed.overrides = next ?? null;
        index += 1;
        break;
      case "--step-ms":
        parsed.stepMs = parseNumber(next ?? "", "--step-ms");
        index += 1;
        break;
      case "--max-run-seconds":
        parsed.maxRunSeconds = parseNumber(next ?? "", "--max-run-seconds");
        index += 1;
        break;
      case "--flask-threshold":
        parsed.flaskThreshold = next === "none" ? null : parseNumber(next ?? "", "--flask-threshold");
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${current}`);
    }
  }

  if (!parsed.mapId && parsed.writeTierBenchmarks === null) {
    throw new Error("Missing required --map <mapId>.");
  }

  if (!Number.isInteger(parsed.runs) || parsed.runs <= 0) {
    throw new Error("--runs must be a positive integer.");
  }

  if (!Number.isInteger(parsed.shopSamples) || parsed.shopSamples < 0) {
    throw new Error("--shop-samples must be 0 or a positive integer.");
  }

  if (parsed.shopTier !== null && (!Number.isInteger(parsed.shopTier) || parsed.shopTier <= 0)) {
    throw new Error("--shop-tier must be a positive integer.");
  }

  if (!Number.isInteger(parsed.stepMs) || parsed.stepMs <= 0) {
    throw new Error("--step-ms must be a positive integer.");
  }

  if (parsed.benchmarkTier !== null && (!Number.isInteger(parsed.benchmarkTier) || parsed.benchmarkTier <= 0)) {
    throw new Error("--benchmark-tier must be a positive integer.");
  }

  if (
    parsed.writeTierBenchmarks !== null &&
    (!Number.isInteger(parsed.writeTierBenchmarks) || parsed.writeTierBenchmarks <= 0)
  ) {
    throw new Error("--write-tier-benchmarks must be a positive integer.");
  }

  if (parsed.maxRunSeconds <= 0) {
    throw new Error("--max-run-seconds must be greater than 0.");
  }

  if (
    parsed.flaskThreshold !== null &&
    (parsed.flaskThreshold < 0 || parsed.flaskThreshold > 1)
  ) {
    throw new Error("--flask-threshold must be between 0 and 1, or 'none'.");
  }

  if (
    !parsed.profile &&
    !(parsed.email && parsed.password) &&
    parsed.benchmarkTier === null &&
    parsed.writeTierBenchmarks === null
  ) {
    throw new Error("Provide either --profile <name-or-path> or --email with --password.");
  }

  return parsed;
};

const resolveInputPath = (inputPath: string): string =>
  path.isAbsolute(inputPath) ? inputPath : path.resolve(frontendRoot, inputPath);

const ensureParentDirectory = async (filePath: string): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
};

const createBenchmarkStatsForTier = (tier: number): CharacterStats => {
  const vitality = 3 + tier * 2;
  const strength = 1 + Math.floor(tier / 2);
  const agility = 1 + Math.floor(tier / 2);
  const dexterity = 1 + Math.floor(tier / 2);

  return { strength, agility, vitality, dexterity };
};

const benchmarkItem = (
  id: string,
  name: string,
  slot: InventoryItem["slot"],
  rarity: ItemRarity,
  tier: number,
  tags: InventoryItem["tags"],
  statBonuses: InventoryItem["statBonuses"]
): InventoryItem => ({ id, name, slot, rarity, tier, tags, statBonuses });

// Per-tier lookup tables — index = tier (0 unused, 1-9 used)
const benchmarkWeaponSpellPower =  [0,    0.03, 0.03, 0.06, 0.08, 0.11, 0.14, 0.18, 0.22, 0.26];
const benchmarkWeaponCrit       =  [0,    0,    0,    0,    0,    0.01, 0.015,0.022,0.030,0.038];
const benchmarkBootsColdRes     =  [0,    0,    0.06, 0.11, 0.15, 0.21, 0.28, 0.40, 0.50, 0.58];
const benchmarkBootsMoveBonus   =  [0,    0,    0,    0,    0,    0.02, 0.03, 0.04, 0.05, 0.06];
const benchmarkBodyFireRes      =  [0,    0,    0,    0,    0.07, 0.13, 0.20, 0.33, 0.43, 0.52];
const benchmarkBodyMaxHealth    =  [0,    0,    0,    0,    0,    25,   55,   110,  160,  210];
const benchmarkHelmLightRes     =  [0,    0,    0,    0,    0,    0,    0.14, 0.28, 0.38, 0.46];
const benchmarkHelmVitality     =  [0,    0,    0,    0,    0,    0,    3,    4,    5,    6];
const benchmarkAmuletSpellPower =  [0,    0,    0,    0,    0,    0.07, 0.10, 0.14, 0.18, 0.22];
const benchmarkRing1LightRes    =  [0,    0,    0,    0,    0,    0,    0,    0.17, 0.23, 0.28];
const benchmarkRing1ColdRes     =  [0,    0,    0,    0,    0,    0,    0,    0.07, 0.10, 0.12];
const benchmarkRing2FireRes     =  [0,    0,    0,    0,    0,    0,    0,    0,    0.12, 0.18];
const benchmarkBeltVitality     =  [0,    0,    0,    0,    0,    0,    0,    4,    5,    6];
const benchmarkBeltMaxHealth    =  [0,    0,    0,    0,    0,    0,    0,    35,   60,   80];

const createBenchmarkEquippedItemsForTier = (tier: number): CharacterRecord["equippedItems"] => {
  const t = Math.max(1, Math.min(9, tier));
  const items: CharacterRecord["equippedItems"] = {};

  // Weapon: oak (T1-2) → yew (T3-4) → runic (T5+)
  if (t <= 2) {
    items.Weapon = benchmarkItem("bm-weapon", "Charged Oak Wand", "Weapon", "Magic", t, ["SpellDamage"], {
      castSpeedMultiplier: 1.0,
      spellPowerMultiplier: benchmarkWeaponSpellPower[t]
    });
  } else if (t <= 4) {
    items.Weapon = benchmarkItem("bm-weapon", "Charged Yew Wand", "Weapon", "Magic", t, ["SpellDamage"], {
      castSpeedMultiplier: 1.2,
      spellPowerMultiplier: benchmarkWeaponSpellPower[t]
    });
  } else {
    items.Weapon = benchmarkItem("bm-weapon", "Sovereign Runic Wand", "Weapon", "Rare", t, ["SpellDamage"], {
      castSpeedMultiplier: 1.35,
      spellPowerMultiplier: benchmarkWeaponSpellPower[t],
      critChance: benchmarkWeaponCrit[t]
    });
  }

  // Boots: from tier 2
  if (t >= 2) {
    const bootsRarity: ItemRarity = t >= 5 ? "Rare" : t >= 3 ? "Magic" : "Normal";
    items.Boots = benchmarkItem("bm-boots", "Frostward Traveler Boots", "Boots", bootsRarity, t, ["CastSpeed"], {
      evasion: 28,
      coldResistance: benchmarkBootsColdRes[t],
      ...(benchmarkBootsMoveBonus[t] > 0 ? { movementSpeedBonus: benchmarkBootsMoveBonus[t] } : {})
    });
  }

  // Body armor: from tier 4
  if (t >= 4) {
    const armorRarity: ItemRarity = t >= 6 ? "Rare" : t >= 5 ? "Magic" : "Normal";
    items.BodyArmor = benchmarkItem("bm-body", "Stalwart Leather Tunic", "BodyArmor", armorRarity, t, ["Physical"], {
      evasion: 44,
      ...(benchmarkBodyMaxHealth[t] > 0 ? { maxHealth: benchmarkBodyMaxHealth[t] } : {}),
      ...(benchmarkBodyFireRes[t] > 0 ? { fireResistance: benchmarkBodyFireRes[t] } : {})
    });
  }

  // Helmet: from tier 6
  if (t >= 6) {
    const helmRarity: ItemRarity = t >= 7 ? "Rare" : "Magic";
    items.Helmet = benchmarkItem("bm-helmet", "Stormward Leather Cap", "Helmet", helmRarity, t, ["Physical"], {
      evasion: 34,
      vitality: benchmarkHelmVitality[t],
      lightningResistance: benchmarkHelmLightRes[t]
    });
  }

  // Gloves: from tier 7
  if (t >= 7) {
    const gloveCrit = t === 7 ? 0.012 : t === 8 ? 0.018 : 0.024;
    items.Gloves = benchmarkItem("bm-gloves", "Precise Woven Gloves", "Gloves", "Rare", t, ["Critical"], {
      evasion: 22,
      critChance: gloveCrit
    });
  }

  // Amulet: from tier 5
  if (t >= 5) {
    const amuletRarity: ItemRarity = t >= 6 ? "Rare" : "Magic";
    items.Amulet = benchmarkItem("bm-amulet", "Arcanist Amber Amulet", "Amulet", amuletRarity, t, ["SpellDamage"], {
      spellPowerMultiplier: benchmarkAmuletSpellPower[t]
    });
  }

  // Ring1: from tier 7 (lightning + cold coverage)
  if (t >= 7) {
    const ringRarity: ItemRarity = t >= 8 ? "Rare" : "Magic";
    items.Ring1 = benchmarkItem("bm-ring1", "Stormward Topaz Ring", "Ring1", ringRarity, t, ["Lightning", "Critical"], {
      lightningResistance: benchmarkRing1LightRes[t],
      coldResistance: benchmarkRing1ColdRes[t]
    });
  }

  // Ring2: from tier 8 (fire coverage)
  if (t >= 8) {
    items.Ring2 = benchmarkItem("bm-ring2", "Emberward Ruby Ring", "Ring2", "Rare", t, ["Fire", "SpellDamage"], {
      fireResistance: benchmarkRing2FireRes[t]
    });
  }

  // Belt: from tier 7
  if (t >= 7) {
    items.Belt = benchmarkItem("bm-belt", "Stout Studded Belt", "Belt", "Magic", t, ["Physical"], {
      vitality: benchmarkBeltVitality[t],
      maxHealth: benchmarkBeltMaxHealth[t]
    });
  }

  return items;
};

const createBenchmarkSpellLoadout = (tier: number): CharacterRecord["spellLoadout"] => {
  const slot1 = { mainSpellId: "stormChain", supportSpellIds: ["fasterCasting", "moreDamage"] };

  if (tier >= 5) {
    return [slot1, { mainSpellId: "emberBurst", supportSpellIds: ["increasedCriticalChance", "fasterCasting"] }];
  }

  return [slot1];
};

const createTierBenchmarkCharacter = (base: CharacterRecord, tier: number): CharacterRecord => {
  const level = Math.max(1, tier * 2);
  const baseStats = createBenchmarkStatsForTier(tier);
  const equippedItems = createBenchmarkEquippedItemsForTier(tier);
  const spellLoadout = createBenchmarkSpellLoadout(tier);

  return normalizeCharacterRecord({
    ...base,
    name: `Benchmark Tier ${tier}`,
    level,
    baseStats,
    unspentStatPoints: 0,
    equippedItems,
    spellLoadout,
    mapProgress: {
      ...base.mapProgress,
      highestUnlockedTier: tier,
      lastCompletedTier: Math.max(0, tier - 1)
    }
  });
};

const resolveProfilePath = async (profileInput: string): Promise<string> => {
  const directPath = resolveInputPath(profileInput);

  try {
    await readFile(directPath, "utf8");
    return directPath;
  } catch {
    const namedProfilePath = path.resolve(defaultProfilesDirectory, `${profileInput}.json`);
    await readFile(namedProfilePath, "utf8");
    return namedProfilePath;
  }
};

const loadProfileCharacter = async (profileInput: string): Promise<{
  character: CharacterRecord;
  profileName: string;
}> => {
  const profilePath = await resolveProfilePath(profileInput);
  const fileContents = await readFile(profilePath, "utf8");
  const character = JSON.parse(fileContents) as CharacterRecord;
  return {
    character,
    profileName: path.basename(profilePath, path.extname(profilePath))
  };
};

const loginAndLoadCharacter = async (
  apiBaseUrl: string,
  email: string,
  password: string
): Promise<CharacterRecord> => {
  const loginResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    throw new Error(errorText || `Login failed with status ${loginResponse.status}.`);
  }

  const loginPayload = (await loginResponse.json()) as { token: string };
  const characterResponse = await fetch(`${apiBaseUrl}/api/characters/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${loginPayload.token}`
    }
  });

  if (!characterResponse.ok) {
    const errorText = await characterResponse.text();
    throw new Error(errorText || `Character load failed with status ${characterResponse.status}.`);
  }

  const loadedCharacter = (await characterResponse.json()) as CharacterRecord | null;

  if (!loadedCharacter) {
    throw new Error("No saved character was returned for this account.");
  }

  return loadedCharacter;
};

const loadOverrideFile = async (inputPath: string): Promise<SimulationBalanceOverrides> => {
  const overridePath = resolveInputPath(inputPath);
  const fileContents = await readFile(overridePath, "utf8");
  return JSON.parse(fileContents) as SimulationBalanceOverrides;
};

const saveProfile = async (filePath: string, character: CharacterRecord): Promise<void> => {
  const resolvedPath = resolveInputPath(filePath);
  await ensureParentDirectory(resolvedPath);
  await writeFile(resolvedPath, `${JSON.stringify(character, null, 2)}\n`, "utf8");
};

const saveReport = async (filePath: string, report: unknown): Promise<void> => {
  const resolvedPath = resolveInputPath(filePath);
  await ensureParentDirectory(resolvedPath);
  await writeFile(resolvedPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
};

const writeTierBenchmarkProfiles = async (
  baseCharacter: CharacterRecord,
  maxTier: number
): Promise<string[]> => {
  const savedPaths: string[] = [];

  for (let tier = 1; tier <= maxTier; tier += 1) {
    const benchmarkCharacter = createTierBenchmarkCharacter(baseCharacter, tier);
    const profilePath = path.resolve(defaultProfilesDirectory, `benchmark-tier${tier}.json`);
    await ensureParentDirectory(profilePath);
    await writeFile(profilePath, `${JSON.stringify(benchmarkCharacter, null, 2)}\n`, "utf8");
    savedPaths.push(profilePath);
  }

  return savedPaths;
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  const baseCharacterSource =
    args.profile !== null
      ? await loadProfileCharacter(args.profile)
      : args.email && args.password
        ? {
            character: await loginAndLoadCharacter(args.apiBaseUrl, args.email, args.password),
            profileName: "current-backend-character"
          }
        : await loadProfileCharacter("starter-caster");

  if (args.writeTierBenchmarks !== null) {
    const savedPaths = await writeTierBenchmarkProfiles(
      baseCharacterSource.character,
      args.writeTierBenchmarks
    );

    for (const savedPath of savedPaths) {
      console.log(`Saved ${savedPath}`);
    }

    return;
  }

  const characterSource =
    args.benchmarkTier !== null
      ? {
          character: createTierBenchmarkCharacter(baseCharacterSource.character, args.benchmarkTier),
          profileName: `benchmark-tier${args.benchmarkTier}`
        }
      : baseCharacterSource;
  const overrides = args.overrides ? await loadOverrideFile(args.overrides) : undefined;

  if (args.saveProfile) {
    await saveProfile(args.saveProfile, characterSource.character);
  }

  const summary = simulateMapRuns({
    profileName: characterSource.profileName,
    character: characterSource.character,
    mapId: args.mapId!,
    runs: args.runs,
    shopSamples: args.shopSamples,
    shopTier: args.shopTier ?? undefined,
    stepMs: args.stepMs,
    maxRunDurationMs: Math.round(args.maxRunSeconds * 1000),
    autoUseLifeFlaskThreshold: args.flaskThreshold,
    overrides
  });

  console.log(formatSimulationSummary(summary));

  if (args.output) {
    await saveReport(args.output, summary);
    console.log(`\nSaved report to ${resolveInputPath(args.output)}`);
  }

  if (args.saveProfile) {
    console.log(`Saved profile to ${resolveInputPath(args.saveProfile)}`);
  }
};

await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Simulation failed.");
  process.exitCode = 1;
});
