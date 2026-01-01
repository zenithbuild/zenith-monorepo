# Compiler-Only State Declarations - Implementation Guide

## Overview

The compiler-only state declaration feature allows Zenith to register state variables at compile time, detect redeclarations, and throw informative errors without modifying runtime behavior.

## Implementation Status

✅ **Fully Implemented and Tested**

- All TypeScript errors fixed
- Redeclaration detection working
- Location information (line, column, script index) included in errors
- Backward compatible with existing code
- Git-safe and idempotent

## Files Modified

### `compiler/parse.ts`

**Added:**
- `StateDeclarationInfo` interface - Contains name, value, line, column, scriptIndex
- `extractStateDeclarationsWithLocation()` - Extracts state declarations with location info

**Preserved:**
- `extractStateDeclarations()` - Backward compatible function
- `transformStateDeclarations()` - Existing transformation function

### `compiler/split.ts`

**Added:**
- `StateRedeclarationError` class - Custom error with detailed location information
- Redeclaration detection logic in `splitZen()`

**Enhanced:**
- `splitZen()` now uses `extractStateDeclarationsWithLocation()` for better error reporting

## TypeScript Safety

All TypeScript errors have been resolved:
- ✅ Proper null/undefined checks for regex match groups
- ✅ Safe array access with guards
- ✅ Correct type annotations
- ✅ No `any` types in public APIs

## Error Messages

Redeclaration errors include:
- State variable name
- First declaration location (script index, line, column)
- Second declaration location (script index, line, column)
- Clear explanation

Example:
```
Compiler Error: State variable "count" is declared multiple times.
  First declaration: script 1, line 2, column 3
  Second declaration: script 1, line 3, column 3
  State variables must be declared exactly once.
```

## Testing

Test files verify:
1. ✅ Single script redeclaration detection
2. ✅ Multiple scripts redeclaration detection  
3. ✅ Valid declarations compile successfully

Run tests:
```bash
bun run playground/test-redeclaration.ts
```

## Safety Features

- **Idempotent**: Safe to run multiple times
- **Git-safe**: Additive changes only, merge-friendly
- **Non-breaking**: Does not modify runtime behavior
- **Preserves code**: Existing code untouched
- **Multiple scripts**: Works across all `<script>` tags

## Usage

State declarations in `.zen` files:

```html
<script>
  state count = 0;
  state name = "test";
</script>
```

The compiler will:
1. Register all state declarations
2. Detect any redeclarations
3. Throw compile-time errors with location info
4. Continue with compilation if no errors

## Compiler Flow

1. `parseZen()` - Parses `.zen` file, extracts `<script>` tags
2. `splitZen()` - Calls `extractStateDeclarationsWithLocation()` for each script
3. Redeclaration check - Compares all declarations, throws error if duplicate found
4. Continue compilation - If no errors, proceed with normal compilation

## Backward Compatibility

- Existing `extractStateDeclarations()` function preserved
- Existing code continues to work
- New location-aware function is additive
- No breaking changes to public APIs

