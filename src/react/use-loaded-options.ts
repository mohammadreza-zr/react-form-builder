import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Control, type FieldValues, type Path, useWatch } from "react-hook-form";

import { toWatchSnapshot } from "../core/field-watch.js";
import type { FieldOption } from "../core/types.js";
import type { OptionsState } from "./adapter.js";
import type { OptionsLoader, OptionsPage } from "./config.js";

/**
 * Loads already started, per loader and per input and page: two fields with
 * the same loader and the same inputs share one request, and a field that
 * mounts again shows the answer it had. A load is aborted only when every
 * field waiting on it has gone; a failed or aborted load is forgotten, so the
 * next one retries. Each loader keeps its latest answers only.
 */
type Entry = { promise: Promise<OptionsPage>; controller: AbortController; users: number; settled: boolean };

const cache = new WeakMap<OptionsLoader<any>, Map<string, Entry>>();

/** How many answers a loader keeps for fields that come back. */
const KEPT = 64;

function toPage(answer: FieldOption[] | OptionsPage): OptionsPage {
  return Array.isArray(answer) ? { options: answer } : answer;
}

function subscribe(
  loader: OptionsLoader<any>,
  key: string,
  run: (signal: AbortSignal) => Promise<FieldOption[] | OptionsPage> | FieldOption[] | OptionsPage,
): { promise: Promise<OptionsPage>; leave: () => void } {
  let entries = cache.get(loader);
  if (!entries) {
    entries = new Map();
    cache.set(loader, entries);
  }
  const map = entries;
  let entry = map.get(key);
  if (!entry) {
    const controller = new AbortController();
    const created: Entry = {
      controller,
      users: 0,
      settled: false,
      promise: Promise.resolve().then(() => run(controller.signal)).then(toPage),
    };
    created.promise.then(
      () => {
        created.settled = true;
      },
      () => {
        created.settled = true;
        if (map.get(key) === created) map.delete(key);
      },
    );
    map.set(key, created);
    entry = created;
    // Oldest first: drop answers no field is waiting on once there are too many.
    for (const [old, kept] of map) {
      if (map.size <= KEPT) break;
      if (kept.settled && kept.users === 0) map.delete(old);
    }
  }
  const joined = entry;
  joined.users += 1;
  return {
    promise: joined.promise,
    leave: () => {
      joined.users -= 1;
      if (joined.users > 0 || joined.settled) return;
      joined.controller.abort();
      if (map.get(key) === joined) map.delete(key);
    },
  };
}

function forget(loader: OptionsLoader<any>, prefix: string) {
  const entries = cache.get(loader);
  if (!entries) return;
  for (const key of [...entries.keys()]) if (key.startsWith(prefix)) entries.delete(key);
}

function keyOf(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    // Inputs JSON cannot spell (a cycle, a BigInt) count as unchanged.
    return "";
  }
}

/** The pages' options as one list, each value once. */
function merge(pages: OptionsPage[]): FieldOption[] {
  if (pages.length === 1) return pages[0].options;
  const seen = new Set<string>();
  const out: FieldOption[] = [];
  for (const page of pages) {
    for (const option of page.options) {
      const id = String(option.value);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(option);
    }
  }
  return out;
}

/** How long a typed search waits for the next keystroke before it loads. */
const SEARCH_DELAY = 250;

const NOTHING = () => {};

const IDLE: OptionsState = {
  loading: false,
  loadingMore: false,
  error: null,
  search: "",
  setSearch: NOTHING,
  hasMore: false,
  loadMore: NOTHING,
  open: NOTHING,
  retry: NOTHING,
};

type LoadedConfig<T extends FieldValues> = {
  options?: FieldOption[];
  loadOptions?: OptionsLoader<T>;
  optionsDeps?: Path<T>[];
  optionsKey?: unknown;
  loadOn?: "mount" | "open";
  searchDelay?: number;
};

type Answer = { base: string; key: string; pages: OptionsPage[]; error: unknown };

