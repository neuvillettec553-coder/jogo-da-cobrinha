/* -------------------------------------------------
   script.js – Lógica completa do Jogo da Cobrinha
   Compatível com o index.html e style.css fornecidos
   ------------------------------------------------- */

/* -------------------- Configurações iniciais -------------------- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('score');

const FPS = 10;                 // Atualizações por segundo
const GRID_COUNT = 20;          // Número de células em cada eixo (20x20)
let cellSize;                   // Tamanho de cada célula em pixels (calculado dinamicamente)

let snake;                      // Array de segmentos {x, y}
let direction;                  // Direção atual {x, y}
let nextDirection;              // Direção que será aplicada no próximo tick
let food;                       // Posição da comida {x, y}
let score;                      // Pontuação atual
let gameLoopId;                 // ID do setInterval
let isRunning = false;          // Controle de estado

/* -------------------- Funções auxiliares -------------------- */

/**
 * Ajusta o tamanho do canvas de acordo com a viewport
 * e com o devicePixelRatio (para telas retina).
 */
function resizeCanvas() {
    // Tamanho em CSS já está definido pelo CSS (90vmin etc.)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr); // Escala o contexto para usar coordenadas CSS

    // Calcula o tamanho de cada célula (tamanho do canvas em CSS / GRID_COUNT)
    cellSize = Math.min(rect.width, rect.height) / GRID_COUNT;
}

/**
 * Gera uma posição aleatória para a comida que não coincida
 * com nenhum segmento da cobra.
 */
function placeFood() {
    let newPos;
    do {
        newPos = {
            x: Math.floor(Math.random() * GRID_COUNT),
            y: Math.floor(Math.random() * GRID_COUNT)
        };
    } while (snake.some(seg => seg.x === newPos.x && seg.y === newPos.y));
    food = newPos;
}

/**
 * Reinicia todas as variáveis do jogo.
 */
function initGame() {
    // Cobra começa no centro, com 3 segmentos
    const startX = Math.floor(GRID_COUNT / 2);
    const startY = Math.floor(GRID_COUNT / 2);
    snake = [
        { x: startX,     y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];
    direction = { x: 1, y: 0 };      // Começa indo para a direita
    nextDirection = direction;
    score = 0;
    scoreSpan.textContent = score;
    placeFood();
}

/**
 * Atualiza a lógica do jogo (movimento, colisões, pontuação).
 */
function update() {
    // Aplica a direção escolhida, evitando 180°
    if (Math.abs(nextDirection.x) !== Math.abs(direction.x) ||
        Math.abs(nextDirection.y) !== Math.abs(direction.y)) {
        direction = nextDirection;
    }

    // Calcula nova cabeça
    const newHead = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // Checa colisão com paredes
    if (
        newHead.x < 0 || newHead.x >= GRID_COUNT ||
        newHead.y < 0 || newHead.y >= GRID_COUNT
    ) {
        gameOver();
        return;
    }

    // Checa colisão consigo mesma
    if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        gameOver();
        return;
    }

    // Adiciona nova cabeça
    snake.unshift(newHead);

    // Verifica se comeu a comida
    if (newHead.x === food.x && newHead.y === food.y) {
        score++;
        scoreSpan.textContent = score;
        placeFood(); // gera nova comida
    } else {
        // Remove a cauda (movimento normal)
        snake.pop();
    }
}

/**
 * Desenha todo o estado atual no canvas.
 */
function draw() {
    // Limpa fundo
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha comida
    ctx.fillStyle = '#ff1744'; // vermelho vibrante
    ctx.fillRect(
        food.x * cellSize,
        food.y * cellSize,
        cellSize,
        cellSize
    );

    // Desenha cobra
    ctx.fillStyle = '#4caf50'; // verde
    snake.forEach((seg, index) => {
        // Cabeça um pouco mais clara
        if (index === 0) ctx.fillStyle = '#81c784';
        else ctx.fillStyle = '#4caf50';
        ctx.fillRect(
            seg.x * cellSize,
            seg.y * cellSize,
            cellSize,
            cellSize
        );
    });
}

/**
 * Loop principal: atualização + desenho.
 */
function loop() {
    update();
    draw();
}

/**
 * Inicia o intervalo que chama o loop a cada 1/FPS segundos.
 */
function startLoop() {
    if (gameLoopId) clearInterval(gameLoopId);
    gameLoopId = setInterval(loop, 1000 / FPS);
    isRunning = true;
}

/**
 * Para o jogo e exibe mensagem de fim.
 */
function gameOver() {
    clearInterval(gameLoopId);
    isRunning = false;
    // Pequeno delay para garantir que o último frame seja desenhado
    setTimeout(() => {
        alert(`Game Over!\nSua pontuação: ${score}\nClique OK para jogar novamente.`);
        restartGame();
    }, 100);
}

/**
 * Reinicia tudo (usado após Game Over ou redimensionamento).
 */
function restartGame() {
    initGame();
    startLoop();
}

/* -------------------- Controle por teclado -------------------- */
function handleKey(e) {
    if (!isRunning) return; // ignora se o loop ainda não iniciou

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            nextDirection = { x: 0, y: -1 };
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            nextDirection = { x: 0, y: 1 };
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            nextDirection = { x: -1, y: 0 };
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            nextDirection = { x: 1, y: 0 };
            e.preventDefault();
            break;
    }
}
window.addEventListener('keydown', handleKey);

/* -------------------- Controle por toque (swipe) -------------------- */
let touchStartX = null;
let touchStartY = null;

function handleTouchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}
function handleTouchEnd(e) {
    if (touchStartX === null || touchStartY === null) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    // Determina a direção dominante
    if (Math.abs(dx) > Math.abs(dy)) {
        // Movimento horizontal
        if (dx > 0) nextDirection = { x: 1, y: 0 };   // direita
        else nextDirection = { x: -1, y: 0 };          // esquerda
    } else {
        // Movimento vertical
        if (dy > 0) nextDirection = { x: 0, y: 1 };   // baixo
        else nextDirection = { x: 0, y: -1 };          // cima
    }

    // Reseta valores
    touchStartX = null;
    touchStartY = null;
}
canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
canvas.addEventListener('touchend', handleTouchEnd);

/* -------------------- Redimensionamento da tela -------------------- */
window.addEventListener('resize', () => {
    // Redimensiona canvas e reinicia o jogo para evitar bugs de coordenadas
    resizeCanvas();
    restartGame();
});

/* -------------------- Inicialização -------------------- */
function startGame() {
    resizeCanvas();   // Define tamanho correto antes de tudo
    initGame();
    startLoop();
}

// Inicia ao carregar a página
window.addEventListener('load', startGame);
