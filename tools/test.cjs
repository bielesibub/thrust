const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(){
 const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const els={};const el=id=>els[id]??(els[id]={value:id==='practice'?'0':'original',width:288,height:240,textContent:'',getContext:()=>ctx,addEventListener(){},setAttribute(){},focus(){}});
 const listeners={};const box={console,URLSearchParams,location:{search:'?test'},performance:{now:()=>0},localStorage:{getItem(){return null},setItem(){}},document:{hidden:false,getElementById:el,createElement:()=>el(Math.random()),querySelectorAll:()=>[],addEventListener:(n,f)=>listeners[n]=f},addEventListener:(n,f)=>listeners[n]=f,requestAnimationFrame(){},setTimeout(){}};
 box.window=box;vm.createContext(box);vm.runInContext(code,box);return {g:box.thrustTest,els,listeners,box,ctx};
}
let {g}=boot();
for(let i=0;i<6;i++){
 g.state.level=i;g.buildLevel(i);g.render();
 assert.equal(g.objects.length,g.LEVELS[i].objs.length);
 assert(!g.rockAt(g.ship.x+16,g.ship.y+8),'spawn clear '+i);
 const pod=g.objects.find(o=>o.type===5);
 console.log('level',i+1,'pod',pod.x,pod.y,'walls',g.world.left[pod.y/2],g.world.right[pod.y/2]);
 assert(g.world.left[pod.y/2]<pod.x/4&&g.world.right[pod.y/2]>pod.x/4,'pod accessible '+i);
 assert(g.objPix.every(p=>p.every(([x,y])=>x<24&&y<30)),'object sprite bounds');
}
g.state.screen='play';g.state.level=0;g.buildLevel(0);
const y=g.ship.y;for(let i=0;i<16;i++)g.tick();assert(g.ship.y>y,'gravity');
g.buildLevel(0);g.K.thrust=1;for(let i=0;i<16;i++)g.tick();assert(g.ship.y<y,'thrust');assert.equal(g.state.fuel,994);
g.K.thrust=0;g.buildLevel(0);g.K.rotr=1;for(let i=0;i<16;i++)g.tick();assert.equal(g.ship.angle,12);g.K.rotr=0;
g.ship.x=g.pod.x;g.ship.y=g.pod.y-40;g.attachPod();assert(g.ship.attached);assert.equal(g.ship.my,(g.ship.y+g.pod.y)/2);
g.state.level=5;g.levelComplete();assert.equal(g.state.level,6);assert(g.state.reverse);g.loseLife();assert.equal(g.objects.length,4);
for(let i=0;i<6;i++)g.levelComplete();assert(g.state.invisible);assert(!g.state.reverse);
for(const hz of [50,60,100,120,144,59.94]){
 const {g,els}=boot();g.frame(1000);let count=0;
 for(let i=1;i<=Math.round(hz*60);i++)g.frame(1000+i*1000/hz);
 assert(Math.abs(g.state.tick-Math.floor(Math.round(hz*60)/hz*1000/30))<=1,`clock drift ${hz}: ${g.state.tick}`);
 console.log('timing',hz,'Hz:',g.state.tick,'ticks');
}
console.log('All source data, gameplay and timing checks passed.');
{
 const {g}=boot();g.startGame();g.ship.x=g.pod.x;g.ship.y=g.pod.y-30;g.K.shield=1;g.collisions();assert(g.ship.tractor);assert(!g.ship.attached);
 g.ship.y=g.pod.y-45;g.collisions();assert(g.ship.attached,'two-stage tractor locks when taut');
 g.startGame();const fuel=g.objects.find(o=>o.type===4);g.ship.x=fuel.x-12;g.ship.y=fuel.y-35;g.ship.mx=g.ship.x;g.ship.my=g.ship.y;g.K.shield=1;const before=g.state.fuel;
 for(let i=0;i<26;i++)g.collisions();assert(g.state.fuel>before);assert(!fuel.alive);assert.equal(g.state.score,30);
 g.startGame();const reactor=g.objects.find(o=>o.type===6);for(let i=0;i<40&&reactor.alive;i++)g.hitObject(reactor,{});assert(!reactor.alive,'reactor critical');g.explodePlanet();assert.equal(g.state.screen,'dying');
 g.startGame();g.ship.x=0;g.ship.y=900;g.collisions();assert.equal(g.state.screen,'dying','terrain collision');
 g.state.level=3;g.state.screen='play';g.buildLevel(3);const wall=g.world.left[0x269];g.hitObject(g.objects.find(o=>o.type===8),{});for(let i=0;i<16;i++)g.updateDoor();assert(g.world.left[0x269]<wall,'door opens');for(let i=0;i<260;i++)g.updateDoor();assert.equal(g.world.left[0x269],wall,'door closes');
}
for(const hz of [50,60,100,120,144,59.94]){
 const {g,els}=boot();g.frame(1000);for(let i=1;i<=200;i++)g.frame(1000+i*1000/hz);
 els.pace.onchange({target:{value:'smooth'}});const start=5000;g.frame(start);const before=g.state.tick,k=g.fit(hz),holds=[];let last=g.state.tick;
 for(let i=1;i<=600;i++){g.frame(start+i*1000/hz);if(g.state.tick!==last){holds.push(i);last=g.state.tick;}}
 assert.equal(g.state.tick-before,Math.floor(600/k));assert(holds.slice(1).every((v,i)=>v-holds[i]===k),'uniform holds '+hz);
}
{
 const {g,listeners}=boot();g.startGame();g.K.thrust=1;listeners.blur();assert.equal(g.K.thrust,0);const t=g.state.tick;g.tick();assert.equal(g.state.tick,t);
 g.pauseGame(false);g.frame(1000);g.frame(2000);assert(g.state.paused,'overload pauses');assert.equal(g.state.tick,t);
}
console.log('Tractor, refuelling, reactor, doors, collisions, smooth holds and suspension checks passed.');
{
 const {g}=boot();assert.equal(g.STATUS_BAR.length,1152,'two original HUD rows');assert(g.INTRO_BYTES.length>400,'original instructions extracted');
 for(const [name,p]of Object.entries(g.SND)){
  const pcm=g.synthSound(p,22050,1);
  assert(pcm.length>0&&pcm.length<=22050*10,name+' bounded duration');
  assert(pcm.every(n=>Number.isFinite(n)&&Math.abs(n)<=.25),name+' finite unclipped audio');
  if(p.amp!==0)assert(pcm.some(n=>n!==0),name+' audible');else assert(pcm.every(n=>n===0),'silence block');
  const fast=g.synthSound(p,22050,2);assert(Math.abs(pcm.length/2-fast.length)<=221,name+' pacing');
 }
 console.log('Source HUD, intro, sound buffers, silence and audio pacing checks passed.');
}
// Reproduce a death with real game scheduling and a recording AudioContext.
// Timed stops do not end sources immediately: this catches voices that would
// otherwise remain audible after the respawn, including queued sounds.
{
 const {g,box,els}=boot(),sources=[];
 class FakeAudioContext{
  constructor(){this.currentTime=0;this.sampleRate=8000;this.destination={};}
  resume(){} suspend(){}
  createGain(){return {gain:{value:0},connect(){}};}
  createBuffer(channels,length){const pcm=new Float32Array(length);return {getChannelData:()=>pcm};}
  createBufferSource(){const source={connect(){},disconnect(){},start(time){this.started=time;},stop(time){if(time===undefined){this.cancelled=true;this.onended?.();}else this.scheduledStop=time;}};sources.push(source);return source;}
 }
 box.AudioContext=FakeAudioContext;
 els.start.onclick();els.start.onclick();els.start.onclick();g.K.thrust=1;for(let i=0;i<4;i++)g.tick();
 const engineSources=sources.slice();assert(engineSources.length>0,'engine voice started');
 g.killShip();assert(engineSources.every(s=>s.cancelled),'engine stops on death');
 const deathSources=sources.slice(engineSources.length);assert.equal(deathSources.length,2,'one pair of explosion voices');
 assert(deathSources.some(s=>s.scheduledStop>90*.03),'reproduce explosion lasting beyond respawn');
 g.killShip();assert.equal(sources.length,engineSources.length+2,'death sound does not retrigger');
 g.K.thrust=0;for(let i=0;i<90;i++)g.tick();
 assert.equal(g.state.screen,'play','respawn reached');assert(deathSources.every(s=>s.cancelled),'all explosion voices cancelled at respawn');
 const afterRespawn=sources.length;g.tick();assert.equal(sources.length,afterRespawn,'no stale sound restarts');
 g.state.lives=1;g.killShip();const lastDeath=sources.slice(-2);for(let i=0;i<90;i++)g.tick();
 assert.equal(g.state.screen,'highscores');assert(lastDeath.every(s=>s.cancelled),'game over is silent');
 console.log('Death, respawn and game-over audio lifecycle regression passed.');
}

