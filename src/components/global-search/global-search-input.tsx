/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-to-interactive-role -- The search uses the ARIA combobox pattern with custom game options. */

import { SearchIcon, XIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Kbd, KbdGroup } from "~/components/ui/kbd";

import type { useGlobalSearch } from "./use-global-search";

type Props = ReturnType<typeof useGlobalSearch>["inputProps"];

export function GlobalSearchInput({
  inputRef,
  query,
  isMac,
  showPanel,
  selectedIndex,
  onQueryChange,
  onFocus,
  onKeyDown,
  onClear,
}: Props) {
  return (
    <InputGroup className="h-10 bg-card">
      <InputGroupInput
        ref={inputRef}
        id="global-search"
        type="text"
        inputMode="search"
        autoComplete="off"
        aria-label="Cerca un gioco nella tua libreria e nel catalogo"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls={showPanel ? "global-search-results" : undefined}
        aria-activedescendant={
          showPanel && selectedIndex >= 0
            ? `global-search-option-${selectedIndex}`
            : undefined
        }
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        placeholder="Cerca nella tua libreria o nel catalogo…"
        className="h-full"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      />
      <InputGroupAddon align="inline-start">
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        {query.length > 0 ? (
          <InputGroupButton
            size="icon-sm"
            aria-label="Cancella ricerca"
            onClick={onClear}
          >
            <XIcon aria-hidden="true" />
          </InputGroupButton>
        ) : (
          <KbdGroup aria-hidden="true">
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        )}
      </InputGroupAddon>
    </InputGroup>
  );
}
