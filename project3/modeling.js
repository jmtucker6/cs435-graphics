/**
 * Jacob Tucker
 * CS 435
 * Project #3
 *
 * Produces a 3D gas sign
 * 
 * For the frame, if the call in constructor is changed to createFrame(), the sign is framed in cylinder edges. createRectangularFrame() creates a solid rectangular prism for the body of the sign
 *
 **/
"use strict";

var gl;
var canvas;
var transformation;
var masterModelViewMatrix;
var fColor;
var projection;
var vPosition;
var post;
var premium;
var mid;
var regular;
var theta = 0;
var POST_HEIGHT = 10;
var rotate = false;

var regular_price;
var mid_price;
var premium_price;
var rotateToggle;
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

    setXRotation(degrees) {
        this.rotateXDegrees = degrees;
    }

    setYRotation(degrees) {
        this.rotateYDegrees = degrees;
    }

    setZRotation(degrees) {
        this.rotateZDegrees = degrees;
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

    draw(modelViewMatrix) {
        if (!modelViewMatrix) {
            modelViewMatrix = mat4();
        }
        gl.uniformMatrix4fv(transformation, gl.TRUE, flatten(modelViewMatrix));

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
        this.createPoints();
    }

    createPoints() {
        this.points = [];
        this.points.push(this.center);
        for (var i=0; i <= 32; i++) {
            var angle = i*2*Math.PI/32
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            this.points.push(add(this.center, scale(this.radius, vec3(cos, 0, sin))));
        }
    }

}

class Quad extends Obj {
    constructor(p1, p2, p3, p4) {
        super();
        this.createPoints(p1, p2, p3, p4);
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
            new Circle(subtract(center, vec3(0,this.height/2.0,0)), radius),
            new Circle(add(center, vec3(0,this.height/2.0,0)), radius)
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
            circle.color = this.color;
            circle.init();
        }
        for (var quad of this.quads) {
            quad.color = this.color;
            quad.init();
        }
        if (this.sibling) {
            this.sibling.init();
        }
        if (this.child) {
            this.child.init();
        }
    }

    draw(modelViewMatrix) {
        if (!modelViewMatrix) {
            modelViewMatrix = mat4();
        }
        if (this.sibling) {
            this.sibling.draw(modelViewMatrix);
        }
        var tm = translate(this.offsetX, this.offsetY, this.offsetZ);
        tm = mult(tm, rotateX(this.rotateXDegrees));
        tm = mult(tm, rotateY(this.rotateYDegrees));
        tm = mult(tm, rotateZ(this.rotateZDegrees));
        tm = mult(modelViewMatrix, tm);

        for (var circle of this.circles) {
            circle.draw(tm);
        }
        for (var quad of this.quads) {
            quad.draw(tm);
        }

        if (this.child) {
            this.child.draw(modelViewMatrix);
        }

    }
}

class Frame extends Obj {
    constructor(height, width, radius) {
        super();
        this.width = width;
        this.height = height;
        this.radius = radius;
        this.createRectangularFrame();
        this.color = vec4(1,0,0,1);
    }

    createFrame() {
        this.edges = [];
        var edge = new Cylinder(vec3(), this.radius, this.width);
        edge.setZRotation(90);
        this.edges.push(edge);

        edge = new Cylinder(vec3(), this.radius, this.width);
        edge.setOffset(0, this.height, 0);
        edge.setZRotation(90);
        this.edges.push(edge);

        edge = new Cylinder(vec3(), this.radius, this.height);
        edge.setOffset(-1*this.width/2.0, this.height/2.0, 0)
        this.edges.push(edge);

        edge = new Cylinder(vec3(), this.radius, this.height);
        edge.setOffset(this.width/2.0, this.height/2.0, 0);
        this.edges.push(edge);
    }

