const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const bgm = new Audio('Robot_Sound.mp3');
bgm.loop = true;
bgm.volume = 0.4; // BGMの音量を少し下げる

const damageSE = new Audio('SE/undertale-damage-taken.mp3');
damageSE.volume = 0.8; // 効果音は少し大きめに

const parrySE = new Audio('SE/bone-undertale-sound-effect.mp3');
parrySE.volume = 0.8;

const parrySuccessSE = new Audio('SE/undertale-ding.mp3');
parrySuccessSE.volume = 0.8;

const crossAttackSE = new Audio('SE/undertale-slash-attack.mp3');
crossAttackSE.volume = 0.8;

// BGM autoplay workaround
window.addEventListener('keydown', () => {
    if (bgm.paused && gameState !== 'GAME_OVER' && gameState !== 'VICTORY') {
        bgm.play().catch(e => console.log(e));
    }
});

// UI Elements
const gameOverScreen = document.getElementById('game-over');
const endMessage = document.getElementById('game-over-text');
const statusText = document.getElementById('status-text');
const attackPrompt = document.getElementById('attack-prompt');
const monsterHpBar = document.getElementById('monster-hp-bar');
const playerHpBar = document.getElementById('player-hp-bar');
const playerHpText = document.getElementById('player-hp-text');
const warningMark = document.getElementById('warning-mark');
const blueWarningMark = document.getElementById('blue-warning-mark');

// Game constants
const MAX_PLAYER_HP = 92;
const MAX_MONSTER_HP = 300; // HP蠅怜刈・医・繧ｹ繝ｩ繝・す繝･蟇ｾ蠢懶ｼ・

        const ENEMY_TURN_DURATION = 10000;
        const I_FRAME_DURATION = 60;

// Game state
let gameState = 'START'; 
let playerHp = MAX_PLAYER_HP;
let monsterHp = MAX_MONSTER_HP;
let turnTimer = null;
let frameCount = 0;
let iFrames = 0;
let currentAttackType = 2; // 2縲・

        let turnCount = 0; // 菴輔ち繝ｼ繝ｳ逶ｮ縺・
// AoE Attack State (Pattern 3, 4, 5逕ｨ)
        let aoeState = 'NONE';
let aoeNumAttacks = 0;
let aoeAttacksDone = 0;
let aoeTimer = 0;
let flashFrames = 0;
let motionFrames = 0; 
let flashTriggerTimer = 0;

// Pattern 8 Timers
let p8SpawnTimer = 0;
let p8BeamTimer = 0;
let p8Phase = 1;
let p8BeamCount = 0;
let p8TunnelTimer = 0;
let p8GroundLandedTimer = 0;

// 繝舌ヨ繝ｫ繝懊ャ繧ｯ繧ｹ

        const box = {
    x: 300, // canvas.width / 2
    y: 200, // canvas.height / 2
    currentY: 200,
    targetY: 200,
    currentW: 400,
    currentH: 200,
    targetW: 400,
    targetH: 200
};

let subBoxes = [];

// Player (Heart)
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 10,
    speed: 3.5, 
    color: '#ff0000',
    dx: 0,
    dy: 0,
    vy: 0,
    gravity: 0.4,
    jumpForce: -9.5,
    isGrounded: false,
    isMoving: false,
    parryFrames: 0,
    parryCooldown: 0,
    shieldDir: 'UP',
    trail: [],
    shootTimer: 0,
    currentLine: 1,
    targetY: 0,
    angle: 0,
    moveCooldown: 0,
    isFlipped: false
};

let playerBullets = [];

let gravityDir = 1; // 1 = down, -1 = up

// Bullets and Shockwaves
let bullets = [];
let shockwaves = [];
let speedLines = [];
let currentP4Timeline = [];

let p10ZoneTimer = 0;
let p10ZonePattern = 0;
const p10ZoneCoords = [
    // 荳九↓蜷代°縺・Ξ繝ｼ繝ｳ (Col 10)
    {r:3, c:10}, {r:4, c:10}, {r:5, c:10}, {r:6, c:10}, {r:7, c:10}, {r:8, c:10},
    // 荳翫↓蜷代°縺・聞縺・Ξ繝ｼ繝ｳ (Col 12)
    {r:8, c:12}, {r:7, c:12}, {r:6, c:12}, {r:5, c:12}, {r:4, c:12}, {r:3, c:12}
];

// 繝代ち繝ｼ繝ｳ4 (逶ｾ) 縺ｮ蝗ｺ螳壹す繝ｼ繧ｱ繝ｳ繧ｹ (騾壼ｸｸ)
        const p4Timeline = [
    { f: 40,  t: 'BULLET', d: 'UP' },
    { f: 70,  t: 'BULLET', d: 'UP' },
    { f: 100, t: 'BULLET', d: 'DOWN' },
    { f: 130, t: 'BULLET', d: 'LEFT' },
    { f: 160, t: 'BULLET', d: 'RIGHT' },
    { f: 290, t: 'BULLET', d: 'UP' },
    { f: 310, t: 'BULLET', d: 'RIGHT' },
    { f: 330, t: 'BULLET', d: 'DOWN' },
    { f: 350, t: 'BULLET', d: 'LEFT' },
    { f: 490, t: 'BULLET', d: 'LEFT' },
    { f: 505, t: 'BULLET', d: 'RIGHT' },
    { f: 520, t: 'BULLET', d: 'LEFT' },
    { f: 535, t: 'BULLET', d: 'RIGHT' },
    { f: 560, t: 'BULLET', d: 'UP' }
];

// 繝代ち繝ｼ繝ｳ5 (逶ｾ) 縺ｮ豼縺励＞繧ｷ繝ｼ繧ｱ繝ｳ繧ｹ

        const p4Timeline2 = [
    { f: 20,  t: 'BULLET', d: 'UP' },
    { f: 40,  t: 'BULLET', d: 'UP' },
    { f: 60,  t: 'BULLET', d: 'DOWN' },
    { f: 80,  t: 'BULLET', d: 'DOWN' },
    { f: 100, t: 'BULLET', d: 'LEFT' },
    { f: 120, t: 'BULLET', d: 'RIGHT' },
    { f: 140, t: 'BULLET', d: 'LEFT' },
    { f: 160, t: 'BULLET', d: 'RIGHT' },
    { f: 210, t: 'BULLET', d: 'UP' },
    { f: 230, t: 'BULLET', d: 'UP' },
    { f: 260, t: 'BULLET', d: 'RIGHT' },
    { f: 280, t: 'BULLET', d: 'LEFT' },
    { f: 300, t: 'BULLET', d: 'DOWN' },
    { f: 320, t: 'BULLET', d: 'UP' },
    { f: 380, t: 'BULLET', d: 'LEFT' },
    { f: 400, t: 'BULLET', d: 'RIGHT' },
    { f: 420, t: 'BULLET', d: 'UP' },
    { f: 450, t: 'BULLET', d: 'DOWN' },
    { f: 470, t: 'BULLET', d: 'DOWN' },
    { f: 490, t: 'BULLET', d: 'LEFT' },
    { f: 510, t: 'BULLET', d: 'UP' },
    { f: 530, t: 'BULLET', d: 'RIGHT' },
    { f: 550, t: 'BULLET', d: 'LEFT' },
    { f: 570, t: 'BULLET', d: 'DOWN' }
];

// Key state
const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, a: false, s: false, d: false, Space: false
};

