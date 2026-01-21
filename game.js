/* =========================
   SKYBOUND SEASON - FINAL
   ========================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;
ctx.imageSmoothingEnabled = false;

const TILE = 16;
const SCALE = 3;
const IS_MOBILE = "ontouchstart" in window;

let gameStarted = false;

/* =========================
   IMAGES
   ========================= */
const tileset = new Image();
tileset.src = "assets/tilesets/tilesets.png";

const playerImg = new Image();
playerImg.src = "assets/characters/player.png";

/* =========================
   MAP
   ========================= */
const MAP_W = 60;
const MAP_H = 40;

/* =========================
   TIME
   ========================= */
const Time = {
  day: 1,
  tick() {
    this.day++;
    saveGame();
  }
};
setInterval(() => Time.tick(), 5000);

/* =========================
   PLAYER
   ========================= */
const player = {
  x: 10 * TILE,
  y: 10 * TILE,
  w: TILE,
  h: TILE,
  speed: 1.5
};

/* =========================
   CAMERA
   ========================= */
const camera = {
  x: 0, y: 0,
  w: canvas.width / SCALE,
  h: canvas.height / SCALE,
  update() {
    this.x = player.x - this.w / 2;
    this.y = player.y - this.h / 2;
    this.x = Math.max(0, Math.min(this.x, MAP_W * TILE - this.w));
    this.y = Math.max(0, Math.min(this.y, MAP_H * TILE - this.h));
  }
};

/* =========================
   INPUT KEYBOARD
   ========================= */
const keys = {};
addEventListener("keydown", e => keys[e.key] = true);
addEventListener("keyup", e => keys[e.key] = false);

/* =========================
   JOYSTICK (LOGIC)
   ========================= */
const joystick = {
  active: false,
  sx: 0, sy: 0,
  dx: 0, dy: 0,
  max: 25
};

if (IS_MOBILE) {
  canvas.addEventListener("touchstart", e => {
    const t = e.touches[0];
    joystick.active = true;
    joystick.sx = t.clientX;
    joystick.sy = t.clientY;
    joystick.dx = joystick.dy = 0;
  });

  canvas.addEventListener("touchmove", e => {
    if (!joystick.active) return;
    const t = e.touches[0];
    joystick.dx = t.clientX - joystick.sx;
    joystick.dy = t.clientY - joystick.sy;

    const d = Math.hypot(joystick.dx, joystick.dy);
    if (d > joystick.max) {
      joystick.dx *= joystick.max / d;
      joystick.dy *= joystick.max / d;
    }
  });

  canvas.addEventListener("touchend", () => {
    joystick.active = false;
    joystick.dx = joystick.dy = 0;
  });
}

/* =========================
   SAVE / LOAD
   ========================= */
function saveGame() {
  localStorage.setItem("skyboundSave", JSON.stringify({
    player,
    day: Time.day
  }));
}

function loadGame() {
  const d = JSON.parse(localStorage.getItem("skyboundSave"));
  if (!d) return;
  Object.assign(player, d.player);
  Time.day = d.day;
}

/* =========================
   UPDATE
   ========================= */
function update() {
  let dx = 0, dy = 0;

  if (keys.ArrowUp) dy--;
  if (keys.ArrowDown) dy++;
  if (keys.ArrowLeft) dx--;
  if (keys.ArrowRight) dx++;

  if (joystick.active) {
    dx += joystick.dx / joystick.max;
    dy += joystick.dy / joystick.max;
  }

  player.x += dx * player.speed;
  player.y += dy * player.speed;

  player.x = Math.max(0, Math.min(player.x, MAP_W * TILE));
  player.y = Math.max(0, Math.min(player.y, MAP_H * TILE));

  camera.update();
}

/* =========================
   DRAW MAP
   ========================= */
function drawMap() {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      ctx.drawImage(
        tileset,
        0, 0, TILE, TILE,
        x * TILE - camera.x,
        y * TILE - camera.y,
        TILE, TILE
      );
    }
  }
}

/* =========================
   DRAW
   ========================= */
function draw() {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMap();

  ctx.drawImage(
    playerImg,
    player.x - camera.x,
    player.y - camera.y,
    TILE, TILE
  );

  /* ===== UI (SCREEN SPACE) ===== */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(10, 10, 120, 30);
  ctx.fillStyle = "#fff";
  ctx.font = "12px monospace";
  ctx.fillText(`Day: ${Time.day}`, 20, 30);

  /* ===== JOYSTICK VISUAL ===== */
  if (IS_MOBILE && joystick.active) {
    ctx.beginPath();
    ctx.arc(joystick.sx, joystick.sy, 30, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      joystick.sx + joystick.dx,
      joystick.sy + joystick.dy,
      15,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fill();
  }
}

/* =========================
   LOOP
   ========================= */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

/* =========================
   START (ONCE)
   ========================= */
tileset.onload = () => {
  playerImg.onload = () => {
    if (gameStarted) return;
    gameStarted = true;
    loadGame();
    loop();
  };
};