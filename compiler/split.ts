import type { ZenFile, StateBinding } from "./types"
import * as parse5 from "parse5"
import { extractStateDeclarations, extractStateDeclarationsWithLocation, transformStateDeclarations, type StateDeclarationInfo } from "./parse"

// Transform on* attributes to data-zen-* attributes during compilation
// Returns: { transformedHtml, eventTypes } where eventTypes is a Set of used event types
function transformEventAttributes(html: string): { transformedHtml: string; eventTypes: Set<string> } {
  const document = parse5.parse(html);
  const eventTypes = new Set<string>();
  
  function walk(node: any) {
    // Transform attributes on element nodes
    if (node.attrs && Array.isArray(node.attrs)) {
      node.attrs = node.attrs.map((attr: any) => {
        const attrName = attr.name.toLowerCase();
        // Check if attribute starts with "on" (event handler)
        if (attrName.startsWith('on') && attrName.length > 2) {
          // Convert onclick -> data-zen-click, onchange -> data-zen-change, etc.
          const eventType = attrName.slice(2); // Remove "on" prefix
          eventTypes.add(eventType); // Track which event types are used
          return {
            name: `data-zen-${eventType}`,
            value: attr.value
          };
        }
        return attr;
      });
    }
    
    // Recursively process child nodes
    if (node.childNodes) {
      node.childNodes.forEach(walk);
    }
  }
  
  walk(document);
  
  // Serialize back to HTML string
  return {
    transformedHtml: parse5.serialize(document),
    eventTypes
  };
}

/**
 * Transform text bindings { stateName } in text nodes to <span data-zen-bind="stateName"></span>
 * Returns transformed HTML and a map of state bindings
 */
function transformTextBindings(
  html: string,
  declaredStates: Set<string>
): { transformedHtml: string; stateBindings: Map<string, StateBinding> } {
  const document = parse5.parse(html);
  const stateBindings = new Map<string, StateBinding>();
  let bindingIndex = 0;

  function walk(node: any) {
    // Skip script and style nodes - their content is handled separately
    if (node.nodeName === 'script' || node.nodeName === 'style') {
      return;
    }

    if (!node.childNodes || !Array.isArray(node.childNodes)) {
      return;
    }

    const newChildNodes: any[] = [];
    
    for (const child of node.childNodes) {
      if (child.nodeName === '#text' && child.value) {
        const text = child.value;
        // Match { identifier } pattern - only simple identifiers, no expressions
        const bindingRegex = /\{\s*(\w+)\s*\}/g;
        const matches = Array.from(text.matchAll(bindingRegex));
        
        if (matches.length === 0) {
          // No bindings, keep the text node as-is
          newChildNodes.push(child);
        } else {
          // Validate all bindings reference declared states
          for (const match of matches) {
            const m = match as RegExpMatchArray;
            const stateName = m[1];
            if (!stateName || !declaredStates.has(stateName)) {
              throw new Error(
                `Compiler Error: Binding "{ ${stateName || 'unknown'} }" references undeclared state. ` +
                `Declared states: ${Array.from(declaredStates).join(', ') || '(none)'}`
              );
            }
          }

          // Split text by bindings and create nodes
          let lastIndex = 0;

          for (const match of matches) {
            const m = match as RegExpMatchArray;
            const stateName = m[1];
            if (!stateName) continue; // Skip if state name is missing (shouldn't happen)
            
            const matchStart = m.index!;
            const matchEnd = matchStart + m[0].length;

            // Add text before the binding
            if (matchStart > lastIndex) {
              const beforeText = text.substring(lastIndex, matchStart);
              if (beforeText) {
                newChildNodes.push({
                  nodeName: '#text',
                  value: beforeText,
                  parentNode: node
                });
              }
            }

            // Create span element for binding
            const bindId = `bind-${bindingIndex++}`;
            const spanNode = {
              nodeName: 'span',
              tagName: 'span',
              attrs: [
                {
                  name: 'data-zen-bind',
                  value: stateName
                },
                {
                  name: 'data-zen-bind-id',
                  value: bindId
                }
              ],
              childNodes: [],
              parentNode: node
            };
            newChildNodes.push(spanNode);

            // Track this binding
            if (!stateBindings.has(stateName)) {
              stateBindings.set(stateName, {
                stateName,
                bindings: []
              });
            }
            const binding = stateBindings.get(stateName)!;
            binding.bindings.push({
              stateName,
              nodeIndex: bindingIndex - 1
            });

            lastIndex = matchEnd;
          }

          // Add remaining text after last binding
          if (lastIndex < text.length) {
            const afterText = text.substring(lastIndex);
            if (afterText) {
              newChildNodes.push({
                nodeName: '#text',
                value: afterText,
                parentNode: node
              });
            }
          }
        }
      } else {
        // Not a text node, recurse into it
        walk(child);
        newChildNodes.push(child);
      }
    }
    
    node.childNodes = newChildNodes;
  }

  walk(document);

  return {
    transformedHtml: parse5.serialize(document),
    stateBindings
  };
}

