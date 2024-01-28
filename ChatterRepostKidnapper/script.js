let g_isVisible = false;
let g_read = false;
let g_hideGroupDict = false;

const hideElement = (elem) => {if(elem) { elem.style.display = 'none'; }};
const hideElements = (elems) => {
    elems.forEach(elem => { hideElement(elem); });
};
const showElement = (elem) => {if(elem) { elem.style.display = ''; }};
const showElements = (elems) => {
    elems.forEach(elem => { showElement(elem); });
};
const getQueryGroupFeedByID = (id) =>{
    return `div[data-feeditem*="\\"parentid\\":\\"${id}\\""]`;
}
const setReadItemVisibility = (doc, isVisible, read, hideGroupDict) => {
    const addExtButton = (doc, read, hideGroupDict) =>{
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
            const attrDataFeedItem = elem.getAttribute("data-feeditem");
            if(attrDataFeedItem){
                const dataFeedItem = JSON.parse(attrDataFeedItem);
                switch(dataFeedItem.parentname){
                    case "グループ":
                        const id = dataFeedItem.parentid;
                        if(id){
                            const attrHiddenGroup = 'data-chatterextension-hiddenGroup';
                            const attrShownGroup = 'data-chatterextension-shownGroup';
                            if(id in hideGroupDict){
                                elem.setAttribute(attrHiddenGroup, '');
                                elem.removeAttribute(attrShownGroup);
                            } else {
                                elem.setAttribute(attrShownGroup, '');
                                elem.removeAttribute(attrHiddenGroup);
                            }
                            [{
                                class: 'hide-group',
                                text: 'このグループを非表示',
                                action : (e) => {
                                    e.stopPropagation();
                                    if(id in hideGroupDict){
                                        return;
                                    }
                                    hideGroupDict[id] = true;
                                    chrome.storage.local.set({hideGroupDict:hideGroupDict});
                                    elem.setAttribute(attrHiddenGroup, '');
                                    elem.removeAttribute(attrShownGroup);
                                    if(!isVisible){
                                        hideElements(document.querySelectorAll(getQueryGroupFeedByID(id)));
                                    }
                                }
                            },
                            {
                                class: 'show-group',
                                text: 'このグループを再表示',
                                action : (e) => {
                                    e.stopPropagation();
                                    if(!(id in hideGroupDict)){
                                        return;
                                    }
                                    delete hideGroupDict[id];
                                    chrome.storage.local.set({hideGroupDict:hideGroupDict});
                                    elem.setAttribute(attrShownGroup, '');
                                    elem.removeAttribute(attrHiddenGroup);
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
                        }
                        break;
                    case "ユーザー":
                        break;
                }
            }
        });
    };
    
    addExtButton(doc, read, hideGroupDict);
    const getReadItems = (doc, read, hideGroupDict) => {
        const readIDs = read && Object.keys(read) || [];
        const readItems = readIDs.length > 0 && doc.querySelectorAll(readIDs.map(v => `[id="${v}"]`).join(',')) || document.createDocumentFragment().childNodes;
        const groupIDs = hideGroupDict && Object.keys(hideGroupDict) || [];
        const hidedItems = groupIDs.length > 0 && doc.querySelectorAll(groupIDs.map(id => getQueryGroupFeedByID(id)).join(',')) || document.createDocumentFragment().childNodes;
        return [...readItems, ...hidedItems];

    }
    const readItems = getReadItems(doc, read, hideGroupDict);

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
Promise.all([getStorageItem("isVisible"), getStorageItem("read"), getStorageItem("hideGroupDict")]).then(values => {
    [g_isVisible, g_read, g_hideGroupDict] = values;
    g_read = g_read || {};
    g_hideGroupDict = g_hideGroupDict || {};
    setRepostVisibility(document);
    setReadItemVisibility(document, g_isVisible, g_read, g_hideGroupDict);
}).catch(error => {
    console.error("An error occurred:", error);
});

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        for(let node of mutation.addedNodes){
            if(node.nodeName === 'DIV' && node.parentElement){
                let doc = node.parentElement;
                setRepostVisibility(doc);
                setReadItemVisibility(doc, g_isVisible, g_read, g_hideGroupDict);
            }
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.hasOwnProperty('isVisible')) {
        g_isVisible = request.isVisible;
        setRepostVisibility(document);
        setReadItemVisibility(document, g_isVisible, g_read, g_hideGroupDict);
    }
});