// compiler/binding.ts
// Phase 2: Reactive text bindings runtime generator
// Generates code to update DOM when state values change

import type { StateBinding } from "./types"

export function generateBindingRuntime(
  stateBindings: StateBinding[],
  stateDeclarations: Map<string, string>
): string {
  if (stateBindings.length === 0 && stateDeclarations.size === 0) {
    return "";
  }

  const stateNames = Array.from(stateDeclarations.keys());

  // Generate binding update map - collect all nodes for each state
  // Order is preserved: bindings are processed in the order they appear in stateBindings array
  // (which matches DOM traversal order from compilation)
  const bindingMapEntries: string[] = [];
  const bindingMap = new Map<string, string[]>();
  
  // Iterate over stateBindings array to preserve compile-time order
  // Maps preserve insertion order, so this maintains deterministic ordering
  for (const stateBinding of stateBindings) {
    if (!bindingMap.has(stateBinding.stateName)) {
      bindingMap.set(stateBinding.stateName, []);
    }
    const selectors = bindingMap.get(stateBinding.stateName)!;
    // Push bindings in the order they appear in stateBinding.bindings array
    // This preserves the DOM traversal order from compilation
    for (const binding of stateBinding.bindings) {
      const bindId = `bind-${binding.nodeIndex}`;
      selectors.push(`span[data-zen-bind="${stateBinding.stateName}"][data-zen-bind-id="${bindId}"]`);
    }
  }

  // Generate update functions for each binding
  // Each function captures a DOM node reference directly
  // Map.entries() preserves insertion order, maintaining compile-time binding order
  for (const [stateName, selectors] of bindingMap.entries()) {
    if (selectors.length > 0) {
      // Generate an array of update functions, each capturing a node reference
      const updateFunctions = selectors.map((selector, index) => {
        const escapedSelector = selector.replace(/"/g, '\\"');
        // Create a function that captures the node and updates it
        // We'll query the node once during init, then the function captures it
        return `(function() {
        const node = document.querySelector("${escapedSelector}");
        return function(value) {
          if (node) node.textContent = String(value);
        };
      })()`;
      }).join(",\n      ");
      
      bindingMapEntries.push(
        `    "${stateName}": [\n      ${updateFunctions}\n    ]`
      );
    }
  }

  const bindingMapCode = bindingMapEntries.length > 0 
    ? `__zen_bindings = {\n${bindingMapEntries.join(",\n")}\n  };`
    : `__zen_bindings = {};`;

  // Generate state initialization code
  const stateInitCode = stateNames.map(name => {
    const initialValue = stateDeclarations.get(name) || "undefined";
    return `
  // Initialize state: ${name}
  (function() {
    let __zen_${name} = ${initialValue};
    Object.defineProperty(window, "${name}", {
      get: function() { return __zen_${name}; },
      set: function(value) {
        __zen_${name} = value;
        // Immediately trigger synchronous updates - no batching, no async
        __zen_update_bindings("${name}", value);
      },
      enumerable: true,
      configurable: true
    });
  })();`;
  }).join("");

  // Generate initialization call (after DOM is ready)
  const initBindingsCode = stateNames.map(name => {
    return `    __zen_update_bindings("${name}", ${name});`;
  }).join("\n");

  return `
// Phase 2: Reactive text bindings runtime
(function() {
  let __zen_bindings = {};

  // Update function for a specific state
  // Calls all registered update functions for the given state property
  // Executes synchronously, immediately, in compile-order (array order)
  // No batching, no async scheduling, no reordering
  function __zen_update_bindings(stateName, value) {
    const updaters = __zen_bindings[stateName];
    if (updaters) {
      // Execute update functions in deterministic order (compile-time order)
      // forEach executes synchronously, preserving array order
      updaters.forEach(updateFn => {
        if (typeof updateFn === 'function') {
          updateFn(value);
        }
      });
    }
  }

${stateInitCode}

  // Initialize binding map and bindings after DOM is ready
  function __zen_init_bindings() {
${bindingMapCode.split('\n').map(line => '    ' + line).join('\n')}
${initBindingsCode.split('\n').map(line => '    ' + line).join('\n')}
  }

  // Initialize bindings when DOM is ready (scripts are deferred, so DOM should be ready)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __zen_init_bindings);
  } else {
    __zen_init_bindings();
  }
})();
`;
}

