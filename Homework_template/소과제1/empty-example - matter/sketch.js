const STAR_COLORS = ["#ffd76a", "#f28aab"];
const MAX_STARS = 24;
const INITIAL_STARS = 12;
const SPAWN_INTERVAL = 300;
const stars = [];
const ripples = [];
const glints = [];
const ramps = [];

let engine;
let groundY;
let lastSpawn = 0;
let spawnedStars = 0;
let finalStar = null;

function setup() {
createCanvas(windowWidth, windowHeight);
pixelDensity(1);

engine = Matter.Engine.create();
engine.gravity.y = 1.2;
engine.positionIterations = 8;
engine.velocityIterations = 6;
engine.enableSleeping = true;
addBoundaries();
Matter.Events.on(engine, "collisionStart", handleCollisions);

for (let i = 0; i < INITIAL_STARS; i += 1) {
addStar(random(width), random(-height * 0.2, height * 0.7));
}

for (let i = 0; i < 48; i += 1) {
glints.push({
    x: random(width),
    y: random(height),
    radius: random(0.7, 1.8),
    phase: random(TWO_PI),
});
}
}

function draw() {
drawBackdrop();

Matter.Engine.update(engine, Math.min(deltaTime, 1000 / 60));
if (spawnedStars < MAX_STARS && millis() - lastSpawn > SPAWN_INTERVAL) {
addStar(random(18, width - 18), -24);
lastSpawn = millis();
}

drawRipples();
drawGround();
drawRamps();
drawStars();

const allStarsResting = stars.every((star) => star.body.isSleeping);
if (spawnedStars >= MAX_STARS && allStarsResting && ripples.length === 0) {
noLoop();
}
}

function addBoundaries() {
groundY = height - 42;
const options = { isStatic: true, restitution: 0.8, friction: 0 };
const floor = Matter.Bodies.rectangle(width / 2, groundY + 18, width + 80, 36, {
...options,
label: "ground",
});
const leftWall = Matter.Bodies.rectangle(-18, height / 2, 36, height * 2, options);
const rightWall = Matter.Bodies.rectangle(width + 18, height / 2, 36, height * 2, options);
const rampLength = width * 0.46;
const rampThickness = 16;
const rampAngle = radians(24);
const rampY = height * 0.68;
ramps.push(
{
    body: Matter.Bodies.rectangle(width * 0.23, rampY, rampLength, rampThickness, {
    ...options,
    angle: rampAngle,
    label: "obstacle",
    restitution: 0.72,
    }),
    width: rampLength,
    height: rampThickness,
},
{
    body: Matter.Bodies.rectangle(width * 0.77, rampY, rampLength, rampThickness, {
    ...options,
    angle: -rampAngle,
    label: "obstacle",
    restitution: 0.72,
    }),
    width: rampLength,
    height: rampThickness,
},
);
Matter.Composite.add(engine.world, [floor, leftWall, rightWall, ...ramps.map((ramp) => ramp.body)]);
}

function addStar(x, y) {
const radius = random(14, 20);
const body = Matter.Bodies.circle(x, y, radius * 0.76, {
restitution: 0.82,
friction: 0,
frictionAir: 0.001,
density: 0.001,
label: "star",
});
Matter.Body.setVelocity(body, { x: 0, y: random(0.4, 1.3) });

const star = {
body,
radius,
color: random(STAR_COLORS),
bouncedAt: null,
};
stars.push(star);
spawnedStars += 1;
Matter.Composite.add(engine.world, body);
}

function handleCollisions(event) {
for (const pair of event.pairs) {
const starBody = pair.bodyA.label === "star" ? pair.bodyA : pair.bodyB.label === "star" ? pair.bodyB : null;
const otherBody = starBody === pair.bodyA ? pair.bodyB : pair.bodyA;
if (!starBody || otherBody.label !== "ground") continue;

const star = stars.find((item) => item.body === starBody);
if (!star || star.bouncedAt !== null) continue;

star.bouncedAt = millis();
ripples.push({
    x: starBody.position.x,
    y: groundY - 1,
    color: star.color,
    bornAt: millis(),
    size: random(14, 24),
});
}
}

function drawBackdrop() {
background("#111321");
noStroke();
for (let i = 0; i < 7; i += 1) {
fill(242, 138, 171, 4);
ellipse(width * 0.5, height * (0.13 + i * 0.12), width * (0.58 + i * 0.1), height * 0.3);
}

const time = millis() * 0.001;
for (const glint of glints) {
const glintAlpha = 55 + 75 * (0.5 + 0.5 * sin(time + glint.phase));
fill(255, 235, 217, glintAlpha);
circle(glint.x, glint.y, glint.radius);
}
}

function drawGround() {
noStroke();
fill(242, 138, 171, 12);
rect(0, groundY, width, height - groundY);
stroke(255, 194, 201, 90);
strokeWeight(1);
line(0, groundY, width, groundY);
}

function drawRamps() {
rectMode(CENTER);
for (const ramp of ramps) {
push();
translate(ramp.body.position.x, ramp.body.position.y);
rotate(ramp.body.angle);
fill(242, 138, 171, 45);
stroke(255, 194, 201, 150);
strokeWeight(1);
rect(0, 0, ramp.width, ramp.height, 4);
pop();
}
rectMode(CORNER);
}

function drawRipples() {
const now = millis();
for (let i = ripples.length - 1; i >= 0; i -= 1) {
const ripple = ripples[i];
const progress = (now - ripple.bornAt) / 1100;
if (progress >= 1) {
    ripples.splice(i, 1);
    continue;
}

const alpha = 190 * (1 - progress);
noFill();
stroke(ripple.color + hex(floor(alpha), 2));
strokeWeight(1.5 * (1 - progress) + 0.4);
ellipse(ripple.x, ripple.y, ripple.size + progress * 76, ripple.size * 0.3 + progress * 17);
stroke(ripple.color + hex(floor(alpha * 0.48), 2));
ellipse(ripple.x, ripple.y, ripple.size * 0.58 + progress * 48, ripple.size * 0.2 + progress * 11);
}
}

function drawStars() {
for (const star of stars) {
const { x, y } = star.body.position;

push();
translate(x, y);
rotate(star.body.angle);
noStroke();
fill(star.color);
starShape(star.radius);
pop();
}
}

function starShape(radius) {
beginShape();
for (let i = 0; i < 10; i += 1) {
const angle = -HALF_PI + i * PI / 5;
const pointRadius = i % 2 === 0 ? radius : radius * 0.43;
vertex(cos(angle) * pointRadius, sin(angle) * pointRadius);
}
endShape(CLOSE);
}

function windowResized() {
resizeCanvas(windowWidth, windowHeight);
Matter.Composite.clear(engine.world, false);
stars.length = 0;
ripples.length = 0;
glints.length = 0;
ramps.length = 0;
spawnedStars = 0;
lastSpawn = millis();
loop();
addBoundaries();

for (let i = 0; i < INITIAL_STARS; i += 1) {
addStar(random(width), random(-height * 0.2, height * 0.7));
}
for (let i = 0; i < 48; i += 1) {
glints.push({
    x: random(width),
    y: random(height),
    radius: random(0.7, 1.8),
    phase: random(TWO_PI),
});
}
}
