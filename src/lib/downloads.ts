/** Keep the format explicit, including in browsers that ignore the HTML download attribute. */
export function exportDownloadName(projectName: string, storedFile: string) {
  const match = storedFile.match(/^([a-zA-Z0-9_-]+)\.(mp4|png|webp|glb)$/);
  if (!match) throw new Error("Nombre de exportación no válido.");
  const label = projectName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return `BookStudio-${label || "produccion"}-${match[1].slice(0, 8)}.${match[2]}`;
}
