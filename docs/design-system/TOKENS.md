# Tokens

## Naming and source

Tokens use `--xpex-{category}-{role}-{variant}` and live in `xpex-tokens.css`. Figma collections should omit the CSS prefix (for example `color/brand/secondary`) while Code Connect maps it to `--xpex-color-brand-secondary`.

| Group | Tokens | Intent |
| --- | --- | --- |
| Brand | `primary`, `secondary`, `accent`, `on-primary` | XPeX navy, orange, cyan, white |
| Background | `base`, `surface`, `elevated` | Page-to-overlay elevation |
| Text | `primary`, `secondary`, `muted` | Content hierarchy |
| Status | `success`, `warning`, `error`, `info` | Semantic feedback only |
| Spacing | `xs` through `2xl` | 4px-based layout scale |
| Radius | `sm` through `xl`, `full` | Controls, cards, heroes, pills |
| Shadow | `sm`, `md`, `lg` | Elevation, not decoration |
| Typography | `body`, `heading`, `display` | Stable font fallbacks |
| Motion | `fast`, `normal`, `slow`, `ease-standard` | Interaction timing |
| Breakpoint | `mobile`, `tablet`, `desktop`, `wide` | Documentation/JS parity |

Never use brand colors as status colors. Raw hex values belong in the token source only; legacy aliases in `xpex.css` are migration compatibility.
