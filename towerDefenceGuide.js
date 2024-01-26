const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d"); // ctx === context;
canvas.width = 900; //960
canvas.height = 600; //640
let then = Date.now();
let now;

//global variable
const cellSize = 100; //64
const cellGap = 3;
const gameGrid = [];
const defenders = [];
const enemies = [];
const projectiles = [];
const enemyProjectiles = [];
const enemyPosition = [];
const resources = [];
//const enemyRadious = [];
let numberOfResources = 300;
let enemiesInterval = 600;
let frame = 0;
let gameOver = false;
let score = 0;
let winningScore = 1000;
let chosenDefender = 1;
let defenderCost = 100;
let defenderIndex = 0;
let enemiesIndex = 0;
let exIndex = 0;
let exAttacked = false;
const newEnemy = [1];
const exStart = [false, 0];
function explosionAttackIndex() {
  return Math.floor(Math.random() * 10);
}
function number2or3() {
  let randomNumber = Math.random();
  if (randomNumber < 0.5) {
    return 2;
  } else {
    return 3;
  }
}

//mouse
const mouse = {
  x: undefined,
  y: undefined,
  width: 0.1,
  height: 0.1,
  clicked: false,
};
canvas.addEventListener("mousedown", function () {
  mouse.clicked = true;
});
canvas.addEventListener("mouseup", function () {
  mouse.clicked = false;
});
let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener("mousemove", function (e) {
  mouse.x = e.x - canvasPosition.left;
  mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener("mouseleave", function () {
  mouse.x = undefined;
  mouse.y = undefined;
});

//game board
const controlsBar = {
  width: canvas.width,
  height: cellSize,
};
class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
  }
  draw() {
    if (mouse.x && mouse.y && collision2(this, mouse)) {
      ctx.strokeStyle = "black";
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
}
function createGrid() {
  for (let y = cellSize; y < canvas.height; y += cellSize) {
    for (let x = 0; x < canvas.width; x += cellSize) {
      gameGrid.push(new Cell(x, y));
    }
  }
}
createGrid();
function handleGameGrid() {
  for (let i = 0; i < gameGrid.length; i++) {
    gameGrid[i].draw();
  }
}

//projectiles
const projectileTypes = [];
const projectile1 = new Image();
projectile1.src = "img/other/ArrowAlone.png";
projectileTypes.push(projectile1);

class Projectiles {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize / 2.5 - cellGap * 2;
    this.height = cellSize / 2.5 - cellGap * 2;
    this.power = 10;
    this.speed = 5;
    this.projectileType =
      projectileTypes[Math.floor(Math.random() * projectileTypes.length)];
    this.frameX = 0;
    this.frameY = 0;
    this.minFrame = 0;
    this.maxFrame = 1;
    this.spriteWidth = 128;
    this.spriteHeight = 128;
  }
  update() {
    this.x += this.speed;
  }
  draw() {
    //ctx.fillStyle = "black";
    //ctx.beginPath();
    //ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2); //minus 0
    //ctx.fill();
    //ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.projectileType,
      this.frameX * this.spriteWidth,
      this.frameY,
      this.spriteWidth,
      this.spriteHeight,
      this.x + 15, //minus 30
      this.y - 15,
      this.width,
      this.height
    );
  }
}
function handleProjectiles() {
  for (i = 0; i < projectiles.length; i++) {
    projectiles[i].update();
    projectiles[i].draw();

    for (let j = 0; j < enemies.length; j++) {
      if (enemies[j] && projectiles[i] && enemies[j].width > cellSize) {
        enemies[j].x += cellSize * 2;
        enemies[j].width -= cellSize * 2;
        if (collision(projectiles[i], enemies[j])) {
          enemies[j].health -= projectiles[i].power;
          projectiles.splice(i, 1);
          i--;
        }
        enemies[j].x -= cellSize * 2;
        enemies[j].width += cellSize * 2;
      } else {
        if (
          enemies[j] &&
          projectiles[i] &&
          collision(projectiles[i], enemies[j])
        ) {
          enemies[j].health -= projectiles[i].power;
          projectiles.splice(i, 1);
          i--;
        }
      }
    }

    if (projectiles[i] && projectiles[i].x > canvas.width - cellSize / 3) {
      projectiles.splice(i, 1);
      i--;
    }
  }
}

