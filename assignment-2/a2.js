/**
 * Maximum number of vertices.
 * 
 * @type Number
 */
var maxVertices = 1000;

/**
 * Starting point.
 */
window.onload = function () {
    // Canvas setup
    var canvas = document.getElementById("gl-canvas");
    var gl = WebGLUtils.setupWebGL(canvas);

    // Set the view port and the background color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Load shaders
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Initialize position buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxVertices, gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Adapter that calls the real mouse move event listener
    var mouseMoveListernerAdapter = function (event) {
        onMouseMove(gl, canvas, vBuffer, event);
    };

    // Setup mouse listeners
    canvas.addEventListener("mousedown", function (event) {
        onMouseDown(gl, canvas, vBuffer, event, mouseMoveListernerAdapter);
    });

    canvas.addEventListener("mouseup", function () {
        onMouseUp(canvas, mouseMoveListernerAdapter);
    });

    // Set up thickness change listener
    document.getElementById("thickness").onchange = function (event) {
        gl.lineWidth(event.target.value);
    };
};

/**
 * Handles mouse move events.
 *  
 * @param  glContext  WebGl context.
 * @param  canvas     HTML canvas.
 * @param  vBuffer    Vertex buffer.
 * @param  event      Event to handle.
 */
function onMouseMove(glContext, canvas, vBuffer, event) {
    onMouseMove.count++;
    var x = event.clientX;
    var y = event.clientY;
    console.log("(" + onMouseMove.count + "): " + x + " " + y);
    addVertex(glContext, canvas, vBuffer, event);
    render(glContext);
}

/**
 * Handles mouse down events.
 * 
 * @param  glContext          WebGL context.
 * @param  canvas             HTML canvas.
 * @param  vBuffer            Vertex buffer.
 * @param  event              Event to handle.
 * @param  mouseMoveListener  Function to set as mouse move listener.
 */
function onMouseDown(glContext, canvas, vBuffer, event, mouseMoveListener) {
    // (Re)set the number of times that the onMouseMove has been called 
    onMouseMove.count = 0;
    // Add the current vertex to the vertex buffer
    addVertex(glContext, canvas, vBuffer, event);
    // Install the mouse move event listener for adding more vertices
    canvas.addEventListener("mousemove", mouseMoveListener);
}

/**
 * Handles mouse up events.
 * 
 * @param canvas             HTML canvas.
 * @param mouseMoveListener  Function to remove as mouse move listener.
 */
function onMouseUp(canvas, mouseMoveListener) {
    // By removing this listener no more vertices are added when the mouse moves
    canvas.removeEventListener("mousemove", mouseMoveListener);
}

/**
 * Add a vertex to the vertex buffer.
 * 
 * @param glContext  WebGL context.
 * @param canvas     HTML canvas.
 * @param vBuffer    The vertex buffer.
 * @param event      Event containing the point to add.
 */
function addVertex(glContext, canvas, vBuffer, event) {
    p = vec2(2 * event.clientX / canvas.width - 1,
            2 * (canvas.height - event.clientY) / canvas.height - 1);

    var offset = 8 * onMouseMove.count;
    glContext.bindBuffer(glContext.ARRAY_BUFFER, vBuffer);
    glContext.bufferSubData(glContext.ARRAY_BUFFER, offset, flatten(p));
}

/**
 * Renders the lines with the WebGL context.
 * 
 * @param glContext WebGL contex to use.
 */
function render(glContext) {
    glContext.clear(glContext.COLOR_BUFFER_BIT);
    glContext.drawArrays(glContext.LINE_STRIP, 0, onMouseMove.count + 1);
}
