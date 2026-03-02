export interface EvnexModelInfo {
  name: string;
  connector: string;
  cableLength: string;
  colour: string;
  power: string;
  powerSensor: string;
  configuration: string;
}

const DEFAULT_MODEL_INFO: EvnexModelInfo = {
  name: "Unknown",
  connector: "Unknown",
  cableLength: "Unknown",
  colour: "Unknown",
  power: "N/A",
  powerSensor: "N/A",
  configuration: "N/A",
};

// Lookup tables
const CONNECTOR_MAP: Record<string, string> = {
  "1": "Type 1",
  "2": "Type 2",
};

const NAME_MAP_E2: Record<string, string> = {
  E2: "E2 Plus",
  E2C: "E2 Core",
};

const CABLE_MAP_E2: Record<string, string> = {
  "5": "5 metres",
  "8": "8 metres",
};

const COLOUR_MAP: Record<string, string> = {
  SN: "Snow",
  ST: "Stone",
  SA: "Sand",
  VO: "Volcanic",
  W: "White",
  G: "Grey",
};

const POWER_MAP: Record<string, string> = {
  "7": "7 kW",
  "22": "22 kW",
};

const PS_MAP: Record<string, string> = {
  T: "External PS",
  P: "Onboard PS",
};

const CONFIG_MAP: Record<string, string> = {
  S: "Socket",
  T: "Tether",
};

export function parseModel(modelId: string): EvnexModelInfo {
  if (modelId.startsWith("E2")) {
    const dashIndex = modelId.indexOf("-");
    if (dashIndex === -1) return { ...DEFAULT_MODEL_INFO };

    const prefix = modelId.slice(0, dashIndex);
    const spec = modelId.slice(dashIndex + 1);

    return {
      name: NAME_MAP_E2[prefix] ?? prefix,
      connector: CONNECTOR_MAP[spec[0]!] ?? spec[0]!,
      cableLength: CABLE_MAP_E2[spec[1]!] ?? spec[1]!,
      colour: COLOUR_MAP[spec.slice(-2)] ?? spec.slice(-2),
      power: "N/A",
      powerSensor: "N/A",
      configuration: "N/A",
    };
  }

  if (modelId.startsWith("X")) {
    const parts = modelId.split("-", 3);
    if (parts.length < 3) return { ...DEFAULT_MODEL_INFO };

    const [series, spec, colourPart] = parts as [string, string, string];
    const powerKey = series.slice(1); // e.g. "7" or "22"

    return {
      name: series,
      connector: CONNECTOR_MAP[spec[1]!] ?? spec[1]!,
      cableLength: "N/A",
      colour: COLOUR_MAP[colourPart[0]!] ?? colourPart[0]!,
      power: POWER_MAP[powerKey] ?? powerKey,
      powerSensor: PS_MAP[spec[0]!] ?? spec[0]!,
      configuration: CONFIG_MAP[spec[2]!] ?? spec[2]!,
    };
  }

  if (modelId.startsWith("E7")) {
    const parts = modelId.split("-", 3);
    if (parts.length < 3) return { ...DEFAULT_MODEL_INFO };

    const [series, spec, colourPart] = parts as [string, string, string];

    return {
      name: series,
      connector: CONNECTOR_MAP[spec[1]!] ?? spec[1]!,
      cableLength: "N/A",
      colour: COLOUR_MAP[colourPart[0]!] ?? colourPart[0]!,
      power: "7",
      powerSensor: "N/A",
      configuration: CONFIG_MAP[spec[2]!] ?? spec[2]!,
    };
  }

  return { ...DEFAULT_MODEL_INFO };
}