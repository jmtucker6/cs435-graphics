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
var projection;
var fColor;
var vPosition;
var oldX;
var oldY;
var calculatorTex;
var webBrowserTex;
var wallpaperTex;
var wallpaper;
var taskBarTex;
var taskBar;
var closeTex;
var calcIconTex;
var browserIconTex;

var texCoord;
var texCoords = [
    vec2(0,0),
    vec2(0,1),
    vec2(1,1),
    vec2(1,0)
];

class Window {
    constructor(x0, y0, x1, y1, z) {
        this.color = vec4(1.0,1.0,1.0,1.0);
        this.NumVertices = 4;
        this.topLeft = vec2(x0, y0);
        this.bottomRight = vec2(x1, y1);
        this.zIndex = z;
        
        this.points=[];
        this.points.push(vec3(this.topLeft, this.zIndex));
        this.points.push(vec3(this.topLeft[0], this.bottomRight[1], this.zIndex));
        this.points.push(vec3(this.bottomRight, this.zIndex));
        this.points.push(vec3(this.bottomRight[0], this.topLeft[1], this.zIndex));

        this.tPoints = [];
        this.tPoints.push(vec2(texCoords[0]));
        this.tPoints.push(vec2(texCoords[1]));
        this.tPoints.push(vec2(texCoords[2]));
        this.tPoints.push(vec2(texCoords[3]));
        
        this.offsetX = 0;
        this.offsetY = 0;
    }

    clone() {
        var win = new Window(this.topLeft[0], this.topLeft[1], this.bottomRight[0], this.bottomRight[1], this.zIndex);
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
        for (var i = 0; i < this.points.length; i++) {
            this.points[i][2] = z;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);
    }

    transform(x, y) {
        var x2 = x - this.offsetX;
        var y2 = y - this.offsetY;
        return vec2(x2, y2);
    }


    init() {
        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

        this.tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.tPoints), gl.STATIC_DRAW);
    }

    draw() {
        var tm = translate(this.offsetX, this.offsetY, this.zIndex);
        gl.uniformMatrix4fv(transformation, gl.TRUE, flatten(tm));
        gl.uniform4fv(fColor, flatten(this.color));

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoord);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length);
    }
}

class ApplicationWindow extends Window {
    constructor(x0, y0, x1, y1, z) {
        super(x0, y0, x1, y1, z);
        this.titlePoints = [];
        this.titlePoints.push(vec3(x0, y0, z+.01));
        this.titlePoints.push(vec3(x0, y0+20, z+.01));
        this.titlePoints.push(vec3(x1-20, y0+20, z+.01));
        this.titlePoints.push(vec3(x1-20, y0, z+.01));
        this.closePoints = [];
        this.closePoints.push(vec3(x1-20, y0, z+.01));
        this.closePoints.push(vec3(x1-20, y0+20, z+.01));
        this.closePoints.push(vec3(x1, y0+20, z+.01));
        this.closePoints.push(vec3(x1, y0, z+.01));
    }   

    init() {
        super.init();
        this.cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.closePoints), gl.STATIC_DRAW);
    }

    isInClose(x, y) {
        var p = this.transform(x,y);
        return p[0] >= this.closePoints[0][0] && p[0] <= this.closePoints[2][0] && p[1] <= this.closePoints[1][1] && p[1] >= this.closePoints[0][1];
    }
    
    isInside(x, y) {
        var p = this.transform(x, y);
        return p[0] > this.titlePoints[0][0] && p[0] < this.titlePoints[2][0] && p[1] > this.titlePoints[0][1] && p[1] < this.titlePoints[1][1];
    }

    draw() {
        super.draw();
        this.drawTitle();
        this.drawClose();
    }

    setZIndex(z) {
        super.setZIndex(z);
        for (var i = 0; i < this.titlePoints.length; i++) {
            this.titlePoints[i][2] = z+.01;
        }
        for (var i = 0; i < this.closePoints.length; i++) {
            this.closePoints[i][2] = z+.01;
        }
    }
    
    drawClose() {
        gl.uniform4fv(fColor, flatten(this.color));
        gl.bindTexture(gl.TEXTURE_2D, closeTex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.closePoints), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoord);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.closePoints.length);
    }

    drawTitle() {
        gl.uniform4fv(fColor, vec4(0.0, 0.0, 0.0, 1.0));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.titlePoints), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoord);
        
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.titlePoints.length);
    }
}

