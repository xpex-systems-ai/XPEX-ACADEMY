# Figma MCP readiness

## Collection model

Create Figma variable collections for Color, Spacing, Radius, Shadow, Typography, Motion, and Breakpoint. Names mirror `TOKENS.md`; modes may be added only when matching code tokens exist. Components use documented properties (`tone`, `size`, `state`) rather than detached visual copies.

## Safe workflow

1. Read the code inventory and token source.
2. Match an existing code component by exact path.
3. Create Figma variants for applicable states and responsive intent.
4. Record differences; do not generate a duplicate implementation.
5. Validate accessibility and real data constraints.
6. Submit code and Figma changes for independent review.

MCP tooling must never receive secrets, session data, student records, or production credentials. Screenshots use synthetic/redacted fixtures only.
