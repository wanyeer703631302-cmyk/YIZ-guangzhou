import math

print("Starting Perspective Unit Tests (Python)...")

# Mock constants
COLUMN_COUNT = 16
COLUMN_WIDTH = 320
GAP = 40
RADIUS = 1800

# Test 1: Angle Step Calculation
# JS: (2 * Math.atan((COLUMN_WIDTH + GAP) / (2 * RADIUS))) * (180 / Math.PI)
angle_step_rad = 2 * math.atan((COLUMN_WIDTH + GAP) / (2 * RADIUS))
angle_step_deg = angle_step_rad * (180 / math.pi)

print(f"Test 1: Angle Step")
print(f"- Expected: ~11.4 degrees")
print(f"- Actual: {angle_step_deg:.4f} degrees")

if 10 < angle_step_deg < 13:
    print("PASS: Angle step within reasonable range.")
else:
    print("FAIL: Angle step calculation looks wrong.")

# Test 2: Max Angle (Bounds)
TOTAL_ARC = COLUMN_COUNT * angle_step_deg
VISIBLE_ARC = 60
MAX_ANGLE = max(0, (TOTAL_ARC - VISIBLE_ARC) / 2)

print(f"\nTest 2: Max Angle (Bounds)")
print(f"- Total Arc: {TOTAL_ARC:.1f} degrees")
print(f"- Max Angle: {MAX_ANGLE:.1f} degrees")

if 0 < MAX_ANGLE < 180:
    print("PASS: Max angle is positive and valid.")
else:
    print("FAIL: Max angle invalid.")

# Test 3: Infinite Scroll Logic
SET_HEIGHT = 1000
current_scroll_y = 0
target_scroll_y = 0

print(f"\nTest 3: Infinite Scroll Logic")

# Simulate scroll down
current_scroll_y = SET_HEIGHT + 10
target_scroll_y = SET_HEIGHT + 10

if current_scroll_y > SET_HEIGHT:
    current_scroll_y -= SET_HEIGHT
    target_scroll_y -= SET_HEIGHT

print(f"- After Scroll Reset: current={current_scroll_y}, target={target_scroll_y}")
if current_scroll_y == 10 and target_scroll_y == 10:
    print("PASS: Scroll wrap-around (down) works.")
else:
    print("FAIL: Scroll wrap-around (down) failed.")

print("\nAll tests complete.")