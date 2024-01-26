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
            if(id in read){
                elem.setAttribute(attrRead, '');
                elem.removeAttribute(attrUnread);
            } else {
                elem.setAttribute(attrUnread, '');
                elem.removeAttribute(attrRead);
            }
            let container = document.createElement('div');
            container.classList.add("chatterextension-container");
            elem.appendChild(container);
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
                    hideElement(elem);//TODO: showモードでも隠れるからダメ
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
                container.appendChild(a);
                a.addEventListener('click', obj.action);
            });
            const group = elem.querySelector('span.collaborationGroupMru');
            const groupid = group && group.parentElement.getAttribute("data-hovid") || null;
            if(groupid){
                const a = document.createElement('a');
                a.setAttribute("class", "ignore-group");
                a.textContent = "このグループを非表示にする";
                a.href = 'javascript:void(0);';
                a.style = {"margin-right": "10px" };
                container.appendChild(a);
                a.addEventListener('click', () => {alert("未実装です。需要ありそうなら実装します。")});

            }
        });
    };
    
    addExtButton(doc, read);
    const getReadItems = (doc, read) => {
        const readIDs = read && Object.keys(read) || [];
        const query = readIDs.map(v => `[id="${v}"]`).join(',');
        return query !== '' ? doc.querySelectorAll(query) : document.createDocumentFragment().childNodes;
    }
    const readItems = getReadItems(doc, read);

    if(isVisible){
        showElements(readItems);
    } else {
        hideElements(readItems);
    }    
};

const setRepostVisibility = (doc) => {
    const feedItems = doc.querySelectorAll('div.feeditembody');
    feedItems.forEach(div => {
        const doesContainRepost = div.querySelectorAll('a.feeditemsecondentity').length === 2;
        if(doesContainRepost){
            div.classList.add("rechat");
            const attachments = div.querySelectorAll('.feeditemattachments');
            div.querySelectorAll('a').forEach( (a) => {
                if(a.innerText === 'さらに表示'){
                    a.addEventListener('click', () => {attachments.forEach((attachment) => {attachment.style.display = 'initial'});});
                }
            })
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
    g_isVisible = g_isVisible || true;
    g_read = g_read || {};
    setRepostVisibility(document);
    setReadItemVisibility(document, g_isVisible, g_read);
}).catch(error => {
    console.error("An error occurred:", error);
});

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        for(let node of mutation.addedNodes){
            if(node.nodeName === 'DIV'){
                let doc = node.parentElement;
                setRepostVisibility(doc);
                setReadItemVisibility(doc, g_isVisible, g_read);
            }
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.hasOwnProperty('isVisible')) {
        g_isVisible = request.isVisible;
        setRepostVisibility(document);
        setReadItemVisibility(document, g_isVisible, g_read);
    }
});