import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { CommandMenu, CommandMenuTrigger } from "../command-menu";
import { useRouter } from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => {
  const pushMock = vi.fn();
  return {
    useRouter: vi.fn(() => ({
      push: pushMock,
    })),
    useParams: vi.fn(() => ({
      orgSlug: "acme-corp",
    })),
    usePathname: vi.fn(() => "/org/acme-corp/dashboard"),
  };
});

// Mock auth client
vi.mock("@/lib/auth/client", () => ({
  useSession: vi.fn(() => ({
    data: { 
      user: { id: "test-user-id", email: "test@example.com" },
      session: { activeOrganizationId: "org-1" }
    },
    isPending: false,
  })),
  useListOrganizations: vi.fn(() => ({
    data: [
      { id: "org-1", name: "Acme Corp", slug: "acme-corp" },
      { id: "org-2", name: "Second Org", slug: "second-org" }
    ],
    isPending: false,
  })),
}));

// Mock framer-motion cleanly with hoisted self-contained React imports
vi.mock("framer-motion", async (importOriginal) => {
  const React = await import("react");
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    motion: {
      div: (() => {
        const Component = React.forwardRef(({ children, ...props }: any, ref: any) => 
          React.createElement("div", { ref, ...props }, children)
        );
        Component.displayName = "MotionDiv";
        return Component;
      })(),
    },
  };
});

describe("CommandMenu Keyboard Navigation & Sequences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render search trigger button correctly", () => {
    const { getByText } = render(<CommandMenu />);
    expect(getByText("Buscar comandos...")).toBeDefined();
  });

  it("should render CommandMenuTrigger and dispatch event on click", () => {
    const { getByRole } = render(<CommandMenuTrigger />);
    const button = getByRole("button", { name: "Abrir menu de comando" });
    expect(button).toBeDefined();

    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");
    fireEvent.click(button);
    expect(dispatchEventSpy).toHaveBeenCalled();
    expect(dispatchEventSpy.mock.calls[0][0].type).toBe("toggle-command-menu");
  });

  it("should navigate to dashboard on typing key sequence 'g' then 'd'", () => {
    const mockRouter = useRouter();
    render(<CommandMenu />);

    // Simulate pressing 'g' then 'd' on window (sequential routing)
    fireEvent.keyDown(window, { key: "g" });
    fireEvent.keyDown(window, { key: "d" });

    expect(mockRouter.push).toHaveBeenCalledWith("/org/acme-corp/dashboard");
  });

  it("should navigate to security settings on typing key sequence 'g' then 's'", () => {
    const mockRouter = useRouter();
    render(<CommandMenu />);

    fireEvent.keyDown(window, { key: "g" });
    fireEvent.keyDown(window, { key: "s" });

    expect(mockRouter.push).toHaveBeenCalledWith("/org/acme-corp/settings/security");
  });

  it("should navigate to integrations on typing key sequence 'g' then 'i'", () => {
    const mockRouter = useRouter();
    render(<CommandMenu />);

    fireEvent.keyDown(window, { key: "g" });
    fireEvent.keyDown(window, { key: "i" });

    expect(mockRouter.push).toHaveBeenCalledWith("/org/acme-corp/settings/integrations");
  });

  it("should ignore key buffer if time limit of 1000ms is exceeded", async () => {
    const mockRouter = useRouter();
    render(<CommandMenu />);

    // Press 'g'
    fireEvent.keyDown(window, { key: "g" });

    // Wait 1.1 seconds
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Press 'd'
    fireEvent.keyDown(window, { key: "d" });

    // Should not route because buffer cleared
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