/**
 * A field's options: its `options`, or what its `loadOptions` gives for the
 * current `optionsDeps` values, `optionsKey`, search text and pages. Without a
 * loader nothing is watched and nothing loads.
 */
export function useLoadedOptions<T extends FieldValues>(
  control: Control<T>,
  config: LoadedConfig<T>,
): { options: FieldOption[]; state: OptionsState } {
  const { loadOptions, optionsDeps, optionsKey, loadOn = "mount", searchDelay = SEARCH_DELAY } = config;
  const hasLoader = Boolean(loadOptions);
  const names = useMemo(() => optionsDeps ?? [], [optionsDeps]);
  const watched = useWatch({ control, name: names as never, disabled: !hasLoader }) as unknown[] | undefined;
  const values = useMemo(() => toWatchSnapshot(names, watched), [names, watched]);

  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    if (!hasLoader) return;
    const timer = setTimeout(() => setSearch(typed), searchDelay);
    return () => clearTimeout(timer);
  }, [typed, hasLoader, searchDelay]);

  const [opened, setOpened] = useState(loadOn === "mount");
  const [retries, setRetries] = useState(0);

  // `base` is what the list is for; `key` adds the search. A new search keeps
  // showing the last list until its answer comes; new inputs do not.
  const base = useMemo(() => keyOf([values, optionsKey ?? null]), [values, optionsKey]);
  const key = `${base}|${keyOf(search)}`;

  const [wanted, setWanted] = useState({ key, pages: 1 });
  const pages = wanted.key === key ? wanted.pages : 1;

  const [answer, setAnswer] = useState<Answer>({ base: "", key: "", pages: [], error: null });

  const loaderRef = useRef(loadOptions);
  useEffect(() => {
    loaderRef.current = loadOptions;
  });

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || !opened) return;
    let active = true;
    const subscriptions = Array.from({ length: pages }, (_, index) =>
      subscribe(loader, `${key}#${index + 1}`, (signal) => loader({ values, search, page: index + 1, signal })),
    );
    Promise.all(subscriptions.map((subscription) => subscription.promise)).then(
      (loaded) => {
        if (active) setAnswer({ base, key, pages: loaded, error: null });
      },
      (error: unknown) => {
        if (active) setAnswer((last) => ({ ...last, base, key, error }));
      },
    );
    return () => {
      active = false;
      for (const subscription of subscriptions) subscription.leave();
    };
    // `values` and `search` are in `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pages, opened, hasLoader, retries]);

  const current = answer.key === key;
  const last = current ? answer.pages.at(-1) : undefined;
  const hasMore = Boolean(last?.hasMore);
  const loadingMore = current && answer.pages.length < pages && !answer.error;
  const loading = hasLoader && opened && !current;

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    setWanted({ key, pages: pages + 1 });
  }, [hasMore, loadingMore, loading, key, pages]);

  const open = useCallback(() => setOpened(true), []);

  const retry = useCallback(() => {
    if (loaderRef.current) forget(loaderRef.current, `${key}#`);
    setRetries((count) => count + 1);
  }, [key]);

  const state = useMemo<OptionsState>(
    () =>
      hasLoader
        ? {
            loading,
            loadingMore,
            error: answer.key === key || answer.base === base ? answer.error : null,
            search: typed,
            setSearch: setTyped,
            hasMore,
            total: last?.total ?? (current ? answer.pages[0]?.total : undefined),
            loadMore,
            open,
            retry,
          }
        : IDLE,
    [hasLoader, loading, loadingMore, answer, key, base, typed, hasMore, last, current, loadMore, open, retry],
  );

  const options = useMemo(() => {
    if (!hasLoader || !opened) return config.options ?? [];
    if (answer.base === base && answer.pages.length) return merge(answer.pages);
    return config.options ?? [];
  }, [hasLoader, opened, answer, base, config.options]);

  return { options, state };
}
