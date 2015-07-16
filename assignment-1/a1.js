/* Globals ********************************************************************/
var twist     = 0.0; // Amount of twist
var divisions = 4;   // Number of divisions
/******************************************************************************/

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
 * Returns the vertex resulting from rotating vertex 'vertex' 'theta' radians
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
 * Returns the vertex resulting from rotating the vertex 'vertex' by
 * 'twistAmount' * lenght('vertex') radians.
 */
function twistVertex(vertex, twistAmount) {
   var x = vertex[0];
   var y = vertex[1];
   var theta = twistAmount * length(vertex);
   sintheta = Math.sin(theta);
   costheta = Math.cos(theta);
   return vec2(x * costheta - y * sintheta, x * sintheta + y * costheta);
}

/**
 * Applies a twist to all the vertices in 'vertices'. Each vertex is rotated by
 * 'twistAmount' * lenght(vertex) radians around the origin.
 */
function twistVertices(vertices, twistAmount) {
   for(var i = 0; i < vertices.length; i++) {
      vertices[i] = twistVertex(vertices[i], twistAmount);
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
      divideTriangle(Triangle(ab, bc, ac), numDiv - 1, vertices);
   }
}

/**
 * Creates and returns an array with the vertices to render.
 */
function createVerticesArray() {
   var a = vec2(0, 0.7);
   var triangle = Triangle(a, rotateVertex(a, 2.0 * Math.PI / 3.0),
                           rotateVertex(a, -2.0 * Math.PI / 3.0));
   var vertices = [];
   divideTriangle(triangle, divisions, vertices);
   twistVertices(vertices, twist);
   return vertices;
}

/**
 * Sends the vertices 'vertices' to a buffer in the GPU using the WebGL context
 * 'gl'.
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
 * Renders the WebGL context 'gl' that contains 'numVertices' vertices.
 */
function render(gl, numVertices) {
   gl.clear(gl.COLOR_BUFFER_BIT);
   gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

/**
 * Processes the vertices and reders them in the WebGL context 'gl'.
 */
function processAndRender(gl) {
   var vertices = createVerticesArray();
   sendVerticesToGPU(vertices, gl);
   render(gl, vertices.length);
}
window.onload = function init() {
   var gl = setUpCanvas(); if(!gl) { alert("WegGL is not available"); }
   processAndRender(gl);
   document.getElementById("twist").onchange = function() {
      twist = event.srcElement.value / 10.0;
      processAndRender(gl);
   }
   document.getElementById("divisions").onchange = function() {
      divisions = event.srcElement.value;
      processAndRender(gl);
   }
}