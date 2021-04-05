'use strict';
// webhook should be ready from background-env.js

async function postData(url = '', data = {}, token) {
    // Default options are marked with *
    if (!token) {
        return;
    }
    const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
            'T-Token': token
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

let tabIdTable;

chrome.runtime.onInstalled.addListener(function() {
    // key: tab ID, value: idle (boolean)
    tabIdTable = {};
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const tabId = (sender.tab && sender.tab.id) || request.tabId;
    if (!tabId) {
        return;
    }
    switch (request.cmd) {
        case 'CONTENT_OPEN':
            tabIdTable[tabId] = true;
            return;
        case 'CONTENT_CLOSE':
            delete tabIdTable[tabId];
            return;
        case 'ALLOW_POLL':
            if (tabIdTable[tabId] == null) {
                sendResponse({ noContent: true });
            } else {
                sendResponse({ isWaiting: !tabIdTable[tabId] });
            }
            return;
        case 'POLL_CLICK':
            tabIdTable[tabId] = false;
            chrome.tabs.sendMessage(tabId, request.param, null, function(data) {
                console.log(data);
                tabIdTable[tabId] = true;
                // make LINE API call
                postData(WEBHOOK, {
                    message: `\u4f60\u597d
\u5546\u54c1\u540d\u7a31: ${data.title}
\u5546\u54c1\u66b1\u7a31: ${data.nickname}
\u5df2\u7d93\u6392\u5230\u9806\u4f4d: ${data.waitTarget}
${data.url}`
                }, request.param.token).then(data => {
                    // TODO handle error
                    sendResponse(data);
                    console.log(data); // JSON data parsed by `data.json()` call
                });
            });
            return true;
        case 'CANCEL_CLICK':
            tabIdTable[tabId] = true;
            chrome.tabs.sendMessage(tabId, { cancel: true }, null, function(data) {
                console.log(data);
                sendResponse(data);
            });
            return true;
        default:
            break;
    }
});