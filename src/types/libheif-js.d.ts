declare module "libheif-js/wasm-bundle" {
  interface HeifImage {
    get_width(): number;
    get_height(): number;
    display(
      target: { data: Uint8ClampedArray; width: number; height: number },
      callback: (image: { data: Uint8ClampedArray } | null) => void,
    ): void;
    free(): void;
  }

  class HeifDecoder {
    decoder: { delete(): void };
    decode(buffer: Buffer | Uint8Array): HeifImage[];
  }

  const libheif: { HeifDecoder: typeof HeifDecoder };
  export default libheif;
}
