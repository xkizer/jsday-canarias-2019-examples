import './style.css';
import {generate, JobDescriptor, setupWorkers} from './controller';

const DEFAULT_WORKER_COUNT = 1;
const defaultParams: GenerateParams = {zoom: 300, left: 2.5, top: 1.5, iterations: 1000};
let params: GenerateParams;

function updateParams(newParams: Partial<GenerateParams>) {
    params = {...params, ...newParams};

    const {
        iterations,
        zoom,
        left,
        top,
    } = params;

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

    generate(params).then((timeTaken) => oTimeTaken.value = String(timeTaken));
}

async function generateFromForm() {
    const iThreads = document.getElementById('threads') as HTMLInputElement;
    const iZoom = document.getElementById('zoom') as HTMLInputElement;
    const iLeft = document.getElementById('left') as HTMLInputElement;
    const iTop = document.getElementById('top') as HTMLInputElement;
    const iIterations = document.getElementById('iterations') as HTMLInputElement;

    const threadCount = Number(iThreads.value);
    await createWorkers(threadCount);

    updateParams({
        left: Number(iLeft.value),
        top: Number(iTop.value),
        zoom: Number(iZoom.value),
        iterations: Number(iIterations.value),
    });
}

async function createWorkers(count = DEFAULT_WORKER_COUNT) {
    await setupWorkers(count);
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

    const shiftDivider = Math.log10(params.zoom) + 3;

    switch(e.keyCode) {
        case 13:
            updateParams(defaultParams);
            break;
        case 40:
            updateParams({top: Math.max(params.top - 0.2 / shiftDivider, -100)});
            break;
        case 38:
            updateParams({top: Math.min(params.top + 0.2 / shiftDivider, 100)});
            break;
        case 37:
            updateParams({left: Math.min(params.left + 0.2 / shiftDivider, 100)});
            break;
        case 39:
            updateParams({left: Math.max(params.left - 0.2 / shiftDivider, -100)});
            break;
        case 187:
            updateParams({zoom: params.zoom + Math.ceil(params.zoom / 20)});
            break;
        case 189:
            updateParams({zoom: Math.max(params.zoom - Math.ceil(params.zoom / 20), 10)});
            break;
    }
});

// Initialize
(async () => {
    await createWorkers();
    updateParams(defaultParams);
    document.getElementById('config-form').addEventListener('submit', (e) => {
        e.preventDefault();
        generateFromForm();
    });
})();

type GenerateParams = Omit<JobDescriptor, 'bounds'>;
