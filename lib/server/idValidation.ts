const VALID_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidId(id: string): boolean {
  return VALID_ID.test(id);
}
