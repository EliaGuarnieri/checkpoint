# Coding standards

- Use domain vocabulary from `CONTEXT.md` in types, functions, tests, and UI copy.
- Organize business code by capability under `src/modules`; keep external and database details behind service interfaces.
- Model expected failures as tagged errors. Do not throw for domain or integration outcomes.
- Decode untrusted data at system boundaries with Effect Schema.
- Tests exercise public service interfaces and observable behavior, not private helpers.
- UI uses installed shadcn components, semantic theme tokens, accessible labels, and Base UI composition rules.
- Prefer small named functions and immutable data. Avoid speculative abstractions and type assertions.
- Never commit credentials, generated build output, or local environment files.
