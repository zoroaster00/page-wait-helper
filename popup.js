'use strict';
const startButton = document.getElementById('startButton');
const cancelButton = document.getElementById('cancelButton');
const waitingMessage = document.getElementById('waitingMessage');
const waitTarget = document.getElementById('waitTarget');
const nickname = document.getElementById('nickname');
const token = document.getElementById('token');
startButton.onclick = onPollClick;
cancelButton.onclick = onCancelClick;
waitTarget.nextElementSibling.textContent = '\u76ee\u6a19';
nickname.nextElementSibling.textContent = '\u5546\u54c1\u66b1\u7a31 \u0028\u9078\u586b\u0029';
token.nextElementSibling.textContent = '\u8a8d\u8b49\u78bc';

const ERROR_USER_MSG = '\u7121\u6548\u8a8d\u8b49\u78bc\uff08\u53ef\u900f\u904e\u004c\u0069\u006e\u0065\u66f4\u65b0\u8a8d\u8b49\u78bc\uff09';

let currentTabId;

chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length === 0) {
        console.log('NO TAB');
        return;
    }
    currentTabId = tabs[0].id;
    chrome.runtime.sendMessage({ cmd: 'ALLOW_POLL', tabId: currentTabId }, null, (result) => {
        if (result.noContent) {
            startButton.disabled = true;
            setWaiting(false);
            return;
        }
        setWaiting(result.isWaiting);
    });
});

chrome.storage.sync.get(['token'], function(result) {
    token.value = result && result.token;
});

function showError(error) {}

function setWaiting(waiting) {
    toggleDisplay(startButton, !waiting);
    toggleDisplay(cancelButton, waiting);
    toggleDisplay(waitingMessage, waiting);
}

function toggleDisplay(elem, display) {
    elem.style.display = display ? '' : 'none';
}

function onCancelClick() {
    chrome.runtime.sendMessage({
        cmd: 'CANCEL_CLICK',
        tabId: currentTabId
    }, null, () => {
        setWaiting(false);
    });
}

function onPollClick() {
    const waitTargetNum = Number.parseInt(waitTarget.value);
    if (Number.isNaN(waitTargetNum)) {
        alert('\u8acb\u8f38\u5165\u7b49\u5f85\u76ee\u6a19');
        return;
    }
    if (!token.value) {
        alert(ERROR_USER_MSG);
        return;
    }
    setWaiting(true);
    chrome.storage.sync.set({ token: token.value }, function() {});

    chrome.runtime.sendMessage({
        cmd: 'POLL_CLICK',
        tabId: currentTabId,
        param: {
            waitTarget: waitTargetNum,
            nickname: nickname.value,
            token: token.value
        }
    }, null, (response) => {
        if (response.error) {
            const errorMessage = response.error === 'USER_NOT_FOUND' ? ERROR_USER_MSG : response.error;
            alert(errorMessage);
        }
        setWaiting(false);
    });
}