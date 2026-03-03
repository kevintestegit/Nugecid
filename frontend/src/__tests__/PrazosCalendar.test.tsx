import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import PrazosCalendar from "@/components/dashboard/PrazosCalendar";

describe("PrazosCalendar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 1, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("abre detalhes de prazo e feriado por clique e fecha com Escape", () => {
    render(
      <PrazosCalendar
        prazos={[
          {
            id: 1,
            titulo: "Prazo de devolucao PCI-001",
            data: "2026-02-16",
            tipo: "devolucao",
            urgente: true,
          },
        ]}
      />,
    );

    const dayButton = screen.getByRole("button", {
      name: /16 de fevereiro de 2026/i,
    });

    fireEvent.click(dayButton);

    expect(dayButton).toHaveAttribute("aria-expanded", "true");
    const detailsId = dayButton.getAttribute("aria-controls");
    expect(detailsId).toBeTruthy();
    const detailsPanel = document.getElementById(detailsId ?? "");
    expect(detailsPanel).toHaveAttribute("role", "status");
    expect(detailsPanel).toHaveTextContent("16 de fevereiro de 2026");
    expect(detailsPanel).toHaveTextContent("Ponto facultativo");
    expect(
      within(detailsPanel as HTMLElement).getByText("Carnaval (segunda)"),
    ).toBeInTheDocument();
    expect(
      within(detailsPanel as HTMLElement).getByText(
        "Prazo de devolucao PCI-001",
      ),
    ).toBeInTheDocument();

    fireEvent.keyDown(dayButton, { key: "Escape" });

    expect(dayButton).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(detailsId ?? "")).not.toBeInTheDocument();
  });

  it("mostra a legenda com marcadores de feriado e ponto facultativo", () => {
    render(<PrazosCalendar prazos={[]} />);

    expect(screen.getByText("Feriado")).toBeInTheDocument();
    expect(screen.getByText("Ponto facultativo")).toBeInTheDocument();
  });
});
