import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import styles from "./markdown.module.css"

/**
 * Elements this component may render. Anything else is dropped, so a future
 * remark plugin cannot introduce new elements without this list being updated.
 *
 * `a` and `img` are deliberately absent. An `img` is the only node that reaches
 * out to a remote URL on its own, which lets a README confirm the reader's IP
 * and which plugin they opened. An `a` would reach the `setWindowOpenHandler`
 * in the main process and hand a third-party URL to the OS protocol handler via
 * `shell.openExternal`. `unwrapDisallowed` keeps the link text, so only the
 * navigation is lost.
 */
const ALLOWED_ELEMENTS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "hr",
  "ul",
  "ol",
  "li",
  "input",
  "strong",
  "em",
  "del",
  "code",
  "pre",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td"
]

interface MarkdownProps {
  /** Markdown source. Untrusted: authored by third parties. */
  children: string
}

/**
 * Renders untrusted markdown as a styled, read-only document.
 *
 * This renderer runs with `nodeIntegration: true` (see `main/index.ts`), so any
 * injected markup would be code execution on the user's machine rather than a
 * contained XSS. What makes this safe is that react-markdown does not render
 * raw HTML: the markdown grammar cannot express an event handler, so attributes
 * like `onerror` are unreachable. Adding `rehype-raw` would undo that, and
 * ALLOWED_ELEMENTS would not compensate — it filters elements, not attributes.
 *
 * @param props.children - The markdown source to render.
 */
export default function Markdown({ children }: MarkdownProps): React.ReactElement {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
