/* Slice object library: every object is a closed 3D mesh (x right, y down, z away). 15 easy, 15 medium, 10 hard, 5 finales.
   Exposes window.SLICE_LIB; index.html picks from the tiers. */
(()=>{
'use strict';
const mm=(A,B)=>{const C=new Array(9);for(let r=0;r<3;r++)for(let c=0;c<3;c++)C[r*3+c]=A[r*3]*B[c]+A[r*3+1]*B[3+c]+A[r*3+2]*B[6+c];return C};
const Rx=a=>{const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,c,-s,0,s,c]};
const Ry=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,0,s,0,1,0,-s,0,c]};
const Rz=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,-s,0,s,c,0,0,0,1]};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const newell=q=>{let x=0,y=0,z=0;for(let i=0;i<q.length;i++){const a=q[i],b=q[(i+1)%q.length];x+=(a[1]-b[1])*(a[2]+b[2]);y+=(a[2]-b[2])*(a[0]+b[0]);z+=(a[0]-b[0])*(a[1]+b[1])}const l=Math.hypot(x,y,z)||1;return[x/l,y/l,z/l]};
const LIGHT=(()=>{const v=[-.4,-.7,-.6],l=Math.hypot(...v);return v.map(x=>x/l)})();
function finishMesh(V,F){
  let vol=0,c=[0,0,0];
  for(const f of F){const q=f.idx.map(i=>V[i]);for(let i=1;i+1<q.length;i++){const t=dot(q[0],cross(q[i],q[i+1]))/6;vol+=t;for(let k=0;k<3;k++)c[k]+=t*(q[0][k]+q[i][k]+q[i+1][k])/4}}
  if(vol<0)F.forEach(f=>f.idx.reverse());
  c=c.map(x=>x/vol);V=V.map(v=>[v[0]-c[0],v[1]-c[1],v[2]-c[2]]);
  const m=Math.max(...V.map(v=>Math.hypot(...v)));return{V:V.map(v=>v.map(x=>x/m)),F};
}
function gridMesh(rings){
  const m=rings[0].length,V=[].concat(...rings),F=[];
  for(let i=0;i+1<rings.length;i++)for(let j=0;j<m;j++){const j2=(j+1)%m;F.push({idx:[i*m+j,i*m+j2,(i+1)*m+j2,(i+1)*m+j],cap:false})}
  return finishMesh(V,F);
}
const lathe=(prof,m=32)=>gridMesh(prof.map(([rho,y])=>Array.from({length:m},(_,j)=>{const a=j/m*2*Math.PI;return[rho*Math.cos(a),y,rho*Math.sin(a)]})));
function radial(fn,nLat,nLon,warp=0,warpLat=warp){
  const w=v=>(1-warp)*v+warp*v*v*v,wl=v=>(1-warpLat)*v+warpLat*v*v*v,rings=[];
  for(let i=0;i<=nLat;i++){const th=Math.PI/2+Math.PI/2*wl(i/nLat*2-1),ring=[];
    for(let j=0;j<nLon;j++){const ph=-Math.PI/2+Math.PI*w(j/nLon*2-1),d=[Math.sin(th)*Math.cos(ph),-Math.cos(th),Math.sin(th)*Math.sin(ph)],r=fn(d);ring.push([d[0]*r,d[1]*r,d[2]*r])}
    rings.push(ring)}
  return gridMesh(rings);
}
function farExit(d,e){
  const a=-(e.rot||0),cs=Math.cos(a),sn=Math.sin(a),ox=-e.c[0],oy=-e.c[1],oz=-e.c[2];
  const qx=(ox*cs-oy*sn)/e.r[0],qy=(ox*sn+oy*cs)/e.r[1],qz=oz/e.r[2],dx=(d[0]*cs-d[1]*sn)/e.r[0],dy=(d[0]*sn+d[1]*cs)/e.r[1],dz=d[2]/e.r[2];
  const A=dx*dx+dy*dy+dz*dz,B=2*(qx*dx+qy*dy+qz*dz),C=qx*qx+qy*qy+qz*qz-1,D=B*B-4*A*C;
  if(D<0)return 0;const t=(-B+Math.sqrt(D))/(2*A);return t>0?t:0;
}
const blobs=(comps,post,k=.045)=>d=>{const rs=comps.map(e=>farExit(d,e)).filter(x=>x>0);const m=Math.max(...rs);let s=0;for(const x of rs)s+=Math.exp((x-m)/k);const r=m+k*Math.log(s);return post?post(d,r):r};
const E=(c,r,rot)=>({c,r,rot});
const near=(d,v,w)=>{const l=Math.hypot(...v);return Math.exp(-(1-dot(d,v)/l)/w)};

