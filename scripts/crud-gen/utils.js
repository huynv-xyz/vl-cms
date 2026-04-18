export function toPascalCase(str) {
    return str
        .split(/[-_]/)                // tách theo - hoặc _
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join("")
}

export function toCamelCase(str) {
    const pascal = toPascalCase(str)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}