// Event listeners for keys
window.addEventListener('keydown', (e) => {
    // Prevent default scrolling for game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }

    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (e.code === 'Space') keys.Space = true;
    if (e.code === 'Space') {
        if (gameState === 'GAME_OVER' || gameState === 'VICTORY') {
            initGame();
        } else if (gameState === 'ENEMY_TURN' && (currentAttackType === 3 || currentAttackType === 4 || currentAttackType === 5)) {
            // 繝代ち繝ｼ繝ｳ3,4,5縺ｯ繝代Μ繧｣蜿ｯ閭ｽ

        if (player.parryCooldown <= 0) {
                parrySE.currentTime = 0;
                parrySE.play().catch(e => console.log("SE play failed:", e));
                player.parryFrames = 30;
                player.parryCooldown = 30;
                shockwaves.push({ x: player.x, y: player.y, radius: player.size, alpha: 1.0 });
            }
        } else if (gameState === 'ENEMY_TURN' && (currentAttackType === 6 || currentAttackType === 7)) {
            // 繧ｸ繝｣繝ｳ繝怜・逅・

        if (player.isGrounded) {
                player.vy = player.jumpForce * gravityDir;
                player.isGrounded = false;
            }
        }
    }
    if (e.code === 'Enter' && gameState === 'PLAYER_TURN') {
        performAttack();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    if (e.code === 'Space') keys.Space = false;
    
    // 繧ｸ繝｣繝ｳ繝励・鬮倥＆隱ｿ謨ｴ

        if (e.code === 'Space' && gameState === 'ENEMY_TURN' && (currentAttackType === 6 || currentAttackType === 7)) {
        if (gravityDir === 1 && player.vy < -3) {
            player.vy = -3;
        } else if (gravityDir === -1 && player.vy > 3) {
            player.vy = 3;
        }
    }
});

function performAttack() {
    // 謾ｻ謦・鴨繧定ｪｿ謨ｴ (20縲・0繝繝｡繝ｼ繧ｸ)
        const damage = Math.floor(Math.random() * 11) + 20;
    monsterHp -= damage;
    if (monsterHp < 0) monsterHp = 0;
    updateUI();
    if (monsterHp === 0) {
        setGameOver(true);
    } else {
        startEnemyTurn();
    }
}

function initGame() {
    bgm.currentTime = 0;
    bgm.play().catch(e => console.log("BGM play failed:", e));
    playerHp = MAX_PLAYER_HP;
    monsterHp = MAX_MONSTER_HP;
    turnCount = 0;
    
    // 繧ｲ繝ｼ繝�繧ｪ繝ｼ繝舌・譎ゅ・迥ｶ諷九Μ繧ｻ繝・ヨ

        gravityDir = 1;
    player.isFlipped = false;
    player.dx = 0;
    player.dy = 0;
    player.vy = 0;
    player.isGrounded = false;
    
    updateUI();
    gameOverScreen.classList.add('hidden');
    // 繧ｲ繝ｼ繝�縺ｯ繝励Ξ繧､繝､繝ｼ縺ｮ繧ｿ繝ｼ繝ｳ縺九ｉ髢句ｧ九☆繧・

        startPlayerTurn();
    requestAnimationFrame(gameLoop);
}

function startEnemyTurn() {
    gameState = 'ENEMY_TURN';
    bullets = [];
    shockwaves = [];
    speedLines = [];
    subBoxes = []; // 霑ｽ蜉�

    frameCount = 0;
    
    document.getElementById('monster-sprite').classList.add('combat-mode');
    if (attackPrompt) attackPrompt.classList.add('hidden');
    warningMark.classList.add('hidden');
    if (blueWarningMark) blueWarningMark.classList.add('hidden');
    
    turnCount++;
    
    // 蜀・Κ繝・・繧ｿ縺ｯ繝代ち繝ｼ繝ｳ2縺九ｉ蟋九∪縺｣縺ｦ縺・ｋ縺ｮ縺ｧ縲・縲・1繧偵Ν繝ｼ繝励☆繧・

        const patterns = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    currentAttackType = patterns[(turnCount - 1) % patterns.length];
    
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.shieldDir = 'UP';
    player.dx = 0;
    player.dy = 0;
    player.vy = 0;
    player.isGrounded = false;
    player.trail = [];
    gravityDir = 1; // 繧ｿ繝ｼ繝ｳ髢句ｧ区凾縺ｯ蠢・★荳矩㍾蜉・

        player.gravity = 0.4;
    player.jumpForce = -9.5;
    statusText.style.display = 'none';

    // 繝代ち繝ｼ繝ｳ縺斐→縺ｮ繝懊ャ繧ｯ繧ｹ繝ｻ繧ｫ繝ｩ繝ｼ險ｭ螳・

        if (currentAttackType === 2) {
        box.targetW = 200; box.targetH = 200;
        player.color = '#ff0000'; // 襍､

            } else if (currentAttackType === 3) {
        box.targetW = 200; box.targetH = 200;
        player.color = '#40e0d0'; // 繧ｿ繝ｼ繧ｳ繧､繧ｺ

            } else if (currentAttackType === 4 || currentAttackType === 5) {
        box.targetW = 100; box.targetH = 100;
        // 蜊翫・き繝ｩ繝ｼ縺ｯ謠冗判譎ゅ↓迚ｹ谿雁・逅・

            } else if (currentAttackType === 6 || currentAttackType === 7) {
        box.targetW = 500; box.targetH = 250; // 邂ｱ繧偵＆繧峨↓讓ｪ髟ｷ縺ｫ

        player.color = '#ff9900'; // 繧ｪ繝ｬ繝ｳ繧ｸ
        parrySuccessSE.currentTime = 0;
        parrySuccessSE.play().catch(e => console.log("SE play failed:", e));

            } else if (currentAttackType === 8) {
        box.targetW = 250; box.targetH = 450; // 邵ｦ髟ｷ

        player.color = '#0000ff'; // 髱・
        parrySuccessSE.currentTime = 0;
        parrySuccessSE.play().catch(e => console.log("SE play failed:", e));

        player.gravity = 0; // 辟｡驥榊鴨

        player.y = box.y - 100; // 蛻晄悄菴咲ｽｮ縺ｯ荳翫・譁ｹ

        p8SpawnTimer = 48;
        p8BeamTimer = 180; // 3遘・

        p8Phase = 1;
        p8BeamCount = 0;
        p8TunnelTimer = 0;
        p8GroundLandedTimer = 0;
    } else if (currentAttackType === 9 || currentAttackType === 10) {
        if (currentAttackType === 9) {
            box.targetW = 350; box.targetH = 250;
            player.currentLine = 1;
        } else {
            box.targetW = 550; box.targetH = 350;
            player.currentLine = 8;
        }
        player.angle = -90; // 蜿ｳ蜷代″

        player.targetY = box.y; 
        player.y = box.y;
        player.moveCooldown = 0;
        player.shootTimer = 0;
        player.isFlipped = false;
        
        if (currentAttackType === 10) {
            const lineSpacing = 35;
            const baseY = box.y - 4 * lineSpacing; 
            player.x = box.x - 275 + 12.5; // 蟾ｦ遶ｯ縺ｮ繝槭せ縺ｮ荳ｭ螟ｮ

        player.y = baseY + 8 * lineSpacing;
            player.targetY = player.y;
            
            const p10Map = [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1],
                [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0],
                [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 3, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 5, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            ];
            
            for (let r = 0; r < p10Map.length; r++) {
                for (let c = 0; c < p10Map[r].length; c++) {
                    const cell = p10Map[r][c];
                    if (cell === 1 || cell === 2 || cell === 3 || cell === 4 || cell === 5) {
                        const isBlock = (cell === 1 || cell === 3 || cell === 4 || cell === 5);
                        bullets.push({
                            x: box.x - 275 + 12.5 + c * 25,
                            y: baseY + r * lineSpacing,
                            w: isBlock ? 25 : 20,
                            h: isBlock ? 35 : 20,
                            dx: 0, dy: cell === 2 ? -18 : 0, // 雜・ｫ倬溘〒荳贋ｸ九☆繧・
                            isDestructible: cell === 2,
                            isSolidBlock: isBlock,
                            isBone: false,
                            color: isBlock ? '#ffffff' : '#ff0000',
                            isSpawner: (cell === 3 || cell === 4 || cell === 5),
                            spawnDx: cell === 3 ? -3 : (cell === 4 ? 3 : 0),
                            spawnDy: cell === 5 ? -3 : 0,
                            spawnInterval: cell === 4 ? 48 : (cell === 5 ? 48 : 60),
                            spawnTimer: 0,
                            isBouncing: cell === 2
                        });
                    }
                }
            }
            
            p10ZoneTimer = 0;
            p10ZonePattern = 0;
            for (let i = 0; i < p10ZoneCoords.length; i++) {
                if (i % 2 === 0) {
                    const coord = p10ZoneCoords[i];
                    bullets.push({
                        x: box.x - 275 + 12.5 + coord.c * 25,
                        y: baseY + coord.r * lineSpacing,
                        w: 20, h: 20,
                        dx: 0, dy: 0,
                        isDestructible: true,
                        isSolidBlock: false,
                        isBone: false,
                        color: '#ff0000',
                        isZoneBullet: true
                    });
                }
            }

            // 繧ｴ繝ｼ繝ｫ

        bullets.push({
                x: box.x - 275 + 12.5 + 21 * 25,
                y: baseY + 3 * lineSpacing,
                w: 25,
                h: 35,
                dx: 0, dy: 0,
                isGoal: true,
                color: '#00ff00'
            });
        } else {
            p9Timer = 0;
            p9WaveCount = 0;
            p9Phase = 1;
        }
    } else if (currentAttackType === 11) {
        box.targetW = 450; box.targetH = 250; // 蠎・￡繧・

        player.color = '#ff0000'; // 襍､繝上・繝・

        p11Timer = 0;
    }

    aoeState = 'NONE';
    flashTriggerTimer = Math.floor(Math.random() * 100) + 60;

    let turnDuration = ENEMY_TURN_DURATION;
    if (currentAttackType === 6 || currentAttackType === 7) {
        turnDuration = 12000; // 12遘・

            } else if (currentAttackType === 8) {
        turnDuration = 999999; // 辟｡蛻ｶ髯撰ｼ育捩蝨ｰ縺励※謇句虚縺ｧ邨ゅｏ繧峨○繧具ｼ・

            } else if (currentAttackType === 9 || currentAttackType === 10 || currentAttackType === 11) {
        turnDuration = 999999; // 邨ゅｏ繧九∪縺ｧ謇句虚邂｡逅・

            }
        clearTimeout(turnTimer);
    turnTimer = setTimeout(() => {
        if (gameState === 'ENEMY_TURN') {
            startPlayerTurn();
        }
    }, turnDuration);
}

function startPlayerTurn() {
    gameState = 'PLAYER_TURN';
    document.getElementById('monster-sprite').classList.remove('attacking');
    document.getElementById('monster-sprite').classList.remove('attacking-windup');
    document.getElementById('monster-sprite').classList.remove('gravity-strike');
    
    box.targetW = 400; // 蜈・・繧ｵ繧､繧ｺ

        box.targetH = 250;
    box.targetY = canvas.height / 2; // 蜈・・菴咲ｽｮ

        player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.angle = 0;
    player.isFlipped = false; // 謾ｻ謦・ｵゆｺ・ｾ後・迥ｶ諷九Μ繧ｻ繝・ヨ

        gravityDir = 1; // 謾ｻ謦・ｵゆｺ・ｾ後・驥榊鴨繝ｪ繧ｻ繝・ヨ

    bullets = [];
    shockwaves = [];
    speedLines = [];
    playerBullets = [];
    subBoxes = []; // 霑ｽ蜉�: 蝗幄ｧ偵・蛻・｣ゅｒ螳悟・縺ｫ隗｣髯､縺吶ｋ

    aoeState = 'NONE';
    warningMark.classList.add('hidden');
    if (attackPrompt) attackPrompt.classList.remove('hidden');
    
    player.color = '#ff0000';
    
    document.getElementById('monster-sprite').classList.remove('combat-mode');
    statusText.style.left = (canvas.width / 2 - 180) + 'px';
    statusText.style.top = (canvas.height / 2 - 100) + 'px';
    statusText.innerText = "* あなたの ターン だ。";
    statusText.style.display = 'block';
}

function setGameOver(isVictory) {
    bgm.pause();
    bgm.currentTime = 0;
    gameState = isVictory ? 'VICTORY' : 'GAME_OVER';
    clearTimeout(turnTimer);
    bullets = [];
    shockwaves = [];
    speedLines = [];
    warningMark.classList.add('hidden');
    endMessage.innerText = isVictory ? 'YOU WON!' : 'GAME OVER';
    endMessage.style.color = isVictory ? '#00ff00' : '#ff0000';
    gameOverScreen.classList.remove('hidden');
    if (attackPrompt) attackPrompt.classList.add('hidden');
}

function updateUI() {
    const pPercent = (playerHp / MAX_PLAYER_HP) * 100;
    playerHpBar.style.width = `${pPercent}%`;
    playerHpText.innerText = `${playerHp} / ${MAX_PLAYER_HP}`;
    
    const mPercent = (monsterHp / MAX_MONSTER_HP) * 100;
    monsterHpBar.style.width = `${mPercent}%`;
}

function updateBox() {
    box.currentW += (box.targetW - box.currentW) * 0.1;
    box.currentH += (box.targetH - box.currentH) * 0.1;
    box.currentY += (box.targetY - box.currentY) * 0.1;
    box.y = box.currentY;
}

function drawBox() {
    if (flashFrames > 0) {
        ctx.fillStyle = '#fff';
        if (subBoxes.length > 0) {
            for (const sb of subBoxes) {
                ctx.fillRect(sb.x - sb.w / 2, sb.y - sb.h / 2, sb.w, sb.h);
            }
        } else {
            ctx.fillRect(box.x - box.currentW / 2, box.y - box.currentH / 2, box.currentW, box.currentH);
        }
    } else {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        
        if (subBoxes.length > 0) {
            // 螟匁棧繧呈緒逕ｻ (螟ｪ縺・)
        ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const sb = subBoxes[i];
                const left = sb.x - sb.w / 2;
                const right = sb.x + sb.w / 2;
                const top = sb.y - sb.h / 2;
                const bottom = sb.y + sb.h / 2;
                // 菴呵ｨ医↑逶ｴ邱壹ｒ蠑輔°縺ｪ縺・ｈ縺・↓縲∝推蝗幄ｧ偵・縲悟､匁棧縺ｫ縺ゅ◆繧・霎ｺ縺�縺代阪ｒ謠冗判縺吶ｋ

        if (i === 0) { ctx.moveTo(right, top); ctx.lineTo(left, top); ctx.lineTo(left, bottom); } // 蟾ｦ荳・ 荳願ｾｺ縺ｨ蟾ｦ霎ｺ

        if (i === 1) { ctx.moveTo(left, top); ctx.lineTo(right, top); ctx.lineTo(right, bottom); } // 蜿ｳ荳・ 荳願ｾｺ縺ｨ蜿ｳ霎ｺ

        if (i === 2) { ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.lineTo(right, bottom); } // 蟾ｦ荳・ 蟾ｦ霎ｺ縺ｨ蠎戊ｾｺ

        if (i === 3) { ctx.moveTo(right, top); ctx.lineTo(right, bottom); ctx.lineTo(left, bottom); } // 蜿ｳ荳・ 蜿ｳ霎ｺ縺ｨ蠎戊ｾｺ

            }
            ctx.stroke();

            // 蜀・・縺ｮ繧ｮ繧ｶ繧ｮ繧ｶ繧呈緒逕ｻ (螟ｪ縺・.5縺ｫ邏ｰ縺上☆繧・

        ctx.lineWidth = 1.5;
            ctx.beginPath();
            const drawJagged = (x1, y1, x2, y2) => {
                const segments = 9;
                const dx = (x2 - x1) / segments;
                const dy = (y2 - y1) / segments;
                const len = Math.hypot(x2 - x1, y2 - y1);
                if (len === 0) return;
                
                const nx = -(y2 - y1) / len;
                const ny = (x2 - x1) / len;
                
                ctx.moveTo(x1, y1);
                for (let i = 1; i <= segments; i++) {
                    let px = x1 + dx * i;
                    let py = y1 + dy * i;
                    if (i < segments) {
                        const offset = (i % 2 === 0 ? 1 : -1) * 5; // 5px縺ｮ繧ｮ繧ｶ繧ｮ繧ｶ

                        px += nx * offset;
                        py += ny * offset;
                    }
                    ctx.lineTo(px, py);
                }
            };

            for (let i = 0; i < 4; i++) {
                const sb = subBoxes[i];
                const left = sb.x - sb.w / 2;
                const right = sb.x + sb.w / 2;
                const top = sb.y - sb.h / 2;
                const bottom = sb.y + sb.h / 2;
                
                if (i === 0) { // 蟾ｦ荳・

                    drawJagged(right, bottom, right, top);
                    drawJagged(right, bottom, left, bottom);
                } else if (i === 1) { // 蜿ｳ荳・

                    drawJagged(left, bottom, left, top);
                    drawJagged(left, bottom, right, bottom);
                } else if (i === 2) { // 蟾ｦ荳・

                    drawJagged(right, top, right, bottom);
                    drawJagged(right, top, left, top);
                } else if (i === 3) { // 蜿ｳ荳・

                    drawJagged(left, top, left, bottom);
                    drawJagged(left, top, right, top);
                }
            }
            ctx.stroke();
        } else {
            ctx.strokeRect(box.x - box.currentW / 2, box.y - box.currentH / 2, box.currentW, box.currentH);
        }
        
        if (gameState === 'ENEMY_TURN' && (currentAttackType === 9 || currentAttackType === 10)) {
            const numLines = currentAttackType === 10 ? 9 : 3;
            const lineSpacing = currentAttackType === 10 ? 35 : 45;
            const baseY = currentAttackType === 10 ? box.y - 4 * lineSpacing : box.y - lineSpacing;
            ctx.strokeStyle = '#800080'; // 邏ｫ濶ｲ

        ctx.lineWidth = 2;
            for (let i = 0; i < numLines; i++) {
                const lineY = baseY + i * lineSpacing;
                ctx.beginPath();
                ctx.moveTo(box.x - box.currentW / 2, lineY);
                ctx.lineTo(box.x + box.currentW / 2, lineY);
                ctx.stroke();
            }
        }
    }
    
    // 繝代ち繝ｼ繝ｳ8逕ｨ關ｽ荳九お繝輔ぉ繧ｯ繝茨ｼ医せ繝斐・繝臥ｷ夲ｼ・

        if (currentAttackType === 8) {
        let spawnRate = 0.4;
        let baseSpeed = 15;
        if (p8Phase >= 3) {
            spawnRate = 0.8; // 關ｽ荳区凾縺ｯ繧ｨ繝輔ぉ繧ｯ繝域ｿ縺励￥

            baseSpeed = 25;  // 騾溷ｺｦ繧る溘￥

            }
        
        if (Math.random() < spawnRate) {
            speedLines.push({
                x: box.x - box.currentW / 2 + Math.random() * box.currentW,
                y: canvas.height + 10, // 逕ｻ髱｢縺ｮ縺ｯ繧九°荳九°繧臥匱逕・

                len: Math.random() * 80 + 30,
        speed: Math.random() * 8 + baseSpeed // 鬮倬溘〒荳翫↓豬√ｌ繧・

            });
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = speedLines.length - 1; i >= 0; i--) {
            const line = speedLines[i];
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(line.x, line.y + line.len);
            line.y -= line.speed;
            // 邂ｱ縺ｮ荳翫↓縺ｯ縺ｿ蜃ｺ縺溘ｉ蜑企勁

        if (line.y + line.len < box.y - box.currentH / 2) {
                speedLines.splice(i, 1);
            }
        }
        ctx.stroke();
    }
}

