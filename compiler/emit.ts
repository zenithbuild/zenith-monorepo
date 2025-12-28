import fs from "fs"
import path from "path"

export function emit(
  outDir: string,
  html: string,
  scripts: string[],
  styles: string[]
) {
  fs.mkdirSync(outDir, { recursive: true })

  const styleLinks = styles
    .map((_, i) => `<link rel="stylesheet" href="./style-${i}.css">`)
    .join("\n")

  const scriptTags = scripts
    .map((_, i) => `<script src="./script-${i}.js" defer></script>`)
    .join("\n")

  let outputHTML = html

  if (styleLinks) {
    outputHTML = outputHTML.includes("</head>")
      ? outputHTML.replace("</head>", `${styleLinks}\n</head>`)
      : `${styleLinks}\n${outputHTML}`
  }

  if (scriptTags) {
    outputHTML = outputHTML.includes("</body>")
      ? outputHTML.replace("</body>", `${scriptTags}\n</body>`)
      : `${outputHTML}\n${scriptTags}`
  }

  fs.writeFileSync(
    path.join(outDir, "index.html"),
    outputHTML
  )

  scripts.forEach((content, i) => {
    fs.writeFileSync(
      path.join(outDir, `script-${i}.js`),
      content
    )
  })

  styles.forEach((content, i) => {
    fs.writeFileSync(
      path.join(outDir, `style-${i}.css`),
      content
    )
  })
}
