const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const gameOverScreen = document.getElementById('game-over');
const endMessage = document.getElementById('end-message');
const statusText = document.getElementById('status-text');
const attackPrompt = document.getElementById('attack-prompt');
const monsterHpBar = document.getElementById('monster-hp-bar');
const playerHpBar = document.getElementById('player-hp-bar');
const playerHpText = document.getElementById('player-hp-text');
const warningMark = document.getElementById('warning-mark');

// Game constants
const MAX_PLAYER_HP = 20;
const MAX_MONSTER_HP = 200; // HP増加（ボスラッシュ対応）
const ENEMY_TURN_DURATION = 10000;
const I_FRAME_DURATION = 60;

// Game state
let gameState = 'START'; 
let playerHp = MAX_PLAYER_HP;
let monsterHp = MAX_MONSTER_HP;
let turnTimer = null;
let frameCount = 0;
let iFrames = 0;
let currentAttackType = 2; // 2〜6
let turnCount = 0; // 何ターン目か

// AoE Attack State (Pattern 3, 4, 5用)
let aoeState = 'NONE';
let aoeNumAttacks = 0;
let aoeAttacksDone = 0;
let aoeTimer = 0;
let flashFrames = 0;
let motionFrames = 0; 
let flashTriggerTimer = 0;

// バトルボックス
const box = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    currentW: 200,
    currentH: 200,
    targetW: 200,
    targetH: 200
};

// Player (Heart)
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 10,
    speed: 4, 
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
    trail: [] 
};

// Bullets and Shockwaves
let bullets = [];
let shockwaves = [];
let currentP4Timeline = [];

// パターン4 (盾) の固定シーケンス (通常)
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

// パターン5 (盾) の激しいシーケンス
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
    w: false, a: false, s: false, d: false
};

// Event listeners for keys
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (e.code === 'Space') {
        if (gameState === 'GAME_OVER' || gameState === 'VICTORY') {
            initGame();
        } else if (gameState === 'ENEMY_TURN' && (currentAttackType === 3 || currentAttackType === 4 || currentAttackType === 5)) {
            // パターン3,4,5はパリィ可能
            if (player.parryCooldown <= 0) {
                player.parryFrames = 30;
                player.parryCooldown = 30;
                shockwaves.push({ x: player.x, y: player.y, radius: player.size, alpha: 1.0 });
            }
        } else if (gameState === 'ENEMY_TURN' && currentAttackType === 6) {
            // ジャンプ処理
            if (player.isGrounded) {
                player.vy = player.jumpForce;
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
    
    // ジャンプの高さ調整
    if (e.code === 'Space' && gameState === 'ENEMY_TURN' && currentAttackType === 6) {
        if (player.vy < -3) {
            player.vy = -3;
        }
    }
});

function performAttack() {
    // 攻撃力を調整 (20〜30ダメージ)
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
    playerHp = MAX_PLAYER_HP;
    monsterHp = MAX_MONSTER_HP;
    turnCount = 0;
    updateUI();
    gameOverScreen.classList.add('hidden');
    // ゲームはプレイヤーのターンから開始する
    startPlayerTurn();
    requestAnimationFrame(gameLoop);
}

function startEnemyTurn() {
    gameState = 'ENEMY_TURN';
    bullets = [];
    shockwaves = [];
    frameCount = 0;
    if (attackPrompt) attackPrompt.classList.add('hidden');
    warningMark.classList.add('hidden');
    
    turnCount++;
    
    // ターン数に応じた攻撃パターンの制御
    if (turnCount === 1) currentAttackType = 2;
    else if (turnCount === 2) currentAttackType = 3;
    else if (turnCount === 3) currentAttackType = 4;
    else if (turnCount === 4) currentAttackType = 5;
    else if (turnCount === 5) currentAttackType = 6;
    else {
        // 6ターン目以降はランダム
        const types = [2, 3, 4, 5, 6];
        currentAttackType = types[Math.floor(Math.random() * types.length)];
    }
    
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.shieldDir = 'UP';
    player.dx = 0;
    player.dy = 0;
    player.vy = 0;
    player.isGrounded = false;
    player.trail = [];
    statusText.style.display = 'none';

    // パターンごとのボックス・カラー設定
    if (currentAttackType === 2) {
        box.targetW = 200; box.targetH = 200;
        player.color = '#ff0000'; // 赤
    } else if (currentAttackType === 3) {
        box.targetW = 200; box.targetH = 200;
        player.color = '#40e0d0'; // ターコイズ
    } else if (currentAttackType === 4 || currentAttackType === 5) {
        box.targetW = 100; box.targetH = 100;
        // 半々カラーは描画時に特殊処理
    } else if (currentAttackType === 6) {
        box.targetW = 400; box.targetH = 250;
        player.color = '#ff9900'; // オレンジ
    }

    aoeState = 'NONE';
    flashTriggerTimer = Math.floor(Math.random() * 100) + 60;

    let turnDuration = ENEMY_TURN_DURATION;
    if (currentAttackType === 6) {
        turnDuration = 12000; // 12秒
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
    bullets = []; 
    shockwaves = [];
    aoeState = 'NONE';
    warningMark.classList.add('hidden');
    if (attackPrompt) attackPrompt.classList.remove('hidden');
    
    player.color = '#ff0000';
    box.targetW = 400;
    box.targetH = 250;
    
    statusText.style.left = (canvas.width / 2 - 180) + 'px';
    statusText.style.top = (canvas.height / 2 - 100) + 'px';
    statusText.innerText = "* あなたの ターン だ。";
    statusText.style.display = 'block';
}

function setGameOver(isVictory) {
    gameState = isVictory ? 'VICTORY' : 'GAME_OVER';
    clearTimeout(turnTimer);
    bullets = [];
    shockwaves = [];
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
}

function drawBox() {
    if (flashFrames > 0) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(box.x - box.currentW / 2, box.y - box.currentH / 2, box.currentW, box.currentH);
    } else {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x - box.currentW / 2, box.y - box.currentH / 2, box.currentW, box.currentH);
    }
}

