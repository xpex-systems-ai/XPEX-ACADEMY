# Accessibility gates

- All operations are reachable with keyboard only and expose visible `:focus-visible` treatment.
- Inputs have programmatic labels; icon-only controls have accessible names.
- Status is not communicated by color alone. Async results use appropriate `status` or `alert` live semantics.
- Text and controls target WCAG 2.2 AA contrast; touch targets are at least 44×44 CSS pixels where practical.
- The shell provides a skip link and semantic landmarks. Dialog focus is trapped and restored by the existing Radix primitives.
- `prefers-reduced-motion: reduce` disables nonessential XPeX animation without applying global overrides.
- Heading levels describe page structure; cards do not invent heading hierarchy.

Review keyboard, zoom at 200%, screen-reader naming, contrast, reduced motion, and mobile reflow before visual approval.
