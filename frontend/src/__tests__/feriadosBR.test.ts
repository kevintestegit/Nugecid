import {
  calcularPascoa,
  feriadosMoveis,
  todosFeriados,
} from "@/constants/feriadosBR";

describe("feriadosBR", () => {
  it("calcula a data da pascoa corretamente", () => {
    const pascoa2026 = calcularPascoa(2026);

    expect(pascoa2026.getFullYear()).toBe(2026);
    expect(pascoa2026.getMonth()).toBe(3);
    expect(pascoa2026.getDate()).toBe(5);
  });

  it("classifica carnaval e corpus christi como ponto facultativo", () => {
    const feriados2026 = feriadosMoveis(2026);

    expect(feriados2026).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nome: "Carnaval (segunda)",
          tipo: "ponto_facultativo",
          data: "02-16",
        }),
        expect.objectContaining({
          nome: "Carnaval (terça)",
          tipo: "ponto_facultativo",
          data: "02-17",
        }),
        expect.objectContaining({
          nome: "Corpus Christi",
          tipo: "ponto_facultativo",
          data: "06-04",
        }),
      ]),
    );
  });

  it("mantem sexta-feira santa como feriado nacional e inclui feriados fixos", () => {
    const feriados2026 = todosFeriados(2026);

    expect(feriados2026).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nome: "Sexta-feira Santa",
          tipo: "nacional",
          data: "04-03",
        }),
        expect.objectContaining({
          nome: "Natal",
          tipo: "nacional",
          data: "12-25",
        }),
      ]),
    );
  });
});
