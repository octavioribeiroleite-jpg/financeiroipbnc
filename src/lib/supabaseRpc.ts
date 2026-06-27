export function bindMetodoRpc<T>(cliente: { rpc: T }): T {
  const metodo = cliente.rpc as unknown as { bind(thisArg: unknown): T };
  return metodo.bind(cliente);
}
