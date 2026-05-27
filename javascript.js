// --- 禁忌のデータ定義（アセット） ---
const RITUALS = [
    {
        name: "天命反転・神殺しの呪詛",
        phrase: ["急々如律令", "我が血を糧に", "神仏を屠れ"],
        fortunes: [
            { grade: "大吉", title: "『天命反転・神殺しの呪詛』", desc: "運命の鎖を引きちぎり、神仏さえも道を譲る全能の日。あらゆる因果がお前に味方する。" },
            { grade: "吉", title: "『八百万の夜会』", desc: "影の眷属や妖たちが味方し、不吉な予兆さえも糧とする日。恐れるものは何もない。" },
            { grade: "凶", title: "『百鬼夜行の導火線』", desc: "星の配置が歪む日。深淵の闇が濃いため、大人しく棺（部屋）の中で眠るべき日。" }
        ]
    },
    {
        name: "煉獄の狂宴・因果律崩壊",
        phrase: ["黒焔よ滾れ", "時空の歪みより", "万象を灰燼に帰せ"],
        fortunes: [
            { grade: "大吉", title: "『因果超克・業火の覇権』", desc: "世界の理を書き換えるほどの熱量が宿る。対峙するすべての宿敵を圧倒するだろう。" },
            { grade: "吉", title: "『狂乱の魔火』", desc: "小さな火種が運命を動かす。直感に従って動けば、深淵の加護が得られる日。" },
            { grade: "凶", title: "『焦熱の牢獄』", desc: "魔力が内側へ暴走しやすい。他者との接触を絶ち、内なる闇を統御せよ。" }
        ]
    },
    {
        name: "幽冥の刻印・深淵覚醒",
        phrase: ["開門せよ", "常闇の彼方から", "深淵の王を呼び覚ませ"],
        fortunes: [
            { grade: "大吉", title: "『全知覚醒・黙示録の解読』", desc: "サードアイが完全に開眼する日。未知のインスピレーションが脳内を駆け巡る。" },
            { grade: "吉", title: "『冥府の囁き』", desc: "死霊や過去の残滓が知恵を授けてくれる。目に見えない境界線を意識せよ。" },
            { grade: "凶", title: "『魂の迷宮』", desc: "意識が幽冥の境界を彷徨う。現実の座標を失わぬよう、楔（ルーティン）を打ち込め。" }
        ]
    }
];

const DUMMY_PHRASES = [
    "オン・バサラ", "時計の針を", "世界を統べよ", "夜明けを拒め", 
    "虚無の境界", "神々の黄昏", "禁忌の血脈", "ルシファーの息吹",
    "天網恢恢", "無間の狭間", "現世の幻影", "理を破壊せよ"
];

const DEMONS = [
    { rank: "【下級式神】", name: "影鰐 (カゲワニ)", highLv: false, speeches: { success: "…チッ、捕まったか。人間風情に縛られるとはな。", fail: "ハハハ！その程度の魔力で俺を従えようなど100年早い！" }},
    { rank: "【堕天使】", name: "マルファス", highLv: false, speeches: { success: "お前の魂の渇き、気に入った。しばらく力を貸してやろう。", fail: "不協和音だな。呪文すらまともに紡げぬ生肉め。" }},
    { rank: "【吸血鬼】", name: "アルカード", highLv: true, speeches: { success: "我が主よ…貴方の血の囁きに従い、この夜を支配しましょう。", fail: "魔力が霧散したな。我が牙でその未熟な首筋を正してやろうか？" }},
    { rank: "【深淵の王・鬼神】", name: "大獄丸 (オオタケマル)", highLv: true, speeches: { success: "フハハハ！我が主の器、見事なり！この天を共に覆そうぞ！", fail: "暴走か！脆弱な人間の器など、深淵の火に焼かれて消え失せるが良い！" }}
];

const RELICS = [
    "漆黒の魔力を宿す魔筆（ダーク_インカー）",
    "魔力供給用・漆黒の魔導導線（エーテル_ライン）",
    "生命を活性化させる静寂の秘薬（エルフ_エリクサー）",
    "運命を刻む記憶結晶（アカシック_ドライブ）",
    "神を拒絶する遮光の聖衣（ノワール_フード）"
];

// --- アプリケーションの状態管理 ---
let currentLevel = parseInt(localStorage.getItem("grim_player_level")) || 1;
let currentRitualIdx = 0;
let currentStep = 0; // 0:前節, 1:中節, 2:後節
let timerInterval = null;
let timeLeft = 0;
let maxTime = 0;
let selectedDemon = null;

// キャンバストレース用変数
const canvas = document.getElementById("trace-canvas");
const ctx = canvas.getContext("2d");
let isDrawing = false;
let tracePoints = [];
const targetShapePoints = []; // 五芒星の目標ポイント

