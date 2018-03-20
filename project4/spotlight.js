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
var globalProgram;
var fColor;
var projection;
var modelViewMatrix;
var modelViewMatrixLoc;
var vPosition;
var vNormal;
var objList = new Array();

var lightPosition = vec4(0.0, 25.0, 0.0, 1.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var lightDirection;

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.0, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.0, 0.0, 1.0);
var materialShininess = 500.0;

var ambientProduct, diffuseProduct, specularProduct;

class Obj {
    constructor() {
    }

    init() {
        this.nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.norms), gl.STATIC_DRAW);

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);
    }

    draw() {
        gl.uniformMatrix4fv(modelViewMatrixLoc, gl.TRUE, flatten(modelViewMatrix));

        gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

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
        this.calculateNormal();
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

    calculateNormal() {
        this.norms = [];
        var u = subtract(this.points[1], this.points[0]);
        var v = subtract(this.points[2], this.points[0]);
        var normal = normalize(cross(u,v));
        for (var point of this.points) {
            this.norms.push(normal);
        }
        console.log(this.norms);
    }

}

class Quad extends Obj {
    constructor(p1, p2, p3, p4) {
        super();
        this.createPoints(p1, p2, p3, p4);
        this.calculateNormal();
    }

    createPoints(p1, p2, p3, p4) {
        this.points = [];
        this.points.push(p1);
        this.points.push(p2);
        this.points.push(p4);
        this.points.push(p3);
    }

    calculateNormal() {
        this.norms = [];
        var u = subtract(this.points[1], this.points[0]);
        var v = subtract(this.points[2], this.points[0]);
        var normal = normalize(cross(u,v));
        for (var point of this.points) {
            this.norms.push(normal);
        }
        console.log(this.norms);
    }
}

window.onload = function init() {
    lightDirection = vec4(0, -1, 0, 0);
    canvas = document.getElementById("gl-canvas");


    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }


    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    vNormal = gl.getAttribLocation(program, 'normal');
    vPosition = gl.getAttribLocation(program, "vPosition");
    fColor = gl.getUniformLocation(program, "fColor");
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    projection = gl.getUniformLocation(program, "projection");
    var pm = ortho(-5,5,-5,5,0,20);
    gl.uniformMatrix4fv(projection, gl.TRUE, flatten(pm));

    createRoom();

    var edgeMidpoint = mix(objList[0].points[1], objList[0].points[2], 0.5);
    modelViewMatrix = lookAt(add(edgeMidpoint, vec3(0,4,0)), vec3(0,0,0), vec3(0,1,0));
    gl.uniformMatrix4fv(modelViewMatrixLoc, gl.TRUE, flatten(modelViewMatrix));

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    console.log(ambientProduct);
    console.log(diffuseProduct);
    console.log(specularProduct);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
    console.log(specularProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
    
    render();
}

function render(){
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (var obj of objList) {
        obj.draw();
    }
}

function createRoom() {
    objList = [];
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
}