function takeDamage() {
    if (iFrames <= 0) {
        damageSE.currentTime = 0;
        damageSE.play().catch(e => console.log("SE play failed:", e));
        
        playerHp -= 4;
        if (playerHp < 0) playerHp = 0;
        iFrames = I_FRAME_DURATION;
        updateUI();
        if (playerHp === 0) setGameOver(false);
    }
}

function updatePlayer() {
    if (gameState !== 'ENEMY_TURN') return;

    if (currentAttackType === 2 || currentAttackType === 3 || currentAttackType === 11) {
        // 騾壼ｸｸ遘ｻ蜍・

        player.dx = 0; player.dy = 0;
        if (keys.ArrowLeft || keys.a) player.dx = -player.speed;
        if (keys.ArrowRight || keys.d) player.dx = player.speed;
        if (keys.ArrowUp || keys.w) player.dy = -player.speed;
        if (keys.ArrowDown || keys.s) player.dy = player.speed;
        player.x += player.dx; player.y += player.dy;
        player.isMoving = (player.dx !== 0 || player.dy !== 0);

        let boundW = box.currentW;
        let boundH = box.currentH;
        if (subBoxes.length > 0) {
            boundW -= 40;
            boundH -= 40;
        }
        const leftBound = box.x - boundW / 2 + player.size;
        const rightBound = box.x + boundW / 2 - player.size;
        const topBound = box.y - boundH / 2 + player.size;
        const bottomBound = box.y + boundH / 2 - player.size;

        if (player.x < leftBound) player.x = leftBound;
        if (player.x > rightBound) player.x = rightBound;
        if (player.y < topBound) player.y = topBound;
        if (player.y > bottomBound) player.y = bottomBound;

    } else if (currentAttackType === 4 || currentAttackType === 5) {
        // 繝代ち繝ｼ繝ｳ4/5 (逶ｾ)
        player.x = box.x;
        player.y = box.y;
        if (keys.ArrowUp || keys.w) player.shieldDir = 'UP';
        else if (keys.ArrowDown || keys.s) player.shieldDir = 'DOWN';
        else if (keys.ArrowLeft || keys.a) player.shieldDir = 'LEFT';
        else if (keys.ArrowRight || keys.d) player.shieldDir = 'RIGHT';
        
    } else if (currentAttackType === 6 || currentAttackType === 7) {
        // 谿句ワ縺ｮ霑ｽ蜉�

        player.trail.push({x: player.x, y: player.y, alpha: 0.6});
        if (player.trail.length > 8) {
            player.trail.shift();
        }
        for (let i = 0; i < player.trail.length; i++) {
            player.trail[i].alpha -= 0.08;
        }

        // 繝代ち繝ｼ繝ｳ6,7 (驥榊鴨)
        player.vy += player.gravity * gravityDir;
        player.y += player.vy;
        
        // 繧ｪ繝ｼ繝医Λ繝ｳ・医・繝ｼ繝ｫ繝画桃菴懶ｼ・

        if (keys.ArrowLeft || keys.a) player.dx = -player.speed;
        if (keys.ArrowRight || keys.d) player.dx = player.speed;
        player.x += player.dx;
        
        // 蠅・阜蛻､螳・

        const leftBound = box.x - box.currentW / 2 + player.size;
        const rightBound = box.x + box.currentW / 2 - player.size;
        const topBound = box.y - box.currentH / 2 + player.size;
        const bottomBound = box.y + box.currentH / 2 - player.size;
        
        // 蟾ｦ縺ｮ鬪ｨ縺ｮ螢∝愛螳・(蟷・5px)
        const leftBoneWall = box.x - box.currentW / 2 + 25;
        if (player.x - player.size < leftBoneWall) {
            takeDamage();
            player.x = leftBoneWall + player.size;
        } else if (player.x > rightBound) {
            player.x = rightBound;
        }
        
        // 逹蝨ｰ繝ｻ螟ｩ莠募愛螳・

        if (gravityDir === 1) {
            if (player.y > bottomBound) {
                player.y = bottomBound;
                player.vy = 0;
                if (!player.isGrounded && player.dx === 0) {
                    player.dx = (Math.random() < 0.5 ? 1 : -1) * player.speed;
                }
                player.isGrounded = true;
            } else {
                player.isGrounded = false;
            }
            if (player.y < topBound) {
                player.y = topBound;
                player.vy = 0;
            }
        } else {
            // 蜿崎ｻ｢譎・(螟ｩ莠輔′蠎翫↓縺ｪ繧・

        if (player.y < topBound) {
                player.y = topBound;
                player.vy = 0;
                if (!player.isGrounded && player.dx === 0) {
                    player.dx = (Math.random() < 0.5 ? 1 : -1) * player.speed;
                }
                player.isGrounded = true;
            } else {
                player.isGrounded = false;
            }
            if (player.y > bottomBound) {
                player.y = bottomBound;
                player.vy = 0;
            }
        }
    } else if (currentAttackType === 8) {
        if (player.color === '#ff9900') {
            // 繧ｪ繝ｬ繝ｳ繧ｸ迥ｶ諷具ｼ磯㍾蜉幄誠荳九√ず繝｣繝ｳ繝嶺ｸ榊庄縲∝虚縺咲ｶ壹￠繧具ｼ・

        player.gravity = 0.1; // 繧医ｊ繧・ｋ繧・°縺ｫ蜉�騾・
            
            // 蛻晄悄縺ｮ蜍輔″・域ｭ｢縺ｾ縺｣縺ｦ縺・◆繧峨Λ繝ｳ繝繝�縺ｪ譁ｹ蜷代↓蜍輔″蜃ｺ縺呻ｼ・

        if (player.dx === 0) {
                player.dx = (Math.random() < 0.5 ? 1 : -1) * player.speed;
            }
            
            if (keys.ArrowLeft || keys.a) player.dx = -player.speed;
            if (keys.ArrowRight || keys.d) player.dx = player.speed;
            player.x += player.dx;
            
            player.vy += player.gravity;
            if (player.vy > 3) player.vy = 3; // 關ｽ荳矩溷ｺｦ縺ｮ荳企剞繧貞ｰ上＆縺上＠縺ｦ繧・▲縺上ｊ關ｽ縺｡繧九ｈ縺・↓

        player.y += player.vy;
            
            // 蝨ｰ髱｢縺ｮ鬮倥＆縺ｯ蟶ｸ縺ｫ譫�縺ｮ荳狗ｫｯ

        let groundY = box.y + box.currentH / 2;
            
            const bottomBound = groundY - player.size;
            if (player.y > bottomBound) {
                player.y = bottomBound;
                player.vy = 0;
                
                // 繝輔ぉ繝ｼ繧ｺ5莉･髯阪↓縺ｮ縺ｿ邨ゆｺ・愛螳壹ｒ蜈･繧後ｋ

        if (p8Phase >= 5) {
                    p8GroundLandedTimer++;
                    if (p8GroundLandedTimer >= 60) {
                        clearTimeout(turnTimer);
                        startPlayerTurn();
                    }
                }
            }
        } else {
            // 縺薙ｌ縺ｾ縺ｧ縺ｮ繝繧､繝匁桃菴・

        player.dx = 0;
            if (keys.ArrowLeft || keys.a) player.dx = -player.speed;
            if (keys.ArrowRight || keys.d) player.dx = player.speed;
            player.x += player.dx;
            
            // 繝繧､繝悶→閾ｪ蜍墓ｵｮ荳・

        const topY = box.y - 100;
            const bottomY = box.y + 100;
            
            if (keys.ArrowDown || keys.s) {
                player.y += 4; // 荳九↓繝繧､繝・

        if (player.y > bottomY) player.y = bottomY;
            } else {
                player.y -= 2; // 繧・▲縺上ｊ謌ｻ繧・

        if (player.y < topY) player.y = topY;
            }
        }

        // 蠅・阜蛻､螳・

        const leftBound = box.x - box.currentW / 2 + player.size;
        const rightBound = box.x + box.currentW / 2 - player.size;
        
        if (player.x < leftBound) player.x = leftBound;
        if (player.x > rightBound) player.x = rightBound;
    } else if (currentAttackType === 9 || currentAttackType === 10) {
        // 繝代ち繝ｼ繝ｳ9/10: 繧､繧ｨ繝ｭ繝ｼ・・ヱ繝ｼ繝励Ν

        
        // 1. 繝代・繝励Ν繝上・繝医・謖吝虚 (繝ｩ繧､繝ｳ遘ｻ蜍・

        if (player.moveCooldown > 0) player.moveCooldown--;

        const isWallAt = (px, lineIndex) => {
            if (currentAttackType !== 10) return false;
            const lSpacing = 35;
            const bY = box.y - 4 * lSpacing;
            const py = bY + (lineIndex * lSpacing);
            for (const b of bullets) {
                if (b.isSolidBlock) {
                    if (Math.abs(px - b.x) < (player.size + b.w/2) && 
                        Math.abs(py - b.y) < (player.size + b.h/2)) {
                        return true;
                    }
                }
            }
            return false;
        };

        const maxLines = currentAttackType === 10 ? 8 : 2;
        if (player.moveCooldown === 0) {
            if ((keys.ArrowUp || keys.w) && player.currentLine > 0) {
                if (!isWallAt(player.x, player.currentLine - 1)) {
                    player.currentLine--;
                    player.moveCooldown = 12;
                }
            } else if ((keys.ArrowDown || keys.s) && player.currentLine < maxLines) {
                if (!isWallAt(player.x, player.currentLine + 1)) {
                    player.currentLine++;
                    player.moveCooldown = 12;
                }
            }
        }
        
        const lineSpacing = currentAttackType === 10 ? 35 : 45;
        const baseY = currentAttackType === 10 ? box.y - 4 * lineSpacing : box.y - lineSpacing; 
        player.targetY = baseY + (player.currentLine * lineSpacing);
        player.y += (player.targetY - player.y) * 0.4;
        
        let proposedX = player.x;
        if (keys.ArrowLeft || keys.a) proposedX -= player.speed * 0.5;
        if (keys.ArrowRight || keys.d) proposedX += player.speed * 0.5;

        let hitWallX = false;
        if (currentAttackType === 10) {
            for (const b of bullets) {
                if (b.isSolidBlock) {
                    if (Math.abs(proposedX - b.x) < (player.size + b.w/2) && 
                        Math.abs(player.targetY - b.y) < (player.size + b.h/2)) {
                        hitWallX = true;
                        break;
                    }
                }
            }
        }

        if (!hitWallX) {
            // Box boundaries
            const boundW = currentAttackType === 10 ? box.targetW : box.currentW;
            const leftBound = box.x - boundW / 2 + player.size;
            const rightBound = box.x + boundW / 2 - player.size;
            if (proposedX < leftBound) proposedX = leftBound;
            if (proposedX > rightBound) proposedX = rightBound;
            player.x = proposedX;
        }
        
        if (player.shootTimer > 0) player.shootTimer--;
        
        if (keys.Space && player.shootTimer === 0) {
            playerBullets.push({
                x: player.isFlipped ? player.x - player.size : player.x + player.size,
                y: player.y,
                w: 12,
                h: 6,
                dx: player.isFlipped ? -8 : 8,
                dy: 0,
                color: '#ffff00' // 鮟・牡縺ｮ蠑ｾ

            });
            player.shootTimer = 25; // 騾｣蟆・溷ｺｦ繧帝≦縺・(10 -> 25)
            }
    }
    
    if (iFrames > 0) iFrames--;
    if (player.parryFrames > 0) player.parryFrames--;
    if (player.parryCooldown > 0) player.parryCooldown--;
}

