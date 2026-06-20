import React from "react";

// ── Syntax‑highlighting utility shared across all visualizer pages ──

const CODE_KEYWORDS = new Set([
    "break",
    "case",
    "class",
    "const",
    "continue",
    "default",
    "do",
    "else",
    "enum",
    "for",
    "if",
    "new",
    "return",
    "struct",
    "switch",
    "template",
    "this",
    "throw",
    "typedef",
    "using",
    "virtual",
    "while",
    "public",
    "static",
    "package",
    "import",
    "def",
    "print",
    "len",
    "range",
    "in",
    "and",
    "or",
    "not",
    "is",
    "elif",
    "try",
    "except",
    "finally",
    "with",
    "as",
    "pass",
    "from",
    "None",
    "True",
    "False",
]);

const CODE_TYPES = new Set([
    "bool",
    "char",
    "double",
    "float",
    "int",
    "long",
    "short",
    "void",
    "string",
    "vector",
    "std",
    "Scanner",
    "System",
    "String",
    "out",
    "println",
    "nextInt",
    "list",
    "dict",
    "set",
    "tuple",
    "map",
    "input",
]);

const TOKEN_REGEX =
    /\/\*[\s\S]*?\*\/|\/\/.*|"(?:\\.|[^"\\])*"|^\s*#.*$|\b\d+\b|\b[a-zA-Z_]\w*\b/gm;

function getTokenClass(token) {
    if (token.startsWith("//") || token.startsWith("/*") || token.startsWith("#"))
        return "text-emerald-400/80 italic";
    if (token.startsWith('"')) return "text-amber-300";
    if (token.trim().startsWith("#")) return "text-fuchsia-400";
    if (/^\d/.test(token)) return "text-orange-300";
    if (CODE_TYPES.has(token)) return "text-cyan-300 font-bold";
    if (CODE_KEYWORDS.has(token)) return "text-sky-300 font-bold";
    return "text-slate-100";
}

export function renderHighlightedCode(code) {
    const nodes = [];
    let lastIndex = 0;
    const safeCode = code || "";
    for (const match of safeCode.matchAll(TOKEN_REGEX)) {
        const token = match[0];
        const start = match.index;
        if (start > lastIndex) nodes.push(safeCode.slice(lastIndex, start));
        nodes.push(
            <span key={start} className={getTokenClass(token)}>
                {token}
            </span>,
        );
        lastIndex = start + token.length;
    }
    if (lastIndex < safeCode.length) nodes.push(safeCode.slice(lastIndex));
    return nodes;
}
