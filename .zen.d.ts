// Type definitions for .zen files
// This file tells the TypeScript linter that 'state' is a valid keyword in .zen files

declare global {
  // State declarations are valid in .zen script tags
  // The compiler processes these at compile time
  const state: never; // Prevent accidental use in regular TypeScript files
}

// Note: The 'state' keyword is processed by the Zenith compiler
// and transformed into runtime code. Linter errors for 'state' in .zen files
// are expected and can be ignored - the compiler handles them correctly.

export {};

