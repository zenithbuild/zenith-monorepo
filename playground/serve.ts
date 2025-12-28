import { serve } from "bun"

serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url)
    const filePath =
      url.pathname === "/"
        ? "./playground/dist/index.html"
        : `./playground/dist${url.pathname}`

    try {
      const file = Bun.file(filePath)
      return new Response(file)
    } catch {
      return new Response("Not found", { status: 404 })
    }
  }
})

console.log("Zenith dev server running at http://localhost:3000")
