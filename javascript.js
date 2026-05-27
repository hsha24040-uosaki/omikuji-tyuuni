const RITUALS = [
    { name: "天命反転・神殺しの呪詛", phrase: ["急々如律令", "我が血を糧に", "神仏を屠れ"], 
      fortunes: [ {grade:"大吉", title:"『天命反転』", desc:"運命の鎖を引きちぎり、神仏さえも道を譲る。"}, {grade:"吉", title:"『妖の夜会』", desc:"不吉な予兆さえも糧とする。"}, {grade:"凶", title:"『百鬼夜行』", desc:"星が歪む。棺の中で眠るべき。" } ] },
    { name: "煉獄の狂宴・因果律崩壊", phrase: ["黒焔よ滾れ", "時空の歪みより", "万象を灰燼に帰せ"], 
      fortunes: [ {grade:"大吉", title:"『因果超克』", desc:"世界の理を書き換える。"}, {grade:"吉", title:"『狂乱の魔火』", desc:"小さな火種が運勢を動かす。"}, {grade:"凶", title:"『焦熱の牢獄』", desc:"魔力が内側に暴走する。" } ] },
    { name: "幽冥の刻印・深淵覚醒", phrase: ["開門せよ", "常闇の彼方から", "深淵の王を呼び覚ませ"], 
      fortunes: [ {grade:"大吉", title:"『全知覚醒』", desc:"サードアイが完全に開眼する。"}, {grade:"吉", title:"『冥府の囁き』", desc:"死霊が知恵を授けてくれる。"}, {grade:"凶", title:"『魂の迷宮』", desc:"意識が境界を彷徨う。" } ] }
];

const DEMONS = [
    { id: "kagewani", rank: "【下級式神】", name: "影鰐", pts: 5, speech: "人間風情に縛られるとはな。", fail: "100年早い！" },
    { id: "malphas", rank: "【堕天使】", name: "マルファス", pts: 6, speech: "魂の渇き、気に入った。", fail: "不協和音だな。" },
    { id: "alucard", rank: "【吸血鬼】", name: "アルカード", pts: 7, speech: "我が主よ。夜を支配しましょう。", fail: "我が牙で首筋を正してやろうか？" },
    { id: "ootakemaru", rank: "【深淵の王】", name: "大獄丸", pts: 8, speech: "我が主の器、見事なり！", fail: "深淵の火に焼かれるが良い！" }
];

const RELICS = [
    { id: "fude", name: "漆黒の魔筆", desc: "深淵の泥を固めて造られた異形の筆。", effect: "【効果】書き綴った呪詛を実体化させ、現実の因果を歪める。" },
    { id: "dosen", name: "魔導導線", desc: "大気中の微細な魔力を集束させる特殊な糸。", effect: "【効果】詠唱にかかる時間を1秒短縮し、魔術の暴走を防ぐ。" },
    { id: "yakuhin", name: "静寂の秘薬", desc: "死霊の吐息を精製した、不気味な紫色の液体。", effect: "【効果】一時的に自らの魂の気配を消し、強力な魔物の逆鱗を回避する。" },
    { id: "kessho", name: "記憶結晶", desc: "過去の誇り高き大魔導師が遺した記憶の欠片。", effect: "【効果】脳内に失われた禁忌の真言を直接呼び戻し、知略を研ぎ澄ます。" }
];

const DUMMIES = ["オン・バサラ", "虚無の境界", "理を破壊せよ", "禁忌の血脈"];

let currentLevel = parseInt(localStorage.getItem("grim_lv")) || 1;
let currentRitualIdx = 0, currentStep = 0, timer = null, timeLeft = 0, selectedDemon = null;
const canvas = document.getElementById("trace-canvas"), ctx = canvas.getContext("2d");
let isDrawing = false, tracePoints = [], targetPoints = [];

document.addEventListener("DOMContentLoaded", () => { updateLV(); setup(); });

