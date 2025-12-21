chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id && tab.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Relay tab activity to the side panel so it can refresh the current domain
const notifyTabActivity = async () => {
  try {
    await chrome.runtime.sendMessage({ type: 'tab-activity' });
  } catch (error) {
    // Ignore if no listener (e.g., side panel not open)
    console.debug('tab activity message skipped', error);
  }
};

chrome.tabs.onActivated.addListener(notifyTabActivity);
chrome.tabs.onUpdated.addListener((_, changeInfo) => {
  if (changeInfo.url) {
    notifyTabActivity();
  }
});
