// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import { useFieldWatch } from "../src/index.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Values = { latitude?: number; longitude?: number };

let cleanup: (() => void) | undefined;
afterEach(() => cleanup?.());

describe("useFieldWatch", () => {
  it("publishes nothing until both coordinates are filled, then the pair", async () => {
    const seen: unknown[] = [];
    let setValue!: ReturnType<typeof useForm<Values>>["setValue"];
    function Surface({ control }: { control: ReturnType<typeof useForm<Values>>["control"] }) {
      seen.push(useFieldWatch<Values>(control, { watch: ["latitude", "longitude"] }));
      return null;
    }
    function Harness() {
      const form = useForm<Values>();
      setValue = form.setValue;
      return <Surface control={form.control} />;
    }
    const host = document.createElement("div");
    const root = createRoot(host);
    cleanup = () => act(() => root.unmount());
    await act(async () => root.render(<Harness />));
    expect(seen.at(-1)).toBeNull();

    await act(async () => setValue("latitude", 35));
    expect(seen.at(-1)).toBeNull();

    await act(async () => setValue("longitude", 51));
    expect(seen.at(-1)).toEqual({ latitude: 35, longitude: 51 });
  });
});
