import { createState, recordRound, oppBelief, myRemaining, color, arrToMask, resultOf } from "./game.js";
import POLICY from "./policy.js";
function gcd(a,b){while(b){[a,b]=[b,a%b];}return a;}
function beliefKey(sc){let g=0;for(const s of sc)g=gcd(g,s.weight);if(g===0)g=1;return sc.map(s=>[s.remainingMask,s.weight/g]).sort((a,b)=>a[0]-b[0]).map(([m,w])=>m+":"+w).join(",");}
function stateKey(myMask,sc,colStr){return myMask+"|"+beliefKey(sc)+"|"+(colStr==="black"?0:1);}
function mb(a){return ()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
let rnd=mb(99);
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const M=parseInt(process.argv[2]||"100000",10);
let sum=0,misses=0,wins=0,losses=0,ties=0,coins=0;
for(let g=0;g<M;g++){
  const deck=shuffle([0,1,2,3,4,5,6,7,8]);
  const st=createState();let margin=0,w=0;
  for(let r=0;r<9;r++){
    const o=deck[r],colStr=color(o);
    const myMask=arrToMask(myRemaining(st));
    const {scenarios}=oppBelief(st);
    const key=stateKey(myMask,scenarios,colStr);
    let card=POLICY[key];
    if(card===undefined){misses++;card=myRemaining(st)[0];}
    const res=resultOf(card,o);
    if(res==="higher"){margin++;w++;}else if(res==="lower")margin--;
    recordRound(st,{leader:"opp",myCard:card,oppColor:colStr,result:res});
  }
  sum+=margin;if(margin>0)wins++;else if(margin<0)losses++;else ties++;coins+=w+(margin>0?margin:0);
}
console.log(`policy over ${M} games: avg margin ${(sum/M).toFixed(4)} | win ${(wins/M*100).toFixed(1)}% tie ${(ties/M*100).toFixed(1)}% loss ${(losses/M*100).toFixed(1)}% | coins ${(coins/M).toFixed(3)}`);
console.log(`table MISSES: ${misses} (must be 0)`);