//enemyProjectiles
const enemyProjectileTypes = [];
const enemyProjectile1 = new Image();
enemyProjectile1.src = "img/other/tnt-animated.png";
enemyProjectileTypes.push(enemyProjectile1);
const enemyProjectileExplotion = new Image();
enemyProjectileExplotion.src = "img/other/Explosions.png";
enemyProjectileTypes.push(enemyProjectileExplotion);

class EnemyProjectiles {
  constructor(x, y) {
    this.x = x;
    this.initialX = x;
    this.y = y;
    this.width = cellSize / 2.5 - cellGap * 2;
    this.height = cellSize / 2.5 - cellGap * 2;
    this.power = 20;
    this.speed = 4;
    this.enemyProjectileType = enemyProjectileTypes[0];
    //Math.floor(Math.random() * enemyProjectileTypes.length)
    this.frameX = 0;
    this.frameY = 0;
    this.minFrame = 0;
    this.maxFrame = 7;
    this.spriteWidth = 64;
    this.spriteHeight = 64;
    this.explosion = false;
  }
  update() {
    this.x -= this.speed;

    if (this.enemyProjectileType === enemyProjectileTypes[0]) {
      if (frame % 10 === 0) {
        if (this.frameX < this.maxFrame) {
          this.frameX++;
        } else {
          this.frameX = this.minFrame;
        }
      }
    }
  }
  draw() {
    //ctx.fillStyle = "black";
    //ctx.beginPath();
    //ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    //ctx.fill();
    //ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.enemyProjectileType,
      this.frameX * this.spriteWidth,
      this.frameY,
      this.spriteWidth,
      this.spriteHeight,
      this.x, // minus 30
      this.y,
      this.width,
      this.height
    );
  }
}

//const explosionArray = [];

class Explosion {
  constructor(projectile) {
    if (projectile.enemyProjectileType === enemyProjectileTypes[0]) {
      this.x = projectile.x - 80; // minus
      this.y = projectile.y - 50;
      this.width = projectile.width * 4;
      this.height = projectile.height * 4;
    } else {
      this.x = projectile.x - cellSize; // minus
      this.y = projectile.y - cellSize;
      this.width = projectile.width * 3;
      this.height = projectile.height * 3;
      this.enemyType = enemyTypes[2];
    }
    this.enemyProjectileType = enemyProjectileTypes[1];
    this.frameX = 0;
    this.frameY = 0;
    this.minFrame = 0;
    this.maxFrame = 9;
    this.spriteWidth = 192;
    this.spriteHeight = 192;
    this.explosion = true;
  }
  update() {
    if (frame % 10 === 0) {
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        return 1;
      }
    }
  }
  draw() {
    ctx.drawImage(
      this.enemyProjectileType,
      this.frameX * this.spriteWidth,
      this.frameY,
      this.spriteWidth,
      this.spriteHeight,
      this.x, // minus
      this.y,
      this.width,
      this.height
    );
  }
}

function handleEnemyProjectiles() {
  for (let i = 0; i < enemyProjectiles.length; i++) {
    enemyProjectiles[i].update();
    enemyProjectiles[i].draw();

    for (let j = 0; j < defenders.length; j++) {
      if (
        defenders[j] &&
        enemyProjectiles[i] &&
        collision(enemyProjectiles[i], defenders[j])
      ) {
        if (explosionDetected(enemyProjectiles[i])) {
          if (enemyProjectiles[i].update() === 1) {
            enemyProjectiles.splice(i, 1);
            i--;
          }
        } else {
          defenders[j].health -= enemyProjectiles[i].power;
          enemyProjectiles.splice(i, 1, new Explosion(enemyProjectiles[i]));
          //i--;
        }

        if (defenders[j] && defenders[j].health <= 0) {
          defenders[j].killed = true;
          for (let g = enemies.length; g > -1; g--) {
            if (enemies[g] && enemies[g].target === defenders[j]) {
              enemies[g].target = undefined;
              enemies[g].movement = enemies[g].speed;
              enemies[g].shooting = false;
            }
          }
        }

        if (defenders[j] && defenders[j].killed) {
          defenders.splice(j, 1);
          j--;
        }
      }
    }

    if (enemyProjectiles[i] && enemyProjectiles[i].x < -100) {
      enemyProjectiles.splice(i, 1);
      i--;
    }
  }
}

