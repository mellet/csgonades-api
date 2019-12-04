export function extractGfyIdFromIdOrUrl(gfycatIdOrUrl: string): string {
  const index = gfycatIdOrUrl.lastIndexOf("/");
  const gfyId = gfycatIdOrUrl.substr(index + 1);
  return gfyId;
}
