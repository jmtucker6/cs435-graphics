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
var circle;

class Obj {
    constructor() {
        this.color = vec4(0.0, 0.0, 0.0, 1.0);
        this.offsetX = 0.0;
        this.offsetY = 0.0;
        this.offsetZ = 0.0;
    }

    clone() {
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

    transform(x, y, z) {
        var x2 = x - this.offsetX;
        var y2 = y - this.offsetY;
        var z2 = z - this.offsetZ;
        return vec2(x2, y2);
    }

    init() {
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);
    }

    draw() {
        var tm = translate(this.offsetX, this.offsetY, this.offsetZ);
        gl.uniformMatrix4fv(transformation, gl.TRUE, flatten(tm));

        gl.uniform4fv(fColor, flatten(this.color));
        
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
        this.createPoints();
        this.color = vec4(0, 1, 0, 1);
    }

    createPoints() {
        this.points = [];
        this.points.push(this.center);
        for (var i=0; i <= 32; i++) {
            var angle = i*2*Math.PI/32
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            this.points.push(add(this.center, scale(this.radius, vec3(cos, sin, 0.0))));
        }
    }

}

class Quad extends Obj {
    constructor(p1, p2, p3, p4) {
        super();
        this.createPoints(p1, p2, p3, p4);
        this.color = vec4(1, 0, 0, 1);
    }

    createPoints(p1, p2, p3, p4) {
        this.points = [];
        this.points.push(p1);
        this.points.push(p2);
        this.points.push(p4);
        this.points.push(p3);
    }
}

class Cylinder extends Obj {
    constructor(center, radius, height) {
        super();
        this.center = center;
        this.radius = radius;
        this.height = height;
        this.circles = [
            new Circle(subtract(center, vec3(0,0,this.height/2.0)), radius),
            new Circle(add(center, vec3(0,0,this.height/2.0)), radius)
        ]
        this.quads = this.createQuads();
    }

    createQuads() {
        var arr = [];
        for (var i = 1; i <= 32; i++) {
            var quad = new Quad(this.circles[0].points[i], this.circles[0].points[i+1], this.circles[1].points[i], this.circles[1].points[i+1]);
            arr.push(quad);
        }
        return arr;
    }

    init() {
        for (var circle of this.circles) {
            circle.init();
        }
        for (var quad of this.quads) {
            quad.init();
        }
    }

    draw() {
        for (var circle of this.circles) {
            circle.setOffset(this.offsetX, this.offsetY, this.offsetZ);
            circle.draw();
        }
        for (var quad of this.quads) {
            quad.setOffset(this.offsetX, this.offsetY, this.offsetZ);
            quad.draw();
        }

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

    console.log("projection");
    projection = gl.getUniformLocation(program, "projection");
    var pm = lookAt(vec3(0,0,0), vec3(0,0,0), vec3(0,1,0));
    console.log(pm);
    gl.uniformMatrix4fv(projection, gl.TRUE, flatten(pm));

    circle = new Cylinder(vec3(),1,1);
    circle.init();

    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT);
    circle.draw();
}

