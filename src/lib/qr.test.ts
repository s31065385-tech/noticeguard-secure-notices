import { describe, expect, it } from "vitest";
import { buildNoticeUrl, parseNoticeIdFromQr } from "./qr";

describe("QR notice access", () => {
  it("round-trips a notice id through the QR link", () => {
    const url = buildNoticeUrl("NG-20261111-AB12CD", "https://noticeguard.example");
    expect(url).toBe("https://noticeguard.example/verify/NG-20261111-AB12CD");
    expect(parseNoticeIdFromQr(url)).toBe("NG-20261111-AB12CD");
  });

  it("ignores QR codes that are not NoticeGuard links", () => {
    expect(parseNoticeIdFromQr("https://evil.example/login")).toBeNull();
    expect(parseNoticeIdFromQr("hello world")).toBeNull();
  });
});