class Calculator extends ApplicationWindow {
    constructor(x0, y0, x1, y1, z) {
        super(x0, y0, x1, y1, z);
        this.name = 'calc';
    }   
    
    draw() {
        gl.bindTexture(gl.TEXTURE_2D, calculatorTex);
        super.draw();
    }

}

class WebBrowser extends ApplicationWindow {
    constructor(x0, y0, x1, y1, z) {
        super(x0, y0, x1, y1, z);
        this.name = 'browser';
    }   

    draw() {
        gl.bindTexture(gl.TEXTURE_2D, webBrowserTex);
        super.draw();
    }
}

class Wallpaper extends Window {
    constructor(x0, y0, x1, y1, z) {
        super(x0, y0, x1, y1, z);
    }   

    draw() {
        gl.bindTexture(gl.TEXTURE_2D, wallpaperTex);
        super.draw();
    }
}

class Taskbar  extends Window {
    constructor(x0, y0, x1, y1, z) {
        super(x0, y0, x1, y1, z);
        this.calcIconPoints = [];
        this.calcIconPoints.push(vec3(x0+20, y0, z+0.1));
        this.calcIconPoints.push(vec3(x0+20, y1, z+0.1));
        this.calcIconPoints.push(vec3(x0+60, y1, z+0.1));
        this.calcIconPoints.push(vec3(x0+60, y0, z+0.1));

        this.browserIconPoints = [];
        this.browserIconPoints.push(vec3(x0+80, y0, z+0.1));
        this.browserIconPoints.push(vec3(x0+80, y1, z+0.1));
        this.browserIconPoints.push(vec3(x0+120, y1, z+0.1));
        this.browserIconPoints.push(vec3(x0+120, y0, z+0.1));
    }   