// --- 初期化処理 ---
document.addEventListener("DOMContentLoaded", () => {
    updateLevelDisplay();
    setupEventListeners();
    initPentagramPoints();
});

function updateLevelDisplay() {
    document.getElementById("player-level").innerText = `LV. ${currentLevel}`;
    let rank = "【下級魔術師】";
    if (currentLevel >= 10) rank = "【深淵の召喚魔】";
    if (currentLevel >= 30) rank = "【禁忌の結社大導師】";
    if (currentLevel >= 50) rank = "【常闇を統べる魔皇】";
    document.getElementById("player-rank").innerText = rank;
    localStorage.setItem("grim_player_level", currentLevel);
}

function setupEventListeners() {
    // 儀式選択ボタン
    document.querySelectorAll(".ritual-btn[data-ritual]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            currentRitualIdx = parseInt(e.target.getAttribute("data-ritual"));
            startFirstRitual();
        });
    });

    // アカシックレコード開閉
    document.getElementById("btn-view-records").addEventListener("click", openRecords);
    document.getElementById("btn-close-records").addEventListener("click", () => switchScreen("screen-setup"));

    // 各種戻るボタン
    document.getElementById("btn-return-home").addEventListener("click", () => {
        currentLevel++; 
        updateLevelDisplay();
        switchScreen("screen-setup");
    });
    document.getElementById("btn-retry").addEventListener("click", () => switchScreen("screen-setup"));

    // トレースキャンバスのイベント
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
    
    canvas.addEventListener("touchstart", (e) => { e.preventDefault(); startDrawing(e.touches[0]); });
    canvas.addEventListener("touchmove", (e) => { e.preventDefault(); draw(e.touches[0]); });
    canvas.addEventListener("touchend", stopDrawing);
}

function switchScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
}

// --- 第一儀式：詠唱構築ロジック ---
function startFirstRitual() {
    currentStep = 0;
    const ritual = RITUALS[currentRitualIdx];
    document.getElementById("current-ritual-name").innerText = `◆ 執行中：${ritual.name}`;
    document.getElementById("constructed-text").innerText = "（呪詛を紡げ…）";
    
    const availableDemons = DEMONS.filter(d => currentLevel >= 15 ? true : !d.highLv);
    selectedDemon = availableDemons[Math.floor(Math.random() * availableDemons.length)];

    const totalChars = ritual.phrase.join("").length;
    maxTime = totalChars * 0.45; 
    timeLeft = maxTime;

    updateStepDots();
    generateChoices();
    switchScreen("screen-chant");

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 20);
}

function updateStepDots() {
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`step-dot-${i}`);
        if (i <= currentStep + 1) dot.classList.add("active");
        else dot.classList.remove("active");
    }
}

function generateChoices() {
    const container = document.getElementById("chant-choices");
    container.innerHTML = "";
    
    const ritual = RITUALS[currentRitualIdx];
    const correctPhrase = ritual.phrase[currentStep];

    let shuffledDummies = [...DUMMY_PHRASES].sort(() => 0.5 - Math.random());
    let choices = [correctPhrase, shuffledDummies[0], shuffledDummies[1]];
    choices.sort(() => 0.5 - Math.random());

    choices.forEach(text => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = text;
        btn.addEventListener("click", () => handleChoice(text, correctPhrase));
        container.appendChild(btn);
    });
}

function handleChoice(selected, correct) {
    if (selected === correct) {
        const ritual = RITUALS[currentRitualIdx];
        currentStep++;
        
        const activePhrases = ritual.phrase.slice(0, currentStep);
        document.getElementById("constructed-text").innerText = activePhrases.join("、");

        if (currentStep < 3) {
            updateStepDots();
            generateChoices();
        } else {
            clearInterval(timerInterval);
            startSecondRitual();
        }
    } else {
        triggerFailure();
    }
}

function updateTimer() {
    timeLeft -= 0.02;
    if (timeLeft <= 0) {
        timeLeft = 0;
        clearInterval(timerInterval);
        triggerFailure(); 
    }
    document.getElementById("timer-countdown").innerText = timeLeft.toFixed(2);
    
    const circle = document.getElementById("timer-circle");
    const ratio = timeLeft / maxTime;
    circle.style.borderColor = `rgba(197, 160, 89, ${0.2 + ratio * 0.8})`;
}

function triggerFailure() {
    clearInterval(timerInterval);
    document.getElementById("failure-speech").innerText = `「${selectedDemon.speeches.fail}」`;
    switchScreen("screen-failure");
}

// --- 第二儀式：魔印の束縛（キャンバストレース） ---
function initPentagramPoints() {
    const cx = 160, cy = 165, r = 100;
    const order = [0, 2, 4, 1, 3]; 
    for (let i = 0; i < 5; i++) {
        const angle = (parseInt(order[i]) * 72 - 90) * Math.PI / 180;
        targetShapePoints.push({
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle)
        });
    }
    targetShapePoints.push({ ...targetShapePoints[0] });
}