    createRectangularFrame() {
        this.edges = [];
        var edge = new Quad(vec3(-1*this.width/2.0, this.height, 1*this.radius/2.0),
            vec3(1*this.width/2.0, this.height, 1*this.radius/2.0),
            vec3(-1*this.width/2.0, 0, 1*this.radius/2.0),
            vec3(1*this.width/2.0, 0, 1*this.radius/2.0));
        this.edges.push(edge);
        edge = new Quad(vec3(-1*this.width/2.0, this.height, -1*this.radius/2.0),
            vec3(1*this.width/2.0, this.height, -1*this.radius/2.0),
            vec3(-1*this.width/2.0, 0, -1*this.radius/2.0),
            vec3(1*this.width/2.0, 0, -1*this.radius/2.0));
        this.edges.push(edge);
        edge = new Quad(vec3(-1*this.width/2.0, this.height, -1*this.radius/2.0),
            vec3(1*this.width/2.0, this.height, -1*this.radius/2.0),
            vec3(-1*this.width/2.0, this.height, 1*this.radius/2.0),
            vec3(1*this.width/2.0, this.height, 1*this.radius/2.0));
        this.edges.push(edge);
        edge = new Quad(vec3(-1*this.width/2.0, 0, -1*this.radius/2.0),
            vec3(1*this.width/2.0, 0, -1*this.radius/2.0),
            vec3(-1*this.width/2.0, 0, 1*this.radius/2.0),
            vec3(1*this.width/2.0, 0, 1*this.radius/2.0));
        this.edges.push(edge);
        edge = new Quad(vec3(-1*this.width/2.0, this.height, -1*this.radius/2.0),
            vec3(-1*this.width/2.0, this.height, -1*this.radius/2.0),
            vec3(-1*this.width/2.0, 0, 1*this.radius/2.0),
            vec3(-1*this.width/2.0, 0, 1*this.radius/2.0));
        this.edges.push(edge);
        edge = new Quad(vec3(1*this.width/2.0, this.height, -1*this.radius/2.0),
            vec3(1*this.width/2.0, this.height, -1*this.radius/2.0),
            vec3(1*this.width/2.0, 0, 1*this.radius/2.0),
            vec3(1*this.width/2.0, 0, 1*this.radius/2.0));
        this.edges.push(edge);
    }
    
    init() {
        for (var edge of this.edges) {
            edge.color = this.color;
            edge.init();
        }
        if (this.child) {
            this.child.init();
        }
        if (this.sibling) {
            this.sibling.init();
        }
    }

    draw(modelViewMatrix) {
        if (!modelViewMatrix) {
            modelViewMatrix = mat4();
        }
        if (this.sibling) {
            this.sibling.draw(modelViewMatrix);
        }
        var tm = translate(this.offsetX, this.offsetY, this.offsetZ);
        tm = mult(tm, rotateX(this.rotateXDegrees));
        tm = mult(tm, rotateY(this.rotateYDegrees));
        tm = mult(tm, rotateZ(this.rotateZDegrees));
        modelViewMatrix = mult(modelViewMatrix, tm);

        for (var edge of this.edges) {
            edge.draw(modelViewMatrix);
        }

        if (this.child) {
            this.child.draw(modelViewMatrix);
        }
    }
}

class Letter extends Obj {
    constructor(letter) {
        super();
        this.segments = [];
        this.segIds = [];
        this.letter = letter;
        this.createSegments();
        this.selectLetter();
    }

