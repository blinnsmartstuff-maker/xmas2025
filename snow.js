(function(){
  const canvas = document.getElementById('snow');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, flakes = [];

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    flakes = Array.from({length: Math.floor(W*H/18000)+80}, () => ({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*2.2+0.6,
      d: Math.random()*1.2+0.2,
      a: Math.random()*Math.PI*2
    }));
  }

  window.addEventListener('resize', resize);
  resize();

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for(const flake of flakes){
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI*2);
      ctx.fill();
    }
    for(const flake of flakes){
      flake.y += flake.d + 0.2;
      flake.x += Math.sin(flake.a += 0.01) * 0.4;
      if(flake.y > H+4){ flake.y = -4; flake.x = Math.random()*W; }
      if(flake.x > W+4){ flake.x = -4; }
      if(flake.x < -4){ flake.x = W+4; }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();
