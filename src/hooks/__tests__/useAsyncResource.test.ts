/**
 * useAsyncResource.test.ts — generic async loader hook.
 *
 * Traced behaviour from source:
 *   - loading starts true; loader runs on mount.
 *   - success → data set, error null, loading false.
 *   - failure → error = err.message (or default string for non-Error throws),
 *     data stays at its previous value, loading false.
 *   - reload() bumps an internal counter → re-runs the loader, resetting
 *     loading=true and error=null first.
 *   - deps change re-creates `run` → effect re-runs the loader.
 *   - QUIRK: the hook has NO unmount/cancellation guard (no mounted ref). It
 *     simply calls setState in finally; React just warns if that lands after
 *     unmount. We only assert that unmounting does not throw.
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useAsyncResource } from "@/hooks/useAsyncResource";

describe("useAsyncResource", () => {
  it("starts in the loading state with null data and null error", () => {
    // A never-resolving loader keeps us in the initial state.
    const { result } = renderHook(() =>
      useAsyncResource(() => new Promise<string>(() => {}))
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("resolves: sets data, clears loading, leaves error null", async () => {
    const { result } = renderHook(() =>
      useAsyncResource(() => Promise.resolve({ value: 42 }))
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ value: 42 });
    expect(result.current.error).toBeNull();
  });

  it("calls the loader exactly once on mount", async () => {
    const loader = jest.fn(() => Promise.resolve("ok"));
    const { result } = renderHook(() => useAsyncResource(loader));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("rejection with an Error: surfaces err.message and clears loading", async () => {
    const { result } = renderHook(() =>
      useAsyncResource(() => Promise.reject(new Error("boom")))
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("boom");
    expect(result.current.data).toBeNull();
  });

  it("rejection with a non-Error: falls back to the default message", async () => {
    const { result } = renderHook(() =>
      // reject with a string (not an Error instance)
      useAsyncResource(() => Promise.reject("plain string"))
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Failed to load. Please try again.");
  });

  it("reload() re-runs the loader and refreshes data", async () => {
    let call = 0;
    const loader = jest.fn(() => Promise.resolve(`call-${++call}`));
    const { result } = renderHook(() => useAsyncResource(loader));

    await waitFor(() => expect(result.current.data).toBe("call-1"));
    expect(loader).toHaveBeenCalledTimes(1);

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.data).toBe("call-2"));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("reload() clears a previous error when the retry succeeds", async () => {
    let attempt = 0;
    const loader = jest.fn(() => {
      attempt += 1;
      return attempt === 1
        ? Promise.reject(new Error("first fails"))
        : Promise.resolve("recovered");
    });
    const { result } = renderHook(() => useAsyncResource(loader));

    await waitFor(() => expect(result.current.error).toBe("first fails"));

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.data).toBe("recovered"));
    expect(result.current.error).toBeNull();
  });

  it("re-runs the loader when deps change", async () => {
    const loader = jest.fn((id: number) => Promise.resolve(`data-${id}`));
    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useAsyncResource(() => loader(id), [id]),
      { initialProps: { id: 1 } }
    );

    await waitFor(() => expect(result.current.data).toBe("data-1"));
    expect(loader).toHaveBeenCalledTimes(1);

    rerender({ id: 2 });

    await waitFor(() => expect(result.current.data).toBe("data-2"));
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("does NOT re-run the loader on a re-render when deps are unchanged", async () => {
    const loader = jest.fn(() => Promise.resolve("stable"));
    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useAsyncResource(() => loader(id), [id]),
      { initialProps: { id: 1 } }
    );
    await waitFor(() => expect(result.current.data).toBe("stable"));
    rerender({ id: 1 }); // same dep
    // give any (unexpected) extra run a chance to fire
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("unmounting mid-flight does not throw (no cancellation guard in source)", async () => {
    const { unmount } = renderHook(() =>
      useAsyncResource(() => new Promise<string>(() => {}))
    );
    expect(() => unmount()).not.toThrow();
  });
});
