type OmitThisParameter<T> = T extends (this: infer _, ...args: infer A) => infer R ? (...args: A) => R : T;

export function bindMetodoRpc<T>(cliente: { rpc: T }): OmitThisParameter<T> {
  const metodo = cliente.rpc as unknown as { bind(thisArg: unknown): T };
  return metodo.bind(cliente) as OmitThisParameter<T>;
}
