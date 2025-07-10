import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import "./PongBoard.css";

const BOARD_WIDTH = 400;
const BOARD_HEIGHT = 600;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 6;
const BALL_SIZE = 12;
const PADDLE_SPEED = 6;
const BALL_SPEED = 4;
const SCORE_LIMIT = 10; 

const TOP_PADDLE_Y = 24; // Match the CSS .top-paddle { top: 24px; }
const BOTTOM_PADDLE_Y = BOARD_HEIGHT - PADDLE_HEIGHT - 24; // 24px from bottom per CSS

function clamp(val, min, max) {
  return Math.max(min, Math.min(val, max));
}

const initialState = () => ({
  ball: {
    x: BOARD_WIDTH / 2 - BALL_SIZE / 2,
    y: BOARD_HEIGHT / 2 - BALL_SIZE / 2,
    vx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    vy: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    prevX: BOARD_WIDTH / 2 - BALL_SIZE / 2,
    prevY: BOARD_HEIGHT / 2 - BALL_SIZE / 2,
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
  const [winner, setWinner] = useState(null);
  const keys = useRef({ bottomLeft: false, bottomRight: false, topLeft: false, topRight: false });

  // Reset handler
  const handleReset = () => {
    setState(initialState());
    setWinner(null);
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
    if (winner) return; // Stop game loop if there's a winner
    let animationId;

    function gameLoop() {
      setState((prev) => {
        let { ball, paddles, scores } = prev;
        ball = { ...ball };
        paddles = { ...paddles };
        scores = { ...scores };
        let { x, y, vx, vy, prevX, prevY } = ball;
        // Store previous position
        prevX = x;
        prevY = y;

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

        // Wall collision (left/right) with clamping
        if (x < 0) { x = 0; vx = -vx; }
        if (x > BOARD_WIDTH - BALL_SIZE) { x = BOARD_WIDTH - BALL_SIZE; vx = -vx; }

        // Robust Paddle collision (top)
        // Check if the ball crossed the paddle between frames
        const crossedTopPaddle =
          prevY >= TOP_PADDLE_Y + PADDLE_HEIGHT && // Was below the paddle
          y <= TOP_PADDLE_Y + PADDLE_HEIGHT &&     // Now at or above the paddle's bottom
          vy < 0 &&
          x + BALL_SIZE > paddles.top &&
          x < paddles.top + PADDLE_WIDTH;

        if (crossedTopPaddle) {
          const hitPos = ((x + BALL_SIZE / 2) - (paddles.top + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
          vx += hitPos * 2;
          vx = clamp(vx, -BALL_SPEED * 1.5, BALL_SPEED * 1.5);
          vy = -vy * 1.05;
          y = TOP_PADDLE_Y + PADDLE_HEIGHT + 0.1;
        }

        // Paddle collision (bottom)
        if (
          y + BALL_SIZE >= BOTTOM_PADDLE_Y &&
          y <= BOTTOM_PADDLE_Y + PADDLE_HEIGHT &&
          x + BALL_SIZE > paddles.bottom &&
          x < paddles.bottom + PADDLE_WIDTH &&
          vy > 0
        ) {
          const hitPos = ((x + BALL_SIZE / 2) - (paddles.bottom + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
          vx += hitPos * 2;
          vx = clamp(vx, -BALL_SPEED * 1.5, BALL_SPEED * 1.5);
          vy = -vy * 1.05;
          y = BOTTOM_PADDLE_Y - BALL_SIZE; // Place ball just above the bottom paddle
        }

        // Score (top missed)
        if (y < 0) {
          scores.bottom += 1;
          if (scores.bottom >= SCORE_LIMIT) {
            setWinner("Bottom Player Wins!");
            return { ...initialState(), scores };
          }
          return { ...initialState(), scores };
        }
        // Score (bottom missed)
        if (y + BALL_SIZE > BOARD_HEIGHT) {
          scores.top += 1;
          if (scores.top >= SCORE_LIMIT) {
            setWinner("Top Player Wins!");
            return { ...initialState(), scores };
          }
          return { ...initialState(), scores };
        }

        return {
          ball: { x, y, vx, vy, prevX, prevY },
          paddles,
          scores,
        };
      });
      animationId = requestAnimationFrame(gameLoop);
    }
    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [winner]); //  Add winner as dependency

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
        {/* Winner message */}
        {winner && (
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: 0,
              right: 0,
              textAlign: "center",
              color: "#fff",
              fontSize: "2rem",
              background: "#000a",
              padding: "20px",
              borderRadius: "10px",
              zIndex: 100,
            }}
          >
            {winner}
          </div>
        )}
      </div>
      <button className="reset-btn" onClick={handleReset}>
        Reset
      </button>
    </div>
  );
}