/*
 * CS 435
 * Project #7
 * Jacob Tucker
 * Fog in a forest
 */
var fogColor = vec4(.3, .3, .3, 1.0);
var whiteImg;
var modelViewMatrix;
var projectionMatrix;
var vPosition;
var fColor;
var texCoordLoc;
var texCoords = [
    vec2(0,1),
    vec2(0,0),
    vec2(1,0),
    vec2(1,1)
];
var mvm;
var farthestZ;
var tree;

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


class Cylinder {
    constructor(center, radius, height, color, tex) {
        this.center = center;
        this.radius = radius;
        this.height = height;
        this.color = color;
        this.tex = tex;
        this.bottom = new Circle(center, radius, color, tex);
        this.top = new Circle(add(vec3(0,height,0), center), radius, color, tex);
        this.walls = [];
        for (var i = 1; i < this.bottom.points.length-1; i++) {
            var p1 = add(vec3(0,height,0),this.bottom.points[i]);
            var p2 = this.bottom.points[i];
            var p3 = this.bottom.points[i+1];
            var p4 = add(vec3(0,height,0),this.bottom.points[i+1]);
            this.walls.push(new Quad(p1,p2,p3,p4,color,tex));
        }
    }

    draw() {
        this.bottom.draw();
        for (var wall of this.walls) {
            wall.draw();
        }
        this.top.draw();
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
        if (divisions === 0) {
            this.triangles = [];
            for (var triangle of triangles) {
                for (var i = 0; i < triangle.length; i++) {
                    triangle[i] = add(this.center, scale(this.radius, triangle[i]));
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

class Tree {
    constructor(xcoord, color, tex) {
        this.xcoord = xcoord;
        this.trunkColor = color;
        this.topColor = vec3(Math.random(), Math.random(), Math.random(), 1);
        this.tex = tex;
        this.zOffset = 0;
        this.trunk = new Cylinder(vec3(this.xcoord, -1, farthestZ), 0.5, 6, color, tex);
        this.top = new Ball(vec3(this.xcoord, 5-1, farthestZ), 2, color, tex);
    }

    updateZOffset(offset) {
        this.zOffset += offset;
    }

    setZOffset(offset) {
        this.zOffset = offset;
    }
    draw() {
        var newMvm = mult(mvm, translate(0,0,this.zOffset));
        gl.uniformMatrix4fv(modelViewMatrix, gl.TRUE, flatten(newMvm));
        this.top.draw();
        this.trunk.draw();
        gl.uniformMatrix4fv(modelViewMatrix, gl.TRUE, flatten(mvm));
    }
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    gl.viewport(0,0,canvas.width, canvas.height);
    console.log(fogColor);
    gl.clearColor(fogColor[0],fogColor[1],fogColor[2],1);
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    farthestZ = -40;
    texCoordLoc = gl.getAttribLocation(program, "texCoord");
    fColor = gl.getUniformLocation(program, "fColor");
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    vPosition = gl.getAttribLocation(program, "vPosition");
    modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
    var fogColorLoc = gl.getUniformLocation(program, "fogColor");

    mvm = lookAt(vec3(0,0,1), vec3(0,0,0), vec3(0,1,0));
    console.log("mvm", mvm);
    gl.uniformMatrix4fv(modelViewMatrix, gl.TRUE, flatten(mvm));
    projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
    // var pm = ortho(-10, 10, -10, 10, -10, 10);
    var pm = perspective(90.0, canvas.width/canvas.height, 2, -10);
    console.log("pm", pm);
    gl.uniformMatrix4fv(projectionMatrix, gl.TRUE, flatten(pm));

   
    gl.uniform4fv(fogColorLoc, flatten(fogColor));

    whiteImg = document.getElementById('white-image');

    tree = new Tree(Math.random()*20-10, vec4(0,0,1,1), configureTexture(whiteImg));
    
    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    tree.updateZOffset(0.1);
    if (tree.zOffset >= Math.abs(farthestZ)) {
        console.log('done');
        tree = createNewTree();
    }
    tree.draw();
    requestAnimFrame(render);
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

function createNewTree() {
    return new Tree(Math.random()*20-10, selectColor(), configureTexture(whiteImg));
}

function selectColor() {
    const i = Math.floor(Math.random()*8);
    switch (i) {
        case 0:
            return vec4(1,1,1,1);
        case 1:
            return vec4(1,0,0,1);
        case 2:
            return vec4(0,1,0,1);
        case 3:
            return vec4(0,0,1,1);
        case 4:
            return vec4(1,1,0,1);
        case 5:
            return vec4(1,0,1,1);
        case 6:
            return vec4(0,1,1,1);
        case 7:
            return vec4(0,0,0,1);
    }
}