// Transform :class and :value attributes to data-zen-* attributes
// Returns: { transformedHtml, bindings } where bindings contains attribute binding info
function transformAttributeBindings(html: string): { transformedHtml: string; bindings: Array<{ type: 'class' | 'value'; expression: string }> } {
  const document = parse5.parse(html);
  const bindings: Array<{ type: 'class' | 'value'; expression: string }> = [];
  
  function walk(node: any) {
    // Transform attributes on element nodes
    if (node.attrs && Array.isArray(node.attrs)) {
      node.attrs = node.attrs.map((attr: any) => {
        const attrName = attr.name;
        // Check if attribute is :class or :value (colon-prefixed)
        if (attrName === ':class' || attrName === ':value') {
          const bindingType = attrName.slice(1) as 'class' | 'value'; // Remove ":" prefix
          const expression = attr.value.trim(); // Store the quoted expression
          
          // Track this binding
          bindings.push({ type: bindingType, expression });
          
          // Transform to data-zen-* attribute
          return {
            name: `data-zen-${bindingType}`,
            value: expression // Store the expression string
          };
        }
        return attr;
      });
    }
    
    // Recursively process child nodes
    if (node.childNodes) {
      node.childNodes.forEach(walk);
    }
  }
  
  walk(document);
  
  // Serialize back to HTML string
  return {
    transformedHtml: parse5.serialize(document),
    bindings
  };
}

// Strip script and style tags from HTML since they're extracted to separate files
function stripScriptAndStyleTags(html: string): string {
  // Remove script tags (including content)
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  // Remove style tags (including content)
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  return html;
}

/**
 * Compiler error for state redeclaration
 */
export class StateRedeclarationError extends Error {
  constructor(
    public stateName: string,
    public firstDeclaration: StateDeclarationInfo,
    public secondDeclaration: StateDeclarationInfo
  ) {
    const firstLoc = `script ${firstDeclaration.scriptIndex + 1}, line ${firstDeclaration.line}, column ${firstDeclaration.column}`;
    const secondLoc = `script ${secondDeclaration.scriptIndex + 1}, line ${secondDeclaration.line}, column ${secondDeclaration.column}`;
    super(
      `Compiler Error: State variable "${stateName}" is declared multiple times.\n` +
      `  First declaration: ${firstLoc}\n` +
      `  Second declaration: ${secondLoc}\n` +
      `  State variables must be declared exactly once.`
    );
    this.name = 'StateRedeclarationError';
  }
}

// this function splits the props into what we are compiling the them down too 
// html styles and scripts
export function splitZen(file: ZenFile) {
  // Extract state declarations from all scripts with location information
  const allDeclarations: StateDeclarationInfo[] = [];
  for (let i = 0; i < file.scripts.length; i++) {
    const script = file.scripts[i];
    if (script) {
      const declarations = extractStateDeclarationsWithLocation(script.content, i);
      allDeclarations.push(...declarations);
    }
  }
  
  // Check for redeclarations and throw compile-time error
  const declaredStates = new Map<string, StateDeclarationInfo>();
  for (const declaration of allDeclarations) {
    const existing = declaredStates.get(declaration.name);
    if (existing) {
      throw new StateRedeclarationError(declaration.name, existing, declaration);
    }
    declaredStates.set(declaration.name, declaration);
  }
  
  // Convert to Map<string, string> for backward compatibility
  const stateMap = new Map<string, string>();
  declaredStates.forEach((info, name) => {
    stateMap.set(name, info.value);
  });

  // First transform event attributes
  const { transformedHtml: htmlAfterEvents, eventTypes } = transformEventAttributes(file.html);

  // Then transform attribute bindings (:class, :value)
  const { transformedHtml: htmlAfterAttributeBindings, bindings } = transformAttributeBindings(htmlAfterEvents);

  // Then transform text bindings (this will validate against declared states)
  const { transformedHtml: htmlAfterBindings, stateBindings } = transformTextBindings(
    htmlAfterAttributeBindings,
    new Set(stateMap.keys())
  );

  // Finally strip script/style tags
  const finalHtml = stripScriptAndStyleTags(htmlAfterBindings);

  // Transform scripts to remove state declarations (runtime will handle them)
  const transformedScripts = file.scripts.map(s => transformStateDeclarations(s.content));

  return {
    html: finalHtml,
    scripts: transformedScripts,
    styles: file.styles.map(style => style.content),
    eventTypes: Array.from(eventTypes).sort(), // Return sorted array of event types
    stateBindings: Array.from(stateBindings.values()), // Return array of state bindings
    stateDeclarations: stateMap, // Return map of state declarations (name -> value)
    bindings // Return attribute bindings for :class and :value
  }
}
