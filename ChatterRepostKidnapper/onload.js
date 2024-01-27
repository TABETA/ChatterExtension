const r = document.querySelector('div.rightContent');
const l = document.querySelector('div.leftContent');
const m = document.querySelector('div.mainContent');
if(r && l && m){
    const f = document.createDocumentFragment();
    const leftMenu = document.createElement("div");
    leftMenu.classList.add("leftMenu");
    const p = l.parentNode;    
    leftMenu.appendChild(l);
    leftMenu.appendChild(r);
    p.insertBefore(leftMenu, m);
}
