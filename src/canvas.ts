// MATHEMATICS

type vector4 = [number, number, number, number];

function vector4(x: number, y: number, z: number): vector4 {
    return [x, y, z, 1];
}

type matrix44 = [number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number]
    ;

function translateBy(x: number, y: number, z: number): matrix44 {
    return [
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1
    ];
}

function apply(m: matrix44, v: vector4): vector4 {
    function calculateRow(x: number): number {
        var r = 0;
        for (var y of [0, 1, 2, 3]) {
            r += m[x * 4 + y] * v[y];
        }
        return r;
    }
    return [0, 1, 2, 3].map(calculateRow) as vector4;
}

// main actually?

const existingCanvas: HTMLCanvasElement | null = document.querySelector("#canvas");

if (existingCanvas == null) {
    const newCanvas = document.createElement("canvas");
    newCanvas.id = "canvas";
    document.body.appendChild(newCanvas);
    var canvas = newCanvas;
} else {
    var canvas = existingCanvas;
}

const gl = canvas.getContext("webgl2")!;

function createShader(
    gl: WebGL2RenderingContext,
    type_: GLenum,
    source: string
): WebGLShader | "Failed to initialize" {
    const shader = gl.createShader(type_);
    if (shader == null) {
        return "Failed to initialize";
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success: boolean = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return "Failed to initialize";
    }
    return shader
}

const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;

// all shaders have a main function
void main() {

  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = a_position;
}`
) as WebGLShader;

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
// Just set the output to a constant redish-purple
outColor = vec4(1, 0, 0.5, 1);
}`
) as WebGLShader;

const program = gl.createProgram()!;

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
const success = gl.getProgramParameter(program, gl.LINK_STATUS);
if (!success) {
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(
    positionAttributeLocation,
    2,         // 2 components per iteration
    gl.FLOAT,  // the type of data - 32 bit float
    false,     // don't normalize data
    0,         // no need to additionally stride data
    0,         // offset to begin
);

function resizeCanvasToDisplaySize(
    canvas: HTMLCanvasElement,
    multiplier: number | null,
): boolean {
    multiplier = multiplier || 1;
    const width = canvas.clientWidth * multiplier | 0;
    const height = canvas.clientHeight * multiplier | 0;

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }

    return false;
};

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);
resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement, 1);
gl.useProgram(program);

// MOUSE HANDLING

type mouseState =
    {
        clicked: true;
        startX: number;
        startY: number;
        clientX: number;
        clientY: number
    }
    | { clicked: false }
    ;

var mouseState: mouseState = { clicked: false };

function onMouseUp() {
    if (!mouseState.clicked) {
        return;
    }
    mouseState = { clicked: false };
}

function onMouseMove(clientX: number, clientY: number) {
    if (!mouseState.clicked) {
        return;
    } else {
        mouseState.clientX = clientX;
        mouseState.clientY = clientY;
    }
}

function onMouseDown(clientX: number, clientY: number) {
    if (mouseState.clicked) {
        return
    }
    mouseState = {
        clicked: true,
        startX: clientX,
        startY: clientY,
        clientX,
        clientY,
    };
}

canvas.addEventListener("mousedown", (event) => {
    console.log("mouse move", event.clientX, event.clientY);
    onMouseDown(event.clientX, event.clientY)
});
canvas.addEventListener("mousemove", (event) => {
    if (mouseState.clicked) {
        console.log(
            "mouse move",
            mouseState.startX,
            mouseState.startY,
            event.clientX,
            event.clientY,
        );
    }
    onMouseMove(event.clientX, event.clientY);
});
canvas.addEventListener("mouseup", (_) => {
    console.log("mouse up");
    onMouseUp();
});

const originalPositions = [
    vector4(0.0, 0.0, 0.0),
    vector4(0.0, 0.5, 0.0),
    vector4(0.7, 0.0, 0.0)
];

// actual loop
function loop(_: number) {
    let positions = undefined;

    // process updates for this frame
    if (mouseState.clicked) {
        const displacement = translateBy(
            (mouseState.clientX - mouseState.startX) / canvas.width * 2,
            (mouseState.startY - mouseState.clientY) / canvas.height * 2,
            0
        );

        positions = originalPositions.map((pos) => apply(displacement, pos));
    } else {
        positions = originalPositions;
    }
    // animate the frame

    var positionsF32 = new Float32Array(positions.flatMap((v) => [v[0], v[1]]));
    gl.bufferData(gl.ARRAY_BUFFER, positionsF32, gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // loop
    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);