    draw() {
        gl.bindTexture(gl.TEXTURE_2D, wallpaperTex);
        this.color = vec4(0,0,0,1);
        gl.uniform4fv(fColor, flatten(this.color));
        super.draw();
        this.drawBrowserIcon();
        this.drawCalcIcon();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);
    }

    drawBrowserIcon() {
        gl.bindTexture(gl.TEXTURE_2D, browserIconTex);
        this.color = vec4(1,1,1,1);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.browserIconPoints), gl.STATIC_DRAW);
        super.draw();
    }

    drawCalcIcon() {
        gl.bindTexture(gl.TEXTURE_2D, calcIconTex);
        this.color = vec4(1,1,1,1);
        gl.uniform4fv(fColor, flatten(vec4(1,1,1,1)));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.calcIconPoints), gl.STATIC_DRAW);
        super.draw();
    }

    inCalcIcon(x,y) {
        var p = this.transform(x,y);
        return p[0] >= this.calcIconPoints[0][0] && p[0] <= this.calcIconPoints[2][0] && p[1] <= this.calcIconPoints[1][1] && p[1] >= this.calcIconPoints[0][1];

    }

    inBrowserIcon(x,y) {
        var p = this.transform(x,y);
        return p[0] >= this.browserIconPoints[0][0] && p[0] <= this.browserIconPoints[2][0] && p[1] <= this.browserIconPoints[1][1] && p[1] >= this.browserIconPoints[0][1];
    }

    setZIndex(z) {
        for (var i = 0; i < this.points.length; i++) {
            this.points[i][2] = z;
            this.calcIconPoints[i][2] = z+.01;
            this.browserIconPoints[i][2] = z+.01;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);
    }
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    canvas.addEventListener('mousedown', function(event) {
        if (event.button != 0) return;
        var [x,y] = convertMouseCoordinates(event.pageX, event.pageY);
        var currWindow;
        oldX = x;
        oldY = y;

        for (var i = applicationWindows.length - 1; i >= 0; i--) {
            if (applicationWindows[i].isInside(x, y)) {
                selectedWindow = i;
                currWindow = applicationWindows[i];
                applicationWindows.splice(selectedWindow, 1);
                applicationWindows.push(currWindow);
                console.log(applicationWindows);
                for (var j = 0; j < applicationWindows.length; j++) {
                    applicationWindows[j].setZIndex(j+1);
                }
                selectedWindow = applicationWindows.length-1;
                console.log(selectedWindow);
                window.requestAnimFrame(render);
                return;
            }
        }
    });

    canvas.addEventListener('click', function(event) {
        var [x,y] = convertMouseCoordinates(event.pageX, event.pageY);
        if (taskBar.inCalcIcon(x,y)) {
            var newCalc = new Calculator(100, 100, 600, 600, 1);
            newCalc.init();
            applicationWindows.push(newCalc);
            for (var j = 0; j < applicationWindows.length; j++) {
                applicationWindows[j].setZIndex(j+1);
            }
            taskBar.setZIndex(applicationWindows.length+1);
            window.requestAnimFrame(render);
            return;
        } else if (taskBar.inBrowserIcon(x,y)){
            var newBrowser = new WebBrowser(100, 100, 600, 600, 1);
            newBrowser.init();
            applicationWindows.push(newBrowser);
            for (var j = 0; j < applicationWindows.length; j++) {
                applicationWindows[j].setZIndex(j+1);
            }
            taskBar.setZIndex(applicationWindows.length+1);
            window.requestAnimFrame(render);
            return;
        }
        for (var i = applicationWindows.length - 1; i >= 0; i--) {
            if (applicationWindows[i].isInClose(x,y)) {
                var currWindow = applicationWindows[i];
                applicationWindows.splice(i,1);
                for (var j = 0; j < applicationWindows.length; j++) {
                    applicationWindows[j].setZIndex(j+1);
                }
                taskBar.setZIndex(applicationWindows.length+1);
                window.requestAnimFrame(render);
                return;
            }
        }
    })

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

    wallpaper = new Wallpaper(0, 0, canvas.width, canvas.height, 0);
    wallpaper.init();

    applicationWindows = [];
    applicationWindows.push(new Calculator(100, 100, 600, 600, 1));
    applicationWindows.push(new WebBrowser(200, 200, 700, 700, 2));
    for (var win of applicationWindows) {
        win.init();
    }

    taskBar = new Taskbar(0, canvas.height-40, canvas.width, canvas.height, applicationWindows.length+1);
    taskBar.init();

    selectedWindow = -1;

    vPosition = gl.getAttribLocation(program, "vPosition");
    fColor = gl.getUniformLocation(program, "fColor");
    texCoord = gl.getAttribLocation(program, "texCoord");
    transformation = gl.getUniformLocation(program, "transformation");
    projection = gl.getUniformLocation(program, "projection");

    var calcImg = document.getElementById('calculator-image');
    calculatorTex = configureTexture(calcImg);
    var webBrowserImg = document.getElementById('web-browser-image');
    webBrowserTex = configureTexture(webBrowserImg);
    var wallpaperImg = document.getElementById('wallpaper-image');
    wallpaperTex = configureTexture(wallpaperImg);
    var closeImg = document.getElementById('close-image');
    closeTex = configureTexture(closeImg);
    var calcIcon = document.getElementById('calc-icon');
    calcIconTex = configureTexture(calcIcon);
    var browserIcon = document.getElementById('web-icon');
    browserIconTex = configureTexture(browserIcon);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);


    gl.enable(gl.DEPTH_TEST);
    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    console.log(applicationWindows.length)
    var pm = ortho(0.0, canvas.width, canvas.height, 0.0, -100, 1);
    gl.uniformMatrix4fv(projection, gl.TRUE, flatten(pm));

    wallpaper.draw();
    for (var i = 0; i < applicationWindows.length; i++) {
        applicationWindows[i].draw();
    }
    taskBar.draw();
}

function convertMouseCoordinates(x, y) {
    var newX = x - canvas.offsetLeft;
    var newY = y - canvas.offsetTop;
    return [newX, newY];

}

function configureTexture( image ) {
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, 
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
}