    createSegments() {
        var seg = new Cylinder( vec3(), 0.2, 3);
        seg.setOffset(1.5, 0, 0);
        seg.setZRotation(90);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 3);
        seg.setOffset(4.5, 0, 0);
        seg.setZRotation(90);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 4);
        seg.setOffset(0, 2, 0);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 4);
        seg.setOffset(3, 2, 0);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 4);
        seg.setOffset(6, 2, 0);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 3);
        seg.setOffset(1.5, 4, 0);
        seg.setZRotation(90);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 3);
        seg.setOffset(4.5, 4, 0);
        seg.setZRotation(90);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 4);
        seg.setOffset(0, 6, 0);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 4);
        seg.setOffset(3, 6, 0);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 4);
        seg.setOffset(6, 6, 0);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 3);
        seg.setOffset(1.5, 8, 0);
        seg.setZRotation(90);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 3);
        seg.setOffset(4.5, 8, 0);
        seg.setZRotation(90);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 4.7);
        seg.setOffset(1.5, 2, 0);
        seg.setZRotation(-36.9);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 4.7);
        seg.setOffset(4.5, 2, 0);
        seg.setZRotation(36.9);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 4.7);
        seg.setOffset(1.5, 6, 0);
        seg.setZRotation(36.9);
        this.segments.push(seg);

        seg = new Cylinder(vec3(), 0.2, 4.7);
        seg.setOffset(4.5, 6, 0);
        seg.setZRotation(-36.9);
        this.segments.push(seg);
    }

    selectLetter() {
        switch(this.letter) {
            case 'R': 
                this.segIds = [2,7,10,11,9,6,13,5];
                break;
            case 'E':
                this.segIds = [1,0,2,5,6,7,10,11];
                break;
            case 'G':
                this.segIds = [6,4,1,0,2,7,10,11];
                break;
            case 'U':
                this.segIds = [9,4,1,0,2,7];
                break;
            case 'L':
                this.segIds = [1,0,2,7];
                break;
            case 'A':
                this.segIds = [2,7,10,11,9,4,5,6];
                break;
            case 'M':
                this.segIds = [2,7,14,15,9,4];
                break;
            case 'I':
                this.segIds = [0,1,3,8,10,11];
                break;
            case 'D':
                this.segIds = [0,1,4,9,11,10,8,3];
                break;
            case 'P':
                this.segIds = [2,7,10,11,9,6,5];
                break;
            case '0':
                this.segIds = [0,1,4,9,11,10,7,2,12,15];
                break;
            case '1':
                this.segIds = [15,9,4];
                break;
            case '2':
                this.segIds = [10,11,9,6,5,2,0,1];
                break;
            case '3':
                this.segIds = [10,11,9,6,4,1,0];
                break;
            case '4':
                this.segIds = [7,5,6,9,4];
                break;
            case '5':
                this.segIds = [11,10,7,5,6,4,1,0];
                break;
            case '6':
                this.segIds = [10,7,2,0,1,4,5,6];
                break;
            case '7':
                this.segIds = [10,11,9,4];
                break;
            case '8':
                this.segIds = [10,11,7,9,5,6,2,4,0,1];
                break;
            case '9':
                this.segIds = [10,11,7,9,4,5,6,1];
                break;
        }
    }

    init() {
        for (var id of this.segIds) {
            this.segments[id].color = this.color;
            this.segments[id].init();
        }
    }

    draw(modelViewMatrix) {
        if (!modelViewMatrix) {
            modelViewMatrix = mat4();
        }
        var tm = translate(this.offsetX, this.offsetY, this.offsetZ);
        tm = mult(tm, rotateX(this.rotateXDegrees));
        tm = mult(tm, rotateY(this.rotateYDegrees));
        tm = mult(tm, rotateZ(this.rotateZDegrees));
        modelViewMatrix = mult(modelViewMatrix, tm);

        for (var id of this.segIds) {
            this.segments[id].draw(modelViewMatrix);
        }

    }
}

class Word extends Obj {
    constructor(word) {
        super();
        this.word = word;
        this.letters = [];
        this.createLetters();
    }

    changeWord(word) {
        this.word = word;
        this.createLetters();
        for (var letter of this.letters) {
            letter.color = this.color;
            letter.init();
        }
    }

    createLetters() {
        this.letters = [];
        var letter;
        for (var i=0; i<this.word.length; i++) {
            letter = new Letter(this.word[i]);
            letter.setOffset(7*i, 0, 0);
            letter.color = this.color;
            this.letters.push(letter);
        }

    }

    init() {
        for(var letter of this.letters) {
            letter.color = this.color;
            letter.init();
        }
        if (this.child) {
            this.child.init();
        }
        if (this.sibling) {
            this.sibling.init();
        }
    }

