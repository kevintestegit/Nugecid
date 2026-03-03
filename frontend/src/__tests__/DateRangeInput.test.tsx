import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateRangeInput } from "@/components/ui/DateRangeInput";

describe("DateRangeInput", () => {
  it("aceita digitacao completa do ano no campo de data inicial", () => {
    const handleChange = vi.fn();

    render(
      <DateRangeInput
        value={{ startDate: null, endDate: null }}
        onChange={handleChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /selecione o período/i }),
    );

    const startInput = screen.getByLabelText(/data inicial/i);

    fireEvent.change(startInput, { target: { value: "01041999" } });

    expect(startInput).toHaveValue("01/04/1999");
    expect(handleChange).toHaveBeenLastCalledWith({
      startDate: new Date(1999, 3, 1),
      endDate: null,
    });
  });

  it("aceita ano 2026 corretamente no campo de data inicial", () => {
    const handleChange = vi.fn();

    render(
      <DateRangeInput
        value={{ startDate: null, endDate: null }}
        onChange={handleChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /selecione o período/i }),
    );

    const startInput = screen.getByLabelText(/data inicial/i);

    fireEvent.change(startInput, { target: { value: "01042026" } });

    expect(startInput).toHaveValue("01/04/2026");
    expect(handleChange).toHaveBeenLastCalledWith({
      startDate: new Date(2026, 3, 1),
      endDate: null,
    });
  });

  it("preserva ano com 4 digitos quando usuario edita campo existente", () => {
    const handleChange = vi.fn();

    render(
      <DateRangeInput
        value={{ startDate: null, endDate: null }}
        onChange={handleChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /selecione o período/i }),
    );

    const startInput = screen.getByLabelText(/data inicial/i);

    // Simula quando o input ja tem uma data formatada e usuario adiciona digitos
    // Por exemplo, se tinha "01/04/2025" e usuario quer mudar para "01/04/2026"
    fireEvent.change(startInput, { target: { value: "01/04/2026" } });

    expect(startInput).toHaveValue("01/04/2026");
    expect(handleChange).toHaveBeenLastCalledWith({
      startDate: new Date(2026, 3, 1),
      endDate: null,
    });
  });

  it("aceita ano com 4 digitos no campo de data final", () => {
    const handleChange = vi.fn();

    render(
      <DateRangeInput
        value={{ startDate: null, endDate: null }}
        onChange={handleChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /selecione o período/i }),
    );

    const endInput = screen.getByLabelText(/data final/i);

    fireEvent.change(endInput, { target: { value: "31122026" } });

    expect(endInput).toHaveValue("31/12/2026");
    expect(handleChange).toHaveBeenLastCalledWith({
      startDate: null,
      endDate: new Date(2026, 11, 31),
    });
  });

  it("permite digitar ano caractere por caractere", () => {
    const handleChange = vi.fn();

    render(
      <DateRangeInput
        value={{ startDate: null, endDate: null }}
        onChange={handleChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /selecione o período/i }),
    );

    const startInput = screen.getByLabelText(/data inicial/i);

    // Simula digitacao caractere por caractere como o usuario faria
    fireEvent.change(startInput, { target: { value: "0" } });
    expect(startInput).toHaveValue("0");

    fireEvent.change(startInput, { target: { value: "01" } });
    expect(startInput).toHaveValue("01");

    fireEvent.change(startInput, { target: { value: "010" } });
    expect(startInput).toHaveValue("01/0");

    fireEvent.change(startInput, { target: { value: "01/04" } });
    expect(startInput).toHaveValue("01/04");

    fireEvent.change(startInput, { target: { value: "01/042" } });
    expect(startInput).toHaveValue("01/04/2");

    fireEvent.change(startInput, { target: { value: "01/04/20" } });
    expect(startInput).toHaveValue("01/04/20");

    fireEvent.change(startInput, { target: { value: "01/04/202" } });
    expect(startInput).toHaveValue("01/04/202");

    fireEvent.change(startInput, { target: { value: "01/04/2026" } });
    expect(startInput).toHaveValue("01/04/2026");
    expect(handleChange).toHaveBeenLastCalledWith({
      startDate: new Date(2026, 3, 1),
      endDate: null,
    });
  });
});
