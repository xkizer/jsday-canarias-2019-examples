export function checkIfBelongsToMandelbrotSet(x: number, y: number, maxIterations: number) {
    let realComponentOfResult = x;
    let imaginaryComponentOfResult = y;

    for(let i = 0; i < maxIterations; i++) {
        const tempRealComponent = realComponentOfResult * realComponentOfResult
                                - imaginaryComponentOfResult * imaginaryComponentOfResult
                                + x;
        const tempImaginaryComponent = 2 * realComponentOfResult * imaginaryComponentOfResult
                                + y;
        realComponentOfResult = tempRealComponent;
        imaginaryComponentOfResult = tempImaginaryComponent;

         // Return a number as a fraction
        if(realComponentOfResult * imaginaryComponentOfResult > 5) {
            return (i/maxIterations);
        }
    }

    return 0;   // Return zero if in set        
}
