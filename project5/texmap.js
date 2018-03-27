/**
 * Jacob Tucker
 * CS 435
 * Project #5
 *
 * Creates a rudimentary desktop window manager
 *
 **/
"use strict";

var gl;
var canvas;
var applicationWindows;
var selectedWindow;
var transformation;
var fColor;
var projection;
var vPosition;
var oldX;
var oldY;
var calculatorTex;
var webBrowserTex;

class Window {
    constructor(color, x0, y0, x1, y1, z) {
        this.NumVertices = 4;
        this.color = color;
        this.topLeft = vec2(x0, y0);
        this.bottomRight = vec2(x1, y1);
        this.zIndex = z;
        
        this.points=[];
        this.points.push(vec3(this.topLeft, this.zIndex));
        this.points.push(vec3(this.topLeft[0], this.bottomRight[1], this.zIndex));
        this.points.push(vec3(this.bottomRight, this.zIndex));
        this.points.push(vec3(this.bottomRight[0], this.topLeft[1], this.zIndex));
        
        this.offsetX = 0;
        this.offsetY = 0;
    }

    clone() {
        var win = new Window(this.color, this.topLeft[0], this.topLeft[1], this.bottomRight[0], this.bottomRight[1], this.zIndex);
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

    setZIndex(z) {
        this.zIndex = z;
    }

    transform(x, y) {
        var x2 = x - this.offsetX;
        var y2 = y - this.offsetY;
        return vec2(x2, y2);
    }

    isInside(x, y) {
        var p = this.transform(x, y);
        return p[0] > this.topLeft[0] && p[0] < this.bottomRight[0] && p[1] > this.topLeft[1] && p[1] < this.bottomRight[1];
    }

    init() {
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);
    }

    draw() {
        var tm = translate(this.offsetX, this.offsetY, this.zIndex);
        gl.uniformMatrix4fv(transformation, gl.TRUE, flatten(tm));
        console.log(tm);

        gl.uniform4fv(fColor, flatten(this.color));
        console.log(this.color);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length);
    }
}

class Calculator extends Window {
    constructor(color, x0, y0, x1, y1, z) {
        super(color, x0, y0, x1, y1, z);
    }   
}

class WebBrowser extends Window {
    constructor(color, x0, y0, x1, y1, z) {
        super(color, x0, y0, x1, y1, z);
    }   
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    canvas.addEventListener('mousedown', function(event) {
        if (event.button != 0) return;
        var [x,y] = convertMouseCoordinates(event.pageX, event.pageY);
        oldX = x;
        oldY = y;

        for (var i = 0; i < applicationWindows.length; i++) {
            if (applicationWindows[i].isInside(x, y)) {
                selectedWindow = i;
            }
        }
    });

    canvas.addEventListener('mousemove', function(event) {
        if (selectedWindow === -1) return;
        var [x,y] = convertMouseCoordinates(event.pageX, event.pageY);
        applicationWindows[selectedWindow].updateOffset(x-oldX, y-oldY);
        oldX = x;
        oldY = y;
        window.requestAnimFrame(render);
    });

    canvas.addEventListener('mouseup', function(event) {
        selectedWindow = -1;
    })

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }


    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    applicationWindows = [];
    applicationWindows.push(new Calculator(vec4(1.0, 0.0, 0.0, 1.0), 100, 100, 600, 600, 1));
    for (var win of applicationWindows) {
        win.init();
    }

    selectedWindow = -1;

    vPosition = gl.getAttribLocation(program, "vPosition");
    fColor = gl.getUniformLocation(program, "fColor");
    transformation = gl.getUniformLocation(program, "transformation");
    projection = gl.getUniformLocation(program, "projection");
    console.log(canvas.width);
    console.log(canvas.height);
    var pm = ortho(0.0, canvas.width, canvas.height, 0.0, -10.0, 10.0);
    gl.uniformMatrix4fv(projection, gl.TRUE, flatten(pm));

    var calcImg = document.getElementById('calculator-img');
    var webBrowserImg = document.getElementById('web-browswer-img');


    gl.enable(gl.DEPTH_TEST);
    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (var i = 0; i < applicationWindows.length; i++) {
        applicationWindows[i].draw();
        console.log(applicationWindows[i]);
    }
}

function convertMouseCoordinates(x, y) {
    var newX = x - canvas.offsetLeft;
    var newY = y - canvas.offsetTop;
    return [newX, newY];

}

function configureTexture( image ) {
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, 
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    
    // gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    return texture;
}