/* ---------- object library: every Slice object is a closed 3D mesh ---------- */
// building blocks that return raw parts {V,F}; combine() joins parts and centers/scales the result
function gridRaw(rings){
  const m=rings[0].length,V=[].concat(...rings),F=[];
  for(let i=0;i+1<rings.length;i++)for(let j=0;j<m;j++){const j2=(j+1)%m;F.push({idx:[i*m+j,i*m+j2,(i+1)*m+j2,(i+1)*m+j],cap:false})}
  return{V,F};
}
const latheRaw=(prof,m=32)=>gridRaw(prof.map(([rho,y])=>Array.from({length:m},(_,j)=>{const a=j/m*2*Math.PI;return[rho*Math.cos(a),y,rho*Math.sin(a)]})));
function radialRaw(fn,nLat,nLon,warp=0,warpLat=warp){
  const w=v=>(1-warp)*v+warp*v*v*v,wl=v=>(1-warpLat)*v+warpLat*v*v*v,rings=[];
  for(let i=0;i<=nLat;i++){const th=Math.PI/2+Math.PI/2*wl(i/nLat*2-1),ring=[];
    for(let j=0;j<nLon;j++){const ph=-Math.PI/2+Math.PI*w(j/nLon*2-1),d=[Math.sin(th)*Math.cos(ph),-Math.cos(th),Math.sin(th)*Math.sin(ph)],r=fn(d);ring.push([d[0]*r,d[1]*r,d[2]*r])}
    rings.push(ring)}
  return gridRaw(rings);
}
// a tube along a curve: f(t) gives the point, rf(t) the radius (0 at both ends closes it)
function tubeRaw(f,n,rf,m=14){
  const pts=Array.from({length:n},(_,i)=>f(i/(n-1))),rings=[];let N=null;
  for(let i=0;i<n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)];let T=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];const tl=Math.hypot(...T)||1;T=T.map(x=>x/tl);
    if(!N){const up=Math.abs(T[2])<.9?[0,0,1]:[1,0,0];N=cross(T,up)}
    const d=dot(N,T);N=[N[0]-d*T[0],N[1]-d*T[1],N[2]-d*T[2]];const nl=Math.hypot(...N)||1;N=N.map(x=>x/nl);
    const B=cross(T,N),r=rf(i/(n-1)),p=pts[i];
    rings.push(Array.from({length:m},(_,j)=>{const q=j/m*2*Math.PI,c=Math.cos(q)*r,s=Math.sin(q)*r;return[p[0]+N[0]*c+B[0]*s,p[1]+N[1]*c+B[1]*s,p[2]+N[2]*c+B[2]*s]}))}
  return gridRaw(rings);
}
const endR=(t,e=.12)=>{const u=Math.min(t,1-t)/e;return u>=1?1:Math.sqrt(Math.max(0,1-(1-u)*(1-u)))}; // rounded tube ends
function torusRaw(R,r,nu=36,nv=14){
  const rings=[];for(let i=0;i<=nu;i++){const u=i/nu*2*Math.PI;rings.push(Array.from({length:nv},(_,j)=>{const v=j/nv*2*Math.PI,rr=R+r*Math.cos(v);return[rr*Math.cos(u),r*Math.sin(v),rr*Math.sin(u)]}))}
  return gridRaw(rings);
}
function slabRaw(poly,depth){ // a flat outline with thickness (fins, sails)
  const n=poly.length,V=[...poly.map(([x,y])=>[x,y,depth]),...poly.map(([x,y])=>[x,y,-depth])];
  const F=[{idx:Array.from({length:n},(_,i)=>i),cap:false},{idx:Array.from({length:n},(_,i)=>2*n-1-i),cap:false}];
  for(let i=0;i<n;i++){const j=(i+1)%n;F.push({idx:[i,n+i,n+j,j],cap:false})}
  return{V,F};
}
const xf=(m,f)=>({V:m.V.map(f),F:m.F});
const move=(m,dx,dy,dz,s=1)=>xf(m,([x,y,z])=>[x*s+dx,y*s+dy,z*s+dz]);
const turn=(m,M)=>xf(m,([x,y,z])=>[M[0]*x+M[1]*y+M[2]*z,M[3]*x+M[4]*y+M[5]*z,M[6]*x+M[7]*y+M[8]*z]);
function partVol(p){let v=0;for(const f of p.F){const q=f.idx.map(i=>p.V[i]);for(let i=1;i+1<q.length;i++)v+=dot(q[0],cross(q[i],q[i+1]))/6}return v}
function combine(...parts){const V=[],F=[];for(const p of parts){const flip=partVol(p)<0,o=V.length;V.push(...p.V);for(const f of p.F)F.push({idx:(flip?f.idx.slice().reverse():f.idx).map(i=>i+o),cap:false})}return finishMesh(V,F)}
const one=p=>combine(p);
const arc=(cx0,cy0,R,a0,a1,z=0)=>t=>{const a=a0+(a1-a0)*t;return[cx0+R*Math.cos(a),cy0+R*Math.sin(a),z]};
const lineP=(a,b)=>t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const angOf=d=>Math.atan2(d[2],d[0]);

