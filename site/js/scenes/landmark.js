import { DESTINATION } from "../config.js";
import { resolveDestination } from "../landmarks/index.js";

// The destination's landmark, whatever config.js names.
const { lines, decorate, wings } = resolveDestination(DESTINATION);
export default { id: "landmark", title: DESTINATION.name, lines, decorate, wings };