function explosionDetected(explosion) {
  if (explosion.explosion === true) {
    return true;
  } else {
    return false;
  }
}

//defenders
const defenderTypes = [];
const defender1 = new Image();
defender1.src = "img/defenders/Defender1.png";
const defender2 = new Image();
defender2.src = "img/defenders/Defender2.png";

class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.shooting = false;
    this.shootingNow = false;
    this.chosenDefender = chosenDefender;
    if (this.chosenDefender === 1) {
      this.health = 100;
    } else if (this.chosenDefender === 2) {
      this.health = 500;
    }
    this.projectiles = [];
    this.timer = 0;
    this.frameX = 0;
    this.frameY = 0;
    this.minFrame = 0;
    this.maxFrame = 5;
    this.spriteWidth = 192;
    this.spriteHeight = 192;
    this.killed = false;
    this.target;
    //this.index = defenderIndex;
  }
  draw() {
    // health bar
    if (this.chosenDefender === 1) {
      ctx.fillStyle = "lightcoral";
      ctx.fillRect(this.x + this.width / 4, this.y + 15, this.width / 2, 10);
      ctx.fillStyle = "green";
      ctx.fillRect(
        this.x + this.width / 4,
        this.y + 15,
        ((this.width / 2) * this.health) / 100,
        10
      );
    } else {
      ctx.fillStyle = "lightcoral";
      ctx.fillRect(this.x + this.width / 4, this.y + 15, this.width / 2, 10);
      ctx.fillStyle = "green";
      ctx.fillRect(
        this.x + this.width / 4,
        this.y + 15,
        ((this.width / 2) * this.health) / 500,
        10
      );
    }
    //ctx.fillStyle = "black";
    //ctx.font = "30px Orbitron";
    //ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    if (this.chosenDefender === 1) {
      ctx.drawImage(
        defender1,
        this.frameX * this.spriteWidth,
        this.frameY,
        this.spriteWidth,
        this.spriteHeight,
        this.x, //minus + 0
        this.y,
        this.width,
        this.height
      );
    } else if (this.chosenDefender === 2) {
      ctx.drawImage(
        defender2,
        this.frameX * this.spriteWidth,
        this.frameY,
        this.spriteWidth,
        this.spriteHeight,
        this.x, //minus + 0
        this.y,
        this.width,
        this.height
      );
    }
  }
  update() {
    if (this.chosenDefender === 1) {
      if (frame % 10 === 0) {
        if (this.shooting === false) {
          this.frameY = this.minFrame;
          this.maxFrame = 5;
          if (this.frameX < this.maxFrame) {
            this.frameX++;
          } else {
            this.frameX = this.minFrame;
          }
        } else {
          this.frameY = 192 * 4;
          this.maxFrame = 7;
          if (this.frameX < this.maxFrame) {
            this.frameX++;
            if (this.frameX === 6) {
              this.shootingNow = true;
            }
          } else {
            this.frameX = this.minFrame;
          }
        }
      }
      if (this.shootingNow) {
        projectiles.push(new Projectiles(this.x + 35, this.y + 50));
        this.shootingNow = false;
      }
    } else if (this.chosenDefender === 2 && this.shooting === false) {
      this.frameY = 0;
      this.maxFrame = 5;
      if (frame % 10 === 0) {
        if (this.frameX < this.maxFrame) {
          this.frameX++;
        } else {
          this.frameX = this.minFrame;
        }
      }
    } else if (this.chosenDefender === 2 && this.shooting) {
      if (frame % 10 === 0) {
        this.frameY = 192 * number2or3();
        if (this.frameX < this.maxFrame) {
          this.frameX++;
        } else {
          this.frameX = this.minFrame;
        }
      }
    }
  }
}
canvas.addEventListener("click", function () {
  const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
  const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
  if (gridPositionY < cellSize) return;
  for (let i = 0; i < defenders.length; i++) {
    if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) {
      return;
    }
  }
  if (numberOfResources >= defenderCost) {
    defenders.push(new Defender(gridPositionX, gridPositionY));
    numberOfResources -= defenderCost;
  } else {
    floatingMessages.push(
      new floatingMessage(
        "Not enough resources!",
        mouse.x - 180,
        mouse.y,
        24,
        "red"
      )
    );
  }
});