function startSecondRitual() {
    switchScreen("screen-trace");
    const ritual = RITUALS[currentRitualIdx];
    document.getElementById("final-chant-preview").innerText = `【完成せし真言】\n「${ritual.phrase.join("、")}」`;
    drawBasePentagram();
}

function drawBasePentagram() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = "rgba(197, 160, 89, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(160, 165, 115, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(139, 0, 0, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(targetShapePoints[0].x, targetShapePoints[0].y);
    for (let i = 1; i < targetShapePoints.length; i++) {
        ctx.lineTo(targetShapePoints[i].x, targetShapePoints[i].y);
    }
    ctx.stroke();

    ctx.fillStyle = "#8b0000";
    ctx.beginPath();
    ctx.arc(targetShapePoints[0].x, targetShapePoints[0].y, 6, 0, Math.PI * 2);
    ctx.fill();
}

function startDrawing(e) {
    isDrawing = true;
    tracePoints = [];
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    tracePoints.push({ x, y });
}

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    tracePoints.push({ x, y });

    drawBasePentagram();
    
    ctx.strokeStyle = "#c5a059";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#8b0000";
    
    ctx.beginPath();
    ctx.moveTo(tracePoints[0].x, tracePoints[0].y);
    for (let i = 1; i < tracePoints.length; i++) {
        ctx.lineTo(tracePoints[i].x, tracePoints[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; 
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    validateTrace();
}

function validateTrace() {
    if (tracePoints.length < 20) {
        drawBasePentagram();
        return; 
    }

    const startPt = tracePoints[0];
    const endPt = tracePoints[tracePoints.length - 1];
    const targetStart = targetShapePoints[0];

    const distStart = Math.hypot(startPt.x - targetStart.x, startPt.y - targetStart.y);
    const distEnd = Math.hypot(endPt.x - targetStart.x, endPt.y - targetStart.y);

    if (distStart < 35 && distEnd < 45) {
        showFinalOracle();
    } else {
        drawBasePentagram();
    }
}

// --- 第三儀式：深淵の託宣（結果発表） ---
function showFinalOracle() {
    const ritual = RITUALS[currentRitualIdx];
    
    const rand = Math.random();
    let fortuneIdx = 1; 
    if (rand > 0.75) fortuneIdx = 0; 
    else if (rand < 0.20) fortuneIdx = 2; 
    
    const outcome = ritual.fortunes[fortuneIdx];
    const item = RELICS[Math.floor(Math.random() * RELICS.length)];

    document.getElementById("demon-rank").innerText = selectedDemon.rank;
    document.getElementById("demon-name").innerText = `魔人：${selectedDemon.name}`;
    
    let speech = selectedDemon.speeches.success;
    if (selectedDemon.highLv && currentLevel >= 30) {
        speech = `「我が主（マスター）よ。よくぞ私をここまで引き上げた。本日も貴方の血肉となりて託宣を授けよう…」`;
    } else if (!selectedDemon.highLv && currentLevel >= 20) {
        speech = `...う、動けん！貴様の魔位が、いつの間にこれほど…！従う他ないようだな。」`;
    }
    document.getElementById("demon-speech").innerText = speech;

    document.getElementById("oracle-fortune").innerText = outcome.grade;
    document.getElementById("oracle-title").innerText = outcome.title;
    document.getElementById("oracle-desc").innerText = outcome.desc;
    document.getElementById("relic-item").innerText = item;

    saveToRecords(outcome.grade, outcome.title, item, selectedDemon.name);

    switchScreen("screen-result");
}

// --- アカシックレコード（データ保管） ---
function saveToRecords(grade, title, relic, demonName) {
    let records = JSON.parse(localStorage.getItem("grim_records")) || [];
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    records.unshift({
        date: dateStr,
        grade: grade,
        title: title,
        relic: relic,
        demon: demonName
    });

    if (records.length > 50) records.pop();
    localStorage.setItem("grim_records", JSON.stringify(records));
}

function openRecords() {
    const listContainer = document.getElementById("records-list");
    listContainer.innerHTML = "";
    
    const records = JSON.parse(localStorage.getItem("grim_records")) || [];
    
    if (records.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">未だ深淵との契約は記録されていない...</p>';
    } else {
        records.forEach(r => {
            const item = document.createElement("div");
            item.className = "record-item";
            item.innerHTML = `
                <div class="record-header">
                    <span>${r.date}</span>
                    <span>召喚対象: ${r.demon}</span>
                </div>
                <div class="record-body">
                    <span class="record-fortune">${r.grade}</span>
                    <span style="color:#c5a059;">${r.title}</span>
                    <div style="font-size:11px; color:#a49a88; margin-top:4px;">聖遺物: ${r.relic}</div>
                </div>
            `;
            listContainer.appendChild(item);
        });
    }
    
    switchScreen("screen-records");
}