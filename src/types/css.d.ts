declare module '*.css' {
  const content: Record<string, string>
  export default content
}

declare module './index.css' {
  const content: Record<string, string>
  export default content
}
