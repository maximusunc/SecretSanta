import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { isPrivateAddress } from "../src/lib/safeFetch";

describe("isPrivateAddress", () => {
  it.each(["127.0.0.1", "10.0.0.5", "192.168.1.20", "172.16.3.3", "100.101.102.103", "169.254.1.1", "::1", "fd7a:115c:a1e0::1", "::ffff:192.168.0.1"])(
    "blocks %s",
    (ip) => expect(isPrivateAddress(ip)).toBe(true),
  );
  it.each(["8.8.8.8", "151.101.1.69", "2606:4700::6810:84e5"])("allows %s", (ip) =>
    expect(isPrivateAddress(ip)).toBe(false),
  );
});
