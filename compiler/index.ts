
import { parseZen } from "./parse"
import { splitZen } from "./split"
import { emit } from "./emit"

export function compile(entry: string, outDir = "dist") {
  const zen = parseZen(entry)
  const { html, styles, scripts } = splitZen(zen)

  emit(outDir, html, styles, scripts)
}
