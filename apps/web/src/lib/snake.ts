export type Direction = "up" | "down" | "left" | "right";
export type Cell = { x: number; y: number };
export type SnakeState = {
  snake: Cell[];
  direction: Direction;
  food: Cell;
  score: number;
  over: boolean;
  won: boolean;
  seed: number;
};
export const BOARD = { width: 20, height: 14 };
export function createSnake(): SnakeState {
  return {
    snake: [
      { x: 8, y: 7 },
      { x: 7, y: 7 },
      { x: 6, y: 7 },
    ],
    direction: "right",
    food: { x: 12, y: 7 },
    score: 0,
    over: false,
    won: false,
    seed: 27,
  };
}
export function advanceSnake(
  state: SnakeState,
  requested: Direction,
): SnakeState {
  if (state.over) return state;
  const opposite: Record<Direction, Direction> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };
  const direction =
    requested === opposite[state.direction] ? state.direction : requested;
  const delta: Record<Direction, Cell> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const head = {
    x: state.snake[0].x + delta[direction].x,
    y: state.snake[0].y + delta[direction].y,
  };
  const eats = head.x === state.food.x && head.y === state.food.y;
  const body = eats ? state.snake : state.snake.slice(0, -1);
  if (
    head.x < 0 ||
    head.x >= BOARD.width ||
    head.y < 0 ||
    head.y >= BOARD.height ||
    body.some((p) => p.x === head.x && p.y === head.y)
  )
    return { ...state, direction, over: true };
  const snake = [head, ...state.snake];
  if (!eats) snake.pop();
  if (snake.length === BOARD.width * BOARD.height)
    return { ...state, snake, score: state.score + 10, over: true, won: true };
  let { food, seed } = state;
  if (eats) {
    const free: Cell[] = [];
    for (let y = 0; y < BOARD.height; y++)
      for (let x = 0; x < BOARD.width; x++)
        if (!snake.some((p) => p.x === x && p.y === y)) free.push({ x, y });
    seed = (seed * 16807) % 2147483647;
    food = free[seed % free.length];
  }
  return {
    ...state,
    snake,
    direction,
    food,
    seed,
    score: state.score + (eats ? 10 : 0),
  };
}
