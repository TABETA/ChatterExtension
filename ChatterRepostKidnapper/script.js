let g_isVisible = false;
let g_read = false;

const setRepostVisibility = (doc, isVisible, read) => {
    const getReposts = (feedItems) => {
        const reposts = Array.from(feedItems).map(div => {
            const doesContainRepost = Array.from(div.querySelectorAll('a')).some(anchor => anchor.innerText.includes('元の投稿'));
            const doesContainComments = div.querySelector('div.feeditemcomment.cxfeedcomment') !== null;
            return (doesContainRepost && !doesContainComments) ? div : null;
        }).filter(div => div !== null);
        return reposts;
    };
    const hideDivs = (reposts) => {
        reposts.forEach(div => { if(div) { div.style.display = 'none'; } });
    };
    const showDivs = (reposts) => {
        reposts.forEach(div => { if(div) { div.style.display = ''; } });
    };

    const addExtButton = (doc, read) =>{
        const attrProcessed = 'data-chatterextension-processed';
        const attrRead = 'data-chatterextension-read';
        const attrUnread = 'data-chatterextension-unread';
        const feedItems = doc.querySelectorAll(`div.cxfeeditem.feeditem:not([${attrProcessed}])`);
        feedItems.forEach(div => {
            const id = div.id;
            div.setAttribute(attrProcessed, '');
            if(div.id in read){
                div.setAttribute(attrRead, '');
                div.removeAttribute(attrUnread);
            } else {
                div.setAttribute(attrUnread, '');
                div.removeAttribute(attrRead);
            }
            [{
                class: 'set-read',
                text: '既読にする',
                action : (e) => {
                    e.stopPropagation();
                    if(!(id in read)){
                        read[id] = true;
                        chrome.storage.local.set({read:read});
                        div.setAttribute(attrRead, '');
                        div.removeAttribute(attrUnread);
                        console.log(read);
                    }
                }
            },
            {
                class: 'set-unread',
                text: '未読にする',
                action : (e) => {
                    e.stopPropagation();
                    delete read[id];
                    chrome.storage.local.set({read:read});
                    div.setAttribute(attrUnread, '');
                    div.removeAttribute(attrRead);
                    console.log(read);

                }
            }].forEach((obj)=>{
                let a = document.createElement('a');
                a.setAttribute("class", obj.class);
                a.textContent = obj.text;
                a.href = 'javascript:void(0);';
                a.style = {"margin-right": "10px"};
                div.appendChild(a);
                a.addEventListener('click', obj.action);
            });
        });
    };
    
    const feedItems = doc.querySelectorAll('div.cxfeeditem.feeditem');
    const reposts = getReposts(feedItems);
    if(isVisible){
        showDivs(reposts);
    } else {
        hideDivs(reposts);
    }
    addExtButton(doc, read);
    chrome.storage.local.get("read", function({read}){
        if(Object.keys(read).length > 0){
            const query = Object.keys(read).map(v => `[id="${v}"]`).join(',');
            const readItems = document.querySelectorAll(query);
            if(isVisible){
                showDivs(readItems);
            } else {
                hideDivs(readItems);
            }
        }
    });
    
};
function getStorageItem(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, function(result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result[key]);
            }
        });
    });
}
Promise.all([getStorageItem("isVisible"), getStorageItem("read")]).then(values => {
    [g_isVisible, g_read] = values;
    setRepostVisibility(document, g_isVisible, g_read);
}).catch(error => {
    console.error("An error occurred:", error);
});
//span.collaborationGroupMru

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        for(let node of mutation.addedNodes){
            if(node.nodeType === Node.ELEMENT_NODE){
                setRepostVisibility(node, g_isVisible, g_read);
            }
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.hasOwnProperty('isVisible')) {
        g_isVisible = request.isVisible;
        setRepostVisibility(document, g_isVisible, g_read);
    }
});