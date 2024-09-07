"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const existingCanvas = document.querySelector("#canvas");
if (existingCanvas == null) {
    const newCanvas = document.createElement("canvas");
    newCanvas.id = "canvas";
    document.body.appendChild(newCanvas);
    canvas = newCanvas;
}
else {
    canvas = existingCanvas;
}
const gl = canvas.getContext("webgl2");
function createShader(gl, type_, source) {
    const shader = gl.createShader(type_);
    if (shader == null) {
        return "Failed to initialize";
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return "Failed to initialize";
    }
    return shader;
}
const vertexShader = createShader(gl, gl.VERTEX_SHADER, `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;

// all shaders have a main function
void main() {

// gl_Position is a special variable a vertex shader
// is responsible for setting
gl_Position = a_position;
}`);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, `
// an attribute will receive data from a buffer
attribute vec4 a_position;

// all shaders have a main function
void main() {

// gl_Position is a special variable a vertex shader
// is responsible for setting
gl_Position = a_position;
}`);
var program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
var success = gl.getProgramParameter(program, gl.LINK_STATUS);
if (!success) {
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}
//# sourceMappingURL=canvas.js.map