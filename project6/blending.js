/*
 * CS 435
 * Project #6
 * Jacob Tucker
 * Blending of ball in a cup
 */
var modelViewMatrix;
var projectionMatrix;
var vPosition;
var fColor;
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
    constructor(p1, p2, p3, p4, color, tex) {
        this.points = [p1, p2, p3, p4];
        this.tex = tex;
        this.color = color;

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

        this.tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);
    }

    draw() {
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.uniform4fv(fColor, flatten(this.color));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLoc);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length);
    }
}

class Circle {
    constructor(center, radius, color, tex) {
        this.center = center;
        this.radius = radius;
        this.tex = tex;
        this.color = color;
        this.points = [];
        this.texCoords = [vec2(0,0)];
        this.points.push(center);
        this.sides = 36;

        for (var i = 0; i <= this.sides; i++) {
            var point = vec3(radius*Math.sin(2*i*Math.PI/this.sides), 0, radius*Math.cos(2*i*Math.PI/this.sides));
            this.points.push(add(point, center));
            this.texCoords.push(vec2(0,0));
        }


        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

        this.tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texCoords), gl.STATIC_DRAW);
    }

    draw() {
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.uniform4fv(fColor, flatten(this.color));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLoc);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length);
    }
}

class Triangle {
    constructor(p1, p2, p3, color, tex) {
        this.points = [p1,p2,p3];
        this.color = color;
        this.tex = tex;
        this.texCoords = [vec2(0,0),vec2(0,0),vec2(0,0)];

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

        this.tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texCoords), gl.STATIC_DRAW);
    }

    draw() {
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.uniform4fv(fColor, flatten(this.color));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLoc);

        gl.drawArrays(gl.TRIANGLES, 0, this.points.length);
    }
}

class Prism {
    constructor(p1, p2, p3, p4, height, color, tex) {
        var tallP1 = add(p1, vec3(0,height,0));
        var tallP2 = add(p2, vec3(0,height,0));
        var tallP3 = add(p3, vec3(0,height,0));
        var tallP4 = add(p4, vec3(0,height,0));
        this.surfaces = [];
        this.surfaces.push(new Quad(p4, p3, p2, p1, color,  tex));
        this.surfaces.push(new Quad(tallP1, tallP2, tallP3, tallP4, color,  tex));
        this.surfaces.push(new Quad(tallP4, p4, p1, tallP1, color,  tex));
        this.surfaces.push(new Quad( tallP1, p1, p2, tallP2, color,  tex));
        this.surfaces.push(new Quad( tallP3, p3, p4, tallP4, color,  tex));
        this.surfaces.push(new Quad( tallP2, p2, p3, tallP3, color,  tex));
    }

    draw () {
        for (var surface of this.surfaces) {
            surface.draw();
        }
    }
}

class Table {
    constructor (sideLength, height, color, tex) {
        this.sideLength = sideLength;
        this.height = height;
        this.tex = tex;
        this.color = color;
        var halfLength = sideLength/2.0;
        this.bottomOfHorizontalHeight = height - 0.5;
        this.horizontal = new Prism(vec3(-halfLength, this.bottomOfHorizontalHeight, -halfLength),
                vec3(-halfLength, this.bottomOfHorizontalHeight, halfLength),
                vec3(halfLength, this.bottomOfHorizontalHeight, halfLength),
                vec3(halfLength, this.bottomOfHorizontalHeight, -halfLength),
                0.5,
                color,
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
            this.color,
            this.tex));
        this.legs.push(new Prism(vec3(-halfLength+.1, 0, halfLength-.1-legWidth),
            vec3(-halfLength+.1, 0, halfLength-.1),
            vec3(-halfLength+.1+legWidth, 0, halfLength-.1),
            vec3(-halfLength+.1+legWidth, 0, halfLength-.1-legWidth),
            this.bottomOfHorizontalHeight,
            this.color,
            this.tex));
        this.legs.push(new Prism(vec3(halfLength-.1-legWidth, 0, halfLength-.1-legWidth),
            vec3(halfLength-.1-legWidth, 0, halfLength-.1),
            vec3(halfLength-.1, 0, halfLength-.1),
            vec3(halfLength-.1, 0, halfLength-.1-legWidth),
            this.bottomOfHorizontalHeight,
            this.color,
            this.tex));
        this.legs.push(new Prism(vec3(halfLength-.1-legWidth, 0, -halfLength+.1),
            vec3(halfLength-.1-legWidth, 0, -halfLength+.1+legWidth),
            vec3(halfLength-.1, 0, -halfLength+.1+legWidth),
            vec3(halfLength-.1, 0, -halfLength+.1),
            this.bottomOfHorizontalHeight,
            this.color,
            this.tex));
    }
}

