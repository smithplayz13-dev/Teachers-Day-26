// reveal
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible') })
},{threshold:.16})
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))

// progress bar
const bar = document.getElementById('progress-bar')
window.addEventListener('scroll', ()=>{
  const h = document.documentElement
  const p = (h.scrollTop / (h.scrollHeight - h.clientHeight))*100
  if(bar) bar.style.width = p + '%'
}, {passive:true})

// tilt card
const card = document.getElementById('tiltCard')
if(card){
  const wrap = card.parentElement
  wrap.addEventListener('mousemove', (e)=>{
    const r = wrap.getBoundingClientRect()
    const x = (e.clientX - r.left)/r.width - .5
    const y = (e.clientY - r.top)/r.height - .5
    card.style.transform = `rotate(${x*4}deg) translateY(-6px) perspective(800px) rotateY(${x*8}deg) rotateX(${-y*6}deg)`
  })
  wrap.addEventListener('mouseleave', ()=>{ card.style.transform='' })
}

// class photo slider
const track = document.getElementById('slidesTrack')
const dots = [...document.querySelectorAll('.dot')]
const prev = document.getElementById('prevSlide')
const next = document.getElementById('nextSlide')
let idx = 0
function go(n){
  idx = (n + dots.length) % dots.length
  if(track) track.style.transform = `translateX(-${idx*100}%)`
  dots.forEach((d,i)=>{
    const active = i===idx
    d.classList.toggle('is-active', active)
    d.setAttribute('aria-selected', String(active))
    document.querySelectorAll('.slide')[i]?.classList.toggle('is-active', active)
  })
}
dots.forEach(d=> d.addEventListener('click', ()=> go(Number(d.dataset.go))))
prev?.addEventListener('click', ()=> go(idx-1))
next?.addEventListener('click', ()=> go(idx+1))
let sx=0
const viewport = document.getElementById('slidesViewport')
viewport?.addEventListener('touchstart', e=> sx=e.touches[0].clientX, {passive:true})
viewport?.addEventListener('touchend', e=>{
  const dx = e.changedTouches[0].clientX - sx
  if(Math.abs(dx)>40) go(idx + (dx<0?1:-1))
})

// lightbox
const lightbox = document.getElementById('lightbox')
const lbImg = document.getElementById('lightboxImg')
const lbClose = document.getElementById('lightboxClose')
function openLb(src){
  if(lbImg) lbImg.src = src || lbImg.src
  lightbox?.classList.add('is-open')
  lightbox?.setAttribute('aria-hidden','false')
  document.body.style.overflow='hidden'
}
function closeLb(){
  lightbox?.classList.remove('is-open')
  lightbox?.setAttribute('aria-hidden','true')
  document.body.style.overflow=''
}
document.querySelectorAll('[data-expand]').forEach(b=>{
  b.addEventListener('click', ()=>{
    const img = b.closest('.slide')?.querySelector('img')
    openLb(img?.src)
  })
})
document.getElementById('classPhotoMedia')?.addEventListener('click', (e)=>{
  if(e.target.closest('button')) return
  const img = e.currentTarget.querySelector('img')
  openLb(img?.src)
})
lbClose?.addEventListener('click', closeLb)
lightbox?.addEventListener('click', (e)=>{ if(e.target===lightbox) closeLb() })
window.addEventListener('keydown', e=>{ if(e.key==='Escape') closeLb() })

// upload placeholder to add slide dynamically
const fileInput = document.querySelector('.slide-media.placeholder input[type="file"]')
fileInput?.addEventListener('change', (e)=>{
  const f = e.target.files?.[0]
  if(!f) return
  const url = URL.createObjectURL(f)
  const slide = fileInput.closest('.slide')
  const media = slide.querySelector('.slide-media')
  media.classList.remove('placeholder')
  media.innerHTML = `<img src="${url}" alt="Uploaded candid" style="width:100%;height:100%;object-fit:cover" /><div class="slide-vignette"></div><button class="expand-btn" type="button" data-expand><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg> Expand</button>`
  media.querySelector('[data-expand]')?.addEventListener('click', ()=> openLb(url))
  media.addEventListener('click', (ev)=>{
    if(ev.target.closest('button')) return
    openLb(url)
  })
  slide.querySelector('.slide-caption strong').textContent = f.name.replace(/\.[^.]+$/,'')
  go(1)
})

