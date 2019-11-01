// TODO: consider using the whole width and height of the browser
export const CANVAS_WIDTH = window.document.body.clientWidth;
export const CANVAS_HEIGHT = window.document.body.clientHeight;

// Initialize the canvas once
const canvasContext = (function (width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    document.body.appendChild(canvas);
    return canvas.getContext("2d");
})(CANVAS_WIDTH, CANVAS_HEIGHT);

export function drawToCanvas(imageData: ImageData, x: number, y: number) {
    canvasContext.putImageData(imageData, x, y);
}
