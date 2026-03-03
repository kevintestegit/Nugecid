import {
  buildMeiliVisibilityFilter,
  buildSearchDocumentId,
  isDocumentSearchType,
  SearchService,
} from "./search.service";
import { ConfigService } from "@nestjs/config";

describe("SearchService helpers", () => {
  it("identifica tipos documentais suportados", () => {
    expect(isDocumentSearchType("desarquivamento")).toBe(true);
    expect(isDocumentSearchType("planilha")).toBe(true);
    expect(isDocumentSearchType("usuario")).toBe(false);
  });

  it("gera ids estáveis para documentos indexados", () => {
    expect(buildSearchDocumentId("pasta", "abc")).toBe("pasta_abc");
  });

  it("monta filtro de visibilidade com tipo e papel do usuário", () => {
    expect(
      buildMeiliVisibilityFilter({
        currentUserId: 42,
        currentUserRoles: ["admin"],
        requestedTypes: ["desarquivamento", "planilha"],
      }),
    ).toBe(
      '(type = "desarquivamento" OR type = "planilha") AND (visibilityScope = "authenticated" OR allowedUserIds = 42 OR fullAccessRoles = "admin")',
    );
  });

  it("indexa planilha como documento restrito aos papéis administrativos", async () => {
    const service = new SearchService(
      {
        get: jest.fn((key: string, defaultValue?: string) =>
          key === "SEARCH_ENABLED" ? "false" : defaultValue,
        ),
      } as unknown as ConfigService,
      {
        getObject: jest.fn().mockResolvedValue({
          buffer: Buffer.from("coluna,valor\nnome,teste"),
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {
        findOne: jest.fn().mockResolvedValue({
          id: "planilha-1",
          nomeOriginal: "controle.csv",
          caminho: "planilhas/controle.csv",
          tamanhoBytes: "123",
          dataUpload: new Date("2026-04-01T10:00:00.000Z"),
        }),
      } as any,
    );

    const document = await (service as any).buildPlanilhaDocument("planilha-1");

    expect(document).toMatchObject({
      id: "planilha_planilha-1",
      entityId: "planilha-1",
      type: "planilha",
      visibilityScope: "restricted",
      allowedUserIds: [],
      fullAccessRoles: ["admin", "coordenador"],
    });
  });
});
