const Engine = Matter.Engine;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const MatterBody = Matter.Body;

const colors = [
"#d96850",
"#547a84",
"#d1ad4d",
"#b77f72",
"#3f4944",
"#87956f",
"#cd9159",
"#71778a",
"#a5a08f",
"#c15e50",
"#718f80",
];

const designs = [
{ kind: "circle", x: 0.16, y: 0.2, size: 22, weight: 1.1 },
{ kind: "diamond", x: 0.35, y: 0.15, size: 20, weight: 1.45 },
{ kind: "triangle", x: 0.58, y: 0.19, size: 24, weight: 1.2 },
{ kind: "circle", x: 0.81, y: 0.16, size: 17, weight: 0.8 },
{ kind: "triangle", x: 0.25, y: 0.43, size: 18, weight: 0.85 },
{ kind: "circle", x: 0.47, y: 0.4, size: 27, weight: 1.7 },
{ kind: "diamond", x: 0.72, y: 0.43, size: 19, weight: 1.05 },
{ kind: "circle", x: 0.89, y: 0.48, size: 15, weight: 0.72 },
{ kind: "circle", x: 0.13, y: 0.68, size: 16, weight: 0.75 },
{ kind: "triangle", x: 0.39, y: 0.72, size: 21, weight: 1.18 },
{ kind: "diamond", x: 0.65, y: 0.7, size: 23, weight: 1.5 },
{ kind: "circle", x: 0.86, y: 0.76, size: 17, weight: 0.82 },
];

let engine;
let shapes = [];
let boundaries = [];
let treeObstacle;
let elapsed = 0;
let cloudX = 140;
let cloudY = 0;
let cloudScale = 1;
let sceneFrozen = false;
const finalStateTime = 12;

function setup() {
createCanvas(windowWidth, windowHeight);
pixelDensity(displayDensity());
createFloatingField();
}

function draw() {
background("#c8ddbd");

const step = min(deltaTime || 16.67, 16.667);
if (!sceneFrozen) {
elapsed = min(finalStateTime, elapsed + step / 1000);
applyFloatingForces();
Engine.update(engine, step);
cloudX = (cloudX + step * 0.06) % (width + 150);
if (elapsed >= finalStateTime) freezeScene();
}
drawCloud();
drawJungleGround();
drawTreeObstacle();
drawShapes();
}

function createFloatingField() {
engine = Engine.create();
engine.gravity.x = 0;
engine.gravity.y = 1;
engine.gravity.scale = 0.001;
engine.positionIterations = 8;
engine.velocityIterations = 6;
shapes = [];
elapsed = 0;
cloudX = 140;
sceneFrozen = false;

const groundY = height * 0.84;
const obstacleWidth = min(width * 0.35, 300);
const obstacleHeight = max(14, min(width, height) * 0.025);
treeObstacle = Bodies.rectangle(
width * 0.5,
groundY - obstacleHeight / 2,
obstacleWidth,
obstacleHeight,
{ isStatic: true, label: "fixed horizontal tree log" },
);

cloudY = height * 0.17;
cloudScale = max(0.65, min(width / 1000, height / 760, 1));

const wall = 80;
boundaries = [
Bodies.rectangle(width / 2, -wall / 2, width + wall * 2, wall, { isStatic: true }),
Bodies.rectangle(width / 2, height + wall / 2, width + wall * 2, wall, { isStatic: true }),
Bodies.rectangle(-wall / 2, height / 2, wall, height + wall * 2, { isStatic: true }),
Bodies.rectangle(width + wall / 2, height / 2, wall, height + wall * 2, { isStatic: true }),
];

designs.forEach((design, index) => {
const scale = min(width / 700, height / 560, 1.2);
const size = max(12, design.size * scale);
const body = createShape(
    width * design.x,
    height * design.y,
    design.kind,
    size,
    colors[index % colors.length],
    design.weight,
);

MatterBody.setVelocity(body, {
    x: index % 2 === 0 ? 0.1 : -0.1,
    y: index % 3 === 0 ? 0.05 : -0.035,
});
MatterBody.setAngularVelocity(body, index % 2 === 0 ? 0.008 : -0.009);
shapes.push({
    body,
    phase: index * 0.9,
    weight: design.weight,
    legPhase: index * 1.37,
});
});

Composite.add(engine.world, [
...boundaries,
treeObstacle,
...shapes.map(({ body }) => body),
]);
}

