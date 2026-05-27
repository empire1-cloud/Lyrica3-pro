// Stub firebase — legacy studio components reference this
// Real persistence is handled by MongoDB via the Empire 1 backend

export const db = null;
export const auth = null;

export enum OperationType {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  LIST = 'LIST',
  CREATE = 'CREATE',
  GET = 'GET',
}

export const handleFirestoreError = (err: unknown, op?: OperationType, context?: string) => {
  console.warn('Firebase stub — operation not supported:', op, context, err);
};