function drawPlayerShape(px, py) {
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(1, gravityDir); // 驥榊鴨蜿崎ｻ｢譎ゅ・Y霆ｸ繧貞渚霆｢

        if (player.angle !== 0) {
        ctx.rotate(player.angle * Math.PI / 180);
    }
    
    ctx.beginPath();
    const topCurveHeight = player.size * 0.3;
    ctx.moveTo(0, topCurveHeight);
    ctx.bezierCurveTo(
        -player.size / 2, -player.size / 2, 
        -player.size, player.size / 3, 
        0, player.size
    );
    ctx.bezierCurveTo(
        player.size, player.size / 3, 
        player.size / 2, -player.size / 2, 
        0, topCurveHeight
    );
    ctx.fill();
    ctx.closePath();
    
    ctx.restore();
}

function drawPlayer() {
    if (iFrames > 0 && Math.floor(iFrames / 5) % 2 === 0) return;
    
    const renderPlayerInner = () => {
        if (gameState === 'ENEMY_TURN' && (currentAttackType === 6 || currentAttackType === 7)) {
            // 谿句ワ縺ｮ謠冗判

            for (const t of player.trail) {
                if (t.alpha > 0) {
                    ctx.fillStyle = `rgba(255, 153, 0, ${t.alpha})`;
                    drawPlayerShape(t.x, t.y);
                }
            }
        }
        
        if (gameState === 'ENEMY_TURN' && (currentAttackType === 4 || currentAttackType === 5)) {
            // 蜊雁・繧ｿ繝ｼ繧ｳ繧､繧ｺ縲∝濠蛻・げ繝ｪ繝ｼ繝ｳ縺ｮ謠冗判

        ctx.save();
            ctx.beginPath(); ctx.rect(player.x - 20, player.y - 20, 20, 40); ctx.clip();
            ctx.fillStyle = player.parryFrames > 0 ? '#ffffff' : '#40e0d0';
            drawPlayerShape(player.x, player.y);
            ctx.restore();
            
            ctx.save();
            ctx.beginPath(); ctx.rect(player.x, player.y - 20, 20, 40); ctx.clip();
            ctx.fillStyle = player.parryFrames > 0 ? '#ffffff' : '#00ff00';
            drawPlayerShape(player.x, player.y);
            ctx.restore();
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(player.x, player.y + player.size * 0.3); 
            ctx.lineTo(player.x, player.y + player.size);       
            ctx.stroke();
            
            ctx.strokeStyle = '#00ff00'; 
            ctx.lineWidth = 4;
            ctx.beginPath();
            let startAngle, endAngle;
            const shieldDist = 20;
            if (player.shieldDir === 'UP') { startAngle = Math.PI * 1.25; endAngle = Math.PI * 1.75; }
            else if (player.shieldDir === 'DOWN') { startAngle = Math.PI * 0.25; endAngle = Math.PI * 0.75; }
            else if (player.shieldDir === 'LEFT') { startAngle = Math.PI * 0.75; endAngle = Math.PI * 1.25; }
            else if (player.shieldDir === 'RIGHT') { startAngle = Math.PI * 1.75; endAngle = Math.PI * 2.25; }
            ctx.arc(player.x, player.y, shieldDist, startAngle, endAngle);
            ctx.stroke();
            
        } else if (gameState === 'ENEMY_TURN' && (currentAttackType === 9 || currentAttackType === 10)) {
            // 繝代ち繝ｼ繝ｳ9/10: 蜊雁・繧､繧ｨ繝ｭ繝ｼ縲∝濠蛻・ヱ繝ｼ繝励Ν (讓ｪ蜑ｲ繧翫・90蠎ｦ蝗櫁ｻ｢縺輔ｌ縺ｦ縺・ｋ縺溘ａ)
        ctx.save();
            ctx.beginPath(); ctx.rect(player.x - 20, player.y - 20, 40, 20); ctx.clip();
            ctx.fillStyle = '#ffff00'; // 荳雁濠蛻・

            drawPlayerShape(player.x,
        player.y);
            ctx.restore();
            
            ctx.save();
            ctx.beginPath(); ctx.rect(player.x - 20, player.y, 40, 20); ctx.clip();
            ctx.fillStyle = '#800080'; // 荳句濠蛻・

            drawPlayerShape(player.x,
        player.y);
            ctx.restore();
            
            // 蛻・牡邱・

        ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(player.x - player.size, player.y); 
            ctx.lineTo(player.x + player.size * 0.3, player.y);       
            ctx.stroke();
        } else {
            // 騾壼ｸｸ縺ｮ謠冗判 (襍､, 繧ｿ繝ｼ繧ｳ繧､繧ｺ, 繧ｪ繝ｬ繝ｳ繧ｸ遲・

        ctx.fillStyle = (player.parryFrames > 0 && currentAttackType === 3) ? '#ffffff' : player.color;
            drawPlayerShape(player.x, player.y);
        }
    };

    if (subBoxes.length > 0) {
        let boundW = box.currentW - 40;
        let boundH = box.currentH - 40;
        const offsets = subBoxes.map((sb, i) => {
            let cx = box.x + (i % 2 === 0 ? -boundW/4 : boundW/4); // 0,2縺ｯ蟾ｦ, 1,3縺ｯ蜿ｳ

        let cy = box.y + (i < 2 ? -boundH/4 : boundH/4); // 0,1縺ｯ荳・ 2,3縺ｯ荳・

            return { dx: sb.x - cx, dy: sb.y - cy, sb: sb };
        });
        
        for (const off of offsets) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(off.sb.x - off.sb.w/2, off.sb.y - off.sb.h/2, off.sb.w, off.sb.h);
            ctx.clip();
            ctx.translate(off.dx, off.dy);
            renderPlayerInner();
            ctx.restore();
        }
    } else {
        renderPlayerInner();
    }
}

function drawShockwaves() {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        ctx.strokeStyle = `rgba(64, 224, 208, ${sw.alpha})`; 
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
        
        sw.radius += 3;
        sw.alpha -= 0.05;
        if (sw.alpha <= 0) {
            shockwaves.splice(i, 1);
        }
    }
}

// ==================== 謾ｻ謦・ｮ｡逅・ｳｻ ====================

// 繝代ち繝ｼ繝ｳ2: 髱偵・繧ｪ繝ｬ繝ｳ繧ｸ縺ｮ蜀・憾謾ｻ謦・
function manageAttackPattern2() {
    const attackInterval = 54;
    if (frameCount % attackInterval === 0) {
        // 縺溘∪縺ｫ・・0%縺ｮ遒ｺ邇・〒・牙屓霆｢縺吶ｋ

        let aSpeed = 0;
        if (Math.random() < 0.4) {
            const aSpeedOpts = [0.01, 0.02, 0.03]; // 蜈・・驕・＞縲∵勸騾壹∵掠縺・

        const dir = Math.random() < 0.5 ? 1 : -1;
            aSpeed = aSpeedOpts[Math.floor(Math.random() * aSpeedOpts.length)] * dir;
        }
        
        const rSpeed = 3;
        const numBullets = 36;
        
        // 繧ｪ繝ｬ繝ｳ繧ｸ繧偵碁｣邯壹〒縲・縺､縺ｫ縺吶ｋ

        const orangeStart = Math.floor(Math.random() * numBullets);
        
        for (let i = 0; i < numBullets; i++) {
            const angle = (Math.PI * 2 / numBullets) * i;
            
            // 騾｣邯・蛟九・蛻､螳・

        let isOrange = false;
            for (let j = 0; j < 5; j++) {
                if ((orangeStart + j) % numBullets === i) {
                    isOrange = true;
                    break;
                }
            }
            
            const color = isOrange ? '#ff9900' : '#00ccff';
            bullets.push({
                radius: 400, // 螟ｧ縺阪↑蜊雁ｾ・°繧峨せ繧ｿ繝ｼ繝医＆縺帙※縲∝・縺ｫ隕九∴繧九ｈ縺・↓縺吶ｋ

                angle: angle,
                radialSpeed: rSpeed,
                angularSpeed: aSpeed,
                centerX: box.x,
                centerY: box.y,
                size: 8,
                color: color,
                usePolar: true
            });
        }
    }
}

// 蜈ｨ菴薙ヵ繝ｩ繝・す繝･謾ｻ謦・ｼ医ヱ繧ｿ繝ｼ繝ｳ3, 4, 5縺ｧ蜈ｱ騾壼茜逕ｨ・・
function manageAoEFlash() {
    if (aoeState === 'NONE') {
        if (flashTriggerTimer > 0) flashTriggerTimer--;
        if (flashTriggerTimer <= 0) {
            startAoESequence(); 
        }
    } else if (aoeState === 'WARN') {
        aoeTimer--;
        if (aoeTimer <= 0) {
            warningMark.classList.add('hidden');
            triggerAoEFlash();
        }
    } else if (aoeState === 'WAIT') {
        aoeTimer--;
        if (aoeTimer <= 0) {
            triggerAoEFlash();
        }
    } else if (aoeState === 'DONE') {
          aoeState = 'NONE';
        flashTriggerTimer = Math.floor(Math.random() * 120) + 60; // 1縲・遘貞ｾ・

            }
        if (flashFrames > 0) flashFrames--;
    if (motionFrames > 0) {
        motionFrames--;
        if (motionFrames <= 0) {
            document.getElementById('monster-sprite').classList.remove('attacking');
            if (aoeState === 'WAIT') {

            }
        }
    }
}

