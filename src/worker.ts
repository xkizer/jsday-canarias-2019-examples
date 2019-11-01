import { JobDescriptor } from "./controller";
import { checkIfBelongsToMandelbrotSet } from "./mandelbrot";

const R_VALUE = 100;
const G_VALUE = 0;
const B_VALUE = 0;

function processJob(descriptor: JobDescriptor) {
    const {
        bounds,
        zoom,
        left,
        top,
        iterations
    } = descriptor;

    const { x, y, w, h } = bounds;
    const pixels: number[] = [];

    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            const x$ = (j + x) / zoom - left;
            const y$ = (i + y) / zoom - top;
            const isInSet = checkIfBelongsToMandelbrotSet(x$, y$, iterations); // TODO: include pan and zoom

            // pixels.push(Math.round(R_VALUE * isInSet), Math.round(G_VALUE * isInSet), Math.round(B_VALUE * isInSet), 255);
            if (isInSet === 0) {
                pixels.push(255, 255, 255, 255);
            } else {
                // pixels.push(255, 255, 255, 255);
                const multiplier = Math.min(isInSet * 10, 1);
                pixels.push(Math.round(R_VALUE * multiplier), Math.round(G_VALUE * multiplier), Math.round(B_VALUE * multiplier), 255);
            }
        }
    }
    
    postMessage({
        type: 'done',
        result: Uint8ClampedArray.from(pixels),
    });
}

postMessage({type: 'ready'});

onmessage = function ({data: msg}) {
    switch(msg.type) {
        case 'job':
            processJob(msg.descriptor);
            break;
    }
}
