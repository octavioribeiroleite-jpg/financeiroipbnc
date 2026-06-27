export function bindMetodoRpc<T extends (...args: never[]) => unknown>(
  cliente: { rpc: T },
): T {
  return cliente.rpc.bind(cliente) as T;
}
