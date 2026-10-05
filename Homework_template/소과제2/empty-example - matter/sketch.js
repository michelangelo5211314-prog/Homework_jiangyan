const { Engine, Bodies, Body, Composite } = Matter;

const negativeThoughts = [
"I can't do this", "I'm not ready", "Everything is late",
"I will get it wrong", "Too much to do", "I'm not enough",
"I always fail", "Nothing is working", "I have no time",
"This is too hard", "I am falling behind",
"I will disappoint everyone", "I can't keep up",
"I should be doing more"
];

let engine;
let thoughts = [];
let brainWalls = [];
let thoughtsInitialized = false;

function setup() {
createCanvas(windowWidth, windowHeight);
pixelDensity(Math.min(window.devicePixelRatio || 1, 2));

engine = Engine.create();
engine.gravity.y = 1;
engine.gravity.scale = 0.001;

createBrainWalls();
}

function brainShape() {
const compact = width < 700;

return {
x: width / 2,
y: height / 2,
w: compact ? Math.min(width * 0.98, 560) : Math.min(width * 0.82, 920),
h: Math.min(height * 0.72, 620)
};
}

function createBrainWalls() {
brainWalls.forEach(wall => Composite.remove(engine.world, wall));

const { x, y, w, h } = brainShape();
const segments = 64;
const thickness = 48;
const radiusX = w * 0.48;
const radiusY = h * 0.47;

brainWalls = [];

for (let i = 0; i < segments; i++) {
const a = i * TWO_PI / segments;
const b = (i + 1) * TWO_PI / segments;
const x1 = x + Math.cos(a) * radiusX;
const y1 = y + Math.sin(a) * radiusY;
const x2 = x + Math.cos(b) * radiusX;
const y2 = y + Math.sin(b) * radiusY;
const dx = x2 - x1;
const dy = y2 - y1;

brainWalls.push(Bodies.rectangle(
    (x1 + x2) / 2,
    (y1 + y2) / 2,
    Math.hypot(dx, dy) + thickness,
    thickness,
    {
    isStatic: true,
    friction: 0.8,
    angle: Math.atan2(dy, dx)
    }
));
}

brainWalls.push(Bodies.rectangle(
width / 2, -thickness / 2, width + thickness * 2, thickness,
{ isStatic: true }
));

Composite.add(engine.world, brainWalls);
}

function draw() {
Engine.update(engine, Math.min(deltaTime, 16));

if (!thoughtsInitialized) {
thoughtsInitialized = true;
seedThoughts();
}

background(74, 51, 44);
drawBrain();
updateThoughts();
thoughts.forEach(drawThought);
}

function drawBrain() {
const { x, y, w, h } = brainShape();

noStroke();
fill(183, 235, 211);
ellipse(x, y, w * 0.96, h * 0.94);

stroke(255, 255, 255, 95);
strokeWeight(Math.max(18, Math.min(w, h) * 0.045));
strokeCap(ROUND);
strokeJoin(ROUND);
noFill();
beginShape();
vertex(x - w * 0.23, y + h * 0.01);
vertex(x - w * 0.06, y + h * 0.18);
vertex(x + w * 0.25, y - h * 0.19);
endShape();

stroke(255);
strokeWeight(5);
ellipse(x, y, w * 0.96, h * 0.94);
}

function seedThoughts() {
const { x, y } = brainShape();

negativeThoughts.forEach((text, i) => {
createThought(text, x, y, false, i);
createThought("😭", x, y, true, i);
});
}

function createThought(content, centerX, centerY, isEmoji, index) {
const boxWidth = isEmoji
? 76
: constrain(content.length * 7.2 + 38, 132, 248);
const boxHeight = isEmoji ? 76 : 58;
const { w, h } = brainShape();
const rx = w * 0.48 - boxWidth * 0.55 - 20;
const ry = h * 0.47 - boxHeight * 0.55 - 20;
const relativeY = -ry * 0.72 + Math.floor(index / 4) * 20 + random(-5, 5);
const safeX = rx * Math.sqrt(Math.max(0, 1 - (relativeY / ry) ** 2));
const x = centerX + random(-safeX, safeX);
const y = centerY + relativeY;
const options = {
friction: 0.78,
frictionAir: 0.018,
restitution: 0.08,
density: 0.0012
};

const body = isEmoji
? Bodies.circle(x, y, boxWidth / 2, options)
: Bodies.rectangle(x, y, boxWidth, boxHeight, options);

Body.setAngle(body, random(-0.09, 0.09));
thoughts.push({
body,
text: content,
isEmoji,
width: boxWidth,
height: boxHeight,
death: false
});
Composite.add(engine.world, body);
}

function drawThought(thought) {
const { x, y } = thought.body.position;
let scaleSize = 1;
let alpha = 255;

if (thought.state === "popping") {
const progress = constrain((millis() - thought.poppedAt) / 260, 0, 1);
scaleSize = progress < 0.68
    ? lerp(1, 1.28, progress / 0.68)
    : lerp(1.28, 0, (progress - 0.68) / 0.32);
if (progress >= 0.68) alpha = map(progress, 0.68, 1, 255, 0);
}

push();
translate(x, y);
rotate(thought.body.angle);
scale(scaleSize);
rectMode(CENTER);
fill(255, 255, 255, alpha);
stroke(111, 70, 52, alpha);
strokeWeight(2);

if (thought.isEmoji) {
ellipse(0, 0, thought.width, thought.height);
} else {
rect(0, 0, thought.width, thought.height, thought.height / 2);
}

noStroke();
textAlign(CENTER, CENTER);

if (thought.isEmoji) {
textSize(46);
text(thought.text, 0, 1);
} else {
fill(111, 70, 52, alpha);
textSize(11);
textStyle(BOLD);
text(thought.text, 0, 0, thought.width - 18, thought.height - 8);
}

pop();
}

function updateThoughts() {
for (let i = thoughts.length - 1; i >= 0; i--) {
const thought = thoughts[i];

if (thought.death && millis() - thought.poppedAt >= 260) {
    thoughts.splice(i, 1);
    Composite.remove(engine.world, thought.body);
}
}
}

function mousePressed() {
const thought = [...thoughts].reverse().find(item =>
!item.death && isThoughtAtPoint(item, mouseX, mouseY)
);

if (thought) {
thought.state = "popping";
thought.death = true;
thought.poppedAt = millis();
Body.setStatic(thought.body, true);
}

return false;
}

function isThoughtAtPoint(thought, x, y) {
const dx = x - thought.body.position.x;
const dy = y - thought.body.position.y;
const angle = -thought.body.angle;
const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
const localY = dx * Math.sin(angle) + dy * Math.cos(angle);

return Math.abs(localX) <= thought.width / 2 &&
Math.abs(localY) <= thought.height / 2;
}

function windowResized() {
resizeCanvas(windowWidth, windowHeight);
createBrainWalls();
}