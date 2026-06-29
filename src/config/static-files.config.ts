import { join } from "path";

type StaticFileConfigService = {
  get<T = unknown>(key: string, defaultValue?: T): T;
};

export type StaticFileServeOption = {
  rootPath: string;
  serveRoot: string;
};

export function createStaticFileServeOptions(
  configService: StaticFileConfigService,
): StaticFileServeOption[] {
  const uploadPath = configService.get<string>("UPLOAD_PATH", "./uploads");

  return [
    {
      rootPath: join(__dirname, "..", "..", "public"),
      serveRoot: "/public",
    },
    {
      rootPath: join(uploadPath, "avatars"),
      serveRoot: "/uploads/avatars",
    },
  ];
}
