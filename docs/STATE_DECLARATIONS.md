# State Declarations - Compiler Feature

## Overview

Zenith supports compile-time state declarations in `<script>` tags. The compiler registers these declarations and throws errors if a state variable is declared multiple times.

## Syntax

State declarations use the `state` keyword:

```html
<script>
  state count = 0;
  state name = "test";
  state isActive = true;
</script>
```

## Features

### ✅ Compile-Time Registration

State variables are registered at compile time, not runtime. The compiler:
- Parses all `<script>` tags in the `.zen` file
- Extracts state declarations with location information (line, column, script index)
- Registers them in the compiler's internal registry

### ✅ Redeclaration Detection

The compiler detects and throws errors for redeclarations:

**Single Script Redeclaration:**
```html
<script>
  state count = 0;
  state count = 1;  // ❌ Error: State variable "count" is declared multiple times
</script>
```

**Multiple Scripts Redeclaration:**
```html
<script>
  state count = 0;
</script>
<script>
  state count = 1;  // ❌ Error: State variable "count" is declared multiple times
</script>
```

### ✅ Error Messages

Errors include detailed location information:

```
Compiler Error: State variable "count" is declared multiple times.
  First declaration: script 1, line 2, column 3
  Second declaration: script 1, line 3, column 3
  State variables must be declared exactly once.
```

## Implementation Details

### Compiler Functions

- `extractStateDeclarationsWithLocation()` - Extracts state declarations with line/column info
- `splitZen()` - Main function that collects declarations and checks for redeclarations
- `StateRedeclarationError` - Custom error class for redeclaration errors

### Non-Breaking

- ✅ Does not modify runtime behavior
- ✅ Does not affect existing code
- ✅ Safe for Git merges (idempotent)
- ✅ Works with multiple `<script>` tags
- ✅ Compatible with imports and other code

## Testing

Run the test suite:

```bash
bun run playground/test-redeclaration.ts
```

This verifies:
1. Single script redeclaration detection
2. Multiple scripts redeclaration detection
3. Valid declarations compile successfully

## Usage in Text Bindings

State declarations are used with text bindings:

```html
<div>Count: { count }</div>
<script>
  state count = 0;
</script>
```

The compiler validates that all bindings reference declared states.

