/**
 * Jacob Tucker
 * CS 435
 * Project #3
 *
 * Produces a 3D gas sign
 *
 **/
"use strict";

var gl;
var canvas;
var transformation;
var fColor;
var projection;
var vPosition;

    clone() {
    }

    updateOffset(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
    }

    setOffset(dx, dy) {
        this.offsetX = dx;
        this.offsetY = dy;
    }

    transform(x, y) {
        var x2 = x - this.offsetX;
        var y2 = y - this.offsetY;
        return vec2(x2, y2);
    }

    isInside(x, y) {
    }

    init() {
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);
    }

    draw() {
        var tm = translate(this.offsetX, this.offsetY, 0.0);
        gl.uniformMatrix4fv(transformation, gl.TRUE, flatten(tm));

        gl.uniform4fv(fColor, flatten(this.color));
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length);
    }
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");


    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }


    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    vPosition = gl.getAttribLocation(program, "vPosition");
    fColor = gl.getUniformLocation(program, "fColor");
    transformation = gl.getUniformLocation(program, "transformation");
    projection = gl.getUniformLocation(program, "projection");
    var pm = ortho(0.0, canvas.width, canvas.height, 0.0, -1.0, 1.0);
    gl.uniformMatrix4fv(projection, gl.TRUE, flatten(pm));


    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT);
}