function updateLV() {
    document.getElementById("player-level").innerText = `LV. ${currentLevel}`;
    let rank = "【下級魔術師】";
    if (currentLevel >= 10) rank = "【深淵の召喚魔】";
    if (currentLevel >= 20) rank = "【結社大導師】";
    if (currentLevel >= 30) rank = "【常闇を統べる魔皇】";
    document.getElementById("player-rank").innerText = rank;
    localStorage.setItem("grim_lv", currentLevel);
}

function setup() {
    document.querySelectorAll(".ritual-btn[data-ritual]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            currentRitualIdx = parseInt(e.target.getAttribute("data-ritual"));
            startChant();
        });
    });

    document.getElementById("btn-level-info").onclick = () => document.getElementById("level-modal").classList.add("active");
    document.getElementById("btn-close-modal").onclick = () => document.getElementById("level-modal").classList.remove("active");

    document.getElementById("btn-return-home").onclick = () => { currentLevel++; updateLV(); showScreen("screen-setup"); };
    document.getElementById("btn-retry").onclick = () => showScreen("screen-setup");
    document.getElementById("btn-view-records").onclick = openRecords;
    document.getElementById("btn-close-records").onclick = () => showScreen("screen-setup");

    canvas.onmousedown = startDraw; canvas.onmousemove = drawing; canvas.onmouseup = stopDraw;
    canvas.ontouchstart = (e) => { e.preventDefault(); startDraw(e.touches[0]); };
    canvas.ontouchmove = (e) => { e.preventDefault(); drawing(e.touches[0]); };
    canvas.ontouchend = stopDraw;
}

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function startChant() {
    currentStep = 0;
    const ritual = RITUALS[currentRitualIdx];
    
    let maxDemonIdx = 0;
    if (currentLevel >= 10) maxDemonIdx = 1;
    if (currentLevel >= 20) maxDemonIdx = 2;
    if (currentLevel >= 30) maxDemonIdx = 3;
    
    const availableDemons = DEMONS.slice(0, maxDemonIdx + 1);
    selectedDemon = availableDemons[Math.floor(Math.random() * availableDemons.length)];
    
    unlockDemonInBook(selectedDemon.id);

    document.getElementById("current-ritual-name").innerText = `◆ 執行中：${ritual.name}`;
    document.getElementById("constructed-text").innerText = "（呪詛を紡げ…）";
    timeLeft = 15; showScreen("screen-chant");
    if (timer) clearInterval(timer);
    timer = setInterval(updateTimer, 20);
    genChoices();
}

function genChoices() {
    const container = document.getElementById("chant-choices"); container.innerHTML = "";
    const correct = RITUALS[currentRitualIdx].phrase[currentStep];
    const choices = [correct, ...DUMMIES.sort(() => 0.5 - Math.random()).slice(0, 2)].sort(() => 0.5 - Math.random());
    choices.forEach(t => {
        const b = document.createElement("button"); b.className = "choice-btn"; b.innerText = t;
        b.onclick = () => {
            if (t === correct) {
                currentStep++;
                document.getElementById("constructed-text").innerText = RITUALS[currentRitualIdx].phrase.slice(0, currentStep).join("、");
                if (currentStep < 3) genChoices(); else { clearInterval(timer); startTrace(); }
            } else fail();
        };
        container.appendChild(b);
    });
}

function updateTimer() {
    timeLeft -= 0.02; if (timeLeft <= 0) fail();
    document.getElementById("timer-countdown").innerText = timeLeft.toFixed(2);
}

function fail() {
    clearInterval(timer);
    document.getElementById("failure-speech").innerText = `「${selectedDemon.fail}」`;
    showScreen("screen-failure");
}

function startTrace() {
    showScreen("screen-trace");
    document.getElementById("final-chant-preview").innerText = `【構築完了】「${RITUALS[currentRitualIdx].phrase.join("、")}」`;
    document.getElementById("trace-instruction").innerText = `${selectedDemon.name}の魔印（${selectedDemon.pts}芒星）を解放せよ`;
    initPoints(selectedDemon.pts);
    drawBase();
}