function startAoESequence(numAttacks) {
    if (numAttacks !== undefined) {
        aoeNumAttacks = numAttacks;
    } else {
        const r = Math.random();
        if (r < 0.6) aoeNumAttacks = 1;
        else if (r < 0.9) aoeNumAttacks = 2;
        else aoeNumAttacks = 3;
    }
    
    aoeAttacksDone = 0;
    warningMark.innerText = '!'.repeat(aoeNumAttacks);
    warningMark.classList.remove('hidden');
    document.getElementById('monster-sprite').classList.add('attacking-windup');

    
    aoeState = 'WARN';
    aoeTimer = 30; // 0.5遘・

            }

function triggerAoEFlash() {
    flashFrames = 5; 
    motionFrames = 45; 
    

    document.getElementById('monster-sprite').classList.remove('attacking-windup');
      document.getElementById('monster-sprite').classList.add('attacking');
    
    // パリィ判定
    if (player.parryFrames <= 0) {
        takeDamage();
    } else {
        parrySuccessSE.currentTime = 0;
        parrySuccessSE.play().catch(e => console.log("SE play failed:", e));
    }
    
    aoeAttacksDone++;
    if (aoeAttacksDone < aoeNumAttacks) {
        aoeState = 'WAIT';
        aoeTimer = 30; 
    } else {
        aoeState = 'DONE';
    }
}

// 繝代ち繝ｼ繝ｳ3: 蜈ｨ菴薙ヵ繝ｩ繝・す繝･謾ｻ謦・・縺ｿ
function manageAttackPattern3() {
    manageAoEFlash();
}

// 繝代ち繝ｼ繝ｳ4/5 (逶ｾ・句・菴捺判謦・
function manageAttackPattern4(timeline) {
    for (const ev of timeline) {
        if (frameCount === ev.f) {
            if (ev.t === 'BULLET') {
                spawnShieldBullet(ev.d);
            }
        }
    }
    manageAoEFlash();
}

function spawnShieldBullet(dir) {
    const dist = 250; 
    const speed = 4; 
    let bx = box.x, by = box.y;
    let dx = 0, dy = 0;
    if (dir === 'UP') { by -= dist; dy = speed; }
    else if (dir === 'DOWN') { by += dist; dy = -speed; }
    else if (dir === 'LEFT') { bx -= dist; dx = speed; }
    else if (dir === 'RIGHT') { bx += dist; dx = -speed; }
    
    bullets.push({
        x: bx, y: by, dx: dx, dy: dy,
        size: 6, color: '#ffffff',
        isShieldBullet: true,
        dir: dir
    });
}

// 繝代ち繝ｼ繝ｳ6 (繧ｪ繝ｬ繝ｳ繧ｸ驥榊鴨)
function manageAttackPattern6() {
    const spawnRate = Math.max(30, 60 - Math.floor(frameCount / 60)); 
    
    if (frameCount > 60 && frameCount % spawnRate === 0) {
        const boneWidth = 20;
        const type = Math.floor(Math.random() * 4);
        let by, bh;
        const bottomY = box.y + box.currentH / 2;
        const topY = box.y - box.currentH / 2;
        
        if (type === 0 || type === 1) {
            bh = Math.floor(Math.random() * 50) + 40;
            by = bottomY - bh / 2;
        } else if (type === 2) {
            bh = Math.floor(Math.random() * 50) + 40;
            by = topY + bh / 2;
        } else {
            bh = 30;
            by = box.y + (Math.random() * 80 - 40);
        }
        
        bullets.push({
            x: box.x + box.currentW / 2 + boneWidth,
            y: by,
            w: boneWidth,
            h: bh,
            dx: -4, 
            dy: 0,
            isBone: true,
            color: '#ffffff'
        });
    }
}

// 繝代ち繝ｼ繝ｳ7 (繧ｪ繝ｬ繝ｳ繧ｸ驥榊鴨繝ｻ繝代Ρ繝ｼ繧｢繝・・迚・
function manageAttackPattern7() {
    const spawnRate = 42; // 邏・.7遘偵＃縺ｨ

        const boneWidth = 25;
    
    // 荳九・鬪ｨ (螟ｧ繝ｻ荳ｭ繝ｻ蟆上Λ繝ｳ繝繝�)
        if (frameCount > 0 && frameCount % spawnRate === 0) {
        const heights = [30, 60, 90]; 
        const bh = heights[Math.floor(Math.random() * heights.length)];
        const bottomY = box.y + box.currentH / 2;
        
        bullets.push({
            x: box.x + box.currentW / 2 + boneWidth,
            y: bottomY - bh / 2,
            w: boneWidth,
            h: bh,
            dx: -5,
            dy: 0,
            isBone: true,
            color: '#ffffff'
        });
    }
    
    // 荳翫・鬪ｨ (縺吶∋縺ｦ蟆上し繧､繧ｺ縲・遘貞ｾ後°繧牙・蟋九ａ繧・

        const topOffset = 21; // 蜃ｺ迴ｾ繧ｿ繧､繝溘Φ繧ｰ繧貞濠蛻・★繧峨☆

        if (frameCount > 60 && (frameCount - topOffset) % spawnRate === 0) {
        const bh = 30; // 蟆上し繧､繧ｺ蝗ｺ螳・

        const topY = box.y - box.currentH / 2;
        
        bullets.push({
            x: box.x + box.currentW / 2 + boneWidth,
            y: topY + bh / 2,
            w: boneWidth,
            h: bh,
            dx: -5,
            dy: 0,
            isBone: true,
            color: '#ffffff'
        });
    }
    
    // ----- 髱偵＞・√・繝ｼ繧ｯ縺ｮ轤ｹ貊・→驥榊鴨蜿崎ｻ｢・医■縺｣縲√■縺｣縲√■縺｣縲√ち繝ｳ・・ｼ・-----
    // frameCount 300(5遘・ 縺九ｉ繧ｹ繧ｿ繝ｼ繝・

        if (frameCount === 300) { 
        if (blueWarningMark) blueWarningMark.classList.remove('hidden'); 

        document.getElementById('monster-sprite').classList.remove('combat-mode');
    }
    if (frameCount === 315) { if (blueWarningMark) blueWarningMark.classList.add('hidden'); }
    if (frameCount === 330) { if (blueWarningMark) blueWarningMark.classList.remove('hidden'); }
    if (frameCount === 345) { if (blueWarningMark) blueWarningMark.classList.add('hidden'); }
    if (frameCount === 360) { if (blueWarningMark) blueWarningMark.classList.remove('hidden'); document.getElementById('monster-sprite').classList.add('attacking-windup'); }
    if (frameCount === 375) { if (blueWarningMark) blueWarningMark.classList.add('hidden'); }
    if (frameCount === 390) { 
        // 繧ｿ繝ｳ・・(蜿崎ｻ｢)
        if (blueWarningMark) blueWarningMark.classList.remove('hidden');
        
        // 笘・％縺薙〒謾ｻ謦・い繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ・域険繧贋ｸ九ｍ縺暦ｼ峨ｒ荳迸ｬ縺�縺大・逕滂ｼ・

        document.getElementById('monster-sprite').classList.remove('combat-mode');

        document.getElementById('monster-sprite').classList.remove('attacking-windup');
        document.getElementById('monster-sprite').classList.add('gravity-strike');
        
        player.color = '#0000ff';
        parrySuccessSE.currentTime = 0;
        parrySuccessSE.play().catch(e => console.log("SE play failed:", e));
        gravityDir = -1;
        player.gravity = 0.2; // 繝輔Ρ繝・→縺輔○繧・

        player.jumpForce = -6; // 繧ｸ繝｣繝ｳ繝怜鴨繧ゅ・繧､繝ｫ繝峨↓

        
        shockwaves.push({ x: player.x, y: player.y, radius: player.size, alpha: 1.0 });
    }
    if (frameCount === 420) {
        if (blueWarningMark) blueWarningMark.classList.add('hidden');
        document.getElementById('monster-sprite').classList.remove('gravity-strike');
        document.getElementById('monster-sprite').classList.add('combat-mode');
    }
}

// 繝代ち繝ｼ繝ｳ8 (髱偵・辟｡髯占誠荳九せ繝・い繝ｪ繝ｳ繧ｰ)
function manageAttackPattern8() {
    if (p8Phase === 1) {
        let currentSpawnInterval = 48; // 蛻晄悄0.8遘・
        
        // 譎る俣邨碁℃縺ｧ髢馴囈繧堤洒縺上☆繧・

        if (frameCount > 240) currentSpawnInterval = 42; // 4遘剃ｻ･髯・0.7遘・

        if (frameCount > 480) currentSpawnInterval = 36; // 8遘剃ｻ･髯・0.6遘・

        // 遲蛾俣髫斐〒鬪ｨ繧堤函謌撰ｼ医ヰ繧ｰ菫ｮ豁｣貂医∩・・

        p8SpawnTimer--;
        if (p8SpawnTimer <= 0) {
            p8SpawnTimer = currentSpawnInterval;
            
            const bh = 15; // 鬪ｨ縺ｮ蜴壹∩

        const gapWidth = 60; // 髫咎俣縺ｮ蟷・

        const minGapX = box.x - box.currentW / 2 + gapWidth / 2 + 10;
            const maxGapX = box.x + box.currentW / 2 - gapWidth / 2 - 10;
            const gapX = Math.random() * (maxGapX - minGapX) + minGapX;
            
            const leftEdge = box.x - box.currentW / 2;
            const rightEdge = box.x + box.currentW / 2;
            
            const leftBoneW = (gapX - gapWidth / 2) - leftEdge;
            const rightBoneW = rightEdge - (gapX + gapWidth / 2);
            
            const by = box.y + box.currentH / 2 + bh; // 荳狗ｫｯ縺ｮ縺吶＄螟悶°繧・
            
            // 蟾ｦ蛛ｴ縺ｮ鬪ｨ

        if (leftBoneW > 0) {
                bullets.push({ x: leftEdge + leftBoneW / 2, y: by, w: leftBoneW, h: bh, dx: 0, dy: -6, isBone: true, color: '#ffffff' });
            }
            
            // 蜿ｳ蛛ｴ縺ｮ鬪ｨ

        if (rightBoneW > 0) {
                bullets.push({ x: rightEdge - rightBoneW / 2, y: by, w: rightBoneW, h: bh, dx: 0, dy: -6, isBone: true, color: '#ffffff' });
            }
        }
        
        // 3遘偵♀縺阪・莠亥相繝薙・繝�

        p8BeamTimer--;
        if (p8BeamTimer <= 0) {
            p8BeamTimer = 180; // 谺｡縺ｯ3遘貞ｾ・

            p8BeamCount++;
        bullets.push({
                x: box.x,
                y: box.y - 100, // 譛蛻昴・菴咲ｽｮ・井ｸ企Κ・・
                w:
        box.currentW,
                h: 40, // 繝薙・繝�縺ｮ螟ｪ縺・
                isBeam: true,
                state: 'WARN',
                timer: 45, // 0.75遘剃ｺ亥相

                maxTimer: 45
            });
            
            if (p8BeamCount >= 3) {
                p8Phase = 2; // 3蝗樊茶縺｣縺溘ｉ谺｡縺ｮ繝輔ぉ繝ｼ繧ｺ縺ｸ

            }
        }
    } else if (p8Phase === 2) {
        // 繧ｪ繝ｬ繝ｳ繧ｸ螢√ｒ逕滓・

        p8TunnelTimer++;
        if (p8TunnelTimer > 20) {
            bullets.push({
                x: box.x,
                y: box.y + box.currentH / 2 + 30,
                w: box.currentW,
                h: 30,
                dx: 0,
                dy: -8, // 蟆代＠騾溘ａ

                isOrangeWall: true,
                color: '#ff9900'
            });
            p8Phase = 3;
            p8TunnelTimer = 0;
        }
    } else if (p8Phase === 3) {
        p8TunnelTimer++;
        // 繝医Φ繝阪Ν縺ｮ鬪ｨ逕滓・

        if (p8TunnelTimer > 20 && p8TunnelTimer % 8 === 0) { 
            const bh = 15;
            // 邏・0繝輔Ξ繝ｼ繝�縺九￠縺ｦ蠕舌・↓迢ｭ縺ｾ繧・

        const progress = Math.min((p8TunnelTimer - 20) / 90, 1.0); 
            const gapWidth = 220 - (180 * progress);
            
            const leftEdge = box.x - box.currentW / 2;
            const rightEdge = box.x + box.currentW / 2;
            const gapX = box.x;
            const leftBoneW = (gapX - gapWidth / 2) - leftEdge;
            const rightBoneW = rightEdge - (gapX + gapWidth / 2);
            const by = canvas.height + 40; 
            
            if (leftBoneW > 0) bullets.push({ x: leftEdge + leftBoneW / 2, y: by, w: leftBoneW, h: bh, dx: 0, dy: -10, isBone: true, color: '#ffffff' });
            if (rightBoneW > 0) bullets.push({ x: rightEdge - rightBoneW / 2, y: by, w: rightBoneW, h: bh, dx: 0, dy: -10, isBone: true, color: '#ffffff' });
            
            if (progress >= 1.0) {
                p8Phase = 4;
                p8TunnelTimer = 0;
            }
        }
    } else if (p8Phase === 4) {
        p8TunnelTimer++;
        if (p8TunnelTimer === 10) { 
            // 鬪ｨ繧定ｶ・∴縺溘ｉ縲∫ｮｱ縺ｮ繧ｵ繧､繧ｺ繧剃ｸ区婿蜷代□縺大ｰ上＆縺上＠縺ｦ繧・▲縺上ｊ荳翫￡繧・

        box.targetH = 200; // 蜈・・鬮倥＆縺ｫ謌ｻ縺呻ｼ・50 -> 200 = 250px貂幢ｼ・

        box.targetY = canvas.height / 2 - 125; // 250px縺ｮ蜊雁・縺�縺台ｸ翫ｒ蝓ｺ貅悶↓縺吶ｋ縺溘ａ縲∽ｸ翫↓125px縺壹ｉ縺・
            p8Phase = 5;
            }
    } else if (p8Phase === 5) {
        // 邂ｱ縺檎ｸｮ縺ｿ邨ゅｏ繧九・繧貞ｾ・▲縺ｦ縺九ｉ繧ｦ繧ｧ繝ｼ繝也ｵゆｺ・

        if (Math.abs(box.currentH - box.targetH) < 5) {
            clearTimeout(turnTimer);
            startPlayerTurn();
        }
    }
}

