import { describe, expect, it } from "vitest";
import { deepMergePartial } from "../../src/core/config/merge.js";

describe("deepMergePartial", () => {
  it("merges top-level keys, incoming wins", () => {
    expect(deepMergePartial({ a: 1, b: 2 }, { b: 3, c: 4 })).toEqual({ a: 1, b: 3, c: 4 });
  });

  it("merges nested plain objects recursively", () => {
    expect(deepMergePartial({ a: { x: 1, y: 2 } }, { a: { y: 3, z: 4 } }))
      .toEqual({ a: { x: 1, y: 3, z: 4 } });
  });

  it("replaces arrays wholesale instead of merging them", () => {
    expect(deepMergePartial({ a: [1, 2, 3] }, { a: [9] })).toEqual({ a: [9] });
  });

  it("skips keys whose incoming value is undefined", () => {
    expect(deepMergePartial({ a: 1, b: 2 }, { a: undefined, b: 5 })).toEqual({ a: 1, b: 5 });
  });

  it("returns current unchanged when partial is undefined", () => {
    expect(deepMergePartial({ a: 1 }, undefined)).toEqual({ a: 1 });
  });

  it("replaces an object with a primitive when incoming is primitive", () => {
    expect(deepMergePartial({ a: { x: 1 } }, { a: 5 })).toEqual({ a: 5 });
  });

  it("does not mutate the current object", () => {
    const current = { a: { x: 1 } };
    deepMergePartial(current, { a: { y: 2 } });
    expect(current).toEqual({ a: { x: 1 } });
  });
});