function takeDamage() {
    if (iFrames <= 0) {
        playerHp -= 4;
        if (playerHp < 0) playerHp = 0;
        iFrames = I_FRAME_DURATION;
        updateUI();
        if (playerHp === 0) setGameOver(false);
    }
}

function updatePlayer() {
    if (gameState !== 'ENEMY_TURN') return;

    if (currentAttackType === 2 || currentAttackType === 3) {
        // 通常移動
        player.dx = 0; player.dy = 0;
        if (keys.ArrowLeft || keys.a) player.dx = -player.speed;
        if (keys.ArrowRight || keys.d) player.dx = player.speed;
        if (keys.ArrowUp || keys.w) player.dy = -player.speed;
        if (keys.ArrowDown || keys.s) player.dy = player.speed;
        player.x += player.dx; player.y += player.dy;
        player.isMoving = (player.dx !== 0 || player.dy !== 0);

        const leftBound = box.x - box.currentW / 2 + player.size;
        const rightBound = box.x + box.currentW / 2 - player.size;
        const topBound = box.y - box.currentH / 2 + player.size;
        const bottomBound = box.y + box.currentH / 2 - player.size;

        if (player.x < leftBound) player.x = leftBound;
        if (player.x > rightBound) player.x = rightBound;
        if (player.y < topBound) player.y = topBound;
        if (player.y > bottomBound) player.y = bottomBound;

    } else if (currentAttackType === 4 || currentAttackType === 5) {
        // パターン4/5 (盾)
        player.x = box.x;
        player.y = box.y;
        if (keys.ArrowUp || keys.w) player.shieldDir = 'UP';
        else if (keys.ArrowDown || keys.s) player.shieldDir = 'DOWN';
        else if (keys.ArrowLeft || keys.a) player.shieldDir = 'LEFT';
        else if (keys.ArrowRight || keys.d) player.shieldDir = 'RIGHT';
        
    } else if (currentAttackType === 6) {
        // 残像の追加
        player.trail.push({x: player.x, y: player.y, alpha: 0.6});
        if (player.trail.length > 8) {
            player.trail.shift();
        }
        for (let i = 0; i < player.trail.length; i++) {
            player.trail[i].alpha -= 0.08;
        }

        // パターン6 (オレンジ重力)
        player.vy += player.gravity;
        player.y += player.vy;
        
        // オートラン（ホールド操作）
        if (keys.ArrowLeft || keys.a) player.dx = -player.speed;
        if (keys.ArrowRight || keys.d) player.dx = player.speed;
        player.x += player.dx;
        
        // 境界判定
        const leftBound = box.x - box.currentW / 2 + player.size;
        const rightBound = box.x + box.currentW / 2 - player.size;
        const topBound = box.y - box.currentH / 2 + player.size;
        const bottomBound = box.y + box.currentH / 2 - player.size;
        
        // 左の骨の壁判定 (幅25px)
        const leftBoneWall = box.x - box.currentW / 2 + 25;
        if (player.x - player.size < leftBoneWall) {
            takeDamage();
            player.x = leftBoneWall + player.size;
        } else if (player.x > rightBound) {
            player.x = rightBound;
        }
        
        // 着地判定
        if (player.y > bottomBound) {
            player.y = bottomBound;
            player.vy = 0;
            player.isGrounded = true;
        } else {
            player.isGrounded = false;
        }
        
        if (player.y < topBound) {
            player.y = topBound;
            player.vy = 0;
        }
    }
    
    if (iFrames > 0) iFrames--;
    if (player.parryFrames > 0) player.parryFrames--;
    if (player.parryCooldown > 0) player.parryCooldown--;
}

