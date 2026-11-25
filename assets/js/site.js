(function(){
  "use strict";
  var header=document.querySelector(".site-header");
  var hasFilm=!!document.querySelector(".film");
  function onScroll(){
    if(!header)return;
    var limit=hasFilm?window.innerHeight*0.9:20;
    header.classList.toggle("solid",window.scrollY>limit||!hasFilm);
  }
  window.addEventListener("scroll",onScroll,{passive:true});onScroll();

  var toggle=document.querySelector(".menu-toggle"),nav=document.querySelector(".nav");
  if(toggle&&nav){
    toggle.addEventListener("click",function(){var o=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",o);if(header)header.classList.add("solid");});
    nav.addEventListener("click",function(e){if(e.target.tagName==="A"){nav.classList.remove("open");toggle.setAttribute("aria-expanded","false");}});
  }

  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});},{rootMargin:"0px 0px -8% 0px"});
    document.querySelectorAll(".reveal").forEach(function(el){io.observe(el);});
  }else{document.querySelectorAll(".reveal").forEach(function(el){el.classList.add("in");});}

  /* Scroll film: frame sequence on canvas (fallback: video) */
  var film=document.querySelector(".film");
  if(film){
    var stage=film.querySelector(".film-stage");
    var video=film.querySelector("video");
    var copies=film.querySelectorAll(".film-copy,.film-hint");
    var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var count=parseInt(film.dataset.frames||"0",10);
    var base=film.dataset.framePath||"";
    var mobile=window.matchMedia("(max-width: 760px)").matches;
    var dir=mobile&&film.dataset.framePathMobile?film.dataset.framePathMobile:base;
    function progress(){
      var r=film.getBoundingClientRect();
      var total=film.offsetHeight-window.innerHeight;
      return Math.min(1,Math.max(0,-r.top/total));
    }
    function updateCopy(p){
      copies.forEach(function(c){
        var from=parseFloat(c.dataset.from||0),to=parseFloat(c.dataset.to||1);
        if(p>=from&&p<=to)c.removeAttribute("data-hidden");else c.setAttribute("data-hidden","");
      });
    }
    if(count>0&&dir){
      if(video)video.remove();
      var canvas=document.createElement("canvas");
      canvas.className="film-canvas";canvas.setAttribute("aria-hidden","true");
      var poster=stage.querySelector(".film-poster");if(poster)poster.insertAdjacentElement("afterend",canvas);else stage.insertBefore(canvas,stage.firstChild);
      var ctx=canvas.getContext("2d");
      var frames=new Array(count),loaded=new Array(count);
      var pad=function(n){return ("000"+n).slice(-3);};
      function load(i){
        if(frames[i])return;
        var img=new Image();img.decoding="async";
        img.onload=function(){loaded[i]=true;if(i===0)canvas.classList.add("ready");};
        img.src=dir+"f_"+pad(i+1)+".webp";frames[i]=img;
      }
      /* coarse pass first, then fill gaps */
      load(0);
      [8,4,2,1].forEach(function(step){for(var i=0;i<count;i+=step)load(i);});
      function nearest(i){
        if(loaded[i])return i;
        for(var d=1;d<count;d++){if(i-d>=0&&loaded[i-d])return i-d;if(i+d<count&&loaded[i+d])return i+d;}
        return -1;
      }
      var cur=0,last=-1,dpr=Math.min(window.devicePixelRatio||1,2);
      function size(){canvas.width=stage.clientWidth*dpr;canvas.height=stage.clientHeight*dpr;last=-1;}
      window.addEventListener("resize",size);size();
      function draw(i){
        var img=frames[i];if(!img)return;
        var cw=canvas.width,ch=canvas.height,iw=img.naturalWidth,ih=img.naturalHeight;
        var portrait=cw/ch<1;
        var s=portrait?(cw/iw)*1.3:Math.max(cw/iw,ch/ih),w=iw*s,h=ih*s;
        if(portrait){ctx.fillStyle="#14110d";ctx.fillRect(0,0,cw,ch);}
        ctx.drawImage(img,(cw-w)/2,(ch-h)*(portrait?0.62:0.5),w,h);
      }
      (function tick(){
        var p=progress();updateCopy(p);
        var target=reduce?0:p*(count-1);
        cur+=(target-cur)*0.18;
        var idx=nearest(Math.round(cur));
        if(idx>=0&&idx!==last){draw(idx);last=idx;}
        requestAnimationFrame(tick);
      })();
    }else{
      var target=0,current=0,ready=false;
      if(video){
        video.muted=true;video.playsInline=true;
        video.addEventListener("loadedmetadata",function(){ready=true;video.pause();});
        if(video.readyState>=1)ready=true;
      }
      (function tick(){
        var p=progress();updateCopy(p);
        if(video&&ready&&video.duration&&!reduce){
          target=p*(video.duration-0.05);current+=(target-current)*0.12;
          if(Math.abs(video.currentTime-current)>0.04&&!video.seeking){try{video.currentTime=current;}catch(e){}}
        }
        requestAnimationFrame(tick);
      })();
    }
  }

  /* Ankaufsanfrage: builds a WhatsApp message, falls back to e-mail */
  var form=document.querySelector("#anfrage-form");
  if(form){
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var d=new FormData(form);
      if(!d.get("kontakt")||!d.get("plz")){alert("Bitte Kontaktmöglichkeit und Postleitzahl angeben.");return;}
      var lines=["Ankaufsanfrage über vintagemoebelankauf.de",""];
      [["moebel","Möbel"],["hersteller","Designer/Hersteller"],["kontakt","Kontakt"],["plz","PLZ"],["etage","Etage/Aufzug"],["preis","Preisvorstellung"],["termin","Wunschtermin"],["nachricht","Nachricht"]].forEach(function(f){var v=(d.get(f[0])||"").toString().trim();if(v)lines.push(f[1]+": "+v);});
      lines.push("","Fotos sende ich direkt hier im Chat.");
      var text=lines.join("\n");
      var wa=(document.body.dataset.wa||"").replace(/\D/g,"");
      var via=d.get("weg")||"whatsapp";
      var url;
      if(via==="mail"||!wa){url="mailto:"+(document.body.dataset.mail||"")+"?subject="+encodeURIComponent("Ankaufsanfrage")+"&body="+encodeURIComponent(text);}
      else{url="https://wa.me/"+wa+"?text="+encodeURIComponent(text);}
      document.querySelector(".form-ok").classList.add("show");
      window.open(url,"_blank","noopener");
    });
  }
})();
