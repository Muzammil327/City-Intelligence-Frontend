/**
 * Stands in for the `server-only` package during tests.
 *
 * `server-only` throws on import unless the bundler selects the `react-server`
 * condition, which Vitest does not. Aliasing it here lets a node-environment
 * test import a server module directly.
 *
 * This does not weaken the real boundary: `next build` still fails if a client
 * component imports a `server-only` module, and `.claude/stack.md` records the
 * rule.
 */
export {};
