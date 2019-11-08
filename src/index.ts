import './style.css';
import {generate, JobDescriptor, setupWorkers, generateInMainThread, generateWithSharedArray} from './controller';

const DEFAULT_WORKER_COUNT = 1;
const USE_THREADS = true;
const USE_SHARED_ARRAY_BUFFER = true;

const defaultParams: GenerateParams = {zoom: 42, left: 2000, top: 1200, iterations: 20};
let params: GenerateParams;

function updateParams(newParams: Partial<GenerateParams>) {
    const combinedParams = {...params, ...newParams};
    const generatorFunction = USE_THREADS ?
        (USE_SHARED_ARRAY_BUFFER ? generateWithSharedArray : generate) : generateInMainThread;
    params = combinedParams;

    const {
        iterations,
        zoom,
        left,
        top,
    } = combinedParams;

    const iZoom = document.getElementById('zoom') as HTMLInputElement;
    const iLeft = document.getElementById('left') as HTMLInputElement;
    const iTop = document.getElementById('top') as HTMLInputElement;
    const iIterations = document.getElementById('iterations') as HTMLInputElement;
    const oTimeTaken = document.getElementById('time-taken') as HTMLOutputElement;

    iZoom.value = String(zoom);
    iLeft.value = String(left);
    iTop.value = String(top);
    iIterations.value = String(iterations);
    oTimeTaken.value = '...';

    generatorFunction(combinedParams).then((timeTaken) => {
        oTimeTaken.value = String(timeTaken);

        // If the params have changed since we started, re-render
        if (Object.values(combinedParams).join('-') !== Object.values(params).join('-')) {
            updateParams(params);
        }
    });
}

async function generateFromForm() {
    const iThreads = document.getElementById('threads') as HTMLInputElement;
    const iZoom = document.getElementById('zoom') as HTMLInputElement;
    const iLeft = document.getElementById('left') as HTMLInputElement;
    const iTop = document.getElementById('top') as HTMLInputElement;
    const iIterations = document.getElementById('iterations') as HTMLInputElement;

    const threadCount = Number(iThreads.value);
    USE_THREADS && await createWorkers(threadCount);

    updateParams({
        left: Number(iLeft.value),
        top: Number(iTop.value),
        zoom: Number(iZoom.value),
        iterations: Number(iIterations.value),
    });
}

async function createWorkers(count = DEFAULT_WORKER_COUNT) {
    await setupWorkers(count).catch(e => console.error(e));
    const iThreads = document.getElementById('threads') as HTMLInputElement;
    iThreads.value = String(count);
}

window.addEventListener('keydown', (e) => {
    // Do not intercept if it's input element
    const target = e.target as HTMLElement;
    const form = document.getElementById('config-form') as HTMLFormElement;

    if (form.isSameNode(target) || form.contains(target)) {
        return;
    }

    const shiftStep = Math.pow(10, 4 - Math.floor(Math.log10(params.zoom))) / 4;
    const zoomStep = Math.pow(10, Math.floor(Math.log10(params.zoom)) - 1);

    switch(e.keyCode) {
        case 13:
            // Refresh when enter/return is pressed
            updateParams({});
            break;
        case 40:
            updateParams({top: params.top - shiftStep});
            break;
        case 38:
            updateParams({top: params.top + shiftStep});
            break;
        case 37:
            updateParams({left: params.left + shiftStep});
            break;
        case 39:
            updateParams({left: params.left - shiftStep});
            break;
        case 187:
            updateParams({zoom: params.zoom + zoomStep});
            break;
        case 189:
            updateParams({zoom: Math.max(params.zoom - zoomStep, 10)});
            break;
    }
});

// Initialize
(async () => {
    document
        .getElementById('config-form')
        .addEventListener('submit', (e) => {
            e.preventDefault();
            generateFromForm();
        });

    await createWorkers();
    updateParams(defaultParams);
})();

type GenerateParams = Omit<JobDescriptor, 'bounds'>;