function initPoints(n) {
    targetPoints = []; const cx = 160, cy = 160, r = 110;
    const step = (n % 2 === 0) ? (n / 2 - 1) : Math.floor(n / 2);
    for (let i = 0; i < n; i++) {
        const idx = (i * step) % n;
        const angle = (idx * (360 / n) - 90) * Math.PI / 180;
        targetPoints.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
    targetPoints.push(targetPoints[0]);
}

function drawBase() {
    ctx.clearRect(0,0,320,320);
    ctx.strokeStyle = "rgba(197, 160, 89, 0.7)"; ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(targetPoints[0].x, targetPoints[0].y);
    targetPoints.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#8b0000";
    targetPoints.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.fill(); });
}

function startDraw(e) { isDrawing = true; tracePoints = []; const rect = canvas.getBoundingClientRect(); tracePoints.push({x: e.clientX - rect.left, y: e.clientY - rect.top}); }
function drawing(e) {
    if(!isDrawing) return;
    const rect = canvas.getBoundingClientRect(); tracePoints.push({x: e.clientX - rect.left, y: e.clientY - rect.top});
    drawBase(); ctx.strokeStyle = "#c5a059"; ctx.lineWidth = 4; ctx.shadowBlur = 10; ctx.shadowColor = "#8b0000";
    ctx.beginPath(); ctx.moveTo(tracePoints[0].x, tracePoints[0].y);
    tracePoints.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); ctx.shadowBlur = 0;
}
function stopDraw() { if(!isDrawing) return; isDrawing = false; checkTrace(); }
function checkTrace() {
    const start = tracePoints[0], end = tracePoints[tracePoints.length - 1], target = targetPoints[0];
    if (Math.hypot(start.x-target.x, start.y-target.y) < 40 && Math.hypot(end.x-target.x, end.y-target.y) < 50 && tracePoints.length > 20) {
        showResult();
    } else drawBase();
}

function showResult() {
    const ritual = RITUALS[currentRitualIdx];
    const outcome = ritual.fortunes[Math.floor(Math.random()*ritual.fortunes.length)];
    
    const selectedRelic = RELICS[Math.floor(Math.random()*RELICS.length)];
    unlockRelicInBook(selectedRelic.id);

    let speech = selectedDemon.speech;
    if (selectedDemon.id === "kagewani" && currentLevel >= 20) {
        speech = "...う、動けん！貴様の魔位、いつの間にこれほど…！従う他ないようだな。";
    } else if (selectedDemon.id === "malphas" && currentLevel >= 30) {
        speech = "お前の魂の深淵にひれ伏そう。我が魔力を好きに使うが良い、マスター。";
    } else if (currentLevel >= 30) {
        speech = `「我が主（マスター）よ。よくぞ私をここまで引き上げた。本日も貴方の血肉となりて託宣を授けよう…」`;
    }

    document.getElementById("demon-rank").innerText = selectedDemon.rank;
    document.getElementById("demon-name").innerText = `魔人：${selectedDemon.name}`;
    document.getElementById("demon-speech").innerText = `「${speech}」`;
    document.getElementById("oracle-fortune").innerText = outcome.grade;
    document.getElementById("oracle-title").innerText = outcome.title;
    document.getElementById("oracle-desc").innerText = outcome.desc;
    
    document.getElementById("relic-item").innerText = selectedRelic.name;
    document.getElementById("relic-effect-desc").innerText = `${selectedRelic.desc} ${selectedRelic.effect}`;
    
    saveRecord(outcome.grade, outcome.title, selectedRelic.name, selectedDemon.name);
    showScreen("screen-result");
}

function saveRecord(g, t, r, d) {
    let recs = JSON.parse(localStorage.getItem("grim_recs")) || [];
    recs.unshift({ date: new Date().toLocaleString(), grade: g, title: t, relic: r, demon: d });
    localStorage.setItem("grim_recs", JSON.stringify(recs.slice(0, 50)));
}

