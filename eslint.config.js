import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Props MUI 9 no longer reads: React passes them to the HTML as unknown attributes and they do
// nothing (docs/ARCHITECTURE-AUDIT.md, finding 2). Select still reads inputProps, so only
// TextField's are listed. Box with component="svg" keeps width/height: those are SVG attributes.
const MUI_DEAD_PROPS = [
  {
    selector: "JSXOpeningElement[name.name='TextField'] > JSXAttribute[name.name=/^(inputProps|InputProps|InputLabelProps|FormHelperTextProps|SelectProps)$/]",
    message: "MUI 9 ignora esta prop de TextField: usa slotProps (htmlInput, input, inputLabel, formHelperText, select).",
  },
  {
    selector: "JSXOpeningElement[name.name='Dialog'] > JSXAttribute[name.name='PaperProps']",
    message: "MUI 9 ignora PaperProps: usa slotProps={{ paper: … }}.",
  },
  {
    selector: "JSXOpeningElement[name.name='ListItemText'] > JSXAttribute[name.name=/^(primary|secondary)TypographyProps$/]",
    message: "MUI 9 ignora esta prop de ListItemText: usa slotProps={{ primary: …, secondary: … }}.",
  },
  {
    selector: "JSXOpeningElement[name.name=/^(Typography|Box|Stack|Grid)$/] > JSXAttribute[name.name=/^(fontWeight|fontSize|fontStyle|fontFamily|textAlign|textTransform|letterSpacing|lineHeight|m|mt|mb|ml|mr|mx|my|p|pt|pb|pl|pr|px|py|bgcolor|alignItems|justifyContent|flexDirection|flexWrap|gap)$/]",
    message: "MUI 9 ya no lee las props de sistema: pásala en sx (sx={{ … }}).",
  },
]

export default defineConfig([
  globalIgnores(['dist', '.next', 'node_modules', 'next-env.d.ts']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.next,
    ],
    languageOptions: {
      globals: { ...globals.browser, process: "readonly" },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: { "no-restricted-syntax": ["error", ...MUI_DEAD_PROPS] },
  },
  {
    // TypeScript (routes, config, and the modules migrated from JS): same rules plus
    // typescript-eslint's recommended set; tsc (npm run typecheck) checks the types.
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.next,
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: { "no-restricted-syntax": ["error", ...MUI_DEAD_PROPS] },
  },
])
