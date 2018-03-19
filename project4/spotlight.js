/**
 * Jacob Tucker
 * CS 435
 * Project #4
 *
 * Hexagonal room for spotlight viewing
 * 
 *
 **/
"use strict";

var gl;
var canvas;
var fColor;
var projection;
var modelViewMatrix;
var modelViewMatrixLoc;
var vPosition;
var objList = new Array();

class Obj {
    constructor() {
        this.color = vec4(0.0, 0.0, 0.0, 1.0);
        this.offsetX = 0.0;
        this.offsetY = 0.0;
        this.offsetZ = 0.0;
        this.rotateXDegrees = 0.0;
        this.rotateYDegrees = 0.0;
        this.rotateZDegrees = 0.0;
        this.sibling = null;
        this.child = null;
    }

    clone() {
    }

    setSibling(sibling) {
        this.sibling = sibling;
    }

    setChild(child) {
        this.child = child;
    }

    updateOffset(dx, dy, dz) {
        this.offsetX += dx;
        this.offsetY += dy;
        this.offsetZ += dz;
    }

    setOffset(dx, dy, dz) {
        this.offsetX = dx;
        this.offsetY = dy;
        this.offsetZ = dz;
    }


    init() {
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);
    }

    draw() {
        gl.uniformMatrix4fv(modelViewMatrixLoc, gl.TRUE, flatten(modelViewMatrix));

        gl.uniform4fv(fColor, flatten(this.color));
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length);
    }
}

class Circle extends Obj {
    constructor(center, radius) {
        super();
        this.center = center;
        this.radius = radius;
        this.sides = 8;
        this.createPoints();
    }

    createPoints() {
        this.points = [];
        this.points.push(this.center);
        for (var i=0; i <= this.sides; i++) {
            var angle = i*2*Math.PI/this.sides;
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            this.points.push(add(this.center, scale(this.radius, vec3(cos, 0, -1*sin))));
        }
    }

}

class Quad extends Obj {
    constructor(p1, p2, p3, p4) {
        super();
        this.createPoints(p1, p2, p3, p4);
        this.color = vec4(1,0,0,1);
    }

    createPoints(p1, p2, p3, p4) {
        this.points = [];
        this.points.push(p1);
        this.points.push(p2);
        this.points.push(p4);
        this.points.push(p3);
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
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    modelViewMatrix = lookAt(vec3(1,1,1), vec3(0,0,0), vec3(0,1,0));
    gl.uniformMatrix4fv(modelViewMatrixLoc, gl.TRUE, flatten(modelViewMatrix));

    projection = gl.getUniformLocation(program, "projection");
    var pm = ortho(-5,5,-5,5,-5,5);
    gl.uniformMatrix4fv(projection, gl.TRUE, flatten(pm));

    var floor = new Circle(vec3(0,0,0), 4);
    floor.init();
    objList.push(floor);
    for (var i = 0; i<8; i++) {
        var p1 = floor.points[i+1];
        var p2 = floor.points[(i+1)%8+1];
        var p3 = add(p1, vec3(0,3,0));
        var p4 = add(p2, vec3(0,3,0));
        var wall = new Quad(p1, p2, p3, p4);
        wall.init();
        objList.push(wall);
    }
    render();
}

function render(){
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (var obj of objList) {
        obj.draw();
    }
}

