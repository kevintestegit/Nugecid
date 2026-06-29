import { createStaticFileServeOptions } from "./static-files.config";

describe("createStaticFileServeOptions", () => {
  it("serve public files and only public avatar uploads", () => {
    const options = createStaticFileServeOptions({
      get: <T = unknown>(key: string, defaultValue?: T): T =>
        (key === "UPLOAD_PATH" ? "/srv/sgc/uploads" : defaultValue) as T,
    });

    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ serveRoot: "/public" }),
        expect.objectContaining({
          rootPath: "/srv/sgc/uploads/avatars",
          serveRoot: "/uploads/avatars",
        }),
      ]),
    );
    expect(options).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ serveRoot: "/uploads" }),
      ]),
    );
  });
});
