/**
 * Maximum number of vertices.
 * 
 * @type Number
 */
var maxVertices = 1024 * 1024;

/**
 * Minimum distance between two points for adding new points.
 * 
 * @type Number
 */
var minDistance = 15;

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

    // Initialize color buffer
    var vColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * maxVertices, gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    render(gl);

    // Adapter that calls the real mouse move event listener
    var mouseMoveListernerAdapter = function (event) {
        onMouseMove(gl, canvas, vBuffer, vColorBuffer, event);
    };

    // Initialize render stats
    render.start = [];    // Start index of each line
    render.nVertices = 0; // Number of vertices
    render.len = [];      // Length of each line
    render.nLines = -1;   // Number of lines

    // Setup mouse listeners
    canvas.addEventListener("mousedown", function (event) {
        onMouseDown(gl, canvas, vBuffer, vColorBuffer, event,
                mouseMoveListernerAdapter);
    });

    canvas.addEventListener("mouseup", function (event) {
        onMouseUp(gl, canvas, mouseMoveListernerAdapter);
    });

    // Set up thickness change listener
    document.getElementById("thickness").onchange = function (event) {
        gl.lineWidth(event.target.value);
    };
    
    // Set up minimum distance change listener
    document.getElementById("min-distance").onchange = function (event) {
        minDistance = event.target.value;
    };
};

/**
 * Determines whether the current event is far enough (in space) in respect to
 * the last one.
 *  
 * @param event Current event.
 */
function enoughDistance(event) {
    var u = vec2(event.clientX, event.clientY);
    var v = onMouseMove.last;
    var diff = subtract(u,v);
    return Math.sqrt(dot(diff, diff)) > minDistance;
}

/**
 * Handles mouse move events.
 *  
 * @param  glContext     WebGl context.
 * @param  canvas        HTML canvas.
 * @param  vBuffer       Vertex buffer.
 * @param  vColorBuffer  Color buffer.
 * @param  event         Event to handle.
 */
function onMouseMove(glContext, canvas, vBuffer, vColorBuffer, event) {
    if (enoughDistance(event)) {
        // Add the current vertex to the vertex buffer
        addVertex(glContext, canvas, vBuffer, vColorBuffer, event);

        // Update line length and number of total vertices
        render.len[render.nLines]++;
        render.nVertices++;

        // Show the lines
        render(glContext);
    }
}

/**
 * Handles mouse down events.
 * 
 * @param  glContext          WebGL context.
 * @param  canvas             HTML canvas.
 * @param  vBuffer            Vertex buffer.
 * @param  vColorBuffer       Color buffer.
 * @param  event              Event to handle.
 * @param  mouseMoveListener  Function to set as mouse move listener.
 */
function onMouseDown(glContext, canvas, vBuffer, vColorBuffer, event, mouseMoveListener) {
    // Add the current vertex to the vertex buffer
    addVertex(glContext, canvas, vBuffer, vColorBuffer, event);

    // Start new line
    render.start.push(0);
    render.len.push(0);

    // Start a new line and mark the start position
    render.nLines++;
    render.start[render.nLines] = render.nVertices;
    render.nVertices++; // We just added one vertex

    // Remember the last point
    onMouseMove.last = vec2(event.clientX, event.clientY);

    // Install the mouse move event listener for adding more vertices
    canvas.addEventListener("mousemove", mouseMoveListener);
}

/**
 * Handles mouse up events.
 * @param glContext          WebGL context.
 * @param canvas             HTML canvas.
 * @param mouseMoveListener  Function to remove as mouse move listener.
 */
function onMouseUp(glContext, canvas, mouseMoveListener) {
    // By removing this listener no more vertices are added when the mouse moves
    canvas.removeEventListener("mousemove", mouseMoveListener);
}

/**
 * Adda a vertex to the vertex and color buffer.
 * 
 * @param glContext     WebGL context.
 * @param canvas        HTML canvas.
 * @param vBuffer       The vertex buffer.
 * @param vColorBuffer  Color buffer.
 * @param event         Event containing the point to add.
 */
function addVertex(glContext, canvas, vBuffer, vColorBuffer, event) {
    p = vec2(2 * event.clientX / canvas.width - 1,
            2 * (canvas.height - event.clientY) / canvas.height - 1);

    // Calculate the offset that corresponds to the new vertex
    var offset = 8 * render.nVertices;

    // Add vertex
    glContext.bindBuffer(glContext.ARRAY_BUFFER, vBuffer);
    glContext.bufferSubData(glContext.ARRAY_BUFFER, offset, flatten(p));

    // Pick vertex color
    var color = pickColor(document.getElementById("line-color").value);

    // Add color
    glContext.bindBuffer(glContext.ARRAY_BUFFER, vColorBuffer);
    glContext.bufferSubData(glContext.ARRAY_BUFFER, 2 * offset, color);
}

/**
 * Picks a color from the color picker.
 * 
 * @param hex  Hexadecimal value representing a RGB color.
 * @returns The color is returned as a Float32Array.
 */
function pickColor(hex) {
    hex = hex.replace(/#/g, "0x");
    var rgb = parseInt(hex, 16);
    var red = (rgb >> 16) / 255.0;
    var green = ((rgb >> 8) & 255) / 255.0;
    var blue = (rgb & 255) / 255.0;
    return flatten(vec4(red, green, blue, 1.0));
}

/**
 * Renders the lines with the WebGL context.
 * 
 * @param glContext WebGL contex to use.
 */
function render(glContext) {
    glContext.clear(glContext.COLOR_BUFFER_BIT);

    for (var l = 0; l <= render.nLines; l++) {
        glContext.drawArrays(glContext.LINE_STRIP, render.start[l],
                render.len[l]);
    }
}