{
 const {g,box,els}=boot(),storage=new Map();
 box.localStorage.getItem=k=>storage.get(k)??null;box.localStorage.setItem=(k,v)=>storage.set(k,v);
 assert.equal(g.state.screen,'splash');g.advanceScreen();assert.equal(g.state.screen,'title');g.advanceScreen();assert.equal(g.state.screen,'highscores');g.advanceScreen();assert.equal(g.state.screen,'play');
 assert.equal(g.highScores.length,8);assert.equal(g.highScores[0].name,'SPACELORD');assert.equal(g.highScores[7].score,500);
 g.state.score=499;g.gameOver();assert.equal(g.state.screen,'highscores');assert(els['score-entry'].hidden);
 g.startGame();g.state.score=15001;g.gameOver();assert.equal(g.state.screen,'nameentry');assert(!els['score-entry'].hidden);
 g.saveHighScore('test pilot!!');assert.equal(g.state.screen,'highscores');assert.equal(g.highScores[1].score,15001);assert.equal(g.highScores[1].name,'TEST PILO');assert.equal(g.highScores.length,8);
 assert.equal(g.loadHighScores()[1].name,'TEST PILO','saved table reloads');
 const saved=JSON.stringify(g.highScores);g.saveHighScore('DUPLICATE');assert.equal(JSON.stringify(g.highScores),saved,'submit cannot duplicate entry');
 g.startGame();g.state.score=g.highScores[7].score;g.gameOver();assert.equal(g.state.screen,'nameentry','equal score qualifies as in source');g.saveHighScore('');assert(g.highScores.some(e=>e.name==='ANONYMOUS'));
 storage.set('thrust.highscores.v1','broken');assert.equal(g.loadHighScores()[0].name,'SPACELORD','corrupt storage falls back');
 box.localStorage.setItem=()=>{throw Error('blocked');};g.startGame();g.state.score=99999;g.gameOver();g.saveHighScore('OFFLINE');assert.equal(g.highScores[0].name,'OFFLINE','blocked storage still works in memory');
 console.log('Splash flow, ranking, name entry, persistence, ties and unavailable storage passed.');
}

