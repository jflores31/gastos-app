import { defineConfig } from "vitest/config"

export default defineConfig({
  // Components are .jsx without `import React`: use the automatic JSX runtime, as Next does.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    // Default environment is node (pure functions, route handlers). Component tests opt into
    // jsdom with a `// @vitest-environment jsdom` comment at the top of the file.
    environment: "node",
    include: ["src/**/*.test.{js,jsx}"],
  },
})
