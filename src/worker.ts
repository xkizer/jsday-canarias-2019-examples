import { JobDescriptor } from "./controller";
import { generateMandelbrotSlice } from "./mandelbrot";

function processJob(descriptor: JobDescriptor) {
    postMessage({
        type: 'done',
        result: generateMandelbrotSlice(descriptor),
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
