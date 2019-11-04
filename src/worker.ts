import { JobDescriptor } from "./controller";
import { generateMandelbrotSlice } from "./mandelbrot";

function processJob(descriptor: JobDescriptor) {
    postMessage({
        type: 'done',
        result: generateMandelbrotSlice(descriptor),
    });
}

function processSabJob(
    tasksBuffer: SharedArrayBuffer,
    controlBuffer: SharedArrayBuffer,
    pixelsBuffer: SharedArrayBuffer,
) {
    // nextIndex, totalCount, completedCount, size, zoom, left, top, iterations, width, height
    const controlArray = new Uint32Array(controlBuffer);
    const controlFloat = new Float32Array(controlBuffer);
    const pixelsArray = new Uint8Array(pixelsBuffer);
    // x, y, w, h
    const tasksArray = new Uint32Array(tasksBuffer);

    // Use a while loop instead of recursion to avoid stack overflow
    do {
        // Grab a task
        const nextIndex = Atomics.add(controlArray, 0, 1);
        const taskIndex = nextIndex * 4;
    
        const [size, zoom, , , iterations, width, height] = controlArray.slice(3, 10);
        const [left, top] = controlFloat.slice(5, 7);

        if (taskIndex >= tasksArray.length) {
            break;
        }
    
        const [x, y, w, h] = tasksArray.slice(taskIndex, taskIndex + 4);
        const bounds = {x, y, w, h, size};
        const pixels = generateMandelbrotSlice({
            bounds,
            zoom,
            left,
            top,
            iterations
        });
        
        pixels.forEach((pixel, i) => {
            const y$ = Math.floor(i / (w * 4));
            const x$ = i % (w * 4);
            const row = y + y$;
            const col = x * 4 + x$;
            const index = row * width * 4 + col;
    
            // Safe to write without atomics, as no other thread should be touching this
            pixelsArray[index] = pixel;
        });
    
        // Increment the "completedCount" flag
        Atomics.add(controlArray, 2, 1);    
    } while(true);
}

postMessage({type: 'ready'});

onmessage = function ({data: msg}) {
    switch(msg.type) {
        case 'job':
            processJob(msg.descriptor);
            break;
        case 'sab-job':
            console.log('Dealing with SAB job', msg);
            processSabJob(msg.tasksBuffer, msg.controlBuffer, msg.pixelsBuffer);
            break;
    }
}
