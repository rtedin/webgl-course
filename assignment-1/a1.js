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
 * Returns a triangle with vertices 'a', 'b' and 'c'.
 */
function Triangle(a, b, c) {
   return {'a': a, 'b': b, 'c': c};
}

/**
 * Returns the vertex resulting form rotating vertex 'vertex' 'theta' radians
 * around the origin.
 */
function rotateVertex(vertex, theta) {
   var x = vertex[0];
   var y = vertex[1];
   sintheta = Math.sin(theta);
   costheta = Math.cos(theta);
   return vec2(x * costheta - y * sintheta, x * sintheta + y * costheta);
}

/**
 * Rotates the vertices 'vertices' by 'theta' radians around the origin.
 */
function rotateVertices(vertices, theta) {
   for(var i = 0; i < vertices.length; i++) {
      vertices[i] = rotateVertex(vertices[i], theta);
   }
}

/**
 * Divides a triangle 'triangle' recursively a 'numDiv' of times and stores the
 * vertices in 'vertices'.
 */
function divideTriangle(triangle, numDiv, vertices) {
   if(numDiv === 0) {
      vertices.push(triangle.a, triangle.b, triangle.c);
   } else {
      var ab = mix(triangle.a, triangle.b, 0.5);
      var bc = mix(triangle.b, triangle.c, 0.5);
      var ac = mix(triangle.a, triangle.c, 0.5);
      divideTriangle(Triangle(triangle.a, ab, ac), numDiv - 1, vertices);
      divideTriangle(Triangle(ab, triangle.b, bc), numDiv - 1, vertices);
      divideTriangle(Triangle(ac, bc, triangle.c), numDiv - 1, vertices);
//       divideTriangle(Triangle(ab, bc, ac), numDiv - 1, vertices);
   }
}

/**
 * Creates and returns an array with the vertices to render.
 * 'numDiv' is the number of times to divide the original triangle.
 */
function createVerticesArray(numDiv) {
   var a = vec2(0, 0.7);
   var triangle = Triangle(a, rotateVertex(a, 2.0 * Math.PI / 3.0),
                           rotateVertex(a, -2.0 * Math.PI / 3.0));
   var vertices = [];
   divideTriangle(triangle, numDiv, vertices);
   rotateVertices(vertices, Math.PI/2);
   return vertices;
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
   var vertices = createVerticesArray(4);
   sendVerticesToGPU(vertices, gl);
   render(gl, vertices.length);
}