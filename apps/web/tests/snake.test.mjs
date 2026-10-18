import test from "node:test";
import assert from "node:assert/strict";
import { createSnake, advanceSnake } from "../src/lib/snake.ts";
test("a run moves without mutating the previous state", () => {
  const start = createSnake();
  const next = advanceSnake(start, "right");
  assert.equal(next.snake[0].x, 9);
  assert.equal(next.snake.length, 3);
  assert.equal(start.snake[0].x, 8);
});
test("the snake cannot reverse into its neck", () => {
  const next = advanceSnake(createSnake(), "left");
  assert.equal(next.direction, "right");
  assert.equal(next.over, false);
});
test("collecting a signal grows the snake, scores, and places safe food", () => {
  let game = createSnake();
  for (let i = 0; i < 4; i++) game = advanceSnake(game, "right");
  assert.equal(game.score, 10);
  assert.equal(game.snake.length, 4);
  assert.ok(
    !game.snake.some((c) => c.x === game.food.x && c.y === game.food.y),
  );
});
test("wall and self collisions end a run", () => {
  let game = createSnake();
  for (let i = 0; i < 20; i++) game = advanceSnake(game, "right");
  assert.equal(game.over, true);
  const self = {
    ...createSnake(),
    snake: [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
    ],
    direction: "up",
    food: { x: 10, y: 10 },
  };
  assert.equal(advanceSnake(self, "left").over, true);
});
test("moving into the vacated tail cell is legal", () => {
  const ring = {
    ...createSnake(),
    snake: [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
      { x: 0, y: 1 },
    ],
    direction: "up",
    food: { x: 10, y: 10 },
  };
  assert.equal(advanceSnake(ring, "left").over, false);
});
