import fs from "fs"
import * as parse5 from "parse5"
import type { ZenFile, ScriptBlock, StyleBlock } from "./types"

export function parseZen(path: string): ZenFile {
  const source = fs.readFileSync(path, "utf-8");
  const document = parse5.parse(source);

  const scripts: ScriptBlock[] = [];
  const styles: StyleBlock[] = [];
  let scriptIndex = 0;
  let stylesIndex = 0;

  function extractTextContent(node: any): string {
    if (!node.childNodes?.length) return '';
    return node.childNodes
      .filter((n: any) => n.nodeName === '#text')
      .map((n: any) => n.value || '')
      .join('');
  }

  function walk(node: any) {
    if (node.nodeName === "script" && node.childNodes?.length) {
      const content = extractTextContent(node);
      scripts.push({ content, index: scriptIndex++ })
    }
    if (node.nodeName === "style" && node.childNodes?.length) {
      const content = extractTextContent(node);
      styles.push({
        content,
        index: stylesIndex++
      })
    }


    node.childNodes?.forEach(walk)
  }
  walk(document)

  return {
    html: source,
    scripts,
    styles
  }
}

/**
 * State declaration with location information for error reporting
 */
export interface StateDeclarationInfo {
  name: string;
  value: string;
  line: number;
  column: number;
  scriptIndex: number;
}

/**
 * Extract state declarations from script content with location information
 * Returns an array of StateDeclarationInfo for redeclaration detection
 */
export function extractStateDeclarationsWithLocation(
  scriptContent: string,
  scriptIndex: number
): StateDeclarationInfo[] {
  const declarations: StateDeclarationInfo[] = [];
  const lines = scriptContent.split('\n');
  
  // Match "state identifier = ..." pattern (captures everything after = until end of statement)
  // This regex matches: state <identifier> = <expression>
  const stateRegex = /state\s+(\w+)\s*=\s*([^;]+?)(?:\s*;|\s*$)/gm;
  let match;
  
  while ((match = stateRegex.exec(scriptContent)) !== null) {
    const name = match[1];
    const value = match[2];
    
    // Skip if match groups are missing (shouldn't happen with our regex, but TypeScript requires check)
    if (!name || value === undefined) {
      continue;
    }
    
    const matchIndex = match.index ?? 0;
    const trimmedValue = value.trim();
    
    // Calculate line and column from match index
    let line = 1;
    let column = 1;
    let currentIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i];
      if (!currentLine) continue;
      const lineLength = currentLine.length + 1; // +1 for newline
      if (currentIndex + lineLength > matchIndex) {
        line = i + 1;
        column = matchIndex - currentIndex + 1;
        break;
      }
      currentIndex += lineLength;
    }
    
    declarations.push({
      name,
      value: trimmedValue,
      line,
      column,
      scriptIndex
    });
  }
  
  return declarations;
}

/**
 * Extract state declarations from script content
 * Returns a Map of state name -> initial value expression
 * @deprecated Use extractStateDeclarationsWithLocation for redeclaration detection
 */
export function extractStateDeclarations(scriptContent: string): Map<string, string> {
  const states = new Map<string, string>();
  // Match "state identifier = ..." pattern (captures everything after = until end of statement)
  // This regex matches: state <identifier> = <expression>
  // We need to handle the expression which may contain commas, semicolons, etc.
  // For now, we'll match until the end of the line or semicolon
  const stateRegex = /state\s+(\w+)\s*=\s*([^;]+?)(?:\s*;|\s*$)/gm;
  let match;
  while ((match = stateRegex.exec(scriptContent)) !== null) {
    const name = match[1];
    const value = match[2];
    
    // Skip if match groups are missing (shouldn't happen with our regex, but TypeScript requires check)
    if (!name || value === undefined) {
      continue;
    }
    
    states.set(name, value.trim());
  }
  return states;
}

/**
 * Transform script content to remove state declarations (they'll be handled by runtime)
 */
export function transformStateDeclarations(scriptContent: string): string {
  // Remove state declarations - replace with empty line
  return scriptContent.replace(/state\s+\w+\s*=\s*[^;]+?(?:\s*;|\s*$)/gm, '');
}
