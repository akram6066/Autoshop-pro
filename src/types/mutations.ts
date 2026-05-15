export type MutationResult<T> =
  | { status: "success"; data: T }
  | { status: "offline"; data: T }
  | { status: "error"; error: Error };
