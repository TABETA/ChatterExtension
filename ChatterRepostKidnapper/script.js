let isEnabled = false;

const target = 'div.cxfeeditem.feeditem';
const hideReposts = () => {
    const divs = document.querySelectorAll(target);
    const reposts = Array.from(divs).map(div => {
        const doesContainRepost = Array.from(div.querySelectorAll('a')).some(anchor => anchor.innerText.includes('元の投稿'));
        const doesContainComments = div.querySelector('div.feeditemcomment.cxfeedcomment') !== null;
        return (doesContainRepost && !doesContainComments) ? div : null;
    }).filter(div => div !== null);
    reposts.forEach(div => { if(div) { div.style.display = 'none'; } });
};

const showReposts = () => {
    const divs = document.querySelectorAll(target);
    divs.forEach(div => { div.style.display = ''; });
};

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
            if (isEnabled) {
                hideReposts();
            }
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.hasOwnProperty('isEnabled')) {
        isEnabled = request.isEnabled;
        if (isEnabled) {
            hideReposts();
        } else {
            showReposts();
        }
    }
});