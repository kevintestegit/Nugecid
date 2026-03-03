import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("@/services/api", () => ({
  api: apiMock,
}));

import backupService from "@/services/backupService";

describe("backupService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usa timeout estendido para criar backup completo", async () => {
    apiMock.post.mockResolvedValue({
      data: {
        success: true,
      },
    });

    await backupService.createFullBackup();

    expect(apiMock.post).toHaveBeenCalledWith("/backup/full", undefined, {
      timeout: 600000,
    });
  });

  it("usa timeout ainda maior para restaurar backup", async () => {
    apiMock.post.mockResolvedValue({
      data: {
        success: true,
      },
    });

    await backupService.restoreBackup("backup_full_2026-03-24.tar.gz");

    expect(apiMock.post).toHaveBeenCalledWith(
      "/backup/restore/backup_full_2026-03-24.tar.gz",
      undefined,
      {
        timeout: 900000,
      },
    );
  });
});
