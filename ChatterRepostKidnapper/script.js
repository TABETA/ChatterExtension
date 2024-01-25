let g_isVisible = false;
let g_read = false;

const hideElement = (elem) => {if(elem) { elem.style.display = 'none'; }};
const hideElements = (elems) => {
    elems.forEach(elem => { hideElement(elem); });
};
const showElement = (elem) => {if(elem) { elem.style.display = ''; }};
const showElements = (elems) => {
    elems.forEach(elem => { showElement(elem); });
};

const setReadItemVisibility = (doc, isVisible, read) => {
    const addExtButton = (doc, read) =>{
        const attrProcessed = 'data-chatterextension-processed';
        const attrRead = 'data-chatterextension-read';
        const attrUnread = 'data-chatterextension-unread';
        const feedItems = doc.querySelectorAll(`div.cxfeeditem.feeditem:not([${attrProcessed}])`);
        feedItems.forEach(elem => {
            const id = elem.id;
            elem.setAttribute(attrProcessed, '');
            if(elem.id in read){
                elem.setAttribute(attrRead, '');
                elem.removeAttribute(attrUnread);
            } else {
                elem.setAttribute(attrUnread, '');
                elem.removeAttribute(attrRead);
            }
            [{
                class: 'set-read',
                text: '既読にする',
                action : (e) => {
                    e.stopPropagation();
                    if(id in read){
                        return;
                    }
                    read[id] = true;
                    chrome.storage.local.set({read:read});
                    elem.setAttribute(attrRead, '');
                    elem.removeAttribute(attrUnread);
                    hideElement(elem);
                }
            },
            {
                class: 'set-unread',
                text: '未読にする',
                action : (e) => {
                    e.stopPropagation();
                    if(!(id in read)){
                        return;
                    }
                    delete read[id];
                    chrome.storage.local.set({read:read});
                    elem.setAttribute(attrUnread, '');
                    elem.removeAttribute(attrRead);
                    showElement(elem);
                }
            }].forEach((obj)=>{
                let a = document.createElement('a');
                a.setAttribute("class", obj.class);
                a.textContent = obj.text;
                a.href = 'javascript:void(0);';
                a.style = {"margin-right": "10px"};
                elem.appendChild(a);
                a.addEventListener('click', obj.action);
            });
        });
    };
    
    addExtButton(doc, read);
    const getReadItems = (doc, read) => {
        const readIDs = read && Object.keys(read) || [];
        const query = readIDs.map(v => `[id="${v}"]`).join(',');
        return doc.querySelectorAll(query);
    }
    const readItems = getReadItems(doc, read);

    if(isVisible){
        showElements(readItems);
    } else {
        hideElements(readItems);
    }    
};

const setRepostVisibility = (doc, isVisible) => {
    const getReposts = (doc) => {
        const feedItems = doc.querySelectorAll('div.cxfeeditem.feeditem');
        const reposts = Array.from(feedItems)
            .filter(item => !item.closest('.rechatMainContainer'))
            .map(div => {
                const doesContainRepost = Array.from(div.querySelectorAll('a')).some(anchor => anchor.innerText === '元の投稿');
                const doesContainComments = div.querySelector('div.feeditemcomment.cxfeedcomment') !== null;
                return (doesContainRepost && !doesContainComments) ? div : null;
            })
            .filter(div => div !== null);
        return reposts;

    };
    const reposts = getReposts(doc);
    if(isVisible){
        showElements(reposts);
    } else {
        hideElements(reposts);
    }
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
    setRepostVisibility(document, g_isVisible);
    setReadItemVisibility(document, g_isVisible, g_read);
}).catch(error => {
    console.error("An error occurred:", error);
});
//span.collaborationGroupMru

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        for(let node of mutation.addedNodes){
            if(node.nodeName === 'DIV'){
                let doc = node.parentElement;
                setRepostVisibility(doc, g_isVisible);
                setReadItemVisibility(doc, g_isVisible, g_read);
            }
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.hasOwnProperty('isVisible')) {
        g_isVisible = request.isVisible;
        setRepostVisibility(document, g_isVisible);
        setReadItemVisibility(document, g_isVisible, g_read);
    }
});