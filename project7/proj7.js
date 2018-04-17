/*
 * CS 435
 * Project #7
 * Jacob Tucker
 * Fog in a plastic forest
 */
var speed;
var numTrees;
var fogDensity;
var fogDensityLoc;
var fogColor = vec4(.6, .6, .6, 1.0);
var barkColor = vec4(98/255, 78/255, 44/255);
var lightPosition = vec4(1, 3, 3, 1);
var ambientLight = vec4(0.0, 0.0, 0.0, 1);
var diffuseLight = vec4(1,1,1,1);
var eye = vec3(0,0,1);
var whiteImg;
var modelViewMatrix;
var projectionMatrix;
var vPosition;
var normal;
var fColor;
var mvm;
var farthestZ;
var trees = [];

class Quad {
    constructor(p1, p2, p3, p4, color) {
        this.points = [p1, p2, p3, p4];
        const norm = this.getNorm();
        this.norms = [norm, norm, norm, norm];
        this.color = color;

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

        this.nBuffer = gl.createBuffer();
        this.setNormBuffer();
    }

    setNormBuffer() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.norms), gl.STATIC_DRAW);
    }

    draw() {
        gl.uniform4fv(fColor, flatten(this.color));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
        gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normal);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length);
    }

    getNorm() {
        const v1 = subtract(this.points[1], this.points[0]);
        const v2 = subtract(this.points[3], this.points[0]);
        return cross(v1, v2);
    }
}

class Circle {
    constructor(center, radius, color) {
        this.center = center;
        this.radius = radius;
        this.color = color;
        this.points = [];
        this.norms = [];
        this.points.push(center);
        this.sides = 36;

        for (var i = 0; i <= this.sides; i++) {
            var point = vec3(radius*Math.sin(2*i*Math.PI/this.sides), 0, radius*Math.cos(2*i*Math.PI/this.sides));
            this.points.push(add(point, center));
        }

        const norm = this.getNorm();
        for (var i = 0; i < this.points.length; ++i) {
            this.norms[i] = norm;
        }


        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

        this.nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.norms), gl.STATIC_DRAW);
    }

    draw() {
        gl.uniform4fv(fColor, flatten(this.color));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
        gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normal);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.points.length);
    }

    getNorm() {
        const v1 = subtract(this.points[1], this.points[0]);
        const v2 = subtract(this.points[2], this.points[0]);
        return cross(v1, v2);
    }
}

class Triangle {
    constructor(p1, p2, p3, color) {
        this.points = [p1,p2,p3];
        const norm = this.getNorm();
        this.norms = [norm, norm, norm];
        this.color = color;

        this.vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW);

        this.nBuffer = gl.createBuffer();
        this.setNormBuffer();
    }

    setNormBuffer() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.norms), gl.STATIC_DRAW);
    }

    draw() {
        gl.uniform4fv(fColor, flatten(this.color));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
        gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normal);

        gl.drawArrays(gl.TRIANGLES, 0, this.points.length);
    }

    getNorm() {
        const v1 = subtract(this.points[1], this.points[0]);
        const v2 = subtract(this.points[2], this.points[0]);
        return cross(v1, v2);
    }
}


class Cylinder {
    constructor(center, radius, height, color) {
        this.center = center;
        this.radius = radius;
        this.height = height;
        this.color = color;
        this.bottom = new Circle(center, radius, color);
        this.top = new Circle(add(vec3(0,height,0), center), radius, color);
        this.walls = [];
        for (var i = 1; i < this.bottom.points.length-1; i++) {
            var p1 = add(vec3(0,height,0),this.bottom.points[i]);
            var p2 = this.bottom.points[i];
            var p3 = this.bottom.points[i+1];
            var p4 = add(vec3(0,height,0),this.bottom.points[i+1]);
            this.walls.push(new Quad(p1,p2,p3,p4,color));
        }
        this.fixNormals();
    }

    draw() {
        this.bottom.draw();
        for (var wall of this.walls) {
            wall.draw();
        }
        this.top.draw();
    }

    fixNormals() {
        for (var i = 0; i < this.walls.length; i++) {
            for (var j = 0; j < this.walls[i].points.length; j++) {
                var norm = subtract(this.walls[i].points[j], this.center);
                norm[1] = 0;
                this.walls[i].norms[j] = normalize(norm);
            }
            this.walls[i].setNormBuffer();
        }
    }
}

