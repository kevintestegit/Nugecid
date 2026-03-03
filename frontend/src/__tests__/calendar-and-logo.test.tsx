import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import PrazosCalendar from "@/components/dashboard/PrazosCalendar";

describe("PrazosCalendar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 10, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("abre detalhes do dia por clique/foco em botão acessível", () => {
    render(
      <PrazosCalendar
        prazos={[
          {
            id: 1,
            titulo: "Prazo de teste",
            data: "2026-01-06",
            tipo: "solicitacao",
          },
        ]}
      />,
    );

    const dayButton = screen.getByRole("button", {
      name: /^6 de janeiro de 2026\./i,
    });

    fireEvent.click(dayButton);

    expect(dayButton).toHaveAttribute("aria-expanded", "true");
    const detailsId = dayButton.getAttribute("aria-controls");
    expect(detailsId).toBeTruthy();
    const detailsPanel = document.getElementById(detailsId ?? "");
    expect(detailsPanel).toHaveAttribute("role", "status");
    expect(detailsPanel).toHaveTextContent("6 de janeiro de 2026");
    expect(screen.getByText("Prazo de teste")).toBeInTheDocument();
    expect(screen.getByText(/Santos Reis/i)).toBeInTheDocument();
  });
});
