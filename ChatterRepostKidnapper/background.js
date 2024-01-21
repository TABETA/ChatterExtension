let isVisible = false;
chrome.storage.local.get('isVisible', function(data) {
    isVisible = data.isVisible;
    if (typeof isVisible === 'undefined') {
        isVisible = false;
    }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.query === 'getStatus') {
        sendResponse({isVisible: isVisible});
    } else if (request.toggle) {
        isVisible = !isVisible;
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {isVisible: isVisible});
        });
        chrome.storage.local.set({isVisible: isVisible}, () => { });
        sendResponse({isVisible: isVisible});
    }
    return true;
});