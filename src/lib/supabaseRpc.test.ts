import { describe, expect, it } from "vitest";
import { bindMetodoRpc } from "./supabaseRpc";

describe("bindMetodoRpc", () => {
  it("preserva o contexto interno do cliente", () => {
    const cliente = {
      rest: { ativo: true },
      rpc(this: { rest: { ativo: boolean } }) {
        return this.rest.ativo;
      },
    };

    const rpc = bindMetodoRpc(cliente);

    expect(rpc()).toBe(true);
  });
});
