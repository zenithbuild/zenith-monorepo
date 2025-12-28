import type { ZenFile } from "./types"

export function splitZen(file: ZenFile) {
  return {
    html: file.html,
    scripts: file.scripts.map(s => s.content),
    styles: file.styles.map(style => style.content)
  }
}
