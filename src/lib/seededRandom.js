export function hashToFloat01(str) {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h << 13; h ^= h >>> 7; h ^= h << 17;
  return (h >>> 0) / 4294967295;
}
export function seededRandom(seed) {
  let s = hashToFloat01(seed) * 1e9;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967295); };
}
