(function(){
var $=function(s){return document.querySelector(s)};
var API=((window.PORTFOLIO_CONFIG&&window.PORTFOLIO_CONFIG.API_BASE)||'').replace(/\/$/,'');
$('#cf').onsubmit=function(e){e.preventDefault();var f=e.target,el=f.elements,b=f.querySelector('button[type=submit]'),st=$('#cs');
if(!el.name.value.trim()||!el.email.validity.valid||el.message.value.trim().length<10){st.textContent='Please enter your name, a valid email and a message of at least 10 characters.';return}
b.disabled=true;st.textContent='Sending…';
fetch(API+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:el.name.value,email:el.email.value,message:el.message.value,website:el.website.value})})
.then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||'Could not send your message');return d})})
.then(function(){st.textContent='Message sent. Thank you!';f.reset()})
.catch(function(err){st.textContent=err instanceof TypeError?'The server is not reachable right now. Please use GitHub instead.':err.message})
.finally(function(){b.disabled=false})};
})();
