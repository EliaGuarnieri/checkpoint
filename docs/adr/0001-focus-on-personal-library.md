# Focus Checkpoint on the personal library

Checkpoint no longer imports Steam libraries. The project keeps manual addition from the demo or live RAWG catalog and uses Effect for catalog requests, validation, dependencies, and persistence. Import reconciliation and ownership-source tracking added substantial work beyond the core learning goal, so the Steam integration and its ownership-source table are removed. The migration discards stored ownership associations while preserving games and personal library entries.
