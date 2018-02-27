/**
 * Jacob Tucker
 * CS 435
 * Project #2
 *
 * Produces a car scene with cloneable prototype cars that can be dragged and moved
 *
 **/
"use strict";

var gl;
var canvas;
var Cars;
var selectedCar;
var transformation;
var fColor;
var projection;
var vPosition;
var oldX;
var oldY;

class Car {
    constructor(color, x0, y0, x1, y1) {
        this.NumVertices = 4;
        this.color = color;
        this.topLeft = vec2(x0, y0);
        this.bottomRight = vec2(x1, y1);
        this.points=[];
        this.domePoints = [];
        this.wheelPoints = [[], []];
        this.wheelRadius = 0;
        this.points.push(mix(this.topLeft, vec2(this.topLeft[0], this.bottomRight[1]), 1.0/2.0));
        this.points.push(vec2(this.topLeft[0], this.bottomRight[1]));
        this.points.push(this.bottomRight);
        this.points.push(mix(vec2(this.bottomRight[0], this.topLeft[1]), this.bottomRight, 1.0/2.0));
        this.setDomePoints();
        this.setWheelPoints();
        this.vBuffer = null;
        this.domeBuffer = null;
        this.wheelBuffers = [null, null];
        this.offsetX = 0;
        this.offsetY = 0;
    }

    setDomePoints() {
        this.domePoints = [];
        var radius = this.points[3][1] - this.topLeft[1];
        var center = vec2(this.points[3][0]-radius, this.points[3][1]);
        this.domePoints.push(center);
        var theta = 0;
        var s;
        var c;
        for (var i = 0; i <= 16; i++) {
            theta = Math.PI/16.0 * i; 
            s = -1 * radius * Math.sin(theta) + center[1];
            c = -1 * radius * Math.cos(theta) + center[0];
            this.domePoints.push(vec2(c, s));
        }
    }

    setWheelPoints() {
        this.wheelPoints[0] = [];
        this.wheelPoints[1] = [];
        var radius = (this.bottomRight[0] - this.topLeft[0]) / 8.0;
        this.wheelRadius = radius;
        var center = [];
        center[0] = mix(this.points[1], this.bottomRight, 3.0/4.0);
        this.wheelPoints[0].push(center[0]);
        center[1] = mix(this.points[1], this.bottomRight, 1.0/4.0);
        this.wheelPoints[1].push(center[1]);
        var theta = [0, 0];
        var s, c;
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j <= 32; j++) {
                theta = 2 * Math.PI / 32.0 * j;
                s = radius * Math.sin(theta) + center[i][1];
                c = radius * Math.cos(theta) + center[i][0];
                this.wheelPoints[i].push(vec2(c, s));
            }
        }
    }

    clone() {
        var car = new Car(this.color, this.topLeft[0], this.topLeft[1], this.bottomRight[0], this.bottomRight[1]);
        car.init();
        return car;
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
        var p = this.transform(x, y);
        return p[0] > this.topLeft[0] && p[0] < this.bottomRight[0] && p[1] > this.topLeft[1] && p[1] < this.bottomRight[1] + this.wheelRadius;
    }

    init() {
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);
        this.domeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.domeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.domePoints), gl.STATIC_DRAW);
        for (var i = 0; i < 2; i++) {
            this.wheelBuffers[i] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.wheelBuffers[i]);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(this.wheelPoints[i]), gl.STATIC_DRAW);
        }
    }

    draw() {
        var tm = translate(this.offsetX, this.offsetY, 0.0);
        gl.uniformMatrix4fv(transformation, gl.TRUE, flatten(tm));

        gl.uniform4fv(fColor, flatten(this.color));
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.domeBuffer);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.domePoints.length);

        gl.uniform4fv(fColor, flatten(vec4(0.0, 0.0, 0.0, 1.0)));

        gl.bindBuffer(gl.ARRAY_BUFFER, this.wheelBuffers[0]);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.wheelPoints[0].length);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.wheelBuffers[1]);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.wheelPoints[1].length);
    }
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    canvas.addEventListener('click', function(event) {
        if (event.button != 0 || !event.altKey) return;
        var [x, y] = convertMouseCoordinates(event.pageX, event.pageY);
        for (var i = 6; i < Cars.length && i > 5; i++) {
            if (Cars[i].isInside(x,y)) {
                Cars.splice(i, 1);
                requestAnimationFrame(render);
                break;
            }
        }
    })
    canvas.addEventListener('mousedown', function(event) {
        if (event.button != 0) return;
        var [x,y] = convertMouseCoordinates(event.pageX, event.pageY);
        oldX = x;
        oldY = y;
        console.log(x, y);

        for (var i = 6; i < Cars.length && i > 5; i++) {
            if (Cars[i].isInside(x, y)) {
                console.log(i);
                selectedCar = i;
            }
        }
        for (var i = 0; i < 6; i++) {
            if (Cars[i].isInside(x, y)) {
                console.log(i);
                console.log(Cars[i].clone());
                Cars.push(Cars[i].clone());
                selectedCar = Cars.length-1;
            }
        }
    });

    canvas.addEventListener('mousemove', function(event) {
        if (selectedCar === -1) return;
        var [x,y] = convertMouseCoordinates(event.pageX, event.pageY);
        Cars[selectedCar].updateOffset(x-oldX, y-oldY);
        console.log(Cars[selectedCar].offsetX, Cars[selectedCar].offsetY);
        oldX = x;
        oldY = y;
        window.requestAnimFrame(render);
    });

    canvas.addEventListener('mouseup', function(event) {
        selectedCar = -1;
    })

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }


    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    Cars = [];
    Cars.push(new Car(vec4(1.0, 0.0, 0.0, 1.0), 25, 25, 100, 50));
    Cars.push(new Car(vec4(0.0, 1.0, 0.0, 1.0), 125, 25, 200, 50))
    Cars.push(new Car(vec4(0.0, 0.0, 1.0, 1.0), 225, 25, 300, 50))
    Cars.push(new Car(vec4(1.0, 0.0, 1.0, 1.0), 325, 25, 400, 50))
    Cars.push(new Car(vec4(0.0, 1.0, 1.0, 1.0), 425, 25, 500, 50))
    Cars.push(new Car(vec4(1.0, 1.0, 0.0, 1.0), 525, 25, 600, 50))
    for (var i = 0; i < Cars.length; i++) {
        Cars[i].init();
    }
    selectedCar = -1;

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
    for (var i = 0; i < Cars.length; i++) {
        Cars[i].draw();
    }
}

function convertMouseCoordinates(x, y) {
    var newX = x - canvas.offsetLeft;
    var newY = y - canvas.offsetTop;
    return [newX, newY];

}
