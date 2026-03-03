import { ForbiddenException } from "@nestjs/common";

import { BackupController } from "./backup.controller";

describe("BackupController", () => {
  const backupService = {
    createFullBackup: jest.fn(),
    createDesarquivamentoBackup: jest.fn(),
    listBackups: jest.fn(),
    restoreBackup: jest.fn(),
    cleanOldBackups: jest.fn(),
    isHttpRestoreEnabled: jest.fn(),
  };

  let controller: BackupController;

  beforeEach(() => {
    controller = new BackupController(backupService as any);
    jest.clearAllMocks();
  });

  it("bloqueia restore via HTTP quando a flag está desabilitada", async () => {
    backupService.isHttpRestoreEnabled.mockReturnValue(false);

    await expect(
      controller.restoreBackup("backup_full_2026-04-01.tar.gz"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(backupService.restoreBackup).not.toHaveBeenCalled();
  });

  it("permite restore via HTTP quando a flag está habilitada", async () => {
    const result = { success: true, filename: "backup_full_2026-04-01.tar.gz" };
    backupService.isHttpRestoreEnabled.mockReturnValue(true);
    backupService.restoreBackup.mockResolvedValue(result);

    await expect(
      controller.restoreBackup("backup_full_2026-04-01.tar.gz"),
    ).resolves.toEqual(result);
    expect(backupService.restoreBackup).toHaveBeenCalledWith(
      "backup_full_2026-04-01.tar.gz",
    );
  });
});