class Ball {
    constructor(center, radius, color) {
        this.center = center;
        this.radius = radius;
        this.color = color;
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
        this.fixNormals();
    }

    divideTriangles(triangles, divisions) {
        if (divisions === 0) {
            this.triangles = [];
            for (var triangle of triangles) {
                for (var i = 0; i < triangle.length; i++) {
                    triangle[i] = add(this.center, scale(this.radius, triangle[i]));
                }
                this.triangles.push(new Triangle(triangle[0], triangle[1], triangle[2], this.color));
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

    fixNormals() {

        for (var i = 0; i < this.triangles.length; i++) {
            for (var j = 0; j < this.triangles[i].points.length; j++) {
                this.triangles[i].norms[j] = normalize(subtract(this.triangles[i].points[j], this.center));
            }
            this.triangles[i].setNormBuffer();
        }
    }

    draw() {
        for (var triangle of this.triangles) {
            triangle.draw();
        }
    }
}

class Tree {
    constructor(xcoord, color) {
        this.xcoord = xcoord;
        this.trunkColor = color;
        this.topColor = vec3(Math.random(), Math.random(), Math.random(), 1);
        this.zOffset = 0;
        this.trunk = new Cylinder(vec3(this.xcoord, -1, farthestZ), 0.5, 6, barkColor);
        this.top = new Ball(vec3(this.xcoord, 5-1, farthestZ), 2, color);
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
    gl.clearColor(fogColor[0],fogColor[1],fogColor[2],1);
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    fogDensity = 0.2;
    speed = 0.3;
    numTrees = 6;
    farthestZ = -40;
    fogDensityLoc = gl.getUniformLocation(program, "fogDensity");
    fColor = gl.getUniformLocation(program, "fColor");
    normal = gl.getAttribLocation(program, "normal");
    vPosition = gl.getAttribLocation(program, "vPosition");
    modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
    var fogColorLoc = gl.getUniformLocation(program, "fogColor");

    mvm = lookAt(eye, vec3(0,0,0), vec3(0,1,0));
    gl.uniformMatrix4fv(modelViewMatrix, gl.TRUE, flatten(mvm));
    projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
    // var pm = ortho(-10, 10, -10, 10, -10, 10);
    var pm = perspective(90.0, canvas.width/canvas.height, 2, -10);
    gl.uniformMatrix4fv(projectionMatrix, gl.TRUE, flatten(pm));

   
    gl.uniform4fv(fogColorLoc, flatten(fogColor));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform4fv(gl.getUniformLocation(program, "ambientLight"), flatten(ambientLight));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseLight"), flatten(diffuseLight));
    gl.uniform3fv(gl.getUniformLocation(program, "eye"), flatten(eye));
    gl.uniform1f(fogDensityLoc, fogDensity);

    whiteImg = document.getElementById('white-image');

    trees.push(createNewTree());
    
    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    trees.forEach((tree, i) => {
        trees[i].updateZOffset(speed);
        if (trees[i].zOffset >= Math.abs(farthestZ)/numTrees && trees[i].zOffset < Math.abs(farthestZ)/numTrees+speed) {
            trees.push(createNewTree());
        } else if (tree.zOffset >= Math.abs(farthestZ)) {
            trees.shift();
        }
    });
    trees.forEach((tree) => {
        tree.draw();
    });
    requestAnimFrame(render);
}


function createNewTree() {
    return new Tree(Math.random()*20-10, selectColor());
}

function selectColor() {
    const i = Math.floor(Math.random()*7);
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
    }
}

function decreaseSpeed() {
    speed = Math.max(speed-0.1, 0.1);
}

function increaseSpeed() {
    speed = Math.min(speed+0.1, 1);
}
function increaseFog() {
    fogDensity = Math.min(fogDensity + 0.05, 0.6);
    gl.uniform1f(fogDensityLoc, fogDensity);
}
function decreaseFog() {
    fogDensity = Math.max(fogDensity - 0.05, 0.05);
    gl.uniform1f(fogDensityLoc, fogDensity);
}