// x right, y down, z away from you. Profiles for lathe run top to bottom and end on the axis.
const OBJECTS={
  /* ----- easy: symmetrical ----- */
  vase:()=>lathe([[0,-1.1],[.36,-1.1],[.3,-.95],[.24,-.7],[.3,-.45],[.48,-.15],[.62,.2],[.6,.55],[.45,.85],[.42,1.1],[0,1.1]],36),
  pawn:()=>{const p=[[0,-1.2]];for(let i=1;i<=8;i++){const a=i/8*Math.PI*.8;p.push([.34*Math.sin(a),-.86-.34*Math.cos(a)])}
    return lathe(p.concat([[.38,-.52],[.38,-.45],[.2,-.4],[.24,.1],[.36,.55],[.55,.8],[.56,1.05],[0,1.05]]),32)},
  bell:()=>lathe([[0,-1.15],[.1,-1.15],[.1,-.95],[.3,-.9],[.42,-.7],[.46,-.3],[.55,.1],[.75,.5],[.95,.75],[.98,.85],[0,.85]],36),
  apple:()=>{const p=[[0,-1.2],[.05,-1.2],[.05,-.6]];for(let i=1;i<16;i++){const a=i/16*Math.PI;
      p.push([.9*Math.sin(a)*(1-.08*Math.cos(a)),-.78*Math.cos(a)+.25*Math.exp(-a*a*5)-.15*Math.exp(-((Math.PI-a)**2)*5)])}
    p.push([0,.63]);return lathe(p,32)},
  pear:()=>lathe([[0,-1.2],[.04,-1.2],[.04,-.98],[.16,-.9],[.26,-.7],[.3,-.45],[.4,-.2],[.58,.1],[.68,.42],[.64,.72],[.45,.92],[.18,1.0],[0,1.0]],32),
  spintop:()=>lathe([[0,-1.2],[.08,-1.2],[.08,-.9],[.7,-.75],[.85,-.5],[.7,-.15],[.15,.7],[0,1]],32),
  cupcake:()=>lathe([[0,-1.05],[.12,-1.02],[.22,-.9],[.18,-.82],[.45,-.72],[.42,-.62],[.68,-.5],[.66,-.38],[.86,-.25],[.88,-.12],[.78,-.04],[.7,0],[.52,.9],[0,.9]],36),
  donut:()=>one(torusRaw(.68,.34,36,16)),
  egg:()=>{const p=[];for(let i=0;i<=20;i++){const a=i/20*Math.PI;p.push([.74*Math.sin(a)*(1-.14*Math.cos(a)),-Math.cos(a)])}return lathe(p,32)},
  pin:()=>lathe([[0,-1.2],[.12,-1.19],[.2,-1.1],[.22,-.95],[.17,-.7],[.13,-.55],[.2,-.3],[.38,.1],[.45,.45],[.4,.85],[.3,1.1],[0,1.12]],32),
  hourglass:()=>lathe([[0,-1.1],[.7,-1.1],[.72,-1.0],[.6,-.95],[.55,-.7],[.35,-.25],[.12,0],[.35,.25],[.55,.7],[.6,.95],[.72,1.0],[.7,1.1],[0,1.1]],32),
  lamp:()=>lathe([[0,-1.0],[.32,-1.0],[.82,-.25],[.78,-.2],[.12,-.2],[.08,.62],[.5,.78],[.55,.92],[0,.92]],36),
  trophy:()=>{const cup=latheRaw([[0,-1.05],[.72,-1.05],[.68,-.7],[.48,-.32],[.18,-.12],[.1,.2],[.15,.45],[.45,.6],[.5,.8],[.5,.95],[0,.95]],32);
    const h=s=>tubeRaw(t=>{const a=-Math.PI*.55+t*Math.PI*1.1;return[s*(.62+.3*Math.cos(a)),-.7+.28*Math.sin(a),0]},14,t=>.06*endR(t,.08),10);
    return combine(cup,h(1),h(-1))},
  acorn:()=>lathe([[0,-1.15],[.06,-1.15],[.06,-.95],[.45,-.85],[.7,-.6],[.78,-.42],[.62,-.38],[.66,-.1],[.6,.3],[.42,.7],[.15,.95],[0,1.02]],32),
  onion:()=>lathe([[0,-1.15],[.04,-1.15],[.1,-.9],[.3,-.6],[.62,-.3],[.78,0],[.7,.35],[.45,.62],[.2,.72],[.1,.85],[0,.85]],32),

  /* ----- medium: a little uneven ----- */
  mushroom:()=>lathe([[0,-1],[.45,-.95],[.8,-.75],[1,-.42],[1.02,-.25],[.9,-.18],[.3,-.22],[.26,.5],[.32,.85],[.3,.95],[0,.95]],36),
  duck:()=>radial(blobs([E([0,.15,0],[1,.6,.72]),E([-.55,-.55,0],[.42,.42,.42]),E([-1,-.47,0],[.3,.08,.2]),E([.92,-.12,0],[.28,.22,.2],-.6)]),28,40),
  fish:()=>radial(blobs([E([-.15,0,0],[.85,.5,.28]),E([.85,0,0],[.22,.5,.06]),E([-.1,-.5,0],[.35,.12,.04]),E([-.75,.05,0],[.25,.3,.24])],null,.05),28,44),
  lemon:()=>lathe([[0,-1.15],[.1,-1.05],[.38,-.82],[.58,-.5],[.64,0],[.58,.5],[.38,.82],[.1,1.05],[0,1.15]],32),
  pumpkin:()=>combine(radialRaw(blobs([E([0,.1,0],[1,.66,1])],(d,r)=>r*(1-.09*Math.pow(Math.abs(Math.cos(4*angOf(d))),.5)*Math.min(1,Math.hypot(d[0],d[2])*1.4))),28,48),
    tubeRaw(t=>[.04*t,-.5-.32*t,0],8,t=>.1*(1-.3*t)*endR(t,.15),10)),
  pepper:()=>combine(radialRaw(blobs([E([0,.05,0],[.75,.9,.75])],(d,r)=>{const lobes=1+.08*Math.cos(3*angOf(d));const bot=d[1]>.4?1-.18*Math.abs(Math.sin(1.5*angOf(d)))*(d[1]-.4):1;return r*lobes*bot}),28,48),
    tubeRaw(t=>[.12*Math.sin(t*2),-.8-.3*t,0],10,t=>.09*endR(t,.12),10)),
  snail:()=>combine(move(radialRaw(blobs([E([0,0,0],[.62,.62,.42])],(d,r)=>r*(1-.07*Math.abs(Math.sin(3*Math.atan2(d[1],d[0])+2*Math.hypot(d[0],d[1]))))),24,36),.05,-.25,0),
    move(radialRaw(blobs([E([0,0,0],[1.05,.22,.3]),E([-.75,-.25,0],[.24,.3,.24])]),20,32),-.1,.45,0),
    tubeRaw(lineP([-.9,0,-.08],[-1.05,-.45,-.1]),8,t=>.045*endR(t,.15),8),tubeRaw(lineP([-.9,0,.08],[-1.0,-.45,.12]),8,t=>.045*endR(t,.15),8)),
  icecream:()=>lathe([[0,-1.1],[.35,-1.05],[.6,-.85],[.7,-.55],[.66,-.32],[.74,-.24],[.6,-.18],[.05,1.1],[0,1.12]],32),
  rocket:()=>{const body=latheRaw([[0,-1.2],[.15,-1.05],[.3,-.75],[.36,-.3],[.36,.5],[.3,.75],[.22,.85],[0,.86]],28);
    const fin=a=>turn(slabRaw([[.3,.25],[.75,.75],[.75,.95],[.3,.7]],.035),Ry(a));
    return combine(body,fin(0),fin(2*Math.PI/3),fin(4*Math.PI/3))},
  sailboat:()=>combine(move(radialRaw(blobs([E([0,0,0],[1.05,.3,.38])],(d,r)=>d[1]<0?Math.min(r,.06/Math.max(.02,-d[1])):r),20,36),0,.55,0),
    tubeRaw(lineP([.05,.4,0],[.05,-1.15,0]),10,t=>.035*endR(t,.05),8),
    slabRaw([[-.02,-1.05],[-.02,.25],[-.85,.25]],.02),slabRaw([[.12,-.95],[.12,.2],[.75,.2]],.02)),
  bulb:()=>lathe([[0,-1.1],[.4,-1.05],[.68,-.8],[.75,-.45],[.62,-.1],[.38,.2],[.32,.4],[.35,.45],[.3,.5],[.35,.55],[.3,.6],[.35,.65],[.28,.8],[.12,.95],[0,.96]],32),
  mug:()=>combine(latheRaw([[0,-.8],[.6,-.8],[.62,-.75],[.6,.75],[.55,.8],[0,.8]],32),
    tubeRaw(t=>{const a=-Math.PI/2+t*Math.PI;return[.6+.38*Math.cos(a),.42*Math.sin(a)*1.1,0]},14,t=>.09*endR(t,.06),10)),
  boot:()=>combine(move(radialRaw(blobs([E([0,0,0],[.42,.85,.42]),E([0,-.85,0],[.46,.1,.46]),E([.1,.55,0],[.42,.3,.4])]),28,32),-.3,-.12,0),move(radialRaw(blobs([E([0,0,0],[.72,.3,.42]),E([.32,.04,0],[.45,.26,.38])],null,.06),24,36),.15,.5,0)),
  carrot:()=>combine(latheRaw([[0,-.95],[.2,-.95],[.34,-.8],[.36,-.55],[.3,-.1],[.2,.4],[.1,.85],[0,1.15]],28),
    ...[-.5,0,.5].map(a=>tubeRaw(t=>[Math.sin(a)*.5*t,-.9-.55*t,Math.cos(a)*.08*t],8,t=>.06*endR(t,.15),8))),
  banana:()=>combine(tubeRaw(arc(0,-.9,1.5,Math.PI*.22,Math.PI*.78),30,t=>.24*Math.pow(Math.sin(Math.PI*t),.6),14),
    tubeRaw(lineP([1.15,.07,0],[1.32,-.1,0]),6,t=>.05*endR(t,.15),8)),

  /* ----- hard: lopsided ----- */
  teapot:()=>radial(blobs([E([0,.1,0],[.8,.6,.8]),E([0,-.52,0],[.48,.14,.48]),E([0,-.72,0],[.13,.11,.13]),E([-.95,-.22,0],[.45,.1,.1],.75),E([.95,.05,0],[.18,.36,.1])]),28,44),
  whale:()=>radial(blobs([E([0,0,0],[1.05,.5,.55]),E([-.35,-.12,0],[.7,.45,.5]),E([1.15,-.15,0],[.16,.1,.42],-.4),E([-.2,.35,.32],[.25,.06,.18]),E([-.2,.35,-.32],[.25,.06,.18])]),28,40),
  rock:r=>{const ph=Array.from({length:6},()=>r()*6);
    return radial(blobs([E([0,0,0],[.95,.72,.82])],(d,rr)=>rr*(1+.13*Math.sin(3*d[0]+ph[0])*Math.sin(2*d[1]+ph[1])+.09*Math.sin(5*d[2]+ph[2])+.06*Math.sin(7*d[0]+4*d[1]+ph[3]))),24,32)},
  sneaker:()=>radial(blobs([E([0,.22,0],[1.1,.3,.42]),E([-.38,-.12,0],[.6,.42,.38]),E([.45,.08,0],[.62,.28,.38]),E([-.5,-.45,0],[.34,.14,.32])],null,.09),32,52),
  guitar:()=>combine(radialRaw(blobs([E([0,.5,0],[.72,.55,.2]),E([0,-.18,0],[.52,.42,.2])],(d,r)=>r*(1-.12*near(d,[0,-.1,-1],.08))),24,40),
    tubeRaw(lineP([0,-.45,0],[0,-1.4,0]),10,t=>.09*endR(t,.04),10),move(slabRaw([[-.15,0],[.15,0],[.18,-.4],[-.18,-.4]],.05),0,-1.37,0)),
  dino:()=>radial(blobs([E([.1,0,0],[.8,.48,.48]),E([-.72,-.58,0],[.55,.22,.22],.95),E([-1.12,-1.02,0],[.28,.18,.18]),E([1.05,.12,0],[.72,.18,.18],-.25),
    E([-.35,.5,.25],[.13,.32,.13]),E([-.35,.5,-.25],[.13,.32,.13]),E([.5,.5,.25],[.15,.32,.15]),E([.5,.5,-.25],[.15,.32,.15])],null,.06),32,48),
  cat:()=>combine(radialRaw(blobs([E([0,.3,0],[.55,.7,.5]),E([0,-.55,0],[.42,.38,.38]),E([.22,-.92,0],[.1,.16,.08]),E([-.22,-.92,0],[.1,.16,.08]),E([0,-.45,-.36],[.1,.07,.06])]),30,40),
    tubeRaw(t=>{const a=t*Math.PI*1.2;return[.45*Math.cos(a)+.05,.92-.08*t,.45*Math.sin(a)-.05]},16,t=>.08*endR(t,.08),10)),
  octopus:()=>{const head=radialRaw(blobs([E([0,-.35,0],[.62,.72,.6])]),24,32),arms=[];
    for(let k=0;k<8;k++){const a=k/8*2*Math.PI,c=Math.cos(a),s=Math.sin(a);
      arms.push(tubeRaw(t=>{const rr=.3+.75*t,yy=.2+.55*Math.sin(t*2.2)-.25*t*t;return[c*rr,yy,s*rr]},16,t=>.14*(1-t*.85)*endR(t,.04),10))}
    return combine(head,...arms)},
  cloud:r=>{const j=()=>(r()-.5)*.15;return radial(blobs([E([0,0,0],[.62,.5,.5]),E([-.65+j(),.12,j()],[.45,.36,.42]),E([.65+j(),.1,j()],[.48,.38,.42]),E([-.25+j(),-.35,j()],[.42,.42,.4]),E([.3+j(),-.32,.1],[.4,.4,.4]),E([0,.3,0],[.9,.22,.4])],null,.08),28,40)},
  cactus:()=>combine(tubeRaw(lineP([0,1.1,0],[0,-1.2,0]),18,t=>.3*(t>.85?Math.sqrt(Math.max(0,1-((t-.85)/.15)**2)):t<.06?Math.sqrt(Math.max(0,1-((.06-t)/.06)**2)):1),16), // closed at both ends
    tubeRaw(t=>t<.45?[-.2-t/.45*.45,.15,0]:[-.65-.08*Math.sin((t-.45)/.55*Math.PI/2),.15-(t-.45)/.55*.75,0],16,t=>.17*endR(t,.08),12),
    tubeRaw(t=>t<.4?[.2+t/.4*.4,-.2,0]:[.6+.06*Math.sin((t-.4)/.6*Math.PI/2),-.2-(t-.4)/.6*.6,0],16,t=>.15*endR(t,.08),12)),

  /* ----- finales ----- */
  bust:()=>radial(blobs([
      E([0,-.12,.05],[.74,.9,.86]),E([0,.35,-.12],[.55,.5,.6]),E([0,.85,.15],[.38,.55,.38]),E([0,1.25,.12],[.98,.42,.58]),
      E([0,.12,-.72],[.1,.22,.2]),E([0,-.24,-.7],[.42,.07,.12]),E([0,.48,-.62],[.2,.07,.12]),E([0,.72,-.48],[.22,.14,.16]),
      E([.72,0,.08],[.1,.22,.16]),E([-.72,0,.08],[.1,.22,.16])],
    (d,r)=>{r-=.07*(near(d,[.27,-.08,-.8],.012)+near(d,[-.27,-.08,-.8],.012));
      if(d[1]<.05&&d[2]>-.6)r+=.022*Math.sin(14*Math.atan2(d[2],d[0]))*Math.sin(10*Math.acos(Math.max(-1,Math.min(1,-d[1]))))*Math.min(1,(.05-d[1])*4);
      return r}),52,52,.5,.2),
  moai:()=>radial(blobs([E([0,-.15,0],[.52,1.05,.58]),E([0,-.62,-.42],[.5,.12,.22]),E([0,-.18,-.6],[.14,.4,.16]),E([0,.38,-.5],[.3,.08,.14]),E([0,.68,-.32],[.36,.22,.3]),
    E([.55,-.2,0],[.1,.42,.16]),E([-.55,-.2,0],[.1,.42,.16]),E([0,1.05,0],[.6,.14,.55])],(d,r)=>r-.06*(near(d,[.25,-.55,-.8],.01)+near(d,[-.25,-.55,-.8],.01))),40,44,.3,.1),
  anchor:()=>combine(tubeRaw(lineP([0,-.8,0],[0,.95,0]),12,t=>.1*endR(t,.04),12),
    move(torusRaw(.2,.06,20,8),0,-1.0,0),
    tubeRaw(lineP([-.55,-.55,0],[.55,-.55,0]),8,t=>.08*endR(t,.08),10),
    tubeRaw(arc(0,.15,.85,Math.PI*.1,Math.PI*.9),22,t=>.1*endR(t,.04),12),
    move(radialRaw(blobs([E([0,0,0],[.2,.13,.06],-.8)]),10,14),.8,.45,0),move(radialRaw(blobs([E([0,0,0],[.2,.13,.06],.8)]),10,14),-.8,.45,0)),
  crown:()=>{const m=48,rings=[],ang=j=>j/m*2*Math.PI,tri=a=>{const u=(a*5/(2*Math.PI))%1;return 1-Math.abs(u*2-1)};
    rings.push(Array.from({length:m},()=>[0,-.15,0]));
    rings.push(Array.from({length:m},(_,j)=>{const a=ang(j);return[.78*Math.cos(a),-.25-.65*Math.pow(tri(a),1.6),.78*Math.sin(a)]}));
    rings.push(Array.from({length:m},(_,j)=>{const a=ang(j);return[.85*Math.cos(a),-.1-.6*Math.pow(tri(a),1.6),.85*Math.sin(a)]}));
    for(const [rr,y] of [[.88,.15],[.94,.22],[.94,.42],[.88,.5]])rings.push(Array.from({length:m},(_,j)=>{const a=ang(j);return[rr*Math.cos(a),y,rr*Math.sin(a)]}));
    rings.push(Array.from({length:m},()=>[0,.5,0]));
    const balls=[];for(let k=0;k<5;k++){const a=(k+.5)/5*2*Math.PI;balls.push(move(radialRaw(d=>.09,8,10),.9*Math.cos(a)*.86,-.95,.9*Math.sin(a)*.86))}
    return combine(gridRaw(rings),...balls)},
  dragonegg:()=>radial(d=>{const r=farExit(d,E([0,.08,0],[.7,1,.7])),th=Math.acos(Math.max(-1,Math.min(1,-d[1]))),ph=angOf(d);
    return r*(1+.045*Math.abs(Math.sin(8*ph+4*th))*Math.abs(Math.sin(9*th)))},36,48),
};