function handleDefender() {
  for (let i = 0; i < defenders.length; i++) {
    function lastDefender() {
      if (defenders.length - i === 1) {
        return true;
      } else {
        return false;
      }
    }

    defenders[i].draw();
    defenders[i].update();
    if (enemyPosition.indexOf(defenders[i].y) !== -1) {
      if (defenders[i].chosenDefender === 1) {
        defenders[i].shooting = true;
      }
    } else {
      defenders[i].shooting = false;
    }
    for (let j = 0; j < enemies.length; j++) {
      if (
        enemies[j].enemyType === enemyTypes[1] &&
        enemies[j].width < cellSize
      ) {
        enemies[j].x -= cellSize * 2;
        enemies[j].width += cellSize * 2;

        if (
          defenders[i] &&
          enemies[j] &&
          collision3(defenders[i], enemies[j])
        ) {
          if (!defenders[i].killed) {
            if (enemies[j].target !== defenders[i]) {
              enemies[j].target = defenders[i];
              enemies[j].movement = 0;
              enemies[j].shooting = true;
            }
            if (enemies[j].frameX === 2) {
              enemies[j].shootingNow = true;
            }
            if (frame % 10 === 0 && enemies[j].shootingNow) {
              let x = enemies[j].x;
              enemyProjectiles.push(
                new EnemyProjectiles(
                  (x += cellSize * 2 + 20),
                  enemies[j].y + 25
                )
              );
              enemies[j].shootingNow = false;
            }
            if (defenders[i] && defenders[i].health <= 0) {
              defenders[i].killed = true;
              for (let g = enemies.length; g > -1; g--) {
                if (enemies[g] && enemies[g].target === defenders[i]) {
                  enemies[g].target = undefined;
                  enemies[g].movement = enemies[g].speed;
                  enemies[g].shooting = false;
                }
              }
            }
            if (defenders[i] && defenders[i].killed) {
              defenders.splice(i, 1);
              i--;
            }
          }
        }
        enemies[j].x += cellSize * 2;
        enemies[j].width -= cellSize * 2;
      }

      if (defenders[i] && enemies[j] && collision(defenders[i], enemies[j])) {
        if (defenders[i].chosenDefender === 2) {
          if (
            enemies[j].enemyType === enemyTypes[1] &&
            enemies[j].width > cellSize
          ) {
            enemies[j].x += cellSize * 2;
            enemies[j].width -= cellSize * 2;
            if (collision(defenders[i], enemies[j])) {
              defenders[i].shooting = true;
              if (defenders[i].frameX === 4) {
                defenders[i].shootingNow = true;
              }
              if (defenders[i].shootingNow) {
                enemies[j].health -= 2;
                defenders[i].shootingNow = false;
              }
            }
            enemies[j].x -= cellSize * 2;
            enemies[j].width += cellSize * 2;
          } else {
            defenders[i].shooting = true;
            if (defenders[i].frameX === 4) {
              defenders[i].shootingNow = true;
            }
            if (defenders[i].shootingNow) {
              enemies[j].health -= 1;
              defenders[i].shootingNow = false;
            }
          }
        }

        if (enemies[j].enemyType === enemyTypes[2] && !defenders[i].killed) {
          if (explosionDetected(enemies[j])) {
            if (exIndex === 1) {
              defenders[i].health -= 75;
              exAttacked = true;
            }
            if (enemies[j].update() === 1) {
              enemies.splice(j, 1);
              j--;
            }
          } else {
            if (
              enemies[j].target !== defenders[i] &&
              enemies[j].spriteWidth !== 192
            ) {
              enemies[j].target = defenders[i];
              enemies[j].movement = 0;
              enemies[j].shooting = true;
              enemies[j].frameX = 3;
            }
            if (enemies[j].frameX === 5) {
              enemies[j].shootingNow = true;
            }

            if (enemies[j].shootingNow) {
              const findThisIndex = enemyPosition.indexOf(enemies[j].y);
              enemyPosition.splice(findThisIndex, 1);
              exStart.splice(0, 2, true, j);
              exIndex = 1;
            }
          }
        }

        if (!defenders[i].killed && enemies[j]) {
          if (explosionDetected(enemies[j])) {
          } else {
            if (enemies[j].target !== defenders[i]) {
              enemies[j].target = defenders[i];
              enemies[j].movement = 0;
              enemies[j].shooting = true;
            }
            if (enemies[j].frameX === 3) {
              enemies[j].shootingNow = true;
            }
          }
          if (
            enemies[j].enemyType === enemyTypes[1] &&
            enemies[j].shootingNow
          ) {
            enemies[j].shootingNow = false;
          } else if (
            enemies[j].enemyType === enemyTypes[2] &&
            enemies[j].shootingNow
          ) {
            enemies[j].shootingNow = false;
          } else if (enemies[j].shootingNow) {
            defenders[i].health -= 2;
            enemies[j].shootingNow = false;
          }
          if (defenders[i] && defenders[i].health <= 0) {
            defenders[i].killed = true;
            for (let g = enemies.length; g > -1; g--) {
              if (enemies[g] && enemies[g].target === defenders[i]) {
                enemies[g].target = undefined;
                enemies[g].movement = enemies[g].speed;
                enemies[g].shooting = false;
              }
            }
          }
          if (defenders[i] && defenders[i].killed) {
            defenders.splice(i, 1);
            i--;
          }
        }
      }
      if (lastDefender() && exStart[0] === true) {
        let j = exStart[1];
        enemies.splice(j, 1, new Explosion(enemies[j]));
        exStart[0] = false;
      }
    }
  }
}