function unlockDemonInBook(demonId) {
    let unlocked = JSON.parse(localStorage.getItem("grim_unlocked_demons")) || [];
    if (!unlocked.includes(demonId)) {
        unlocked.push(demonId);
        localStorage.setItem("grim_unlocked_demons", JSON.stringify(unlocked));
    }
}

function unlockRelicInBook(relicId) {
    let unlocked = JSON.parse(localStorage.getItem("grim_unlocked_relics")) || [];
    if (!unlocked.includes(relicId)) {
        unlocked.push(relicId);
        localStorage.setItem("grim_unlocked_relics", JSON.stringify(unlocked));
    }
}

function openRecords() {
    // 1. 消えていたアカシックレコードを正常に再構築
    const list = document.getElementById("records-list"); 
    list.innerHTML = "";
    const recs = JSON.parse(localStorage.getItem("grim_recs")) || [];
    
    if (recs.length === 0) {
        list.innerHTML = "<p class='empty-message'>未だ深淵との契約ログなし</p>";
    } else {
        recs.forEach(r => {
            const d = document.createElement("div"); 
            d.className = "record-item";
            d.innerHTML = `<span style="color:#a49a88;">[${r.date}]</span> 召喚: <b>${r.demon}</b><br><span style="color:#8b0000; font-weight:bold; margin-right:5px;">${r.grade}</span> <span style="color:#c5a059;">${r.title}</span> / 遺物: ${r.relic}`;
            list.appendChild(d);
        });
    }

    // 2. デーモンアーカイブ
    const bookGrid = document.getElementById("demon-book-grid"); bookGrid.innerHTML = "";
    const unlockedDemons = JSON.parse(localStorage.getItem("grim_unlocked_demons")) || [];

    DEMONS.forEach(d => {
        const itemBox = document.createElement("div");
        const isUnlocked = unlockedDemons.includes(d.id);
        if (isUnlocked) {
            itemBox.className = "book-item unlocked";
            itemBox.innerHTML = `
                <span class="book-rank">${d.rank}</span>
                <span class="book-name">魔人：${d.name}</span>
                <span style="font-size:9px; color:#c5a059;">固有魔印: ${d.pts}芒星</span>
                <div class="book-speech">「${d.speech}」</div>
            `;
        } else {
            itemBox.className = "book-item";
            itemBox.innerHTML = `
                <span class="book-rank" style="color:#444;">【封印指定】</span>
                <span class="book-name" style="color:#444;">？？？？ (未覚醒)</span>
                <span style="font-size:9px; color:#333;">必要魔位: ？？？</span>
            `;
        }
        bookGrid.appendChild(itemBox);
    });

    // 3. レリックアーカイブ
    const relicGrid = document.getElementById("relic-book-grid"); relicGrid.innerHTML = "";
    const unlockedRelics = JSON.parse(localStorage.getItem("grim_unlocked_relics")) || [];

    RELICS.forEach(r => {
        const itemBox = document.createElement("div");
        const isUnlocked = unlockedRelics.includes(r.id);
        if (isUnlocked) {
            itemBox.className = "book-item unlocked";
            itemBox.innerHTML = `
                <span class="book-rank" style="color:#c5a059;">【聖遺物】</span>
                <span class="book-name">${r.name}</span>
                <div class="book-speech" style="font-size:9px; color:#a49a88; border:none; padding:0;">${r.desc}</div>
                <div class="book-speech" style="color:#fff; border-top:1px dashed rgba(197,160,89,0.2); font-weight:bold;">${r.effect}</div>
            `;
        } else {
            itemBox.className = "book-item";
            itemBox.innerHTML = `
                <span class="book-rank" style="color:#444;">【未解明構造】</span>
                <span class="book-name" style="color:#444;">？？？？ (未発見)</span>
                <span style="font-size:9px; color:#333;">出現確率: ？？％</span>
            `;
        }
        relicGrid.appendChild(itemBox);
    });

    showScreen("screen-records");
}