    draw(modelViewMatrix) {
        if (!modelViewMatrix) {
            modelViewMatrix = mat4();
        }
        if (this.sibling) {
            this.sibling.draw(modelViewMatrix);
        }
        var tm = translate(this.offsetX, this.offsetY, this.offsetZ);
        tm = mult(tm, rotateX(this.rotateXDegrees));
        tm = mult(tm, rotateY(this.rotateYDegrees));
        tm = mult(tm, rotateZ(this.rotateZDegrees));
        tm = mult(tm, scalem(.1,.1,.1));
        modelViewMatrix = mult(modelViewMatrix, tm);

        for (var letter of this.letters) {
            letter.draw(modelViewMatrix);
        }
        
        if (this.child) {
            console.log(this.child);
            this.child.draw(modelViewMatrix);
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

    projection = gl.getUniformLocation(program, "projection");
    var pm = ortho(-10,10,-7,15,-10,10);
    gl.uniformMatrix4fv(projection, gl.TRUE, flatten(pm));

    post = new Cylinder(vec3(),0.5,POST_HEIGHT);
    var frame = new Frame(POST_HEIGHT/2, POST_HEIGHT, 0.25)
    frame.setOffset(0, POST_HEIGHT/2, 0);

    regular = new Word('REGULAR');
    regular.setOffset(-frame.width /2.0 + 0.5, 3*frame.height/4.0, 0);

    mid = new Word('MID');
    mid.setOffset(-frame.width /2.0 + 0.5, 2*frame.height/4.0, 0);

    premium = new Word('PREMIUM');
    premium.setOffset(-frame.width /2.0 + 0.5, 1*frame.height/4.0, 0);

    regular_price = new Word('219');
    regular_price.setOffset(2, 3*frame.height/4.0, 0);
    regular_price.color = vec4(0,1,0,1);

    mid_price = new Word('249');
    mid_price.setOffset(2, 2*frame.height/4.0, 0);
    mid_price.color = vec4(0,1,0,1);

    premium_price = new Word('285');
    premium_price.setOffset(2, 1*frame.height/4.0, 0);
    premium_price.color = vec4(0,1,0,1);

    mid_price.setSibling(premium_price);
    regular_price.setSibling(mid_price);
    premium.setSibling(regular_price);
    mid.setSibling(premium);
    regular.setSibling(mid);
    frame.setChild(regular);
    post.setChild(frame);
    post.init();
    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT);
    masterModelViewMatrix = lookAt(vec3(5*Math.sin(theta),1,5*Math.cos(theta)),
        vec3(0,0,0),
        vec3(0,1,0));
    post.draw(masterModelViewMatrix);
    if (rotateToggle) {
        theta += 0.05;
    }
    requestAnimationFrame(render);
}

function incrementPrice() {
    var currentPrice;
    switch (document.getElementById("price-mode").value) {
        case "regular":
            currentPrice = parseInt(regular_price.word);
            regular_price.changeWord(String(++currentPrice));
            break;
        case "mid":
            currentPrice = parseInt(mid_price.word);
            mid_price.changeWord(String(++currentPrice));
            break;
        case "premium":
            currentPrice = parseInt(premium_price.word);
            premium_price.changeWord(String(++currentPrice));
            break;
    }
}
function decrementPrice() {
    var currentPrice;
    switch (document.getElementById("price-mode").value) {
        case "regular":
            currentPrice = parseInt(regular_price.word);
            regular_price.changeWord(String(--currentPrice));
            break;
        case "mid":
            console.log("in mid");
            currentPrice = parseInt(mid_price.word);
            mid_price.changeWord(String(--currentPrice));
            break;
        case "premium":
            currentPrice = parseInt(premium_price.word);
            premium_price.changeWord(String(--currentPrice));
            break;
    }
}

function toggleRotate() {
    rotateToggle = !rotateToggle;
    document.getElementById("toggle-rotate").innerText = rotateToggle ? "Stop" : "Start";
}
