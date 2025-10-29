// 基本時計・ストップウォッチ・アラーム切替
const slider = document.getElementById('sliderHours');
const labelHours = document.getElementById('labelHours');
const display = document.getElementById('display');

const tabClock = document.getElementById('tabClock');
const tabStopwatch = document.getElementById('tabStopwatch');
const tabAlarm = document.getElementById('tabAlarm');
const tabSettings = document.getElementById('tabSettings');

const stopwatchArea = document.getElementById('stopwatchArea');
const alarmArea = document.getElementById('alarmArea');
const settingsArea = document.getElementById('settingsArea');

const startBtn = document.getElementById('startBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const lapsDiv = document.getElementById('laps');

const addAlarmBtn = document.getElementById('addAlarmBtn');
const alarmsList = document.getElementById('alarmsList');

const showSecondsCheckbox = document.getElementById('showSeconds');

let customHours = Number(localStorage.getItem('nclock_hours')) || 24;
slider.value = customHours;
labelHours.textContent = `${customHours} 時間`;

let showSeconds = JSON.parse(localStorage.getItem('showSeconds')) || true;
showSecondsCheckbox.checked = showSeconds;

let mode = localStorage.getItem('nclock_mode') || 'clock';

let running = false;
let elapsedMs = Number(localStorage.getItem('nclock_sw_elapsed')) || 0;
let lastPerf = null;
let laps = JSON.parse(localStorage.getItem('nclock_sw_laps')||'[]');
let alarms = JSON.parse(localStorage.getItem('nclock_alarms')||'[]');

renderLaps();
renderAlarms();

function saveSettings(){ 
  localStorage.setItem('nclock_hours', String(customHours)); 
  localStorage.setItem('nclock_mode', mode); 
  localStorage.setItem('nclock_sw_elapsed', String(elapsedMs)); 
  localStorage.setItem('nclock_sw_laps', JSON.stringify(laps));
  localStorage.setItem('nclock_alarms', JSON.stringify(alarms));
  localStorage.setItem('showSeconds', JSON.stringify(showSeconds));
}

slider.addEventListener('input', e=>{
  customHours = Number(e.target.value);
  labelHours.textContent = `${customHours} 時間`;
  saveSettings();
});

tabClock.addEventListener('click', ()=>{ switchMode('clock'); });
tabStopwatch.addEventListener('click', ()=>{ switchMode('stopwatch'); });
tabAlarm.addEventListener('click', ()=>{ switchMode('alarm'); });
tabSettings.addEventListener('click', ()=>{ switchMode('settings'); });

function switchMode(newMode){
  mode=newMode;
  tabClock.classList.toggle('active',mode==='clock');
  tabStopwatch.classList.toggle('active',mode==='stopwatch');
  tabAlarm.classList.toggle('active',mode==='alarm');
  tabSettings.classList.toggle('active',mode==='settings');

  stopwatchArea.style.display=(mode==='stopwatch')?'block':'none';
  alarmArea.style.display=(mode==='alarm')?'block':'none';
  settingsArea.style.display=(mode==='settings')?'block':'none';
  slider.parentElement.style.display=(mode==='clock')?'block':'none';
  saveSettings();
}

// stopwatch buttons
startBtn.addEventListener('click', ()=>{
  if(!running){
    running = true;
    lastPerf = performance.now();
    startBtn.textContent = 'Stop';
    startBtn.classList.remove('btn-start'); startBtn.classList.add('btn-stop');
    lapBtn.disabled = false; resetBtn.disabled = true;
  } else {
    running = false;
    startBtn.textContent = 'Start';
    startBtn.classList.remove('btn-stop'); startBtn.classList.add('btn-start');
    lapBtn.disabled = true; resetBtn.disabled = false;
    saveSettings();
  }
});

lapBtn.addEventListener('click', ()=>{
  laps.unshift(display.textContent);
  if(laps.length>50) laps.pop();
  renderLaps();
  saveSettings();
});

resetBtn.addEventListener('click', ()=>{
  elapsedMs=0; laps=[]; renderLaps(); resetBtn.disabled=true; saveSettings();
});

function renderLaps(){
  lapsDiv.innerHTML = laps.length===0?'<div style="color:#888;padding:8px;">ラップなし</div>':laps.map((t,i)=>`<div class="lap-item"><div>Lap ${laps.length-i}</div><div>${t}</div></div>`).join('');
}

// alarm
addAlarmBtn.addEventListener('click',()=>{
  const time = prompt("アラーム時間をHH:MMで入力");
  if(!time) return;
  alarms.push({time,enabled:true});
  renderAlarms();
  saveSettings();
});

function renderAlarms(){
  alarmsList.innerHTML='';
  alarms.forEach((a,i)=>{
    const div=document.createElement('div');
    div.className='lap-item';
    div.innerHTML=`<span>${a.time}</span>
      <label><input type="checkbox" ${a.enabled?'checked':''} data-index="${i}"></label>
      <button data-index="${i}">削除</button>`;
    alarmsList.appendChild(div);
  });
}

alarmsList.addEventListener('change', e=>{
  if(e.target.tagName==='INPUT'){
    const i=Number(e.target.dataset.index);
    alarms[i].enabled=e.target.checked;
    saveSettings();
  }
});
alarmsList.addEventListener('click', e=>{
  if(e.target.tagName==='BUTTON'){
    const i=Number(e.target.dataset.index);
    alarms.splice(i,1);
    renderAlarms();
    saveSettings();
  }
});

// settings
showSecondsCheckbox.addEventListener('change',e=>{
  showSeconds=e.target.checked;
  saveSettings();
});

// main tick
function tick(now){
  if(running && mode==='stopwatch'){
    const dt = now-lastPerf;
    elapsedMs += dt*(24/customHours);
    lastPerf=now;
  }

  if(mode==='clock'){
    const realDate=new Date();
    const speed=24/customHours;
    let h=realDate.getHours();
    let m=realDate.getMinutes();
    let s=realDate.getSeconds();
    display.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}${showSeconds?':'+String(s).padStart(2,'0'):''}`;
  } else if(mode==='stopwatch'){
    const totalSec=Math.floor(elapsedMs/1000);
    const h=Math.floor(totalSec/3600);
    const m=Math.floor(totalSec/60)%60;
    const s=totalSec%60;
    display.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}${showSeconds?':'+String(s).padStart(2,'0'):''}`;
  }

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
setInterval(saveSettings,2000);
