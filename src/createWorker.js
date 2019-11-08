/**
 * Create a new worker from JavaScript code instead of a URL
 * @param {string} workerCode The raw JavaScript code for the worker
 * @returns Returns the created worker
 */
function createWorker(workerCode) {
    const blob = new Blob([workerCode], {type: 'application/javascript'});
    const workerURL = URL.createObjectURL(blob);
    return new Worker(workerURL);
}