const OBJ_COLOR={vase:'#7cc8ff',pawn:'#ece7de',bell:'#f2c14e',apple:'#ff7a6b',pear:'#c9dc6a',spintop:'#ff8ad8',cupcake:'#ff8ad8',donut:'#e8a96a',egg:'#f1e6d0',pin:'#f3f1ec',
  hourglass:'#c49bff',lamp:'#f6d77a',trophy:'#f2c14e',acorn:'#b58250',onion:'#c98bd6',
  mushroom:'#ff7a6b',duck:'#f2c14e',fish:'#ff9f5a',lemon:'#f6e05e',pumpkin:'#ff9f5a',pepper:'#e5484d',snail:'#c9a27a',icecream:'#f8c0d8',rocket:'#e9e9ef',sailboat:'#7cc8ff',
  bulb:'#fff2a8',mug:'#9deba8',boot:'#f2c14e',carrot:'#ff9f5a',banana:'#f6d75e',
  teapot:'#7cc8ff',whale:'#6e8bff',rock:'#b9b2a6',sneaker:'#ff8ad8',guitar:'#d08a4e',dino:'#9deba8',cat:'#c9c4bc',octopus:'#c49bff',cloud:'#eef2f6',cactus:'#6fcf7f',
  bust:'#e9e3d8',moai:'#a59d92',anchor:'#a9bccf',crown:'#f6d77a',dragonegg:'#4fd8c8'};