const card1 = {
  x: 10,
  y: 10,
  width: 70,
  height: 80,
  stroke: "black",
};

const card2 = {
  x: 90,
  y: 10,
  width: 70,
  height: 80,
  stroke: "black",
};

function choseDefender() {
  if (mouse.x && mouse.y && collision2(card1, mouse) && mouse.clicked) {
    chosenDefender = 1;
  } else if (mouse.x && mouse.y && collision2(card2, mouse) && mouse.clicked) {
    chosenDefender = 2;
  }
  if (chosenDefender === 1) {
    card1.stroke = "gold";
    card2.stroke = "black";
    defenderCost = 80;
  } else if (chosenDefender === 2) {
    card2.stroke = "gold";
    card1.stroke = "black";
    defenderCost = 100;
  } else {
    card1.stroke = "black";
    card2.stroke = "black";
  }

  ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(card1.x, card1.y, card1.width, card1.height);
  ctx.drawImage(defender1, 0, 0, 192, 192, -25, -15, 192 / 1.4, 192 / 1.4);
  ctx.strokeStyle = card1.stroke;
  ctx.strokeRect(card1.x, card1.y, card1.width, card1.height);
  ctx.fillRect(card2.x, card2.y, card2.width, card2.height);
  ctx.drawImage(defender2, 0, 0, 192, 192, 52, -15, 192 / 1.4, 192 / 1.4);
  ctx.strokeStyle = card2.stroke;
  ctx.strokeRect(card2.x, card2.y, card2.width, card2.height);
}

