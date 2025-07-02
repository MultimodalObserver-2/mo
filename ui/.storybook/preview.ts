import type { Preview } from "@storybook/react-vite"
import "@renderer/core/assets/base.css"

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo"
    },

    backgrounds: {
      options: {
        light: { name: "Light", value: "#f1f1f1" },
        primary900: { name: "Primary-900", value: "#001d1f" },
        primary800: { name: "Primary-800", value: "#002b30" },
        primary700: { name: "Primary-700", value: "#084b51" },
        primary600: { name: "Primary-600", value: "#266a72" },
        primary500: { name: "Primary-500", value: "#3a7980" },
        primary400: { name: "Primary-400", value: "#48868d" },
        primary300: { name: "Primary-300", value: "#5a9398" },
        primary200: { name: "Primary-200", value: "#80b9bf" },
        primary100: { name: "Primary-100", value: "#b0dee2" },
        primary50: { name: "Primary-50", value: "#cfe3e4" }
      },
      default: "primary700"
    }
  }
}

export default preview
