# Code examples for JSDay Canarias 2019

This repository contains code samples for my presentation "Multithreading in JavaScript",
presented on 9 November 2019 at JSDay Canarias, in Tenerife.

This code generates a Mandelbrot fractal using JavaScript. It can be configured whether this can be done in the main thread, in
a worker (or multiple workers) using `postMessage`, or in a worker (or multiple workers) using `SharedArrayBuffer`.

## Configuring
The following constants in [`index.ts`](src/index.ts) can be used to configure how the application behaves:

| Constant                | Purpose                                                                                                                  |
|-------------------------|--------------------------------------------------------------------------------------------------------------------------|
| DEFAULT_WORKER_COUNT    | Configures the default number of workers to spin up                                                                      |
| USE_THREADS             | Whether or not to use threads or do everything in the main thread. Setting this to `false` will not spin up any threads. |
| USE_SHARED_ARRAY_BUFFER | Setting this to true will use `SharedArrayBuffer` for thread communication and coordination instead of `postMessage`     |

## Running the application

This app is written in TypeScript, and compiled using Webpack. To run the application, you need to first install the dependencies,
then compile and start the server.

### Install dependencies
```
npm install
```

### Compile
```
npm run build
```

If you don't want webpack watching for file changes, remove the following line from [`webpack.config.js`](webpack.config.js):
```
watch: true,
```

### Run
```
npm start
```

The app will be started on locahost port 8080.

**Have a lot of fun!**

# License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
