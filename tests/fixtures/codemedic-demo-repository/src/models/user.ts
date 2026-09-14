export interface User {
  id: string;
  name: string;
}

// Controlled Issue 3: TypeScript type mismatch error (TS2322)
export const defaultUser: User = {
  id: 100, // TS2322: Type 'number' is not assignable to type 'string'
  name: 'Demo User',
};
