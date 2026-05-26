import { describe, it, expect, vi } from "vitest";
import { emitEvent } from "../../events";

describe("Workflow Cascading Loop Prevention", () => {
  it("should terminate immediately when depth is 5 or greater", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    
    // We emit an event with depth 5
    await emitEvent("org-123", "project.created", {}, 5);
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("due to excessive cascade depth")
    );
    
    consoleWarnSpy.mockRestore();
  });

  it("should terminate immediately when depth is greater than 5", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    
    // We emit an event with depth 6
    await emitEvent("org-123", "project.created", {}, 6);
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("due to excessive cascade depth")
    );
    
    consoleWarnSpy.mockRestore();
  });
});
