import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { installFakes, resetFakes } from "./fakes";

installFakes();

afterEach(() => {
  cleanup();
  resetFakes();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
