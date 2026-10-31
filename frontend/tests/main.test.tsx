import { act } from "@testing-library/react";
import { expect, it, vi } from "vitest";

it("starts the app in the root element", async () => {
  document.body.innerHTML = '<div id="root"></div>';
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
  await act(async () => {
    await import("../src/main");
  });
  expect(document.getElementById("root")!.textContent).toBe("booting...");
});
