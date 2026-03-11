# AGENT.md

## Commands

```bash
npm run build      # Compile TypeScript to dist/
npm run test       # Run tests (vitest)
npm run lint       # Lint (oxlint)
npm run fmt        # Format (oxfmt)
npm run fmt:check  # Check formatting without writing
npm run start      # Run the CLI
npm run dev        # Build and run
```

## Code Change Checklist

After every code change, you MUST run:

1. `npm run fmt` — format all files
2. `npm run lint` — fix all lint errors before proceeding
3. `npm run build` — ensure TypeScript compiles without errors
4. `npm run test` — ensure all tests pass
