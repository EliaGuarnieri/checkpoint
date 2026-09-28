# Checkpoint

Checkpoint is a personal videogame journal. It records a player's relationship with games independently from the stores or platforms where those games are owned.

## Language

**Game**:
A videogame as a catalog work, independent from a player's ownership, progress, rating, or notes.
_Avoid_: Title, product

**Library entry**:
A player's unique personal record for one game. It includes a tracking status and optional rating and note.
_Avoid_: Game, review, ownership

**Tracking status**:
The current stage of a library entry in the player's personal journey: backlog, playing, completed, or abandoned. Completed means the player considers the game concluded, not necessarily fully completed.
_Avoid_: Game status, progress

**Rating**:
An optional whole-number evaluation from 1 to 10 attached to a library entry. It is independent from tracking status.
_Avoid_: Score, stars

**Note**:
The single optional piece of personal text attached to a library entry.
_Avoid_: Review, journal entry

**Catalog**:
A source of descriptive game metadata used for search and enrichment. It can be a live external service or a deterministic demo catalog with the same behavior.
_Avoid_: Library, database
