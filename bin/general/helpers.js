export function simplifyPath(path) {
  // Remove the './' before a path (if it exists).
  // Remove the ending '/' at the end of the path (if it exists).
  const simplifiedPath = path.replace(/^\.?\/?/, "").replace(/\/$/, "");
  return simplifiedPath;
}
