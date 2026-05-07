import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatSimulationSummary, simulateMapRuns } from "../src/game/simulation";
import type { SimulationBalanceOverrides } from "../src/game/simulation";
import type { CharacterRecord } from "../src/shared/types/saveTypes";

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

Required:
  --map <mapId>                     trainingGrounds, tier1Map, tier2Map, ...

Character source:
  --profile <name-or-path>          load a saved simulation profile JSON
  --email <email> --password <pw>   login to the backend and use the current saved character

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
    flaskThreshold: 0.45
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

  if (!parsed.mapId) {
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

  if (parsed.maxRunSeconds <= 0) {
    throw new Error("--max-run-seconds must be greater than 0.");
  }

  if (
    parsed.flaskThreshold !== null &&
    (parsed.flaskThreshold < 0 || parsed.flaskThreshold > 1)
  ) {
    throw new Error("--flask-threshold must be between 0 and 1, or 'none'.");
  }

  if (!parsed.profile && !(parsed.email && parsed.password)) {
    throw new Error("Provide either --profile <name-or-path> or --email with --password.");
  }

  return parsed;
};

const resolveInputPath = (inputPath: string): string =>
  path.isAbsolute(inputPath) ? inputPath : path.resolve(frontendRoot, inputPath);

const ensureParentDirectory = async (filePath: string): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
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

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  const characterSource =
    args.profile !== null
      ? await loadProfileCharacter(args.profile)
      : {
          character: await loginAndLoadCharacter(args.apiBaseUrl, args.email!, args.password!),
          profileName: "current-backend-character"
        };
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
