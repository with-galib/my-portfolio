(function(){
var $=function(s){return document.querySelector(s)},root=document.documentElement;
var y=$('#yr');if(y)y.textContent=new Date().getFullYear();
window.toast=function(m){var t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}
t.textContent=m;t.classList.add('show');clearTimeout(window.toast.t);window.toast.t=setTimeout(function(){t.classList.remove('show')},1800)};
var tb=$('#theme');if(tb)tb.onclick=function(){var dark=getComputedStyle(root).colorScheme==='dark',n=dark?'light':'dark';root.dataset.theme=n;try{localStorage.setItem('theme',n)}catch(e){}};
var sh=$('#share');if(sh)sh.onclick=function(){var u=location.href.split('#')[0];(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){window.toast('Link copied')},function(){window.toast('Copy the address bar to share')})};
})();