class Cup {
    constructor(center, radius, height, color, tex) {
        this.center = center;
        this.radius = radius;
        this.height = height;
        this.color = color;
        this.tex = tex;
        this.circle = new Circle(center, radius, color, tex);
        this.walls = [];
        // for (var i = 1; i < 2; i++) {
        for (var i = 1; i < this.circle.points.length-1; i++) {
            var p1 = add(vec3(0,height,0),this.circle.points[i]);
            var p2 = this.circle.points[i];
            var p3 = this.circle.points[i+1];
            var p4 = add(vec3(0,height,0),this.circle.points[i+1]);
            this.walls.push(new Quad(p1,p2,p3,p4,color,tex));
        }
    }

    draw() {
        this.circle.draw();
        for (var wall of this.walls) {
            wall.draw();
        }
    }
}

class Ball {
    constructor(center, radius, color, tex) {
        this.center = center;
        this.radius = radius;
        this.color = color;
        this.tex = tex;
        this.numDivisions = 3;
        var startPoints = [vec3(0,1,0)];
        for (var i = 0; i < 4; i++) {
            startPoints.push(vec3(Math.sin(2*i*Math.PI/4), 0, Math.cos(2*i*Math.PI/4)));
        }
        startPoints.push(vec3(0, -1, 0));
        var startTriangles = [[startPoints[0], startPoints[1], startPoints[2]],
                [startPoints[0], startPoints[2], startPoints[3]],
                [startPoints[0], startPoints[3], startPoints[4]],
                [startPoints[0], startPoints[4], startPoints[1]],
                [startPoints[5], startPoints[2], startPoints[1]],
                [startPoints[5], startPoints[3], startPoints[2]],
                [startPoints[5], startPoints[4], startPoints[3]],
                [startPoints[5], startPoints[1], startPoints[4]]
                ];
        this.divideTriangles(startTriangles, this.numDivisions);
    }

    divideTriangles(triangles, divisions) {
        console.log('divisions', divisions);
        if (divisions === 0) {
            this.triangles = [];
            for (var triangle of triangles) {
                for (var i = 0; i < triangle.length; i++) {
                    triangle[i] = add(this.center, scale(this.radius, triangle[i]));
                    console.log(triangle[i]);
                }
                this.triangles.push(new Triangle(triangle[0], triangle[1], triangle[2], this.color, this.tex));
            }
            return;
        }
        var newTriangles = [];
        for (var triangle of triangles) {
            var temp = this.divideTriangle(triangle);
            newTriangles.push(temp[0]);
            newTriangles.push(temp[1]);
            newTriangles.push(temp[2]);
            newTriangles.push(temp[3]);
        }
        this.divideTriangles(newTriangles, --divisions);
    }

    divideTriangle (triangle) {
        var ab = normalize(mix(triangle[0], triangle[1], 0.5));
        var bc = normalize(mix(triangle[1], triangle[2], 0.5));
        var ac = normalize(mix(triangle[0], triangle[2], 0.5));
        return [
            [triangle[0], ab, ac],
            [ab, triangle[1], bc],
            [ac, bc, triangle[2]],
            [ac, ab, bc]
        ];
    }

    draw() {
        for (var triangle of this.triangles) {
            triangle.draw();
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

    texCoordLoc = gl.getAttribLocation(program, "texCoord");
    fColor = gl.getUniformLocation(program, "fColor");
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    vPosition = gl.getAttribLocation(program, "vPosition");
    modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
    var mvm = lookAt(vec3(0,1,2), vec3(0,0,0), vec3(0,1,0));
    gl.uniformMatrix4fv(modelViewMatrix, gl.TRUE, flatten(mvm));
    projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
    var pm = ortho(-10, 10, -10, 10, -10, 10);
    gl.uniformMatrix4fv(projectionMatrix, gl.TRUE, flatten(pm));

    var wallPaperImg = document.getElementById('wallpaper-image');
    var carpetImg = document.getElementById('carpet-image');
    var woodImg = document.getElementById('wood-image');
    var whiteImg = document.getElementById('white-image');
    
    wall = new Quad(vec3(-5,10,-5),
            vec3(-5,0,-5),
            vec3(5,0,-5),
            vec3(5,10,-5),
            vec4(1,1,1,1),
            configureTexture(wallPaperImg));
    floor = new Quad(vec3(-5,0,-5),
            vec3(-5,0,5),
            vec3(5,0,5),
            vec3(5,0,-5),
            vec4(1,1,1,1),
            configureTexture(carpetImg));
    table = new Table(4, 3, vec4(1,1,1,1), configureTexture(woodImg));
    cup = new Cup(vec3(0,3.01,0), 1, 2, vec4(0.5, 0.5, 0.5, 0.5), configureTexture(whiteImg));
    ball = new Ball(vec3(0,3.8,0), 0.8, vec4(0,0,1,1), configureTexture(whiteImg));
    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    wall.draw();
    floor.draw();
    table.draw();
    ball.draw();
    gl.depthMask(gl.FALSE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    cup.draw();
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
