/*
 * CS 435
 * Project #6
 * Jacob Tucker
 * Blending of ball in a cup
 */
var modelViewMatrix;
var projectionMatrix;
var vPosition;
var texCoordLoc;
var wall;
var floor;
var table;
var cup;
var ball;
var texCoords = [
    vec2(0,1),
    vec2(0,0),
    vec2(1,0),
    vec2(1,1)
];

class Quad {
    constructor(p1, p2, p3, p4, tex) {
        this.points = [p1, p2, p3, p4];
        this.tex = tex;

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

        this.tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);
    }

    draw() {
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLoc);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length);
    }
}

class Prism {
    constructor(p1, p2, p3, p4, height, tex) {
        console.log('texture', tex);
        var tallP1 = add(p1, vec3(0,height,0));
        var tallP2 = add(p2, vec3(0,height,0));
        var tallP3 = add(p3, vec3(0,height,0));
        var tallP4 = add(p4, vec3(0,height,0));
        this.surfaces = [];
        this.surfaces.push(new Quad(p4, p3, p2, p1, tex));
        this.surfaces.push(new Quad(tallP1, tallP2, tallP3, tallP4, tex));
        this.surfaces.push(new Quad(tallP4, p4, p1, tallP1, tex));
        this.surfaces.push(new Quad( tallP1, p1, p2, tallP2, tex));
        this.surfaces.push(new Quad( tallP3, p3, p4, tallP4, tex));
        this.surfaces.push(new Quad( tallP2, p2, p3, tallP3, tex));
    }

    draw () {
        for (var surface of this.surfaces) {
            surface.draw();
        }
    }
}

class Table {
    constructor (sideLength, height, tex) {
        this.sideLength = sideLength;
        this.height = height;
        this.tex = tex;
        var halfLength = sideLength/2.0;
        this.bottomOfHorizontalHeight = height - 0.5;
        this.horizontal = new Prism(vec3(-halfLength, this.bottomOfHorizontalHeight, -halfLength),
                vec3(-halfLength, this.bottomOfHorizontalHeight, halfLength),
                vec3(halfLength, this.bottomOfHorizontalHeight, halfLength),
                vec3(halfLength, this.bottomOfHorizontalHeight, -halfLength),
                0.5,
                tex);
        this.createLegs();
    }

    draw() {
        this.horizontal.draw();
        for (var leg of this.legs) {
            leg.draw();
        }
    }

    createLegs() {
        this.legs = [];
        var halfLength = this.sideLength/2.0;
        var legWidth = .25;
        this.legs.push(new Prism(vec3(-halfLength+.1, 0, -halfLength+.1),
            vec3(-halfLength+.1, 0, -halfLength+.1+legWidth),
            vec3(-halfLength+.1+legWidth, 0, -halfLength+.1+legWidth),
            vec3(-halfLength+.1+legWidth, 0, -halfLength+.1),
            this.bottomOfHorizontalHeight,
            this.tex));
        this.legs.push(new Prism(vec3(-halfLength+.1, 0, halfLength-.1-legWidth),
            vec3(-halfLength+.1, 0, halfLength-.1),
            vec3(-halfLength+.1+legWidth, 0, halfLength-.1),
            vec3(-halfLength+.1+legWidth, 0, halfLength-.1-legWidth),
            this.bottomOfHorizontalHeight,
            this.tex));
        this.legs.push(new Prism(vec3(halfLength-.1-legWidth, 0, halfLength-.1-legWidth),
            vec3(halfLength-.1-legWidth, 0, halfLength-.1),
            vec3(halfLength-.1, 0, halfLength-.1),
            vec3(halfLength-.1, 0, halfLength-.1-legWidth),
            this.bottomOfHorizontalHeight,
            this.tex));
        this.legs.push(new Prism(vec3(halfLength-.1-legWidth, 0, -halfLength+.1),
           vec3(halfLength-.1-legWidth, 0, -halfLength+.1+legWidth),
           vec3(halfLength-.1, 0, -halfLength+.1+legWidth),
           vec3(halfLength-.1, 0, -halfLength+.1),
           this.bottomOfHorizontalHeight,
           this.tex));
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

    texCoordLoc = gl.getAttribLocation(program, "texCoord");
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    vPosition = gl.getAttribLocation(program, "vPosition");
    modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
    var mvm = lookAt(vec3(0.5,0.2,3), vec3(0,0,0), vec3(0,1,0));
    gl.uniformMatrix4fv(modelViewMatrix, gl.TRUE, flatten(mvm));
    projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
    var pm = ortho(-10, 10, -10, 10, -10, 10);
    gl.uniformMatrix4fv(projectionMatrix, gl.TRUE, flatten(pm));

    var wallPaperImg = document.getElementById('wallpaper-image');
    var carpetImg = document.getElementById('carpet-image');
    var woodImg = document.getElementById('wood-image');
    
    wall = new Quad(vec3(-5,10,-5),
            vec3(-5,0,-5),
            vec3(5,0,-5),
            vec3(5,10,-5),
            configureTexture(wallPaperImg));
    floor = new Quad(vec3(-5,0,-5),
            vec3(-5,0,5),
            vec3(5,0,5),
            vec3(5,0,-5),
            configureTexture(carpetImg));
    table = new Table(4, 3, configureTexture(woodImg));
    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    wall.draw();
    floor.draw();
    table.draw();
    // cup.draw();
    // ball.draw();
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
