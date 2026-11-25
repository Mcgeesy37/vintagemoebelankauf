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

  /* Scroll film: video time follows scroll position */
  var film=document.querySelector(".film");
  if(film){
    var video=film.querySelector("video");
    var copies=film.querySelectorAll(".film-copy,.film-hint");
    var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var target=0,current=0,ready=false;
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
    if(video){
      video.muted=true;video.playsInline=true;
      video.addEventListener("loadedmetadata",function(){ready=true;video.pause();});
      if(video.readyState>=1){ready=true;}
      /* iOS needs a play call before seeking works */
      var unlock=function(){var pr=video.play();if(pr&&pr.then){pr.then(function(){video.pause();}).catch(function(){});}window.removeEventListener("touchstart",unlock);};
      window.addEventListener("touchstart",unlock,{passive:true});
    }
    function tick(){
      var p=progress();
      updateCopy(p);
      if(video&&ready&&video.duration&&!reduce){
        target=p*(video.duration-0.05);
        current+=(target-current)*0.12;
        if(Math.abs(video.currentTime-current)>0.02){try{video.currentTime=current;}catch(e){}}
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
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
