window.addEventListener('keydown', function(e) {
    if (e.key === 'F5') {
        e.preventDefault();
        starX = Math.random() * (ctx.canvas.width - 60) + 30;
        starY = Math.random() * (ctx.canvas.height - 60) + 30;
    }
});

function startGame() {
    const titleContainer = document.querySelector('.title-container');
    const gameOverContainer = document.querySelector('.gameover-container');
    const canvas = document.getElementById("myCanvas");
    canvas.style.display = "block"; // 캔버스 표시
    
    titleContainer.style.display = "none"; // 타이틀 숨김
    gameOverContainer.style.display = "none"; // 게임오버 화면 숨김
    
    player.hp = 3; // 플레이어 HP 초기화
    enemies.length = 0; // 적 목록 초기화
    
    // 게임 시작 지연
    setTimeout(() => {
        lastTime = performance.now(); // 타이머 리셋
        requestAnimationFrame(draw);
    }, 1000);
}

function restartGame() {
    startGame(); // 게임 재시작
}

const ctx = document.getElementById("myCanvas").getContext("2d");

const player = {
    x: ctx.canvas.width / 2,
    y: ctx.canvas.height / 2,
    speed: 200,
    hp: 3, // 플레이어 HP
    radius: 30 // 하트의 크기
};

let offsetX = 0; // 맵의 X 오프셋
let offsetY = 0; // 맵의 Y 오프셋

let starX = Math.random() * (ctx.canvas.width - 60) + 30;
let starY = Math.random() * (ctx.canvas.height - 60) + 30;
let lastTime = performance.now();

const enemies = [];

const enemySpeed = 100; // 적의 속도
const enemyRadius = 20; // 적의 크기
const numEnemiesPerSecond = 5; // 초당 생성할 적의 개수
const chaseDuration = 2000; // 추격 지속 시간 (ms)

const keyState = {};

document.addEventListener("keydown", function(event) {
    keyState[event.key] = true;
});

document.addEventListener("keyup", function(event) {
    keyState[event.key] = false;
});

function drawHeart(x, y, size, color, borderColor, rotation) {
    ctx.fillStyle = color;
    ctx.strokeStyle = borderColor;
    ctx.beginPath();
    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.translate(-x, -y);

    ctx.moveTo(x, y - size * 0.55);
    ctx.bezierCurveTo(
        x + size * 0.7, y - size,
        x + size * 1.4, y - size * 0.4,
        x, y + size * 0.8
    );
    ctx.bezierCurveTo(
        x - size * 1.4, y - size * 0.4,
        x - size * 0.7, y - size,
        x, y - size * 0.55
    );
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
}

