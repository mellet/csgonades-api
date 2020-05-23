const StatusValues = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  deleted: "Deleted",
};

export type NadeStatus = keyof typeof StatusValues;

export function nadeValidStatus() {
  const maps: string[] = [];
  for (const key in StatusValues) {
    maps.push(key);
  }
  return maps;
}
