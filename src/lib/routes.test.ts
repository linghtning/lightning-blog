import { describe, it, expect } from "vitest";
import { matchRoute } from "./routes";

describe("matchRoute", () => {
  it("matches home route", () => {
    const route = matchRoute("/");
    expect(route).toEqual({ name: "home" });
  });

  it("matches timeline route", () => {
    const route = matchRoute("/timeline");
    expect(route).toEqual({ name: "timeline" });
  });

  it("matches article route", () => {
    const route = matchRoute("/articles/test-article");
    expect(route).toEqual({ name: "article", slug: "test-article" });
  });
});
