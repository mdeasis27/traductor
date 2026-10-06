import { describe, expect, it } from "vitest";
import { routeQuestion } from "./route";

describe("routeQuestion", () => {
  it("refuses write requests even when they name a known table", () => {
    for (const text of ["drop customers", "elimina clientes", "delete all orders", "borra los pagos", "update customers set tier", "actualiza pedidos"]) {
      expect(routeQuestion(text), text).toBeNull();
    }
  });

  it("still routes read questions about the same tables", () => {
    expect(routeQuestion("list customers")?.template).toBe("list_all");
    expect(routeQuestion("cuántos pedidos hay")?.template).toBe("count_all");
  });
});
