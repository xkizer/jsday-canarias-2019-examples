import {CANVAS_WIDTH, CANVAS_HEIGHT, drawToCanvas} from './canvas'

let runningJob = false;
let THREADS_COUNT = 12;
const readyWorkers: WorkerDescriptor[] = [];
let queuePaused = true;
const workQueue: Bounds[] = [];
let currentParams: Omit<JobDescriptor, 'bounds'>;
let pixelBuffer: {bounds: Bounds, imageData: Uint8ClampedArray}[] = [];
let totalChunks: number;

export async function setupWorkers(count: number) {
    if (runningJob) {
        console.warn('Aborting as another job is running');
        // Do not change worker count while a job is running
        return;
    }

    const currentThreads = readyWorkers.length;
    const diff = count - currentThreads;

    if (diff === 0) {
        // No change
        runningJob = false;
        return;
    }

    // Prevent a job from running while we are creating/killing threads
    runningJob = true;

    if (diff < 0) {
        // We have more threads than needed, kill threads
        for(let i = 0; i > diff; i--) {
            readyWorkers[0].kill();
        }

        runningJob = false;
        return;
    }

    let resolve: () => void;
    let createdThreads = 0;

    // Create workers
    Array(diff).fill(0).map(() => {
        const id = Math.random().toString(36).substr(2);
        // console.time(id);
        const worker = new Worker('worker.js');
        let resolvePromise: (data: unknown) => unknown;

        const descriptor: WorkerDescriptor = {
            processJob,
            id,
            kill,
        };

        console.time('Start ' + id)

        worker.onmessage = function({data: msg}) {
            switch (msg.type) {
                case 'ready':
                        // console.timeEnd(id);
                        markWorkerReady(descriptor);

                        if (++createdThreads === diff) {
                            // Last thread ready
                            runningJob = false;
                            resolve();
                        }
                    break;
                case 'done':
                    resolvePromise(msg.result);
                    markWorkerReady(descriptor);
                    break;
            }
        }

        function kill() {
            markWorkerBusy(descriptor);
            worker.terminate();
        }

        async function processJob(job: JobDescriptor) {
            markWorkerBusy(descriptor);

            return new Promise((resolve, reject) => {
                resolvePromise = resolve;
                worker.postMessage({
                    type: 'job',
                    descriptor: job,
                });
            });
        }

        return descriptor;
    });

    return new Promise((res) => {
        resolve = res;
    });
}

function markWorkerReady(worker: WorkerDescriptor) {
    readyWorkers.push(worker);
    resumeQueue();
}

function markWorkerBusy(worker: WorkerDescriptor) {
    const idx = readyWorkers.indexOf(worker);

    if (idx >= 0) {
        readyWorkers.splice(idx, 1);
    }
}

function resumeQueue() {
    if (!queuePaused) {
        // Queue is already running
        return;
    }

    queuePaused = false;
    processNext();
}

function applyPatch(bounds: Bounds, pixels: Uint8ClampedArray) {
    const imageData = new ImageData(pixels, bounds.w, bounds.h);
    drawToCanvas(imageData, bounds.x, bounds.y);
}

function processNext() {
    if (queuePaused) {
        return;
    }

    if (readyWorkers.length === 0) {
        // No workers available
        queuePaused = true;
        return;
    }

    const worker = readyWorkers[0];

    if (workQueue.length === 0) {
        // No jobs available
        queuePaused = true;
        return;
    }

    const bounds = workQueue.shift();

    const {zoom, left: panX, top: panY, iterations} = currentParams;
    const left = panX;
    const top = panY;

    const descriptor: JobDescriptor = {
        bounds,
        zoom,
        left,
        top,
        iterations,
    };

    worker.processJob(descriptor)
        .then((imageData: Uint8ClampedArray) => {
            pixelBuffer.push({bounds, imageData});
        })
        .then(() => {
            if (pixelBuffer.length === totalChunks) {
                queuePaused = true;
    
                if (pixelBuffer.length) {
                    // Done, apply all patches
                    if (!pixelBuffer.length) {
                        return;
                    }

                    pixelBuffer.forEach(({bounds, imageData}) => {
                        applyPatch(bounds, imageData);
                    });
    
                    reportDone();
                }
    
                return;
            }
        });
    
    processNext();
}

let startTime: number;
let setRunningTime: (time: number) => void;

function reportDone() {
    const endTime = performance.now();
    const runningTime = endTime - startTime;
    runningJob = false;
    pixelBuffer = [];
    setRunningTime(runningTime);
}

function getNextChunk(xChunkSize: number, yChunkSize: number, nextX: number, nextY: number) {
    let hasNext = true;
    const x = nextX;
    const y = nextY;
    let x$ = x + xChunkSize;
    let y$ = y + yChunkSize;

    nextX = x$;

    if (y$ >= CANVAS_HEIGHT) {
        // Vertical overflow
        y$ = CANVAS_HEIGHT;
    }

    if (x$ >= CANVAS_WIDTH) {
        // Horizontal overflow, move to next line
        nextX = 0;
        nextY = y$;
        x$ = CANVAS_WIDTH;

        if (nextY >= CANVAS_HEIGHT) {
            hasNext = false;
        }
    }

    const params = {
        x,
        y,
        w: x$ - x,
        h: y$ - y,
    };

    return {
        params,
        hasNext,
        nextX,
        nextY,
    };
}

export async function generate(params: Omit<JobDescriptor, 'bounds'>) {
    if (runningJob) {
        // Do not run two jobs in parallel
        return 0;
    }

    runningJob = true;
    currentParams = params;

    startTime = performance.now();
    console.log('Generating', `threads=${THREADS_COUNT} params:`, params);
    // Divide the work by the number of threads squared
    const xChunkSize = Math.ceil(CANVAS_WIDTH / THREADS_COUNT);
    const yChunkSize = Math.ceil(CANVAS_HEIGHT / THREADS_COUNT);

    let nextX = 0;
    let nextY = 0;
    let hasNext = true;
    
    // Chunk up the canvas to create a work queue
    while(hasNext) {
        const {hasNext: _hasNext, params, nextX: _nextX, nextY: _nextY} = getNextChunk(xChunkSize, yChunkSize, nextX, nextY);
        hasNext = _hasNext;
        nextX = _nextX;
        nextY = _nextY;
        workQueue.push({...params, size: CANVAS_HEIGHT});
    }

    totalChunks = workQueue.length;
    resumeQueue();
    
    return new Promise((resolve) => {
        setRunningTime = resolve;
    });
}

type WorkerDescriptor = {
    id: string;
    processJob(job: JobDescriptor): Promise<unknown>;
    kill(): void
};

export type JobDescriptor = {
    bounds: Bounds;
    zoom: number;
    left: number;
    top: number;
    iterations: number;
};

type Bounds = {
    x: number; // x-coordinate of this chunk
    y: number; // y-coordinate of this chunk
    h: number; // Height of this chunk
    w: number; // Width of this chunk
    size: number; // The base size (usually the width or the height)
};