// floating messages
const floatingMessages = [];
class floatingMessage {
  constructor(value, x, y, size, color) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.size = size;
    this.lifeSpan = 0;
    this.color = color;
    this.opacity = 1;
  }
  update() {
    this.y -= 0.3;
    this.lifeSpan += 1;
    if (this.opacity > 0.01) {
      this.opacity -= 0.01;
    }
  }
  draw() {
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    this.font = this.size + "px Orbitron";
    ctx.fillText(this.value, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}
function handleFloatingMessages() {
  for (let i = 0; i < floatingMessages.length; i++) {
    floatingMessages[i].update();
    floatingMessages[i].draw();
    if (floatingMessages[i].lifeSpan >= 150) {
      floatingMessages.splice(i, 1);
      i--;
    }
  }
}

//enemies
const enemyTypes = [];
function addEnemyTypes() {
  if (newEnemy[0] === 1) {
    const enemy1 = new Image();
    enemy1.src = "img/enemies/Torch_Red.png";
    enemyTypes.push(enemy1);
    newEnemy.splice(0, 1, 0);
  }

  if (newEnemy[0] === 2) {
    const enemy2 = new Image();
    enemy2.src = "img/enemies/TNT_Red.png";
    enemyTypes.push(enemy2);
    newEnemy.splice(0, 1, 0);
  }

  if (newEnemy[0] === 3) {
    const enemy3 = new Image();
    enemy3.src = "img/enemies/Barrel_Red.png";
    enemyTypes.push(enemy3);
    newEnemy.splice(0, 1, 0);
  }
}

class Enemy {
  constructor(verticalPosition) {
    this.x = canvas.width;
    this.initialX = canvas.width;
    this.y = verticalPosition;
    this.width = cellSize - cellGap * 2;
    this.initialWidth = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.speed = Math.random() * 0.2 + 0.4;
    this.movement = this.speed;
    this.enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    if (this.enemyType === enemyTypes[0]) {
      this.health = 120;
    }
    if (this.enemyType === enemyTypes[1]) {
      this.health = 80;
    }
    if (this.enemyType === enemyTypes[2]) {
      this.health = 100;
    }
    this.maxHealth = this.health;
    this.projectiles = [];
    this.frameX = 0;
    this.frameY = 192;
    this.minFrame = 1;
    this.maxFrame = 6;
    this.spriteWidth = 192;
    this.spriteHeight = 192;
    this.shooting = false;
    this.shootingNow = false;
    this.target;
    this.index = enemiesIndex;
    this.explosion = false;
  }
  update() {
    this.x -= this.movement;

    if (this.enemyType === enemyTypes[0] && this.shooting === false) {
      this.frameY = 192;
      if (frame % 10 === 0) {
        if (this.frameX < this.maxFrame) {
          this.frameX++;
        } else {
          this.frameX = this.minFrame;
        }
      }
    } else if (this.enemyType === enemyTypes[0] && this.shooting) {
      if (frame % 10 === 0) {
        this.frameY = 192 * 2;
        if (this.frameX < this.maxFrame) {
          this.frameX++;
        } else {
          this.frameX = this.minFrame;
        }
      }
    }
    if (this.enemyType === enemyTypes[1] && this.shooting === false) {
      this.frameY = 192;
      this.minFrame = 1;
      if (frame % 10 === 0) {
        if (this.frameX < this.maxFrame) {
          this.frameX++;
        } else {
          this.frameX = this.minFrame;
        }
      }
    } else if (this.enemyType === enemyTypes[1] && this.shooting) {
      if (frame % 10 === 0) {
        this.frameY = 192 * 2;
        this.minFrame = 0;
        this.maxFrame = 6;
        if (this.frameX < this.maxFrame) {
          this.frameX++;
        } else {
          this.frameX = this.minFrame;
        }
      }
    }
    if (this.enemyType === enemyTypes[2] && this.shooting === false) {
      this.spriteWidth = 128;
      this.spriteHeight = 128;
      this.frameY = 128;
      this.minFrame = 0;
      this.maxFrame = 5;
      if (frame % 10 === 0) {
        if (this.frameX < this.maxFrame) {
          this.frameX++;
        } else {
          this.frameX = this.minFrame;
        }
      }
    } else if (this.enemyType === enemyTypes[2] && this.shooting) {
      if (frame % 10 === 0) {
        this.frameY = 128 * 5;
        this.minFrame = 3;
        this.maxFrame = 6;
        if (this.frameX < this.maxFrame) {
          this.frameX++;
        } else {
          this.frameX = this.minFrame;
        }
      }
    }
  }
  draw() {
    if (this.width > cellSize) {
      ctx.drawImage(
        this.enemyType,
        this.frameX * this.spriteWidth,
        this.frameY,
        this.spriteWidth,
        this.spriteHeight,
        this.x + 2 * cellSize, // minus -45
        this.y,
        this.width - 2 * cellSize,
        this.height
      );
    } else {
      //health bar
      ctx.fillStyle = "lightcoral";
      ctx.fillRect(this.x + 20, this.y + 15, this.width / 2, 10);
      ctx.fillStyle = "red";
      ctx.fillRect(
        this.x + 20,
        this.y + 15,
        ((this.width / 2) * this.health) / this.maxHealth,
        10
      );
      ctx.drawImage(
        this.enemyType,
        this.frameX * this.spriteWidth,
        this.frameY,
        this.spriteWidth,
        this.spriteHeight,
        this.x, // minus -45
        this.y,
        this.width,
        this.height
      );
    }
  }
}

/* class EnemyRadious {
  constructor(y, index, speed) {
    this.x = canvas.width - cellSize * 2;
    this.y = y;
    this.width = 3 * cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.speed = speed;
    this.movement = this.speed;
    this.index = index;
    this.target;
  }
  update() {
    this.x -= this.movement;
  }
  draw() {
    ctx.fillStyle = "gray";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
} */
function handleEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].update();
    enemies[i].draw();

    if (exAttacked) {
      exIndex = 0;
      exAttacked = false;
    }

    if (!(enemies[i].width > cellSize) && enemies[i].x <= -50) {
      gameOver = true;
    }
    if (enemies[i] && enemies[i].health <= 0) {
      let gainedResources = enemies[i].maxHealth / 5;
      floatingMessages.push(
        new floatingMessage(
          "+" + gainedResources,
          enemies[i].x + enemies[i].width / 4,
          enemies[i].y,
          20,
          "gold"
        )
      );
      numberOfResources += gainedResources;
      score += gainedResources;

      const findThisIndex = enemyPosition.indexOf(enemies[i].y);
      enemyPosition.splice(findThisIndex, 1);
      enemies.splice(i, 1);
      i--;
    }
  }
  // enemies respawn
  if (frame % enemiesInterval === 0 && score < winningScore) {
    let verticalPosition =
      Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
    enemies.push(new Enemy(verticalPosition));
    enemiesIndex++;
    enemyPosition.push(verticalPosition);

    if (enemiesInterval > 400) {
      enemiesInterval -= 25;
    }
    if (enemiesInterval === 400) {
      newEnemy.splice(0, 1, 2);
      enemiesInterval -= 10;
    }
    if (enemiesInterval < 400 && enemiesInterval > 200) {
      enemiesInterval -= 10;
    }
    if (enemiesInterval === 200) {
      newEnemy.splice(0, 1, 3);
      enemiesInterval -= 20;
    }
    if (enemiesInterval < 200 && enemiesInterval > 100) {
      enemiesInterval -= 5;
    }
  }
}

