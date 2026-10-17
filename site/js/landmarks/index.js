import splitGate from "./split-gate.js";

// type → (params) => { lines, decorate }
export const LANDMARKS = { "split-gate": splitGate };

export function resolveDestination(cfg) {
  for (const field of ["name", "landmark", "copy"])
    if (cfg?.[field] == null) throw new Error(`destination.${field} is required`);
  const make = LANDMARKS[cfg.landmark.type];
  if (!make) throw new Error(`destination.landmark.type "${cfg.landmark.type}" is not one of: ${Object.keys(LANDMARKS).join(", ")}`);
  return make(cfg.landmark.params ?? {});
}
