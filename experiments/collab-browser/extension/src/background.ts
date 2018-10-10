import { SharingTab, RemotingTab } from "./sharingtab";
import { ScreenShare } from "./screenshare";

let sharingTab = new SharingTab(`${Math.random().toString(36).substr(2, 4)}`);
const screenCast = new ScreenShare();
let remoteDocId: string;
const remotingTab = new RemotingTab();

const createRemoteDocId = () => { remoteDocId = `remote-${Math.random().toString(36).substr(2, 4)}` };

const parentMenuId = "prague_share_menu";
const menus: chrome.contextMenus.CreateProperties[] = [{
        title: "component",
        contexts: ["all"],
        onclick: async (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) => {
            createRemoteDocId();
            await screenCast.start(tab.id, remoteDocId);
            await insertComponent("document", { id: remoteDocId });
        }
    }, {
        title: "selection",
        contexts: ["selection"],
        onclick: async (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) => {
            insertText(info.selectionText);
        }
    }, {
        title: "session",
        contexts: ["all"],
        onclick: async (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) => {
            createRemoteDocId();
            await screenCast.start(tab.id, remoteDocId);
            await remotingTab.get(remoteDocId);
        }
    }];

chrome.contextMenus.create({
    id: parentMenuId,
    title: "share",
    contexts: ["all"],
}, () => {
    for (const menu of menus) {
        menu.parentId = parentMenuId;
        chrome.contextMenus.create(menu);
    }
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    switch (request.type) {
        case "share": {
            sharingTab.get(true);
            return false;
        }
        case "getDocId": {
            sendResponse(remoteDocId);
            return false;
        }
        default:
            return false;
    }
});

const executeScript = async (script: string) => { 
    chrome.tabs.sendMessage(await sharingTab.get(false), { type: "eval", script });
};

const insertComponent = (type: string, state: {}) => {
    executeScript(`insertComponent(${JSON.stringify(type)}, ${JSON.stringify(state)})`);
};

const insertText = (text: string) => {
    executeScript(`insertText(${JSON.stringify(text)})`);
};