//resources
const resourceTypes = [];
const resource1 = new Image();
resource1.src = "img/other/G_Spawn.png";
resourceTypes.push(resource1);
const amounts = [20, 30, 40];
class Resource {
  constructor() {
    this.x = Math.random() * (canvas.width - cellSize);
    this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
    this.width = cellSize * 0.6;
    this.height = cellSize * 0.6;
    this.amount = amounts[Math.floor(Math.random() * amounts.length)];
    this.resourceType =
      resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    this.frameX = 0;
    this.frameY = 0;
    this.minFrame = 0;
    this.maxFrame = 5;
    this.spriteWidth = 128;
    this.spriteHeight = 128;
  }
  update() {
    if (frame % 10 === 0) {
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      }
    }
  }
  draw() {
    //ctx.fillStyle = "yellow";
    //ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "gold";
    ctx.font = "20px Orbitron";
    ctx.fillText(this.amount, this.x + 15, this.y + 25);
    ctx.drawImage(
      this.resourceType,
      this.frameX * this.spriteWidth,
      this.frameY,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}
function handleResource() {
  if (frame > 1 && frame % 500 === 0 && score < winningScore) {
    resources.push(new Resource());
  }
  for (let i = 0; i < resources.length; i++) {
    resources[i].draw();
    resources[i].update();
    if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)) {
      floatingMessages.push(
        new floatingMessage(
          "+" + resources[i].amount,
          resources[i].x,
          resources[i].y,
          20,
          "gold"
        )
      );
      numberOfResources += resources[i].amount;
      resources.splice(i, 1);
      i--;
    }
  }
}
//utilities
function handleGameStatus() {
  ctx.fillStyle = "gold";
  ctx.font = "30px Orbitron";
  ctx.fillText("Resources: " + numberOfResources, 170, 40);
  ctx.fillStyle = "white";
  ctx.font = "30px Orbitron";
  ctx.fillText("Score: " + score, 170, 80);

  if (gameOver) {
    ctx.fillStyle = "black";
    ctx.font = "90px Orbitron";
    ctx.fillText("GAME OVER", 135, 330);
  }
  if (score >= winningScore) {
    let spoiledEx = 0;
    for (let j = 0; j < enemies.length; j++) {
      if (enemies[j] == Explosion) {
        spoiledEx++;
      }
    }
    if (enemies.length - spoiledEx === 0) {
      ctx.fillStyle = "white";
      ctx.font = "60px Orbitron";
      ctx.fillText("LEVEL COMPLETE", 130, 310);
      ctx.font = "30px Orbitron";
      ctx.fillText("You win with " + score + " points!", 135, 350);
    }
  }
}
function animate() {
  now = Date.now();
  let difference = now - then;
  let fps = 240;
  if (difference > 1000 / fps) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "skyblue";
    ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
    handleGameGrid();
    addEnemyTypes();
    handleDefender();
    handleResource();
    handleEnemies();
    handleProjectiles();
    handleEnemyProjectiles();
    choseDefender();
    handleFloatingMessages();
    handleGameStatus();
    frame++;
    then = now;
  }
  if (!gameOver) {
    requestAnimationFrame(animate);
  }
}
animate();