function drawStar(x, y, radius, spikes, color, borderColor) {
    let rot = Math.PI / 2 * 3;
    let xInner = x;
    let yInner = y;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(x, y - radius);

    for (let i = 0; i < spikes; i++) {
        x = xInner + Math.cos(rot) * radius;
        y = yInner + Math.sin(rot) * radius;
        ctx.lineTo(x, y);
        rot += step;

        x = xInner + Math.cos(rot) * (radius / 2);
        y = yInner + Math.sin(rot) * (radius / 2);
        ctx.lineTo(x, y);
        rot += step;
    }

    ctx.lineTo(xInner, yInner - radius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.stroke();
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

let rotationAngle = 0;
let lastEnemySpawnTime = 0; // 적 생성 시간 추적

function draw() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const currentTimeMillis = performance.now();
    const deltaTime = (currentTimeMillis - lastTime) / 1000;
    lastTime = currentTimeMillis;

    const heartSize = 30;
    const heartColor = "red";
    const borderColor = "black";
    const starRadius = 20;
    const starSpikes = 5;
    const starColor = "#FFD700";
    const starBorderColor = "black";

    rotationAngle += 0.01;

    // 맵 이동
    if (keyState['ArrowLeft']) {
        offsetX += player.speed * deltaTime;
    } 
    if (keyState['ArrowRight']) {
        offsetX -= player.speed * deltaTime;
    }
    if (keyState['ArrowUp']) {
        offsetY += player.speed * deltaTime;
    } 
    if (keyState['ArrowDown']) {
        offsetY -= player.speed * deltaTime;
    }

    const chasingEnemySpeed = 150; // 플레이어를 추격하는 적의 속도
    const wanderingEnemySpeed = 80; // 그냥 이동하는 적의 속도
    
    // 적의 종류를 정의하기 위한 열거형
    const EnemyType = {
        CHASING: "chasing",
        WANDERING: "wandering"
    };
    
    // 랜덤하게 적의 종류를 선택하는 함수
    function randomEnemyType() {
        return Math.random() < 0.5 ? EnemyType.CHASING : EnemyType.WANDERING;
    }
    
    // 끝까지 플레이어를 추격하는 적의 생성 함수
    function createChasingEnemy() {
        const side = Math.floor(Math.random() * 4); // 0: 위, 1: 오른쪽, 2: 아래, 3: 왼쪽
        let x, y;
        switch (side) {
            case 0: // 위쪽
                x = player.x - offsetX + (Math.random() * ctx.canvas.width - ctx.canvas.width / 2);
                y = player.y - offsetY - ctx.canvas.height / 2 - enemyRadius;
                break;
            case 1: // 오른쪽
                x = player.x - offsetX + ctx.canvas.width / 2 + enemyRadius;
                y = player.y - offsetY + (Math.random() * ctx.canvas.height - ctx.canvas.height / 2);
                break;
            case 2: // 아래쪽
                x = player.x - offsetX + (Math.random() * ctx.canvas.width - ctx.canvas.width / 2);
                y = player.y - offsetY + ctx.canvas.height / 2 + enemyRadius;
                break;
            case 3: // 왼쪽
                x = player.x - offsetX - ctx.canvas.width / 2 - enemyRadius;
                y = player.y - offsetY + (Math.random() * ctx.canvas.height - ctx.canvas.height / 2);
                break;
        }
        return {
            x: x,
            y: y,
            color: getRandomColor(),
            chaseTime: performance.now(),
            angle: 0,
            type: EnemyType.CHASING // 적의 종류 지정
        };
    }

    // 그냥 이동하는 적의 생성 함수
    function createWanderingEnemy() {
        const side = Math.floor(Math.random() * 4); // 0: 위, 1: 오른쪽, 2: 아래, 3: 왼쪽
        let x, y;
        switch (side) {
            case 0: // 위쪽
                x = player.x - offsetX + (Math.random() * ctx.canvas.width - ctx.canvas.width / 2);
                y = player.y - offsetY - ctx.canvas.height / 2 - enemyRadius;
                break;
            case 1: // 오른쪽
                x = player.x - offsetX + ctx.canvas.width / 2 + enemyRadius;
                y = player.y - offsetY + (Math.random() * ctx.canvas.height - ctx.canvas.height / 2);
                break;
            case 2: // 아래쪽
                x = player.x - offsetX + (Math.random() * ctx.canvas.width - ctx.canvas.width / 2);
                y = player.y - offsetY + ctx.canvas.height / 2 + enemyRadius;
                break;
            case 3: // 왼쪽
                x = player.x - offsetX - ctx.canvas.width / 2 - enemyRadius;
                y = player.y - offsetY + (Math.random() * ctx.canvas.height - ctx.canvas.height / 2);
                break;
        }
        return {
            x: x,
            y: y,
            color: getRandomColor(),
            angle: Math.random() * Math.PI * 2, // 그냥 이동하는 적은 랜덤한 각도로 이동
            type: EnemyType.WANDERING // 적의 종류 지정
        };
    }

    
    // 적 생성 함수에 대한 맵핑
    const enemyCreationFunctions = {
        [EnemyType.CHASING]: createChasingEnemy,
        [EnemyType.WANDERING]: createWanderingEnemy
    };
    
    function createEnemy() {
        const enemyType = randomEnemyType();
        const createFunction = enemyCreationFunctions[enemyType];
        enemies.push(createFunction());
    }
    
    // 생성된 모든 적을 그린 후, 하트와의 충돌을 체크하여 충돌한 적은 삭제
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const dx = (player.x - offsetX) - enemy.x;
        const dy = (player.y - offsetY) - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        if (distance < player.radius + enemyRadius) {
            // 충돌 발생 시 플레이어 HP 감소
            player.hp -= 1;
            enemies.splice(i, 1);
            i--;
    
            // 플레이어가 죽으면 게임 오버
            if (player.hp <= 0) {
                gameOver();
                return; // 게임 루프 중지
            }
        } else {
            if (enemy.type === EnemyType.CHASING) {
                // 플레이어를 추격하는 적
                const angle = Math.atan2(dy, dx);
                enemy.x += Math.cos(angle) * chasingEnemySpeed * deltaTime;
                enemy.y += Math.sin(angle) * chasingEnemySpeed * deltaTime;
                enemy.angle = angle; // 추격 방향 저장
            } else if (enemy.type === EnemyType.WANDERING) {
                // 그냥 이동하는 적
                enemy.x += Math.cos(enemy.angle) * wanderingEnemySpeed * deltaTime;
                enemy.y += Math.sin(enemy.angle) * wanderingEnemySpeed * deltaTime;
    
                // 화면을 벗어나면 삭제
                if (enemy.x < -enemyRadius || enemy.x > ctx.canvas.width + enemyRadius ||
                    enemy.y < -enemyRadius || enemy.y > ctx.canvas.height + enemyRadius) {
                    enemies.splice(i, 1);
                    i--;
                }
            }
    
            // 적 그리기
            ctx.beginPath();
            ctx.arc(enemy.x + offsetX, enemy.y + offsetY, enemyRadius, 0, Math.PI * 2);
            ctx.fillStyle = enemy.color;
            ctx.fill();
            ctx.closePath();
        }
    }
    
    // 적을 생성
    if (currentTimeMillis - lastEnemySpawnTime > 1000 / numEnemiesPerSecond) {
        createEnemy();
        lastEnemySpawnTime = currentTimeMillis; // 마지막 적 생성 시간 업데이트
    }

    // Circle Collider를 사용하여 플레이어와 적, 플레이어와 별 간의 충돌을 감지
    // 플레이어와 별의 충돌 검사
    const dxStar = (player.x - offsetX) - starX;
    const dyStar = (player.y - offsetY) - starY;
    const distanceStar = Math.sqrt(dxStar * dxStar + dyStar * dyStar);

    // 별에 내접하도록 설정
    if (distanceStar < player.radius + starRadius) {
        starX = Math.random() * (ctx.canvas.width - 60) + 30;
        starY = Math.random() * (ctx.canvas.height - 60) + 30;
    }

    // 별 그리기
    drawStar(starX + offsetX, starY + offsetY, starRadius, starSpikes, starColor, starBorderColor);
    // 플레이어(하트) 그리기
    drawHeart(player.x, player.y, heartSize, heartColor, borderColor, rotationAngle);

    requestAnimationFrame(draw);
}

function gameOver() {
    const gameOverContainer = document.querySelector('.gameover-container');
    const canvas = document.getElementById("myCanvas");
    canvas.style.display = "none"; // 캔버스 숨김
    gameOverContainer.style.display = "flex"; // 게임오버 화면 표시
}