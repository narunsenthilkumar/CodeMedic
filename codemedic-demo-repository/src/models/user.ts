// Controlled Issue 3: TypeScript type mismatch error
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
}

// Deterministic TypeScript Type Error (TS2322)
// Property 'id' expects a string, but is assigned a number (101)
export const defaultAdmin: User = {
  id: 101, // TS2322: Type 'number' is not assignable to type 'string'
  name: 'CodeMedic Admin',
  email: 'admin@codemedic.dev',
  role: 'admin',
};
