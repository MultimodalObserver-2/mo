import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import Markdown from "../../src/renderer/src/core/components/markdown/Markdown"

const render = (markdown: string): string =>
  renderToStaticMarkup(createElement(Markdown, null, markdown))

describe("Markdown", () => {
  describe("untrusted content", () => {
    it("does not render images", () => {
      const html = render("![tracking pixel](https://evil.example/p.png)")

      expect(html).not.toContain("<img")
      expect(html).not.toContain("evil.example")
    })

    it("does not render links, but keeps their text", () => {
      const html = render("See the [documentation](https://example.com/docs) for details.")

      expect(html).not.toContain("<a ")
      expect(html).not.toContain("href")
      expect(html).not.toContain("example.com")
      expect(html).toContain("documentation")
    })

    it("escapes raw HTML into text instead of rendering it", () => {
      const html = render('<img src=x onerror="alert(1)">\n\n<script>alert(1)</script>')

      // The markup survives as visible text, so `onerror` appears escaped rather
      // than as a live attribute. Asserting on the tags is what proves it is inert.
      expect(html).not.toContain("<img")
      expect(html).not.toContain("<script")
      expect(html).toContain("&lt;script&gt;")
    })
  })

  describe("supported formatting", () => {
    it("renders headings, emphasis and code", () => {
      const html = render("# Title\n\nUse **bold** and `npm run dev` to start.")

      expect(html).toContain("<h1")
      expect(html).toContain("<strong>bold</strong>")
      expect(html).toContain("<code>npm run dev</code>")
    })

    it("renders fenced code blocks", () => {
      const html = render("```\nconst a = 1\n```")

      expect(html).toContain("<pre")
      expect(html).toContain("const a = 1")
    })

    it("renders GFM task lists and tables", () => {
      const html = render(
        "- [x] done\n- [ ] pending\n\n| Option | Type |\n| --- | --- |\n| fps | number |"
      )

      expect(html).toContain('type="checkbox"')
      expect(html).toContain("<table")
      expect(html).toContain("<td>fps</td>")
    })
  })
})
