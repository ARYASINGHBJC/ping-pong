import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import "./PongBoard.css";

const BOARD_WIDTH = 400;
const BOARD_HEIGHT = 600;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_SIZE = 12;
const PADDLE_SPEED = 6;
const BALL_SPEED = 4;

function clamp(val, min, max) {
  return Math.max(min, Math.min(val, max));
}

const initialState = () => ({
  ball: {
    x: BOARD_WIDTH / 2 - BALL_SIZE / 2,
    y: BOARD_HEIGHT / 2 - BALL_SIZE / 2,
    vx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    vy: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
  },
  paddles: {
    top: BOARD_WIDTH / 2 - PADDLE_WIDTH / 2,
    bottom: BOARD_WIDTH / 2 - PADDLE_WIDTH / 2,
  },
  scores: {
    top: 0,
    bottom: 0,
  },
});

export default function App() {
  const [state, setState] = useState(initialState());
  const keys = useRef({ bottomLeft: false, bottomRight: false, topLeft: false, topRight: false });

  // Reset handler
  const handleReset = () => {
    setState(initialState());
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === "a") keys.current.bottomLeft = true;
      if (e.key.toLowerCase() === "d") keys.current.bottomRight = true;
      if (e.key === "ArrowLeft") keys.current.topLeft = true;
      if (e.key === "ArrowRight") keys.current.topRight = true;
    };
    const handleKeyUp = (e) => {
      if (e.key.toLowerCase() === "a") keys.current.bottomLeft = false;
      if (e.key.toLowerCase() === "d") keys.current.bottomRight = false;
      if (e.key === "ArrowLeft") keys.current.topLeft = false;
      if (e.key === "ArrowRight") keys.current.topRight = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let animationId;
    function gameLoop() {
      setState((prev) => {
        let {
          ball: { x, y, vx, vy },
          paddles,
          scores,
        } = JSON.parse(JSON.stringify(prev));

        // Paddle movement
        if (keys.current.bottomLeft)
          paddles.bottom = clamp(paddles.bottom - PADDLE_SPEED, 0, BOARD_WIDTH - PADDLE_WIDTH);
        if (keys.current.bottomRight)
          paddles.bottom = clamp(paddles.bottom + PADDLE_SPEED, 0, BOARD_WIDTH - PADDLE_WIDTH);
        if (keys.current.topLeft)
          paddles.top = clamp(paddles.top - PADDLE_SPEED, 0, BOARD_WIDTH - PADDLE_WIDTH);
        if (keys.current.topRight)
          paddles.top = clamp(paddles.top + PADDLE_SPEED, 0, BOARD_WIDTH - PADDLE_WIDTH);

        // Ball movement
        x += vx;
        y += vy;

        // Wall collision (left/right)
        if (x < 0 || x > BOARD_WIDTH - BALL_SIZE) vx = -vx;

        // Paddle collision (top)
        if (
          y < PADDLE_HEIGHT + 8 &&
          x + BALL_SIZE > paddles.top &&
          x < paddles.top + PADDLE_WIDTH &&
          vy < 0
        ) {
          vy = -vy;
          y = PADDLE_HEIGHT + 10;
        }

        // Paddle collision (bottom)
        if (
          y + BALL_SIZE > BOARD_HEIGHT - PADDLE_HEIGHT - 8 &&
          x + BALL_SIZE > paddles.bottom &&
          x < paddles.bottom + PADDLE_WIDTH &&
          vy > 0
        ) {
          vy = -vy;
          y = BOARD_HEIGHT - PADDLE_HEIGHT - BALL_SIZE - 10;
        }

        // Score (top missed)
        if (y < 0) {
          scores.bottom += 1;
          return { ...initialState(), scores };
        }
        // Score (bottom missed)
        if (y + BALL_SIZE > BOARD_HEIGHT) {
          scores.top += 1;
          return { ...initialState(), scores };
        }

        return {
          ball: { x, y, vx, vy },
          paddles,
          scores,
        };
      });
      animationId = requestAnimationFrame(gameLoop);
    }
    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="app-center">
      <div className="pong-board" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}>
        <div className="score left-score">{state.scores.top}</div>
        <div className="score right-score">{state.scores.bottom}</div>
        <div className="center-line" />
        {/* Top paddle */}
        <div
          className="paddle top-paddle"
          style={{ left: state.paddles.top, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }}
        />
        {/* Bottom paddle */}
        <div
          className="paddle bottom-paddle"
          style={{
            left: state.paddles.bottom,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
            top: "unset",
            bottom: 24,
          }}
        />
        {/* Ball */}
        <div
          className="ball"
          style={{
            left: state.ball.x,
            top: state.ball.y,
            width: BALL_SIZE,
            height: BALL_SIZE,
          }}
        />
        <div className="player-label" style={{ top: 50 }}>
          Top: ← →
        </div>
        <div className="player-label" style={{ bottom: 50, top: "unset" }}>
          Bottom: A D
        </div>
      </div>
      <button className="reset-btn" onClick={handleReset}>
        Reset
      </button>
    </div>
  );
}