// notes scroller
const scroller = document.getElementById('notesScroller')
document.getElementById('notesPrev')?.addEventListener('click', ()=> scroller?.scrollBy({left:-340, behavior:'smooth'}))
document.getElementById('notesNext')?.addEventListener('click', ()=> scroller?.scrollBy({left:340, behavior:'smooth'}))
document.querySelectorAll('.student-note').forEach(n=>{
  n.addEventListener('click', ()=>{
    document.querySelectorAll('.student-note').forEach(x=>x.classList.remove('is-spotlight'))
    n.classList.add('is-spotlight')
    setTimeout(()=> n.classList.remove('is-spotlight'), 1800)
  })
})

// confetti — OPTIMIZED CHAOTIC (fast)
const canvas = document.getElementById('confettiCanvas')
const ctx = canvas?.getContext('2d', { alpha: true })
function resize(){ if(!canvas||!ctx) return; canvas.width=window.innerWidth; canvas.height=window.innerHeight; canvas.style.width=window.innerWidth+'px'; canvas.style.height=window.innerHeight+'px'; }
resize(); window.addEventListener('resize', resize, {passive:true})
let particles=[]
let rafId=null
let lastBurst=0
const COLORS=['#ffd84d','#ff4d8d','#7c3aed','#6ef2c0','#ffffff','#ff8a00']
const EMOJIS=['🎉','✨','⭐']
function rand(a,b){return a+Math.random()*(b-a)}
// tiny star without shadow — faster
function drawStar(r){
  ctx.beginPath()
  for(let i=0;i<5;i++){
    const a1=(Math.PI*2*i)/5 - Math.PI/2, a2=a1+Math.PI/5
    if(i===0) ctx.moveTo(Math.cos(a1)*r, Math.sin(a1)*r)
    else ctx.lineTo(Math.cos(a1)*r, Math.sin(a1)*r)
    ctx.lineTo(Math.cos(a2)*r*0.45, Math.sin(a2)*r*0.45)
  }
  ctx.closePath(); ctx.fill()
}
function makeBurst(x,y, opts={}){
  const count = opts.count || 90
  const power = opts.power || 1
  // cap total particles — drop oldest if too many
  if(particles.length > 320) particles.splice(0, particles.length - 260)
  for(let i=0;i<count;i++){
    const t=Math.random()
    let shape='rect'
    if(t<0.18) shape='circle'
    else if(t<0.28) shape='ribbon'
    else if(t<0.38) shape='triangle'
    else if(t<0.44) shape='star'
    else if(t<0.46) shape='emoji' // only 2% emoji — slow
    else shape='rect'
    const angle = rand(-Math.PI*0.95, -0.05) + rand(-0.55,0.55)
    const speed = shape==='ribbon'? rand(7,13) : rand(9,17)
    const vx = Math.cos(angle)*speed*power + rand(-2,2)
    const vy = Math.sin(angle)*speed*power + rand(-1.5,1.5)
    particles.push({
      x, y, vx, vy,
      r: shape==='emoji'? 16 : shape==='ribbon'? rand(12,18) : rand(5,9),
      w: shape==='ribbon'? 4 : 0,
      c: COLORS[Math.floor(Math.random()*COLORS.length)],
      shape, emoji: shape==='emoji'? EMOJIS[Math.floor(Math.random()*EMOJIS.length)] : null,
      rot: rand(0,6.28), vr: rand(-0.42,0.42),
      tilt: rand(0,3.14), tiltV: rand(-0.18,0.18),
      g: shape==='ribbon'? 0.22 : 0.33 + Math.random()*0.22,
      drag: 0.987 + Math.random()*0.008,
      wobble: rand(0,6.28), wobbleSpeed: 0.12 + Math.random()*0.09,
      wobbleAmp: shape==='ribbon'? 5 : 2.2,
      life:1, decay: 0.007 + Math.random()*0.004,
      flutter: Math.random()<0.28
    })
  }
}
function burst(x=window.innerWidth/2, y=window.innerHeight/3){
  if(!ctx||!canvas) return
  const now=performance.now()
  if(now - lastBurst < 280) return // throttle spam
  lastBurst=now
  // OPTIMIZED: single burst + tiny sides — was 430, now ~150 total
  makeBurst(x, y, {count: 110, power: 1})
  setTimeout(()=> makeBurst(x - window.innerWidth*0.14, y+10, {count: 28, power: 0.88}), 80)
  setTimeout(()=> makeBurst(x + window.innerWidth*0.14, y+10, {count: 28, power: 0.88}), 150)
  // no extra setTimeout sparkles — was major lag source
  // light shake only on main button
  if(Math.random()<0.7){
    document.body.animate([{transform:'translate(0,0)'},{transform:`translate(${rand(-3,3)}px,${rand(-2,2)}px)`},{transform:'translate(0,0)'}],{duration:220, easing:'ease-out'})
  }
  if(!rafId) rafId=requestAnimationFrame(loop)
}
function loop(){
  if(!ctx||!canvas) return
  const W=window.innerWidth, H=window.innerHeight
  ctx.clearRect(0,0,W,H)
  let alive=false
  // iterate backwards so we can splice without filter (faster)
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i]
    // cheap wobble — one sin per particle
    p.x += p.vx + Math.sin(p.wobble)*p.wobbleAmp*0.12
    p.y += p.vy
    p.wobble += p.wobbleSpeed
    p.vy += p.g
    p.vx *= p.drag
    if(p.flutter) p.vx += Math.sin(p.life*10)*0.09
    p.rot += p.vr
    p.tilt += p.tiltV
    p.life -= p.decay
    if(p.life<=0 || p.y > H+60){
      // swap-remove for speed
      particles[i]=particles[particles.length-1]; particles.pop()
      continue
    }
    alive=true
    const alpha = p.life // already 0-1
    const scale = 0.78 + alpha*0.22
    ctx.save()
    ctx.translate(p.x, p.y)
    if(p.shape!=='circle' && p.shape!=='emoji') ctx.rotate(p.rot)
    // tilt squash only for rect/ribbon — cheap cos
    let tiltScale=1
    if(p.shape==='rect'||p.shape==='ribbon'){ tiltScale = 0.55 + Math.cos(p.tilt)*0.45 }
    if(tiltScale!==1 || scale!==1) ctx.scale(tiltScale*scale, scale)
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.c
    if(p.shape==='rect'){
      ctx.fillRect(-p.r/2, -p.r*0.33, p.r, p.r*0.66)
    } else if(p.shape==='circle'){
      ctx.beginPath(); ctx.arc(0,0,p.r*0.5,0,6.283); ctx.fill()
    } else if(p.shape==='ribbon'){
      // single rect ribbon — was bezier (slow)
      ctx.fillRect(-p.r/2, -p.w/2, p.r, p.w)
    } else if(p.shape==='triangle'){
      ctx.beginPath(); ctx.moveTo(0,-p.r*0.9); ctx.lineTo(-p.r*0.7,p.r*0.7); ctx.lineTo(p.r*0.7,p.r*0.7); ctx.closePath(); ctx.fill()
    } else if(p.shape==='star'){
      drawStar(p.r*0.9)
    } else if(p.shape==='emoji'){
      ctx.font=`${p.r}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(p.emoji,0,1)
    }
    ctx.restore()
  }
  if(particles.length>0){
    rafId=requestAnimationFrame(loop)
  } else {
    rafId=null
  }
  ctx.globalAlpha=1
}
const confettiBtn=document.getElementById('confettiBtn')
const footerConfetti=document.getElementById('footerConfetti')
function megaBurst(e){
  e?.preventDefault()
  const x = e?.clientX ?? window.innerWidth/2 + rand(-60,60)
  const y = e?.clientY ? e.clientY*0.45 : window.innerHeight*0.32
  burst(x,y)
}
confettiBtn?.addEventListener('click', megaBurst)
footerConfetti?.addEventListener('click', megaBurst)
document.querySelector('.hero')?.addEventListener('click', (e)=>{
  if(e.target.closest('a,button')) return
  // hero click = small sprinkle only — not full burst
  if(performance.now()-lastBurst<400) return
  makeBurst(e.clientX, e.clientY*0.55, {count: 36, power: 0.7})
  if(!rafId) rafId=requestAnimationFrame(loop)
})
let bursted=false
const classSec=document.getElementById('class-memory')
if(classSec){
  new IntersectionObserver((ents)=>{
    if(ents[0].isIntersecting && !bursted){
      bursted=true
      setTimeout(()=> burst(window.innerWidth/2, window.innerHeight*0.42), 450)
    }
  },{threshold:.34}).observe(classSec)
}
window.addEventListener('keydown', (e)=>{
  if(e.code==='Space'){ e.preventDefault(); burst(rand(window.innerWidth*0.25, window.innerWidth*0.75), rand(window.innerHeight*0.18, window.innerHeight*0.38)) }
})
