# Checkpoint

Checkpoint is a personal videogame journal. It records a player's relationship with games independently from the stores or platforms where those games are owned.

## Language

**Game**:
A videogame as a catalog work, independent from a player's ownership, progress, rating, or notes.
_Avoid_: Title, product, Steam game

**Library entry**:
A player's unique personal record for one game, independent from how many platforms or stores provide access to it. It includes a tracking status and optional rating and note.
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

**Ownership source**:
A store or platform through which the player has access to a game. Multiple ownership sources can refer to the same library entry.
_Avoid_: Platform game, game copy

**Catalog**:
A source of descriptive game metadata used for search and enrichment. It can be a live external service or a deterministic demo catalog with the same behavior.
_Avoid_: Library, database

**Steam import**:
A player-requested attempt to add owned Steam games to the personal library. It first previews new, existing, and unmatched games, then persists new games only after confirmation; repeating it never overwrites personal status, rating, or note.
_Avoid_: Steam sync, Steam login

**Match candidate**:
A catalog game proposed for a Steam game using normalized title similarity when no exact external identifier matches. It becomes a match only after player confirmation and is never persisted automatically.
_Avoid_: Match, matched game

**Unmatched game**:
A game reported by Steam that an import could not confidently associate with a catalog game.
_Avoid_: Failed game, missing game
