import { JobDescriptor } from "./controller";

export function mapMandelbrot (n: number, size: number) {
    return (n / size);
};

export function generateMandelbrotSlice(descriptor: JobDescriptor): Uint8ClampedArray {
    const {
        bounds,
        zoom,
        left,
        top,
        iterations
    } = descriptor;

    const { x, y, w, h, size } = bounds;
    const pixels: number[] = [];

    const normalizedZoom = Math.max(0.01, zoom / 100);

    for (let j = y; j < y + h; j++) {
        for (let i = x; i < x + w; i++) {
            let a = mapMandelbrot(i / normalizedZoom - left, size);
            let b = mapMandelbrot(j / normalizedZoom - top, size);
            let A = a;
            let B = b;
            let n;

            for(n = 0; n < iterations; n++) {
                let ab = a * a - b * b;
                let bb = 2 * a * b;
                a = ab + A;
                b = bb + B;

                if(a * a + b * b > 4) {
                    break;
                }
            }

            let brightness = n === iterations ? 0 : (Math.sqrt(n / iterations)) * 255;
            pixels.push(brightness * 2, brightness, brightness, 255);
        }
    }
    
    return Uint8ClampedArray.from(pixels);
}
