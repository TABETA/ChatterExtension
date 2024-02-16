let g_isVisible = false;
let g_read = {};
let g_hideEntityDict = {};

const hideElement = (elem) => {if(elem) { elem.style.display = 'none'; }};
const hideElements = (elems) => {
    elems.forEach(elem => { hideElement(elem); });
};
const showElement = (elem) => {if(elem) { elem.style.display = ''; }};
const showElements = (elems) => {
    elems.forEach(elem => { showElement(elem); });
};
const getQueryFeedByParentID = (id) =>{
    return `div[data-feeditem*="\\"parentid\\":\\"${id}\\""]`;
}
const setReadItemVisibility = (doc, isVisible, read, hideEntityDict) => {
    const addExtButton = (doc, read, hideEntityDict) =>{
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
                const addButtonForEntity = (name) => {
                    const id = dataFeedItem.parentid;
                    if(id){
                        const attrHidden = `data-chatterextension-hidden${name}`;
                        const attrShown = `data-chatterextension-shown${name}`;
                        if(id in hideEntityDict){
                            elem.setAttribute(attrHidden, '');
                            elem.removeAttribute(attrShown);
                        } else {
                            elem.setAttribute(attrShown, '');
                            elem.removeAttribute(attrHidden);
                        }
                        [{
                            class: `hide-${name}`,
                            text: `この${name}を非表示`,
                            action : (e) => {
                                e.stopPropagation();
                                if(id in hideEntityDict){
                                    return;
                                }
                                hideEntityDict[id] = true;
                                chrome.storage.local.set({hideGroupDict:hideEntityDict});
                                elem.setAttribute(attrHidden, '');
                                elem.removeAttribute(attrShown);
                                if(!isVisible){
                                    hideElements(document.querySelectorAll(getQueryFeedByParentID(id)));
                                }
                            }
                        },
                        {
                            class: `show-${name}`,
                            text: `この${name}を再表示`,
                            action : (e) => {
                                e.stopPropagation();
                                if(!(id in hideEntityDict)){
                                    return;
                                }
                                delete hideEntityDict[id];
                                chrome.storage.local.set({hideGroupDict:hideEntityDict});
                                elem.setAttribute(attrShown, '');
                                elem.removeAttribute(attrHidden);
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
                }
                switch(dataFeedItem.parentname){
                    case "グループ":
                        addButtonForEntity("group");
                        break;
                    case "ユーザー":
                        addButtonForEntity("user");
                        break;
                }
            }
        });
    };
    
    addExtButton(doc, read, hideEntityDict);
    const getReadItems = (doc, read, hideEntityDict) => {
        const readIDs = read && Object.keys(read) || [];
        const readItems = readIDs.length > 0 && doc.querySelectorAll(readIDs.map(v => `[id="${v}"]`).join(',')) || document.createDocumentFragment().childNodes;
        const entityIDs = hideEntityDict && Object.keys(hideEntityDict) || [];
        //TODO: この処理では、グループに投稿した無視ユーザーの投稿は見えてしまう。
        // Array.from(document.querySelectorAll('span.feeditemsecondentity a[data-hovid]')).map(a => a.attributes["data-hovid"].value)から判断しないといけない
        const hidedItems = entityIDs.length > 0 && doc.querySelectorAll(entityIDs.map(id => getQueryFeedByParentID(id)).join(',')) || document.createDocumentFragment().childNodes;
        return [...readItems, ...hidedItems];

    }
    const readItems = getReadItems(doc, read, hideEntityDict);

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
Promise.all([
    getStorageItem("isVisible"),
    getStorageItem("read"),
    getStorageItem("hideGroupDict")//Groupじゃなくなったけど後方互換のために名称変更しない
]).then(values => {
    [g_isVisible, g_read, g_hideEntityDict] = values;
    g_read = g_read || {};
    g_hideEntityDict = g_hideEntityDict || {};
    setRepostVisibility(document);
    setReadItemVisibility(document, g_isVisible, g_read, g_hideEntityDict);
}).catch(error => {
    console.error("An error occurred:", error);
});


const hideSelf = function () {
    this.style.display = 'none';
    this.onmouseout = null;
    this.onclick = null;
}
const addPreviewContainer = ()=>{
    let originalImageContainer = document.createElement('div');
    originalImageContainer.id = 'originalImageContainer';
    
    originalImageContainer.style.display = 'none';
    originalImageContainer.style.position = 'fixed';
    originalImageContainer.style.top = '50%';
    originalImageContainer.style.left = '50%';
    originalImageContainer.style.transform = 'translate(-50%, -50%)';
    originalImageContainer.style.zIndex = '1000';
    originalImageContainer.style.width = '90vw'; // ビューポートの幅の90%
    originalImageContainer.style.height = '90vh'; // ビューポートの高さの90%
    originalImageContainer.style.overflow = 'auto'; // 画像がコンテナより大きい場合はスクロールバーを表示

    let originalImage = document.createElement('img');
    originalImage.id = 'originalImage';
    originalImage.style.maxWidth = '100%';
    originalImage.style.maxHeight = '100%';
    originalImageContainer.appendChild(originalImage);
    document.body.appendChild(originalImageContainer);
    return [originalImageContainer, originalImage]
}
let [originalImageContainer, originalImage] = addPreviewContainer();

const addOriginalImageViewAction = (contentPost)=>{
    let downloadAction = contentPost.querySelector("td.moreFileActions-td span.contentActionLabel");
    let ext = downloadAction.textContent.trim().split(" ")[0];
    let thumbnail = contentPost.querySelector(".thumbnailCell img");
    let orgsrc = thumbnail.src.replace(/rendition=[^&]*/, `rendition=ORIGINAL_${ext}`).replace(/&page=[^&]*/, '');
    thumbnail.parentNode.onclick = (event) => {
        event.preventDefault();
        originalImage.onload = function(){
            originalImageContainer.onmouseout = hideSelf;
            originalImageContainer.onclick = hideSelf;
        }
        originalImage.src = orgsrc;
        originalImageContainer.style.display = 'block';
    };
}

document.querySelectorAll(".contentPost").forEach(contentPost => addOriginalImageViewAction(contentPost));


const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        for(let node of mutation.addedNodes){
            if(node.nodeType === Node.ELEMENT_NODE){
                if(node.nodeName === 'DIV' && node.parentElement){
                    let doc = node.parentElement;
                    setRepostVisibility(doc);
                    setReadItemVisibility(doc, g_isVisible, g_read, g_hideEntityDict);
                }
                node.querySelectorAll(".contentPost").forEach(contentPost => addOriginalImageViewAction(contentPost));
            }
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.hasOwnProperty('isVisible')) {
        g_isVisible = request.isVisible;
        setRepostVisibility(document);
        setReadItemVisibility(document, g_isVisible, g_read, g_hideEntityDict);
    }
});