function drawCloud() {
const scale = cloudScale;
noStroke();
fill(255);
const x = cloudX - 75 * scale;
circle(x, cloudY, 48 * scale);
circle(x + 27 * scale, cloudY - 12 * scale, 62 * scale);
circle(x + 60 * scale, cloudY, 46 * scale);
}

function drawJungleGround() {
const groundY = height * 0.84;
const canopyScale = min(width / 1000, height / 760, 1.2);

noStroke();
fill("#9fbe91");
circle(width * 0.18, groundY - 25 * canopyScale, 210 * canopyScale);
fill("#759c70");
circle(width * 0.5, groundY - 44 * canopyScale, 310 * canopyScale);
fill("#557d59");
circle(width * 0.83, groundY - 29 * canopyScale, 250 * canopyScale);

fill("#52784f");
rectMode(CORNER);
rect(0, groundY, width, height - groundY);
rectMode(CENTER);
}

function drawTreeObstacle() {
noStroke();
fill("#795039");
rectMode(CENTER);
rect(
treeObstacle.position.x,
treeObstacle.position.y,
min(width * 0.35, 300),
max(14, min(width, height) * 0.025),
8,
);
}

function createShape(x, y, kind, size, color, weight) {
const options = {
density: 0.0008 * weight,
friction: 0.45,
frictionStatic: 0.65,
frictionAir: 0.035,
restitution: 0.42,
label: kind,
};
let body;

if (kind === "circle") {
body = Bodies.circle(x, y, size, options);
} else if (kind === "diamond") {
body = Bodies.polygon(x, y, 4, size, options);
} else {
body = Bodies.polygon(x, y, 3, size * 1.15, options);
}

body.visual = { kind, size, color };
return body;
}

function applyFloatingForces() {
for (const { body, phase, weight } of shapes) {
const verticalPosition = body.position.y / height;
const riseAndFall = sin(elapsed * 0.72 + phase) * 0.44;
const returnToCenter = (verticalPosition - 0.5) * 0.32;
const buoyancy = 1 + riseAndFall + returnToCenter;
const breeze = sin(elapsed * 0.38 + phase * 1.3) * 0.000045;

MatterBody.applyForce(body, body.position, {
    x: body.mass * breeze,
    y: -body.mass * engine.gravity.scale * buoyancy * (1 + weight * 0.025),
});
}
}

function drawShapes() {
for (const { body, legPhase } of shapes) {
push();
translate(body.position.x, body.position.y);
rotate(body.angle);
drawCartoonLegs(body.visual, legPhase);
noStroke();
fill(body.visual.color);

if (body.visual.kind === "circle") {
    circle(0, 0, body.circleRadius * 2);
} else if (body.visual.kind === "diamond") {
    beginShape();
    vertex(0, -body.visual.size);
    vertex(body.visual.size, 0);
    vertex(0, body.visual.size);
    vertex(-body.visual.size, 0);
    endShape(CLOSE);
} else {
    triangle(
    0,
    -body.visual.size,
    body.visual.size * 0.88,
    body.visual.size * 0.72,
    -body.visual.size * 0.88,
    body.visual.size * 0.72,
    );
}
pop();
}
}

function drawCartoonLegs(visual, phase) {
const size = visual.kind === "circle" ? visual.size * 0.72 : visual.size * 0.68;
const hipY = visual.kind === "triangle" ? size * 0.92 : size * 0.76;
const hipX = size * 0.34;
const sway = sin(elapsed * 2.1 + phase) * size * 0.09;
const legWidth = max(1.5, size * 0.075);

stroke("#171817");
strokeWeight(legWidth);
strokeCap(ROUND);
noFill();

for (const side of [-1, 1]) {
const hip = { x: side * hipX, y: hipY };
const knee = {
    x: hip.x + side * size * 0.16 + sway,
    y: hip.y + size * 0.39,
};
const ankle = {
    x: knee.x - side * size * 0.16 + sway * 0.55,
    y: knee.y + size * 0.34,
};
line(hip.x, hip.y, knee.x, knee.y);
line(knee.x, knee.y, ankle.x, ankle.y);
line(ankle.x, ankle.y, ankle.x + side * size * 0.2, ankle.y + size * 0.035);
}

noStroke();
}

function freezeScene() {
for (const { body } of shapes) {
MatterBody.setVelocity(body, { x: 0, y: 0 });
MatterBody.setAngularVelocity(body, 0);
MatterBody.setStatic(body, true);
}
sceneFrozen = true;
}

function windowResized() {
resizeCanvas(windowWidth, windowHeight);
pixelDensity(displayDensity());
createFloatingField();
}
