let intervalId;

chrome.runtime.sendMessage({ cmd: 'CONTENT_OPEN' });
window.onbeforeunload = () => {
    clearInterval(intervalId);
    chrome.runtime.sendMessage({ cmd: 'CONTENT_CLOSE' });
};

function pollWaitNum(request, sendResponse) {
    const waitTarget = request.waitTarget;
    intervalId = setInterval(() => {
        const iframe = document.getElementById('outline');
        const innerDoc = iframe && (iframe.contentDocument || iframe.contentWindow.document);
        const elem = innerDoc && innerDoc.getElementById('waiterNum');
        console.log(elem);
        const waiterNum = Number.parseInt(elem && elem.innerHTML);
        if (Number.isNaN(waiterNum)) {
            console.log('WAITER NUM NOT FOUND');
            clearInterval(intervalId);
            sendResponse({ error: 'NO WAITER ELEMENT FOUND IN PAGE' });
            return;
        }
        if (waiterNum <= waitTarget) {
            console.log('REACH TARGET');
            clearInterval(intervalId);
            sendResponse({
                title: document.title,
                nickname: request.nickname,
                waitTarget: waiterNum,
                url: window.location.href
            });
            return;
        }
    }, 500);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.cancel) {
        clearInterval(intervalId);
        sendResponse(true);
        return;
    }
    if (request.waitTarget == null) {
        console.log('NO TARGET SET');
        sendResponse({ error: 'NO TARGET SET TO WAIT' });
        return;
    }
    pollWaitNum(request, sendResponse);
    // return true to not close the message channel
    return true;
});