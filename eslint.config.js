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

// T16: design values live in src/theme/ and in each component's *.styles.ts (sx), or in a CSS
// Module for what MUI doesn't style (docs/PROJECT-STRUCTURE.md → "Estilos"). A colour literal
// or a style={{}} in a component skips them. Tests may use colours as data. A colour is a #hex
// after the start, a space, "(" or ",", or rgb()/hsl(); url(#id) and href="#id" point at an
// element instead. src/stylesLint.test.js checks the rule.
const COLOR = String.raw`(?:^|[\s(,])(?<!url\()#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\b(?:rgba?|hsla?)\(`
const STYLES_OUT_OF_COMPONENTS = [
  {
    selector: `Literal[value=/${COLOR}/]:not(JSXAttribute[name.name=/^(href|xlinkHref)$/] > Literal), TemplateElement[value.raw=/${COLOR}/]`,
    message: "Color literal en un componente: va en src/theme/ o en el *.styles.ts del componente.",
  },
  {
    selector: "JSXAttribute[name.name='style']",
    message: "style={{}}: usa sx desde el *.styles.ts del componente, o un CSS Module si no es de MUI.",
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
  {
    // Components. The rule's options replace the ones above, so the MUI list goes again.
    files: ['src/**/*.{jsx,tsx}'],
    ignores: ['src/theme/**', '**/*.test.*'],
    rules: { "no-restricted-syntax": ["error", ...MUI_DEAD_PROPS, ...STYLES_OUT_OF_COMPONENTS] },
  },
])