const OBJ_NAMES={vase:'Vase',pawn:'Pawn',bell:'Bell',apple:'Apple',pear:'Pear',spintop:'Top',cupcake:'Cupcake',donut:'Donut',egg:'Egg',pin:'Bowling pin',hourglass:'Hourglass',lamp:'Lamp',trophy:'Trophy',acorn:'Acorn',onion:'Onion',
  mushroom:'Mushroom',duck:'Duck',fish:'Fish',lemon:'Lemon',pumpkin:'Pumpkin',pepper:'Pepper',snail:'Snail',icecream:'Ice cream',rocket:'Rocket',sailboat:'Sailboat',bulb:'Light bulb',mug:'Mug',boot:'Boot',carrot:'Carrot',banana:'Banana',
  teapot:'Teapot',whale:'Whale',rock:'Rock',sneaker:'Sneaker',guitar:'Guitar',dino:'Dinosaur',cat:'Cat',octopus:'Octopus',cloud:'Cloud',cactus:'Cactus',
  bust:'Bust',moai:'Moai',anchor:'Anchor',crown:'Crown',dragonegg:'Dragon egg'};
const TIER_EASY=['vase','pawn','bell','apple','pear','spintop','cupcake','donut','egg','pin','hourglass','lamp','trophy','acorn','onion'];
const TIER_MED=['mushroom','duck','fish','lemon','pumpkin','pepper','snail','icecream','rocket','sailboat','bulb','mug','boot','carrot','banana'];
const TIER_HARD=['teapot','whale','rock','sneaker','guitar','dino','cat','octopus','cloud','cactus'];
const TIER_FINALE=['bust','moai','anchor','crown','dragonegg'];

window.SLICE_LIB={OBJECTS,OBJ_COLOR,OBJ_NAMES,TIER_EASY,TIER_MED,TIER_HARD,TIER_FINALE};
})();
