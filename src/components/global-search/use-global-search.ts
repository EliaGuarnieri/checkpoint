import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";

import { requestNavigation } from "~/lib/navigation";
import { useCatalogSearch } from "~/modules/catalog/hooks";
import { useAddLibraryEntry, useLibraryEntries } from "~/modules/library/hooks";

import { getSearchResults, type SearchResult } from "./search-results";

const subscribePlatform = () => () => {};
const getIsMac = () => !/Windows|Linux|X11/i.test(navigator.userAgent);

export function useGlobalSearch() {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const adding = useRef(false);
  const catalogRetryFocused = useRef(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [addingTitle, setAddingTitle] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const isMac = useSyncExternalStore(subscribePlatform, getIsMac, () => true);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  useEffect(() => {
    const focusShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        event.altKey ||
        event.shiftKey ||
        (isMac
          ? !event.metaKey || event.ctrlKey
          : !event.ctrlKey || event.metaKey)
      )
        return;
      event.preventDefault();
      input.current?.focus();
    };
    document.addEventListener("keydown", focusShortcut);
    return () => document.removeEventListener("keydown", focusShortcut);
  }, [isMac]);

  const library = useLibraryEntries({
    enabled: open && query.trim().length > 0,
  });
  const catalog = useCatalogSearch(debouncedQuery, {
    enabled: open && debouncedQuery.length >= 2,
  });
  useEffect(() => {
    if (catalog.isSuccess && catalogRetryFocused.current) {
      catalogRetryFocused.current = false;
      input.current?.focus();
    }
  }, [catalog.isSuccess]);
  const add = useAddLibraryEntry();

  const catalogGames =
    library.isSuccess && debouncedQuery === query.trim() && catalog.isSuccess
      ? catalog.data
      : [];
  const { libraryMatches, catalogMatches, results } = getSearchResults(
    library.data ?? [],
    catalogGames,
    query,
  );
  const selectedIndex = activeIndex < results.length ? activeIndex : -1;
  const catalogPending =
    query.trim() !== debouncedQuery ||
    (catalog.isPending && !catalog.isFetched);
  const catalogRecovery =
    !catalogPending &&
    (catalog.isError || (catalog.isLoading && catalog.isFetched));
  const showPanel = open && query.trim().length > 0;

  const activateResult = (result: SearchResult) => {
    if (adding.current) return;
    if (result.kind === "catalog") {
      requestNavigation((replace) => {
        adding.current = true;
        setAddingTitle(result.game.title);
        add.mutate(result.game.id, {
          onSuccess: (id) => {
            setOpen(false);
            setQuery("");
            if (replace) router.replace(`/games/${id}`);
            else router.push(`/games/${id}`);
          },
          onSettled: () => {
            adding.current = false;
          },
        });
      });
      return;
    }
    const destination = `/games/${result.game.id}`;
    if (destination === window.location.pathname) {
      setOpen(false);
      setQuery("");
      return;
    }
    requestNavigation((replace) => {
      setOpen(false);
      setQuery("");
      if (replace) router.replace(destination);
      else router.push(destination);
    }, destination);
  };

  useEffect(() => {
    if (selectedIndex >= 0 && showPanel) {
      document
        .getElementById(`global-search-option-${selectedIndex}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, showPanel]);

  const changeQuery = (value: string) => {
    if (add.isError) add.reset();
    setQuery(value);
    setActiveIndex(-1);
    setOpen(true);
  };
  const clearQuery = () => {
    if (add.isError) add.reset();
    setQuery("");
    setActiveIndex(-1);
    input.current?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      input.current?.blur();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (results.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        event.key === "ArrowDown"
          ? (current + 1) % results.length
          : current <= 0
            ? results.length - 1
            : current - 1,
      );
      return;
    }
    if (event.key === "Enter" && selectedIndex >= 0) {
      event.preventDefault();
      activateResult(results[selectedIndex]);
    }
  };

  return {
    root,
    open,
    query,
    showPanel,
    inputProps: {
      inputRef: input,
      query,
      isMac,
      showPanel,
      selectedIndex,
      onQueryChange: changeQuery,
      onClear: clearQuery,
      onFocus: () => setOpen(true),
      onKeyDown,
    },
    panelProps: {
      query,
      libraryMatches,
      catalogMatches,
      selectedIndex,
      catalogPending,
      catalogRecovery,
      libraryState: {
        isError: library.isError,
        isPending: library.isPending,
        isSuccess: library.isSuccess,
      },
      addingState: {
        isPending: add.isPending,
        isError: add.isError,
        gameId: add.variables,
        title: addingTitle,
      },
      activateResult,
      retryCatalogProps: {
        isFetching: catalog.isFetching,
        onFocus: () => {
          catalogRetryFocused.current = true;
        },
        onBlur: () => {
          catalogRetryFocused.current = false;
        },
        onRetry: () => {
          if (catalog.isFetching) return;
          void catalog.refetch();
        },
      },
    },
  };
}
