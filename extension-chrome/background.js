chrome.commands.onCommand.addListener(cmd => chrome.tabs.create({ url: 'chrome://' + cmd }))
