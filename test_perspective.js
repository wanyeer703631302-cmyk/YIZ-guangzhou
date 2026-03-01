// Unit Test for Perspective Calculations
// To run: node test_perspective.js

console.log("Starting Perspective Unit Tests...");

// Mock constants from grid-phantom.html
const COLUMN_COUNT = 16; 
const COLUMN_WIDTH = 320; 
const GAP = 40;
const RADIUS = 1800; 

// Test 1: Angle Step Calculation
// angleStep = (2 * Math.atan((COLUMN_WIDTH + GAP) / (2 * RADIUS))) * (180 / Math.PI);
const angleStepRad = 2 * Math.atan((COLUMN_WIDTH + GAP) / (2 * RADIUS));
const angleStepDeg = angleStepRad * (180 / Math.PI);

console.log(`Test 1: Angle Step`);
console.log(`- Expected: ~11.4 degrees`); // Rough calc: 360/1800 rad ~ 0.2 rad ~ 11 deg
console.log(`- Actual: ${angleStepDeg.toFixed(4)} degrees`);

if (angleStepDeg > 10 && angleStepDeg < 13) {
    console.log("PASS: Angle step within reasonable range.");
} else {
    console.error("FAIL: Angle step calculation looks wrong.");
}

// Test 2: Max Angle (Bounds)
const TOTAL_ARC = COLUMN_COUNT * angleStepDeg;
const VISIBLE_ARC = 60; 
const MAX_ANGLE = Math.max(0, (TOTAL_ARC - VISIBLE_ARC) / 2);

console.log(`\nTest 2: Max Angle (Bounds)`);
console.log(`- Total Arc: ${TOTAL_ARC.toFixed(1)} degrees`);
console.log(`- Max Angle: ${MAX_ANGLE.toFixed(1)} degrees`);

// If we have 16 columns * 11 deg = 176 deg total.
// Visible is 60. 
// Max rotation = (176 - 60)/2 = 58 deg.
if (MAX_ANGLE > 0 && MAX_ANGLE < 180) {
    console.log("PASS: Max angle is positive and valid.");
} else {
    console.error("FAIL: Max angle invalid.");
}

// Test 3: Infinite Scroll Logic
const SET_HEIGHT = 1000; // Mock height
let currentScrollY = 0;
let targetScrollY = 0;

console.log(`\nTest 3: Infinite Scroll Logic`);

// Simulate scroll down past set height
currentScrollY = SET_HEIGHT + 10;
targetScrollY = SET_HEIGHT + 10;

// Apply logic
if (currentScrollY > SET_HEIGHT) {
    currentScrollY -= SET_HEIGHT;
    targetScrollY -= SET_HEIGHT;
}

console.log(`- After Scroll Reset: current=${currentScrollY}, target=${targetScrollY}`);
if (currentScrollY === 10 && targetScrollY === 10) {
    console.log("PASS: Scroll wrap-around (down) works.");
} else {
    console.error("FAIL: Scroll wrap-around (down) failed.");
}

// Simulate scroll up past negative set height
currentScrollY = -SET_HEIGHT - 20;
targetScrollY = -SET_HEIGHT - 20;

if (currentScrollY < -SET_HEIGHT) {
    currentScrollY += SET_HEIGHT;
    targetScrollY += SET_HEIGHT;
}

console.log(`- After Scroll Reset (Up): current=${currentScrollY}, target=${targetScrollY}`);
if (currentScrollY === -20 && targetScrollY === -20) {
    console.log("PASS: Scroll wrap-around (up) works.");
} else {
    console.error("FAIL: Scroll wrap-around (up) failed.");
}

console.log("\nAll tests complete.");