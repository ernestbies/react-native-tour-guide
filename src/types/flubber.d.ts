declare module 'flubber' {
  type Interpolator = (t: number) => string;

  type Shape = number[][] | string;

  interface Options {
    maxSegmentLength?: number;
    string?: boolean;
    single?: boolean;
  }

  export function interpolate(fromShape: Shape, toShape: Shape, options?: Options): Interpolator;

  export function toCircle(
    fromShape: Shape,
    x: number,
    y: number,
    r: number,
    options?: Options,
  ): Interpolator;

  export function toRect(
    fromShape: Shape,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: Options,
  ): Interpolator;

  export function fromCircle(
    x: number,
    y: number,
    radius: number,
    toShape: Shape,
    options?: Options,
  ): Interpolator;

  export function fromRect(
    x: number,
    y: number,
    width: number,
    height: number,
    toShape: Shape,
    options?: Options,
  ): Interpolator;

  export function separate(fromShape: Shape, toShapeList: Shape[], options?: Options): Interpolator;

  export function combine(fromShapeList: Shape[], toShape: Shape, options?: Options): Interpolator;

  export function interpolateAll(
    fromShapeList: Shape[],
    toShapeList: Shape[],
    options?: Options,
  ): Interpolator;

  export function toPathString(ring: Array<[number, number]>): string;

  export function splitPathString(pathString: string): string[];
}
