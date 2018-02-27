/**
 * Jacob Tucker
 * CS 435
 * Project #1
 *
 * Produces a Koch Snowflake via recursion
 *
 * addTriangles - recursive method that adds a triangle to each line segment
 * addTriangle - takes a line segment and adds a triangle to it
 *
 **/
"use strict";

var gl;
var points;
var vertices = [
    vec2(-0.5, -0.5),
    vec2(0, Math.sqrt(3)/2-0.5),
    vec2(0.5, -0.5),
];
var ITERATIONS = 8;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    points = vertices;

    addTriangles(vertices, ITERATIONS);

    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
}

function addTriangles(vertices, iterations) {
    --iterations;
    if(iterations > 0) {
        var new_vertices = [];
        new_vertices.push(addTriangle(vertices[0], vertices[1]));
        new_vertices.push(addTriangle(vertices[1], vertices[2]));
        new_vertices.push(addTriangle(vertices[2], vertices[0]));

        //add triangles from previous and new vertices
        new_vertices.push([new_vertices[0][1], vertices[1], new_vertices[1][2]]);
        new_vertices.push([new_vertices[1][1], vertices[2], new_vertices[2][2]]);
        new_vertices.push([new_vertices[2][1], vertices[0], new_vertices[0][2]]);
        
        new_vertices.forEach(function(element) {
            addTriangles(element, iterations);
        })
    }
}

function addTriangle(v1, v2) {
    var difference = subtract(v2, v1);
    var interior = [
        add(v1, scale(1/3.0, difference)),
        add(v1, scale(2/3.0, difference)),
    ]
    var vertex = calculateVertex(interior);
    interior.push(vertex);
    interior.reverse();
    points.push(interior[0], interior[1], interior[2]);
    return interior;
}

function calculateVertex(vertices) {
    var angle = Math.PI / 3;
    var difference = subtract(vertices[1], vertices[0]);
    var x = difference[0] * Math.cos(angle) - difference[1] * Math.sin(angle);
    var y = difference[0] * Math.sin(angle) + difference[1] * Math.cos(angle);
    x += vertices[0][0];
    y += vertices[0][1];
    return vec2(x, y);
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}
