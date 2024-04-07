// Canvas setup
const canvas = document.getElementById('gl1');
const gl = canvas.getContext('webgl2');

// Buffers setup

const cubeVertices = [
    -1,-1,-1,   1,-1,-1,   1, 1,-1,  -1, 1,-1, // back
    -1,-1, 1,   1,-1, 1,   1, 1, 1,  -1, 1, 1, // front
    -1,-1,-1,  -1, 1,-1,  -1, 1, 1,  -1,-1, 1, // left
     1,-1,-1,   1, 1,-1,   1, 1, 1,   1,-1, 1, // right
    -1,-1,-1,  -1,-1, 1,   1,-1, 1,   1,-1,-1, // bottom
    -1, 1,-1,  -1, 1, 1,   1, 1, 1,   1, 1,-1, // top
];

const cubeColors = [
    1,1,0,  1,1,0,  1,1,0,  1,1,0, // yellow
    1,1,1,  1,1,1,  1,1,1,  1,1,1, // white
    0,1,0,  0,1,0,  0,1,0,  0,1,0, // green
    0,0,1,  0,0,1,  0,0,1,  0,0,1, // blue
    1,0,0,  1,0,0,  1,0,0,  1,0,0, // red
    1, 0.6, 0,  1, 0.6 ,0,  1, 0.6 ,0,  1, 0.6 ,0 // orange
];

const cubeIndices = [
    0,1,2, 0,2,3, 4,5,6, 4,6,7,
    8,9,10, 8,10,11, 12,13,14, 12,14,15,
    16,17,18, 16,18,19, 20,21,22, 20,22,23,
];

// Filling the buffers with data
const vertexBuffer = gl.createBuffer ();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer ();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeColors), gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer ();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

// Shaders 
const vsSource = 
    `  #version 300 es
        precision mediump float;

        in vec4 aVertexPosition;
        in vec4 aVertexColor;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uMoveMatrix;

        out vec4 vColor;
        out vec4 vPosition;

        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * uMoveMatrix * aVertexPosition;
            vColor = aVertexColor;
            vPosition = aVertexPosition;
        }
    `;

const fsSource = 
    `  #version 300 es
        precision mediump float;
        in vec4 vColor;
        out vec4 color;

        void main() {
            color = vColor;
        }
    `;
// Loading a shader program
const vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vsSource);
gl.compileShader(vertShader);

const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fsSource);
gl.compileShader(fragShader);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);
gl.linkProgram(shaderProgram);

//  Associating attributes to vertex shader
const projectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
const modelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
const moveMatrixLocation = gl.getUniformLocation(shaderProgram, "uMoveMatrix");

// Linking vertex buffer
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
const vertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vertexPosition);

// Linking color buffer
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
const vertexColor = gl.getAttribLocation(shaderProgram, "aVertexColor");
gl.vertexAttribPointer(vertexColor, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vertexColor);

gl.useProgram(shaderProgram);

// Matrices buffer
const FoV = (80 * Math.PI) / 180;
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
const zNear = 0.1;
const zFar = 100.0;
const projectionMatrix = mat4.create();

mat4.perspective(projectionMatrix, FoV, aspect, zNear, zFar);

const modelViewMatrix = mat4.create();
const moveMatrix = mat4.create();

const shift = [-4, -2, -20.0]
const negShift = shift.map(function(x) {return -x})

mat4.translate(
    projectionMatrix,
    projectionMatrix,
    shift,
);

const rotationRate = 0.07;

// Keys event listener setup

canvas.addEventListener('keydown', (e) => {
    if (e.key == "ArrowUp") {
        mat4.rotateY(projectionMatrix, projectionMatrix, 0.07);
    } else if (e.key == "ArrowDown") {
        mat4.rotateY(projectionMatrix, projectionMatrix, -0.07);
    } else if (e.altKey && e.key == "ArrowRight") {
        mat4.translate(projectionMatrix, projectionMatrix, negShift)
        mat4.rotateY(projectionMatrix, projectionMatrix, 0.07);
        mat4.translate(projectionMatrix, projectionMatrix, shift)
    } else if (e.altKey && e.key == "ArrowLeft") {
        mat4.translate(projectionMatrix, projectionMatrix, negShift)
        mat4.rotateY(projectionMatrix, projectionMatrix, -0.07);
        mat4.translate(projectionMatrix, projectionMatrix, shift)
    } else if (e.key == "ArrowRight") {
        mat4.rotateY(moveMatrix, moveMatrix, 0.07);
    } else if (e.key == "ArrowLeft") {
        mat4.rotateY(moveMatrix, moveMatrix, -0.07);
    }
});


// Drawing
let time_old = 0;

const animate = function(time) {
    let dt = time - time_old;
    
    time_old = time;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.5, 0.5, 0.5, 0.9);
    gl.clearDepth(1.0);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);
    gl.uniformMatrix4fv(moveMatrixLocation, false, moveMatrix);

    // Bottom Left Cube
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
    
    // Bottom Right Cube
    mat4.translate(projectionMatrix, projectionMatrix, [-2, 0, 0]);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
    
    // Upper Center Cube
    mat4.translate(projectionMatrix, projectionMatrix, [4, 0, 0]);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
    
    // Bottom Center Cube
    mat4.translate(projectionMatrix, projectionMatrix, [-2, 2, 0]);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
    
    mat4.translate(projectionMatrix, projectionMatrix, [0, -2, 0]);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);

    window.requestAnimationFrame(animate);
}
animate(0);
