# Linter Warnings for State Declarations

## Expected Behavior

When using `state` declarations in `.zen` files, you may see linter warnings like:

```
Unexpected keyword or identifier.
```

**These warnings are expected and can be safely ignored.**

## Why These Warnings Appear

The `state` keyword is custom Zenith compiler syntax, not standard JavaScript. The linter (which treats `.zen` files as HTML/JavaScript) doesn't recognize this syntax and shows warnings.

## What Actually Happens

1. **Compiler processes `state` declarations** - The Zenith compiler extracts and processes all `state` declarations at compile time
2. **Declarations are removed from output** - The `state` lines are removed from the generated JavaScript
3. **Runtime code is generated** - The compiler generates proper JavaScript code to initialize state variables
4. **No runtime errors** - The generated JavaScript is valid and works correctly

## Example

**Input (app.zen):**
```html
<script>
  state count = 0;
  state message = "Hello";
</script>
```

**Generated Output (script-0.js):**
```javascript
// State declarations are removed and replaced with:
Object.defineProperty(window, "count", {
  get: function() { return __zen_count; },
  set: function(value) { /* ... */ }
});
// ... proper JavaScript code
```

## Verification

The compiler successfully processes state declarations:
- ✅ Build completes successfully
- ✅ Generated JavaScript is valid
- ✅ State variables work at runtime
- ✅ Redeclaration detection works

## Suppressing Warnings

If the warnings are distracting, you can:

1. **Add a comment block** at the top of your script:
```html
<script>
  /* 
   * Zenith Compiler: State Declarations
   * Linter errors for 'state' are expected and can be ignored.
   */
  state count = 0;
</script>
```

2. **Configure your editor** to ignore these specific warnings for `.zen` files

3. **Trust the compiler** - The warnings don't affect functionality

## Summary

- ⚠️ Linter warnings for `state` are **expected**
- ✅ The compiler handles `state` declarations correctly
- ✅ Generated JavaScript is valid
- ✅ No runtime errors occur
- ✅ You can safely ignore these warnings