let p9Timer = 0;
let p9WaveCount = 0;
let p9Phase = 1;

function spawnP9Wave(dir) {
    const lineSpacing = 45;
    const baseY = box.y - lineSpacing;
    
    let layout = [];
    if (p9WaveCount % 2 === 0) {
        layout = [false, true, false];
    } else {
        layout = [true, false, true];
    }
    
    for (let i = 0; i < 3; i++) {
        const spawnY = baseY + (i * lineSpacing);
        const isBlock = layout[i];
        
        let startX = dir === 1 ? (box.x + box.currentW / 2 + 20) : (box.x - box.currentW / 2 - 20);
        let speed = dir === 1 ? -5 : 5;
        
        bullets.push({
            x: startX,
            y: spawnY,
            w: isBlock ? 24 : 20,
            h: isBlock ? 24 : 20,
            dx: speed,
            dy: 0,
            isDestructible: !isBlock,
            isBomb: !isBlock,
            bombState: 'NORMAL',
            isSolidBlock: isBlock,
            isBone: isBlock,
            color: '#ffffff'
        });
    }
}

function manageAttackPattern9() {
    p9Timer++;
    
    if (p9Phase === 1) {
        if (p9Timer % 60 === 0 && p9WaveCount < 5) {
            spawnP9Wave(1); // direction 1 (right to left)
            p9WaveCount++;
        }
        if (p9WaveCount >= 5 && p9Timer % 60 === 30) {
            p9Phase = 2;
            p9Timer = 0;
        }
    } else if (p9Phase === 2) {
        if (p9Timer === 30) {
            bullets.push({
                x: box.x + box.currentW / 2 + 50,
                y: box.y,
                w: 30,
                h: box.currentH,
                dx: -8, // move left fast
                dy: 0,
                isYellowWall: true,
                color: '#ffff00'
            });
        }
    } else if (p9Phase === 3) {
        if (p9Timer % 60 === 0 && p9WaveCount < 5) {
            spawnP9Wave(-1); // direction -1 (left to right)
            p9WaveCount++;
        }
        if (p9WaveCount >= 5 && p9Timer % 60 === 45) {
            clearTimeout(turnTimer);
            startPlayerTurn();
        }
    }
}

let p11Timer = 0;

function manageAttackPattern11() {
    p11Timer++;
    
    // 0縲・00繝輔Ξ繝ｼ繝�: 60繝輔Ξ繝ｼ繝�髢馴囈縺ｧ閾ｪ讖溽漁縺・Ξ繝ｼ繧ｶ繝ｼ繧堤匱蟆・

        if (p11Timer <= 300 && p11Timer % 60 === 1) {
        const angle = Math.atan2(player.y - box.y, player.x - box.x);
        bullets.push({
            x: box.x, y: box.y, w: 1000, h: 30, // w縺ｯ逕ｻ髱｢遶ｯ縺ｾ縺ｧ螻翫￥繧医≧縺ｫ髟ｷ縺・

            isBeam: true, state: 'WARN', timer: 40, maxTimer: 40, color: '#ff0000',
            angle: angle
        });
    }

    // 330繝輔Ξ繝ｼ繝�: 蜊∝ｭ励ン繝ｼ繝�謾ｻ謦・・莠亥相髢句ｧ・

        if (p11Timer === 330) {
        bullets.push({
            x: box.x, y: box.y, w: box.currentW + 50, h: 40,
            isBeam: true, state: 'WARN', timer: 60, maxTimer: 60, color: '#ff0000'
        });
        bullets.push({
            x: box.x, y: box.y, w: 40, h: box.currentH + 50,
            isBeam: true, state: 'WARN', timer: 60, maxTimer: 60, color: '#ff0000'
        });
    }

    // 390繝輔Ξ繝ｼ繝: 蜊∝ｭ励ン繝ｼ繝逋ｺ蟆・→蜷梧凾縺ｫ邂ｱ縺・縺､縺ｫ蛻・｣・

        if (p11Timer === 390) {
        crossAttackSE.currentTime = 0;
        crossAttackSE.play().catch(e => console.log("SE play failed:", e));
        
        const gap = 40;
        const subW = (box.targetW - gap) / 2;
        const subH = (box.targetH - gap) / 2;
        
        subBoxes = [
            { x: box.x - box.targetW/2 + subW/2, y: box.y - box.targetH/2 + subH/2, w: subW, h: subH },
            { x: box.x + box.targetW/2 - subW/2, y: box.y - box.targetH/2 + subH/2, w: subW, h: subH },
            { x: box.x - box.targetW/2 + subW/2, y: box.y + box.targetH/2 - subH/2, w: subW, h: subH },
            { x: box.x + box.targetW/2 - subW/2, y: box.y + box.targetH/2 - subH/2, w: subW, h: subH }
        ];
    }
    
    // 390縲・50繝輔Ξ繝ｼ繝�: 蝗幄ｧ偵・蟾ｦ蜿ｳ荳贋ｸ九せ繝ｯ繝・・繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ

        if (p11Timer > 390 && p11Timer <= 450) {
        const t = (p11Timer - 390) / 60;
        const easeInOutQuad = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // 繧ｹ繝�繝ｼ繧ｺ縺ｪ繧､繝ｼ繧ｸ繝ｳ繧ｰ

        const gap = 40;
        const subW = (box.targetW - gap) / 2;
        const subH = (box.targetH - gap) / 2;
        
        const leftX = box.x - box.targetW/2 + subW/2;
        const rightX = box.x + box.targetW/2 - subW/2;
        const topY = box.y - box.targetH/2 + subH/2;
        const bottomY = box.y + box.targetH/2 - subH/2;
        
        const distX = rightX - leftX;
        const distY = bottomY - topY;
        
        // 0(蟾ｦ荳・: 蜿ｳ荳九∈

        subBoxes[0].x = leftX + distX * easeInOutQuad;
        subBoxes[0].y = topY + distY * easeInOutQuad;
        
        // 1(蜿ｳ荳・: 蟾ｦ荳九∈

        subBoxes[1].x = rightX - distX * easeInOutQuad;
        subBoxes[1].y = topY + distY * easeInOutQuad;
        
        // 2(蟾ｦ荳・: 蜿ｳ荳翫∈

        subBoxes[2].x = leftX + distX * easeInOutQuad;
        subBoxes[2].y = bottomY - distY * easeInOutQuad;
        
        // 3(蜿ｳ荳・: 蟾ｦ荳翫∈

        subBoxes[3].x = rightX - distX * easeInOutQuad;
        subBoxes[3].y = bottomY - distY * easeInOutQuad;
    }
    
    // 460繝輔Ξ繝ｼ繝�: 繧ｹ繝ｩ繝・す繝･蠑ｾ1蛟狗岼

        if (p11Timer === 460) {
        let angle = Math.PI * 0.25 + Math.random() * Math.PI * 0.5;
        bullets.push({
            x: box.x - 50, y: box.y - 110,
            w: 40, h: 8, dx: Math.cos(angle) * 4.5, dy: Math.sin(angle) * 4.5,
            isDestructible: false, isSlashBullet: true, angle: angle, color: '#ff0000'
        });
    }
    
    // 500繝輔Ξ繝ｼ繝�: 繧ｹ繝ｩ繝・す繝･蠑ｾ2蛟狗岼

        if (p11Timer === 500) {
        let angle = Math.PI * 0.25 + Math.random() * Math.PI * 0.5;
        bullets.push({
            x: box.x + 50, y: box.y - 110,
            w: 40, h: 8, dx: Math.cos(angle) * 4.5, dy: Math.sin(angle) * 4.5,
            isDestructible: false, isSlashBullet: true, angle: angle, color: '#ff0000'
        });
    }

    // 800繝輔Ξ繝ｼ繝�: 繧ｿ繝ｼ繝ｳ邨ゆｺ・(2縺､逶ｮ縺ｮ蠑ｾ縺悟・縺ｦ縺九ｉ5遘・300繝輔Ξ繝ｼ繝�)蠕・

        if (p11Timer >= 800) {
        clearTimeout(turnTimer);
        startPlayerTurn();
    }
}