function collision3(a, b) {
  if (
    !(
      a.x + a.width / 4 > b.x - a.width / 4 + b.width ||
      a.x + a.width / 4 + a.width / 2 < b.x - a.width / 4 ||
      a.y > b.y + b.height ||
      a.y + a.height < b.y
    )
  ) {
    return true;
  }
}
function collision2(a, b) {
  if (
    !(
      a.x > b.x + b.width ||
      a.x + a.width < b.x ||
      a.y > b.y + b.height ||
      a.y + a.height < b.y
    )
  ) {
    return true;
  }
}

function collision(a, b) {
  // minus + a.width / 4
  if (
    !(
      a.x + a.width / 4 > b.x + b.width / 4 + b.width / 2 ||
      a.x + a.width / 4 + a.width / 2 < b.x + b.width / 4 ||
      a.y > b.y + b.height ||
      a.y + a.height < b.y
    )
  ) {
    return true;
  }
}

window.addEventListener("resize", function () {
  canvasPosition = canvas.getBoundingClientRect();
});

/* function radiousIndex(index) {
  for (let i = 0; i < enemyRadious.length; i++) {
    if (enemyRadious[i].index === index) {
      return true;
    }
  }
} */

/* function radIndexSub(index) {
  for (let i = 0; i < enemyRadious.length; i++) {
    if (enemyRadious[i].index === index) {
      return i;
    }
  }
} */
