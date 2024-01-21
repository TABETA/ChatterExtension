document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('toggleButton');

    chrome.runtime.sendMessage({query: 'getStatus'}, function(response) {
        if (response) {
            button.textContent = response.isVisible ? 'hide' : 'show';
        }
    });

    button.addEventListener('click', () => {
        chrome.runtime.sendMessage({toggle: true}, function(response) {
            if (response) {
                button.textContent = response.isVisible ? 'hide' : 'show';
            }
        });
    });
});