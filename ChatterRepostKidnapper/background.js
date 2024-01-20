let isEnabled = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.query === 'getStatus') {
        sendResponse({isEnabled: isEnabled});
    } else if (request.toggle) {
        isEnabled = !isEnabled;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {isEnabled: isEnabled});
        });
        sendResponse({isEnabled: isEnabled});
    }
    return true;
});