/**
 * Sets up the canvas and returns a webGL context.
 */
function setUpCanvas() {
   var canvas = document.getElementById("gl-canvas");
   var gl = WebGLUtils.setupWebGL(canvas);
   gl.viewport(0, 0, canvas.width, canvas.height);
   gl.clearColor(1.0, 1.0, 1.0, 1.0);
   return gl;
}

/**
 * Creates and returns an array with the vertices to render.
 */
function createVerticesArray() {
   return [vec2(-1, -1), vec2(0, 1), vec2(1, -1)];
}

/**
 * Sends the vertices to a buffer in the GPU using the passed WebGL context.
 */
function sendVerticesToGPU(vertices, glContext) {
   var program = initShaders(glContext, "vertex-shader", "fragment-shader");
   glContext.useProgram(program);
   
   var bid = glContext.createBuffer();
   glContext.bindBuffer(glContext.ARRAY_BUFFER, bid);
   glContext.bufferData(glContext.ARRAY_BUFFER, flatten(vertices),
                        glContext.STATIC_DRAW);
   
   var vPosition = glContext.getAttribLocation(program, "vPosition");
   glContext.vertexAttribPointer(vPosition, 2, glContext.FLOAT, false, 0, 0);
   glContext.enableVertexAttribArray(vPosition);
}

/**
 * Renders the passed WebGL context.
 */
function render(gl, numVertices) {
   gl.clear(gl.COLOR_BUFFER_BIT);
   gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

window.onload = function init() {
   var gl = setUpCanvas(); if(!gl) { alert("WegGL is not available"); }
   var vertices = createVerticesArray();
   sendVerticesToGPU(vertices, gl);
   render(gl, vertices.length);
}

