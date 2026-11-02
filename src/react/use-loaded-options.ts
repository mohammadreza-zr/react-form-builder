import { useEffect, useMemo, useRef, useState } from "react";
import { type Control, type FieldValues, type Path, useWatch } from "react-hook-form";

import { toWatchSnapshot } from "../core/field-watch.js";
import type { FieldOption } from "../core/types.js";
import type { OptionsState } from "./adapter.js";
import type { OptionsLoader } from "./config.js";

/**
 * Loads already started, per loader and per input: two fields with the same
 * loader and the same inputs share one request, and a field that mounts again
 * shows the answer it had. A load is aborted only when every field waiting on
 * it has gone; a failed or aborted load is forgotten, so the next one retries.
 */
type Entry = { promise: Promise<FieldOption[]>; controller: AbortController; users: number; settled: boolean };

const cache = new WeakMap<OptionsLoader<any>, Map<string, Entry>>();

function subscribe(
  loader: OptionsLoader<any>,
  key: string,
  run: (signal: AbortSignal) => Promise<FieldOption[]> | FieldOption[],
): { promise: Promise<FieldOption[]>; leave: () => void } {
  let entries = cache.get(loader);
  if (!entries) {
    entries = new Map();
    cache.set(loader, entries);
  }
  let entry = entries.get(key);
  if (!entry) {
    const controller = new AbortController();
    const created: Entry = {
      controller,
      users: 0,
      settled: false,
      promise: Promise.resolve().then(() => run(controller.signal)),
    };
    created.promise.then(
      () => {
        created.settled = true;
      },
      () => {
        created.settled = true;
        if (entries.get(key) === created) entries.delete(key);
      },
    );
    entries.set(key, created);
    entry = created;
  }
  const joined = entry;
  joined.users += 1;
  return {
    promise: joined.promise,
    leave: () => {
      joined.users -= 1;
      if (joined.users > 0 || joined.settled) return;
      joined.controller.abort();
      if (entries.get(key) === joined) entries.delete(key);
    },
  };
}

/** How long a typed search waits for the next keystroke before it loads. */
const SEARCH_DELAY = 250;

const IDLE: OptionsState = { loading: false, error: null, search: "", setSearch: () => {} };

/**
 * A field's options: its `options`, or what its `loadOptions` gives for the
 * current `optionsDeps` values and search text. Without a loader nothing is
 * watched and nothing loads.
 */
export function useLoadedOptions<T extends FieldValues>(
  control: Control<T>,
  config: { options?: FieldOption[]; loadOptions?: OptionsLoader<T>; optionsDeps?: Path<T>[] },
): { options: FieldOption[]; state: OptionsState } {
  const { loadOptions, optionsDeps } = config;
  const names = useMemo(() => optionsDeps ?? [], [optionsDeps]);
  const watched = useWatch({ control, name: names as never, disabled: !loadOptions }) as unknown[] | undefined;
  const values = useMemo(() => toWatchSnapshot(names, watched), [names, watched]);

  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  const searchable = Boolean(loadOptions);
  useEffect(() => {
    if (!searchable) return;
    const timer = setTimeout(() => setSearch(typed), SEARCH_DELAY);
    return () => clearTimeout(timer);
  }, [typed, searchable]);

  const [result, setResult] = useState<{ key: string; options?: FieldOption[]; error: unknown }>({ key: "", error: null });
  const key = useMemo(() => {
    try {
      return JSON.stringify([values, search]);
    } catch {
      // Inputs JSON cannot spell (a cycle, a BigInt) load once per search.
      return JSON.stringify(["", search]);
    }
  }, [values, search]);

  const loaderRef = useRef(loadOptions);
  useEffect(() => {
    loaderRef.current = loadOptions;
  });

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;
    let active = true;
    const { promise, leave } = subscribe(loader, key, (signal) => loader({ values, search, signal }));
    promise.then(
      (options) => {
        if (active) setResult({ key, options, error: null });
      },
      (error: unknown) => {
        if (active) setResult((last) => ({ key, options: last.options, error }));
      },
    );
    return () => {
      active = false;
      leave();
    };
    // `values` and `search` are in `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, Boolean(loadOptions)]);

  const state = useMemo<OptionsState>(
    () =>
      loadOptions
        ? { loading: result.key !== key, error: result.error, search: typed, setSearch: setTyped }
        : IDLE,
    [loadOptions, result, key, typed],
  );

  return { options: (loadOptions && result.options) || config.options || [], state };
}