// ==================== 譖ｴ譁ｰ繝ｻ謠冗判 ====================
function updateBullets() {
    const solidWalls = bullets.filter(b => b.isSolidBlock);

    let minDist = Infinity;
    let closestBullet = null;

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        
        if (b.isSlashBullet) {
            b.x += b.dx;
            b.y += b.dy;
            
            let boundW = box.currentW;
            let boundH = box.currentH;
            if (subBoxes.length > 0) {
                boundW -= 40;
                boundH -= 40;
            }
            
            let bounced = false;
            if (b.x - b.w/2 < box.x - boundW/2) { b.x = box.x - boundW/2 + b.w/2; bounced = true; }
            if (b.x + b.w/2 > box.x + boundW/2) { b.x = box.x + boundW/2 - b.w/2; bounced = true; }
            if (b.y - b.h/2 < box.y - boundH/2) { b.y = box.y - boundH/2 + b.h/2; bounced = true; }
            if (b.y + b.h/2 > box.y + boundH/2) { b.y = box.y + boundH/2 - b.h/2; bounced = true; }
            
            if (bounced) {
                const speed = Math.hypot(b.dx, b.dy);
                let newDx = 0, newDy = 0;
                let attempts = 0;
                while(attempts < 50) {
                    b.angle = Math.random() * Math.PI * 2;
                    newDx = Math.cos(b.angle) * speed;
                    newDy = Math.sin(b.angle) * speed;
                    
                    let valid = true;
                    if (b.x <= box.x - box.currentW/2 + b.w/2 + 2 && newDx < 0) valid = false;
                    if (b.x >= box.x + box.currentW/2 - b.w/2 - 2 && newDx > 0) valid = false;
                    if (b.y <= box.y - box.currentH/2 + b.h/2 + 2 && newDy < 0) valid = false;
                    if (b.y >= box.y + box.currentH/2 - b.h/2 - 2 && newDy > 0) valid = false;
                    
                    if (valid) {
                        b.dx = newDx;
                        b.dy = newDy;
                        break;
                    }
                    attempts++;
                }
            }
            continue;
        } else if (b.isBone || b.isOrangeWall || b.isYellowWall) {
            b.x += b.dx;
            b.y += b.dy;
            if (b.x < box.x - box.currentW / 2 - 50 || b.x > box.x + box.currentW / 2 + 50) bullets.splice(i, 1);
            else if (b.y < box.y - box.currentH / 2 - 200) {
                bullets.splice(i, 1);
            }
        } else if (b.isBeam) {
            b.timer--;
            if (b.state === 'WARN' && b.timer <= 0) {
                b.state = 'FIRE';
                b.timer = 20; // 20繝輔Ξ繝ｼ繝�逋ｺ蟆・

            } else if (b.state === 'FIRE' && b.timer <= 0) {
                bullets.splice(i, 1);
            }
        } else if (b.isShieldBullet) {
            b.x += b.dx;
            b.y += b.dy;
            const distToCenter = Math.hypot(b.x - box.x, b.y - box.y);
            if (distToCenter < 15) {
                if (player.shieldDir === b.dir) {
                    parrySuccessSE.currentTime = 0;
                    parrySuccessSE.play().catch(e => console.log("SE play failed:", e));
                    bullets.splice(i, 1); // 防御成功

            } else {
                    bullets.splice(i, 1); // 陲ｫ蠑ｾ

        takeDamage();
                }
                continue;
            }
            if (distToCenter < minDist) {
                minDist = distToCenter;
                closestBullet = b;
            }
            b.color = '#ffffff';
        } else if (b.isBomb && b.bombState === 'FLASHING') {
            b.bombTimer--;
            if (b.bombTimer <= 0) {
                // 蜊∝ｭ礼・逋ｺ (繝薙・繝�)
        bullets.splice(i, 1);
                const beamThickness = 20;
                // 讓ｪ繝薙・繝�

        bullets.push({ 
                    x: box.x, y: b.y, w: box.currentW, h: beamThickness, 
                    isBeam: true, state: 'FIRE', timer: 6, maxTimer: 6, color: '#ff0000' 
                });
                // 邵ｦ繝薙・繝�

        bullets.push({ 
                    x: b.x, y: box.y, w: beamThickness, h: box.currentH, 
                    isBeam: true, state: 'FIRE', timer: 6, maxTimer: 6, color: '#ff0000' 
                });
                continue;
            }
        } else if (b.usePolar) {
            // 繝代ち繝ｼ繝ｳ2逕ｨ

            b.radius -= b.radialSpeed;
            b.angle += b.angularSpeed;
            b.x = b.centerX + Math.cos(b.angle) * b.radius;
            b.y = b.centerY + Math.sin(b.angle) * b.radius;
            if (b.radius < 10) { bullets.splice(i, 1); continue; }
        } else if (b.isSpawner) {
            b.spawnTimer++;
            if (b.spawnTimer >= b.spawnInterval) { // Spawner縺斐→縺ｫ險ｭ螳壹＆繧後◆髢馴囈

                b.spawnTimer = 0;
                bullets.push({
                    x: b.x + (Math.sign(b.spawnDx) * 25), // 讓ｪ蜷代″縺ｯ1繝槭せ蜑阪°繧・

                    y: b.y, // 邵ｦ蜷代″縺ｯ繝悶Ο繝・け縺ｮ荳ｭ蠢・°繧臥峩謗･蜃ｺ縺・

                    w: 20, h: 20,
                    dx: b.spawnDx, dy: b.spawnDy,
                    isDestructible: true,
                    isMovingDestructible: true,
                    isSolidBlock: false,
                    isBone: false,
                    color: '#ff0000',
                    ignoreWalls: b.spawnDy !== 0,
                    isCol14Bullet: b.spawnDy !== 0
                });
            }
        } else {
            // 騾壼ｸｸ縺ｮ蠑ｾ

            b.x += b.dx;
            b.y += b.dy;
            
            // 螢√〒豸域ｻ・☆繧句・逅・

        if (b.isMovingDestructible || b.isBouncing) {
                let hitWall = false;
                if (!b.ignoreWalls) {
                    for (const wall of solidWalls) {
                        if (wall !== b) {
                            if (Math.abs(b.x - wall.x) < (b.w/2 + wall.w/2) &&
                                Math.abs(b.y - wall.y) < (b.h/2 + wall.h/2)) {
                                hitWall = true;
                                break;
                            }
                        }
                    }
                }
                if (hitWall) {
                    if (b.isBouncing) {
                        b.y -= b.dy;
                        b.dy *= -1; // 繝舌え繝ｳ繝・

            } else {
                        bullets.splice(i, 1);
                        continue;
                    }
                }
                if (b.isCol14Bullet && currentAttackType === 10) {
                    const lineSpacing = 35;
                    const baseY = box.y - 4 * lineSpacing;
                    const line2Y = baseY + 2 * lineSpacing; // 3rd wire from top
                    if (b.y <= line2Y) {
                        bullets.splice(i, 1);
                        continue;
                    }
                }
            }

            // 逕ｻ髱｢螟門炎髯､

        if (b.x < -50 || b.x > canvas.width + 50 || b.y < -50 || b.y > canvas.height + 50) {
                bullets.splice(i, 1);
            }
        }
    }
    
    if (gameState === 'ENEMY_TURN' && currentAttackType === 10) {
        p10ZoneTimer++;
        
        if (p10ZoneTimer === 40) { // 3蝗樒岼縺ｮ轤ｹ貊・凾縺ｫ蜈・・蠑ｾ繧呈ｶ亥悉

            for (let i = bullets.length - 1; i >= 0; i--) {
                if (bullets[i].isZoneBullet) {
                    bullets.splice(i, 1);
                }
            }
        }
        
        if (p10ZoneTimer === 80) { // 4蝗樒岼縺ｮ轤ｹ貊・ｾ鯉ｼ・0繝輔Ξ繝ｼ繝�逶ｮ・峨↓蜃ｺ迴ｾ

            p10ZonePattern = 1 - p10ZonePattern;
            const lineSpacing = 35;
            const baseY = box.y - 4 * lineSpacing;
            for (let i = 0; i < p10ZoneCoords.length; i++) {
                const isPattern0 = (i % 2 === 0);
                if ((p10ZonePattern === 0 && isPattern0) || (p10ZonePattern === 1 && !isPattern0)) {
                    const coord = p10ZoneCoords[i];
                    bullets.push({
                        x: box.x - 275 + 12.5 + coord.c * 25,
                        y: baseY + coord.r * lineSpacing,
                        w: 20, h: 20,
                        dx: 0, dy: 0,
                        isDestructible: true,
                        isSolidBlock: false,
                        isBone: false,
                        color: '#ff0000',
                        isZoneBullet: true
                    });
                }
            }
        }
        
        if (p10ZoneTimer >= 100) { // 繧ｵ繧､繧ｯ繝ｫ繧・00繝輔Ξ繝ｼ繝�縺ｫ

            p10ZoneTimer = 0;
        }
    }
    
    // 繝励Ξ繧､繝､繝ｼ縺ｮ蠑ｾ縺ｮ譖ｴ譁ｰ

    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const pb = playerBullets[i];
        pb.x += pb.dx;
        pb.y += pb.dy;
        
        // 逕ｻ髱｢螟門炎髯､

        if (pb.x > canvas.width + 50) {
            playerBullets.splice(i, 1);
        }
    }
    
    if (closestBullet) {
        closestBullet.color = '#ff0000';
    }
}

