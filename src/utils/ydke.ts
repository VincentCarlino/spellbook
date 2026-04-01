export interface YdkeDecoded {
  main: number[];
  extra: number[];
  side: number[];
}

export function decodeYdke(ydkeStr: string): YdkeDecoded {
  if (!ydkeStr.startsWith('ydke://')) {
    throw new Error('Invalid ydke string: must start with "ydke://"');
  }
  const body = ydkeStr.slice('ydke://'.length);
  const parts = body.split('!');

  function parsePart(b64: string): number[] {
    if (!b64) return [];
    const binary = atob(b64);
    const result: number[] = [];
    for (let i = 0; i + 3 < binary.length; i += 4) {
      const code =
        binary.charCodeAt(i) |
        (binary.charCodeAt(i + 1) << 8) |
        (binary.charCodeAt(i + 2) << 16) |
        (binary.charCodeAt(i + 3) << 24);
      result.push(code >>> 0);
    }
    return result;
  }

  return {
    main: parsePart(parts[0] ?? ''),
    extra: parsePart(parts[1] ?? ''),
    side: parsePart(parts[2] ?? ''),
  };
}

export function encodeYdke(main: number[], extra: number[], side: number[]): string {
  function encodePart(ids: number[]): string {
    const buf = new Uint8Array(ids.length * 4);
    const view = new DataView(buf.buffer);
    ids.forEach((id, i) => view.setUint32(i * 4, id, true));
    return btoa(String.fromCharCode(...buf));
  }
  return `ydke://${encodePart(main)}!${encodePart(extra)}!${encodePart(side)}!`;
}