{
 const {g,ctx}=boot();const pixels=new Map();
 ctx.fillRect=(x,y,w,h)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixels.set(`${xx},${yy}`,ctx.fillStyle);};
 for(const score of [0,75,1050,123456]){
  g.state.score=score;g.drawHUD();
  for(let y=9;y<14;y++)for(let x=256;x<264;x++)assert.equal(pixels.get(`${x},${y}`),'#000','no baked-in trailing zero');
  const digits=String(score).padStart(6,' ');
  for(let d=0;d<6;d++)for(let y=0;y<5;y++)for(let x=0;x<8;x++){
    const value=digits[d]===' '?0:g.FONT[y][Number(digits[d])+27];
    assert.equal(pixels.get(`${208+d*8+x},${9+y}`),value&(128>>x)?'#ffff00':'#000','HUD score matches numeric value');
  }
 }
}
{
 const {g}=boot();g.startGame();g.ship.attached=true;g.pod.collected=true;g.ship.mx=432;g.ship.my=570;g.ship.vx=0;g.ship.vy=0;g.ship.tetherAngle=0;
 g.tick();assert.equal(g.state.screen,'orbit','escape begins transition');assert.equal(g.state.level,0);assert.equal(g.state.score,0);
 const position=[g.ship.x,g.ship.y,g.pod.x,g.pod.y];g.K.thrust=1;g.K.fire=1;
 g.tick();assert.deepEqual([g.ship.x,g.ship.y,g.pod.x,g.pod.y],position,'transition freezes physics');
 const elapsed=g.state.teleport;g.pauseGame(true);g.tick();assert.equal(g.state.teleport,elapsed,'pause freezes transition');g.pauseGame(false);
 assert(g.TELEPORT_FRAMES.some(points=>points.length>0));assert.equal(g.TELEPORT_FRAMES.at(-1).length,0,'effect fully erases');
 const duration=2+g.TELEPORT_FRAMES.length+14;
 while(g.state.teleport<duration-1){g.tick();g.render();assert.equal(g.state.level,0);}
 g.tick();assert.equal(g.state.screen,'play');assert.equal(g.state.level,1);assert.equal(g.state.score,2000,'bonus awarded after effect');
 g.tick();assert.equal(g.state.level,1,'mission advances once');
 console.log('HUD pixel values and escape animation lifecycle checks passed.');
}
