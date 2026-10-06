# HandyNaija Typography Assets

This directory is designated for self-hosted custom fonts (e.g. `Plus Jakarta Sans`, `Inter`, or `Outfit`).
The default HandyNaija design system is pre-configured in `css/variables.css` using `Plus Jakarta Sans` imported via modern Google Fonts with robust system font fallbacks (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).

To use local fonts:
1. Place `.woff2` font files into this folder (`frontend/assets/fonts/`).
2. Add `@font-face` declarations in `frontend/css/variables.css`.