function drawBullets() {
    if (gameState === 'ENEMY_TURN' && currentAttackType === 10) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(box.x - box.currentW / 2, box.y - box.currentH / 2, box.currentW, box.currentH);
        ctx.clip();
    }

    for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i];
        
        if (b.isBeam) {
            ctx.save();
            ctx.translate(b.x, b.y);
            if (b.angle !== undefined) ctx.rotate(b.angle);
            
            if (b.state === 'WARN') {
                if (Math.floor(frameCount / 4) % 2 === 0) {
                    // 襍､縺・レ譎ｯ縺ｫ襍､縺・ワ繝ｼ繝医□縺ｨ隕九∴縺ｪ縺上↑縺｣縺ｦ轤ｹ貊・＠縺ｦ縺・ｋ繧医≧縺ｫ骭ｯ隕壹☆繧九◆繧√∬ｭｦ蜻翫・鮟・牡縺ｫ螟画峩

        ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
                    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
                    
                    // !繝槭・繧ｯ繧よ緒逕ｻ

        ctx.fillStyle = '#ffff00';
                    ctx.font = '24px "DotGothic16", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('!', 0, 0);
                }
            } else if (b.state === 'FIRE') {
                if (b.maxTimer) {
                    const alpha = b.timer / b.maxTimer;
                    if (b.color === '#ff0000') {
                        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
                    } else {
                        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    }
                } else {
                    ctx.fillStyle = '#ffffff';
                }
                ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
            }
            ctx.restore();
            continue;
        } else if (b.isOrangeWall) {
            ctx.fillStyle = b.color;
            ctx.fillRect(box.x - box.currentW/2, b.y - b.h/2, box.currentW, b.h);
            
            // 荳ｭ螟ｮ縺ｫ繝上・繝医い繧､繧ｳ繝ｳ繧呈緒逕ｻ

        ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            const hx = box.x;
            const hy = b.y - 2; // 蟆代＠荳・

        const size = 6;
            ctx.moveTo(hx, hy + size);
            ctx.bezierCurveTo(hx, hy + size, hx - size*1.2, hy, hx - size*1.2, hy - size*0.5);
            ctx.bezierCurveTo(hx - size*1.2, hy - size*1.2, hx - size*0.4, hy - size*1.2, hx, hy - size*0.3);
            ctx.bezierCurveTo(hx + size*0.4, hy - size*1.2, hx + size*1.2, hy - size*1.2, hx + size*1.2, hy - size*0.5);
            ctx.bezierCurveTo(hx + size*1.2, hy, hx, hy + size, hx, hy + size);
            ctx.fill();
            continue;
        } else if (b.isYellowWall) {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x - b.w/2, box.y - box.currentH/2, b.w, box.currentH);
            
            ctx.fillStyle = '#800080';
            ctx.beginPath();
            const hx = b.x;
            const hy = box.y;
            const size = 6;
            ctx.moveTo(hx + size, hy);
            ctx.bezierCurveTo(hx + size, hy - size*1.2, hx, hy - size*1.2, hx - size*0.5, hy);
            ctx.bezierCurveTo(hx - size*1.2, hy - size*0.4, hx - size*1.2, hy + size*0.4, hx - size*0.3, hy + size);
            ctx.bezierCurveTo(hx - size*1.2, hy + size*1.2, hx, hy + size*1.2, hx + size*0.5, hy + size);
            ctx.bezierCurveTo(hx + size*1.2, hy + size, hx + size, hy, hx + size, hy);
            ctx.fill();
            continue;
        } else if (b.isGoal) {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
            continue;
        } else if (b.isSlashBullet) {
            const drawSlash = () => {
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.rotate(b.angle);
                ctx.fillStyle = b.color;
                ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
                ctx.restore();
            };
            
            if (subBoxes.length > 0) {
                let boundW = box.currentW - 40;
                let boundH = box.currentH - 40;
                const offsets = subBoxes.map((sb, i) => {
                    let cx = box.x + (i % 2 === 0 ? -boundW/4 : boundW/4);
                    let cy = box.y + (i < 2 ? -boundH/4 : boundH/4);
                    return { dx: sb.x - cx, dy: sb.y - cy, sb: sb };
                });
                
                for (const off of offsets) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(off.sb.x - off.sb.w/2, off.sb.y - off.sb.h/2, off.sb.w, off.sb.h);
                    ctx.clip();
                    ctx.translate(off.dx, off.dy);
                    drawSlash();
                    ctx.restore();
                }
            } else {
                drawSlash();
            }
            continue;
        }

        ctx.fillStyle = b.color || '#ffffff';
        if (b.isBomb && b.bombState === 'FLASHING') {
            ctx.fillStyle = (Math.floor(frameCount / 4) % 2 === 0) ? '#ff0000' : '#ffffff';
        }
        
        if (b.isBone || b.isOrangeWall || b.isGround || b.isBeam || b.isSolidBlock) {
            const bw = b.w || (b.size * 2) || 10;
            const bh = b.h || (b.size * 2) || 10;
            ctx.fillRect(b.x - bw / 2, b.y - bh / 2, bw, bh);
        } else {
            ctx.beginPath();
            const radius = (b.w !== undefined) ? b.w / 2 : (b.size || 5);
            ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    }
    
    // 繝励Ξ繧､繝､繝ｼ縺ｮ蠑ｾ謠冗判

    for (const pb of playerBullets) {
        ctx.fillStyle = pb.color;
        ctx.beginPath();
        // 縺｡繧・▲縺ｨ邏ｰ髟ｷ縺・･募・蠖｢縺｣縺ｽ縺乗緒逕ｻ

        ctx.ellipse(pb.x, pb.y, pb.w / 2, pb.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 蟾ｦ縺ｮ鬪ｨ螢・(繝代ち繝ｼ繝ｳ6, 7逕ｨ)
        if (gameState === 'ENEMY_TURN' && (currentAttackType === 6 || currentAttackType === 7)) {
        ctx.fillStyle = '#ffffff';
        const leftBoneWallW = 25;
        const leftX = box.x - box.currentW / 2;
        const topY = box.y - box.currentH / 2;
        ctx.fillRect(leftX, topY, leftBoneWallW, box.currentH);
        
        ctx.fillStyle = '#000000';
        for (let i = 0; i < box.currentH; i += 30) {
            ctx.fillRect(leftX + 15, topY + i + 10, 10, 2);
        }
    }

    // P10縺ｮ荳譛ｬ驕薙だ繝ｼ繝ｳ縺ｮ轤ｹ貊・ｼ郁ｭｦ蜻奇ｼ峨ｒ謠冗判

        if (gameState === 'ENEMY_TURN' && currentAttackType === 10) {
        const lineSpacing = 35;
        const baseY = box.y - 4 * lineSpacing;
        
        const isBlinking = (
            (p10ZoneTimer >= 0 && p10ZoneTimer < 10) || // 1蝗樒岼

            (p10ZoneTimer >= 20 && p10ZoneTimer < 30) || // 2蝗樒岼

            (p10ZoneTimer >= 40 && p10ZoneTimer < 50) || // 3蝗樒岼 (縺薙・譎ょｼｾ縺梧ｶ医∴繧・

            (p10ZoneTimer >= 60 && p10ZoneTimer < 70)    // 4蝗樒岼

        );
        
        if (isBlinking && p10ZoneTimer < 80) {
            const nextPattern = 1 - p10ZonePattern;
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            for (let i = 0; i < p10ZoneCoords.length; i++) {
                const isPattern0 = (i % 2 === 0);
                if ((nextPattern === 0 && isPattern0) || (nextPattern === 1 && !isPattern0)) {
                    const coord = p10ZoneCoords[i];
                    const cx = box.x - 275 + 12.5 + coord.c * 25;
                    const cy = baseY + coord.r * lineSpacing;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }

    if (gameState === 'ENEMY_TURN' && currentAttackType === 10) {
        ctx.restore();
    }
}

function checkCollision() {
    if (gameState !== 'ENEMY_TURN') return;
    
    for (const b of bullets) {
        // 繧ｪ繝ｬ繝ｳ繧ｸ螢√・蛻､螳壹・辟｡謨ｵ譎る俣荳ｭ縺ｧ繧り｡後≧・育憾諷句､牙喧縺ｮ縺溘ａ・・

        if (b.isOrangeWall) {
            const rectY = b.y - b.h/2;
            const testY = Math.max(rectY, Math.min(player.y, rectY + b.h));
            const distY = player.y - testY;
            if (Math.abs(distY) < player.size) {
                if (player.color !== '#ff9900') {
                    player.color = '#ff9900'; // 繧ｪ繝ｬ繝ｳ繧ｸ蛹厄ｼ・
                    parrySuccessSE.currentTime = 0;
                    parrySuccessSE.play().catch(e => console.log("SE play failed:", e));
            }
            }
            continue;
        }

        if (b.isYellowWall) {
            const rectX = b.x - b.w/2;
            const testX = Math.max(rectX, Math.min(player.x, rectX + b.w));
            const distX = player.x - testX;
            if (Math.abs(distX) < player.size) {
                if (!player.isFlipped) {
                    player.isFlipped = true;
                    player.angle = 90; // flip!
                    p9Phase = 3;
                    p9Timer = 0;
                    p9WaveCount = 0;
                }
            }
            continue;
        }
        
        if (b.isGoal) {
            const rectX = b.x - b.w/2;
            const rectY = b.y - b.h/2;
            const testX = Math.max(rectX, Math.min(player.x, rectX + b.w));
            const testY = Math.max(rectY, Math.min(player.y, rectY + b.h));
            const distX = player.x - testX;
            const distY = player.y - testY;
            const distance = Math.hypot(distX, distY);
            if (distance < player.size) {
                clearTimeout(turnTimer);
                startPlayerTurn();
                return; // 繧ｴ繝ｼ繝ｫ蛻ｰ驕疲凾縺ｯ蜊ｳ蠎ｧ縺ｫ蠖薙◆繧雁愛螳壼・逅・ｒ邨ゆｺ・＠縲√ム繝｡繝ｼ繧ｸ繧帝亟縺・

            }
            continue;
        }

        // 莉･髯阪・繝繝｡繝ｼ繧ｸ蛻､螳壹↑縺ｮ縺ｧ辟｡謨ｵ譎る俣荳ｭ縺ｯ辟｡隕・

        if (iFrames > 0) continue;

        if (b.isBone) {
            const rectX = b.x - b.w/2;
            const rectY = b.y - b.h/2;
            const testX = Math.max(rectX, Math.min(player.x, rectX + b.w));
            const testY = Math.max(rectY, Math.min(player.y, rectY + b.h));
            const distX = player.x - testX;
            const distY = player.y - testY;
            const distance = Math.hypot(distX, distY);
            
            if (distance < player.size - 2) {
                takeDamage();
                return;
            }
        } else if (b.isBeam) {
            if (b.state === 'FIRE') {
                if (b.angle !== undefined) {
                    // 隗貞ｺｦ莉倥″縺ｮ繝薙・繝�縺ｮ蠖薙◆繧雁愛螳・(轤ｹ縺ｨ邱壹・霍晞屬)
        const dist = Math.abs(Math.cos(b.angle)*(player.y - b.y) - Math.sin(b.angle)*(player.x - b.x));
                    if (dist < (b.h / 2) + player.size - 2) {
                        takeDamage();
                        return;
                    }
                } else {
                    if (Math.abs(player.x - b.x) < (player.size + b.w / 2) && 
                        Math.abs(player.y - b.y) < (player.size + b.h / 2)) {
                        takeDamage();
                        return;
                    }
                }
            }
        } else if (b.usePolar) {
            // 繝代ち繝ｼ繝ｳ2: 蜍輔＞縺ｦ縺・↑縺・→髱偵↓蠖薙◆繧九∝虚縺・※縺・ｋ縺ｨ繧ｪ繝ｬ繝ｳ繧ｸ縺ｫ蠖薙◆繧・

        const dist = Math.hypot(player.x - b.x, player.y - b.y);
            if (dist < player.size - 2 + b.size) { 
                if (b.color === '#00ccff' && !player.isMoving) continue;
                if (b.color === '#ff9900' && player.isMoving) continue;
                takeDamage();
                return;
            }
        } else {
            // 騾壼ｸｸ縺ｮ蜀・ｽ｢蠑ｾ・医ム繝｡繝ｼ繧ｸ逅・ｼ・

        const dist = Math.hypot(player.x - b.x, player.y - b.y);
            if (dist < player.size - 2 + b.w / 2) {
                takeDamage();
                return;
            }
        }
    }
    
    // 繝励Ξ繧､繝､繝ｼ縺ｮ蠑ｾ縺ｨ謨ｵ縺ｮ蠑ｾ縺ｮ陦晉ｪ∝愛螳・

    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const pb = playerBullets[i];
        let hit = false;
        
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (b.isDestructible) {
                const dist = Math.hypot(pb.x - b.x, pb.y - b.y);
                if (dist < (pb.w / 2 + b.w / 2)) {
                    if (b.isBomb) {
                        b.bombState = 'FLASHING';
                        b.bombTimer = 21; // 0.35遘・

                        b.dx = 0; // 蛛懈ｭ｢縺吶ｋ

            } else {
                        bullets.splice(j, 1);
                    }
                    hit = true;
                    break;
                }
            } else if (b.isSolidBlock) {
                // 蝗幄ｧ偵＞繝悶Ο繝・け縺ｨ縺ｮ陦晉ｪ∝愛螳夲ｼ郁・蠑ｾ縺�縺第ｶ域ｻ・ｼ・

        if (Math.abs(pb.x - b.x) < (pb.w / 2 + b.w / 2) && 
                    Math.abs(pb.y - b.y) < (pb.h / 2 + b.h / 2)) {
                    hit = true;
                    break;
                }
            }
        }
        
        if (hit) {
            playerBullets.splice(i, 1);
        }
    }
}

let lastTime = performance.now();
const FPS_INTERVAL = 1000 / 60;

function gameLoop() {
    if (gameState === 'GAME_OVER' || gameState === 'VICTORY') return;

    requestAnimationFrame(gameLoop);

    const now = performance.now();
    const elapsed = now - lastTime;
    if (elapsed < FPS_INTERVAL) return;

    lastTime = now - (elapsed % FPS_INTERVAL);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateBox();
    drawBox(); 

    if (gameState === 'ENEMY_TURN') {
        updatePlayer();
        frameCount++;
        
        if (currentAttackType === 2) {
            manageAttackPattern2();
        } else if (currentAttackType === 3) {
            manageAttackPattern3();
        } else if (currentAttackType === 4) {
            manageAttackPattern4(p4Timeline);
        } else if (currentAttackType === 5) {
            manageAttackPattern4(p4Timeline2);
        } else if (currentAttackType === 6) {
            manageAttackPattern6();
        } else if (currentAttackType === 7) {
            manageAttackPattern7();
        } else if (currentAttackType === 8) {
            manageAttackPattern8();
        } else if (currentAttackType === 9) {
            manageAttackPattern9();
        } else if (currentAttackType === 11) {
            manageAttackPattern11();
        }
        
        updateBullets();
        drawBullets();
        checkCollision();
    }

    drawPlayer();
    drawShockwaves();
}

// Start game initially
initGame();
