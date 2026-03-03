import {
  buildClamAvInstreamFrames,
  parseClamAvResponse,
} from "./antivirus.service";

describe("AntivirusService helpers", () => {
  describe("parseClamAvResponse", () => {
    it("classifica resposta limpa do ClamAV", () => {
      expect(parseClamAvResponse("stream: OK")).toEqual({
        status: "clean",
        raw: "stream: OK",
      });
    });

    it("classifica resposta infectada e extrai assinatura", () => {
      expect(parseClamAvResponse("stream: Win.Test.EICAR_HDB-1 FOUND")).toEqual(
        {
          status: "infected",
          raw: "stream: Win.Test.EICAR_HDB-1 FOUND",
          signature: "Win.Test.EICAR_HDB-1",
        },
      );
    });

    it("classifica erro genérico do ClamAV", () => {
      expect(
        parseClamAvResponse("INSTREAM size limit exceeded. ERROR"),
      ).toEqual({
        status: "error",
        raw: "INSTREAM size limit exceeded. ERROR",
      });
    });
  });

  describe("buildClamAvInstreamFrames", () => {
    it("divide o buffer em frames e encerra com terminador nulo", () => {
      const frames = buildClamAvInstreamFrames(Buffer.from("abcdef"), 4);

      expect(frames).toHaveLength(5);
      expect(frames[0].readUInt32BE(0)).toBe(4);
      expect(frames[1].toString("utf8")).toBe("abcd");
      expect(frames[2].readUInt32BE(0)).toBe(2);
      expect(frames[3].toString("utf8")).toBe("ef");
      expect(frames[4].readUInt32BE(0)).toBe(0);
    });
  });
});
