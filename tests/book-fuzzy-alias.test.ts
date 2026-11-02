import { describe, expect, it } from "vitest";
import { parsePassage, resolveBookAlias, tryParsePassage } from "../src/index";

describe("fuzzy book alias resolution", () => {
  it("resolves common misspellings for full book names", () => {
    expect(resolveBookAlias("genessis")).toBe("GEN");
    expect(resolveBookAlias("revelaiton")).toBe("REV");
  });

  it.each([
    ["Jhon 3:16", "JHN.3.16"],
    ["Pslam 23:1", "PSA.23.1"],
    ["Duet 6:4", "DEU.6.4"],
    ["Genisis 1:1", "GEN.1.1"],
    ["Romasn 8:28", "ROM.8.28"],
    ["Mathew 5:3", "MAT.5.3"],
    ["1 jhon 1:1", "1JN.1.1"],
    ["2 jhon 1:2", "2JN.1.2"],
    ["3 jhon 1:2", "3JN.1.2"],
    ["I Jhon 4:7-8", "1JN.4.7-8"],
    ["Second Jhon 1:2", "2JN.1.2"],
    ["Third Jhon 1:2", "3JN.1.2"],
    ["Jhon 3:35-4:2", "JHN.3.35-JHN.4.2"],
  ])("corrects misspellings in %s", (input, canonical) => {
    expect(parsePassage(input).canonical).toBe(canonical);
  });

  it("does not reinterpret a corrected numbered book to satisfy chapter caps", () => {
    const result = tryParsePassage("1 jhon 6:1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details).toMatchObject({ book: "1JN", maxChapter: 5 });
    }
  });

  it("preserves exact aliases instead of treating them as typos", () => {
    expect(parsePassage("Jud1").canonical).toBe("JUD.1");
    expect(parsePassage("Jon 2").canonical).toBe("JON.2");
    expect(parsePassage("1 Chr 1:1").canonical).toBe("1CH.1.1");
    expect(parsePassage("2 John 1:13").canonical).toBe("2JN.1.13");
    expect(resolveBookAlias("Ph")).toBeNull();
  });

  it("supports misspelled numbered book names", () => {
    expect(parsePassage("Second Corintians 5:17").canonical).toBe("2CO.5.17");
  });

  it("falls back to a chapter-valid alias when shorthand overflows", () => {
    expect(parsePassage("jon 12").canonical).toBe("JHN.12");
    expect(parsePassage("jon 2").canonical).toBe("JON.2");
  });

  it("does not resolve short ambiguous aliases", () => {
    expect(resolveBookAlias("jo")).toBeNull();
    // John and the registered Jonah alias "jona" are both one edit away.
    expect(resolveBookAlias("jonh")).toBeNull();
    expect(tryParsePassage("Jonh 3:16").ok).toBe(false);
  });

  it("does not map unrelated words", () => {
    expect(resolveBookAlias("kangaroo")).toBeNull();
  });
});