function drawPlayerShape(px, py) {
    ctx.beginPath();
    const topCurveHeight = player.size * 0.3;
    ctx.moveTo(px, py + topCurveHeight);
    ctx.bezierCurveTo(
        px - player.size / 2, py - player.size / 2, 
        px - player.size, py + player.size / 3, 
        px, py + player.size
    );
    ctx.bezierCurveTo(
        px + player.size, py + player.size / 3, 
        px + player.size / 2, py - player.size / 2, 
        px, py + topCurveHeight
    );
    ctx.fill();
    ctx.closePath();
}

function drawPlayer() {
    if (iFrames > 0 && Math.floor(iFrames / 5) % 2 === 0) return;
    
    if (gameState === 'ENEMY_TURN' && currentAttackType === 6) {
        // 残像の描画
        for (const t of player.trail) {
            if (t.alpha > 0) {
                ctx.fillStyle = `rgba(255, 153, 0, ${t.alpha})`;
                drawPlayerShape(t.x, t.y);
            }
        }
    }
    
    if (gameState === 'ENEMY_TURN' && (currentAttackType === 4 || currentAttackType === 5)) {
        // 半分ターコイズ、半分グリーンの描画
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
        
    } else {
        // 通常の描画 (赤, ターコイズ, オレンジ等)
        ctx.fillStyle = (player.parryFrames > 0 && currentAttackType === 3) ? '#ffffff' : player.color;
        drawPlayerShape(player.x, player.y);
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

// ==================== 攻撃管理系 ====================

// パターン2: 青・オレンジの円状攻撃
function manageAttackPattern2() {
    const attackInterval = 54;
    if (frameCount % attackInterval === 0) {
        // たまに（40%の確率で）回転する
        let aSpeed = 0;
        if (Math.random() < 0.4) {
            const aSpeedOpts = [0.01, 0.02, 0.03]; // 元の遅い、普通、早い
            const dir = Math.random() < 0.5 ? 1 : -1;
            aSpeed = aSpeedOpts[Math.floor(Math.random() * aSpeedOpts.length)] * dir;
        }
        
        const rSpeed = 3;
        const numBullets = 36;
        
        // オレンジを「連続で」5つにする
        const orangeStart = Math.floor(Math.random() * numBullets);
        
        for (let i = 0; i < numBullets; i++) {
            const angle = (Math.PI * 2 / numBullets) * i;
            
            // 連続5個の判定
            let isOrange = false;
            for (let j = 0; j < 5; j++) {
                if ((orangeStart + j) % numBullets === i) {
                    isOrange = true;
                    break;
                }
            }
            
            const color = isOrange ? '#ff9900' : '#00ccff';
            bullets.push({
                radius: 400, // 大きな半径からスタートさせて、先に見えるようにする
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

// 全体フラッシュ攻撃（パターン3, 4, 5で共通利用）
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
        document.getElementById('monster-sprite').classList.remove('wind-up');
        document.getElementById('monster-sprite').classList.remove('attacking');
        aoeState = 'NONE';
        flashTriggerTimer = Math.floor(Math.random() * 120) + 60; // 1〜3秒後
    }
    
    if (flashFrames > 0) flashFrames--;
    if (motionFrames > 0) {
        motionFrames--;
        if (motionFrames <= 0) {
            document.getElementById('monster-sprite').classList.remove('attacking');
            if (aoeState === 'WAIT') {
                document.getElementById('monster-sprite').classList.add('wind-up');
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
    document.getElementById('monster-sprite').classList.add('wind-up');
    
    aoeState = 'WARN';
    aoeTimer = 30; // 0.5秒
}

function triggerAoEFlash() {
    flashFrames = 5; 
    motionFrames = 15; 
    
    document.getElementById('monster-sprite').classList.remove('wind-up');
    document.getElementById('monster-sprite').classList.add('attacking');
    
    // パリィ判定
    if (player.parryFrames <= 0) {
        takeDamage();
    }
    
    aoeAttacksDone++;
    if (aoeAttacksDone < aoeNumAttacks) {
        aoeState = 'WAIT';
        aoeTimer = 30; 
    } else {
        aoeState = 'DONE';
    }
}

// パターン3: 全体フラッシュ攻撃のみ
function manageAttackPattern3() {
    manageAoEFlash();
}

// パターン4/5 (盾＋全体攻撃)
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

// パターン6 (オレンジ重力)
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

// ==================== 更新・描画 ====================
function updateBullets() {
    let minDist = Infinity;
    let closestBullet = null;

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        
        if (b.isBone) {
            b.x += b.dx;
            if (b.x < box.x - box.currentW / 2 - 50) bullets.splice(i, 1);
        } else if (b.isShieldBullet) {
            b.x += b.dx;
            b.y += b.dy;
            const distToCenter = Math.hypot(b.x - box.x, b.y - box.y);
            if (distToCenter < 15) {
                if (player.shieldDir === b.dir) {
                    bullets.splice(i, 1); // 防御成功
                } else {
                    bullets.splice(i, 1); // 被弾
                    takeDamage();
                }
                continue;
            }
            if (distToCenter < minDist) {
                minDist = distToCenter;
                closestBullet = b;
            }
            b.color = '#ffffff';
        } else if (b.usePolar) {
            // パターン2用
            b.radius -= b.radialSpeed;
            b.angle += b.angularSpeed;
            b.x = b.centerX + Math.cos(b.angle) * b.radius;
            b.y = b.centerY + Math.sin(b.angle) * b.radius;
            if (b.radius < 10) { bullets.splice(i, 1); continue; }
        }
    }
    
    if (closestBullet) {
        closestBullet.color = '#ff0000';
    }
}

function drawBullets() {
    for (const b of bullets) {
        ctx.fillStyle = b.color;
        if (b.isBone) {
            ctx.beginPath();
            ctx.roundRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h, 5);
            ctx.fill();
            ctx.closePath();
        } else {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    }
    
    // 左の骨壁 (パターン6用)
    if (gameState === 'ENEMY_TURN' && currentAttackType === 6) {
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
}

function checkCollision() {
    if (iFrames > 0 || gameState !== 'ENEMY_TURN') return;
    
    for (const b of bullets) {
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
        } else if (b.usePolar) {
            // パターン2: 動いていないと青に当たる、動いているとオレンジに当たる
            const dist = Math.hypot(player.x - b.x, player.y - b.y);
            if (dist < player.size - 2 + b.size) { 
                if (b.color === '#00ccff' && !player.isMoving) continue;
                if (b.color === '#ff9900' && player.isMoving) continue;
                takeDamage();
                return;
            }
        }
    }
}

function gameLoop() {
    if (gameState === 'GAME_OVER' || gameState === 'VICTORY') return;

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
        }
        
        updateBullets();
        drawBullets();
        checkCollision();
    }

    drawPlayer();
    drawShockwaves();
    requestAnimationFrame(gameLoop);
}

// Start game initially
initGame();
