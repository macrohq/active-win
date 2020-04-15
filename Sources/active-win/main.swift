import AppKit

let frontmostAppPID = NSWorkspace.shared.frontmostApplication!.processIdentifier
let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as! [[String: Any]]

for window in windows {
	let windowOwnerPID = window[kCGWindowOwnerPID as String] as! Int

	if windowOwnerPID != frontmostAppPID {
		continue
	}

	// Skip transparent windows, like with Chrome.
	if (window[kCGWindowAlpha as String] as! Double) == 0 {
		continue
	}

	let bounds = CGRect(dictionaryRepresentation: window[kCGWindowBounds as String] as! CFDictionary)!

	// Skip tiny windows, like the Chrome link hover statusbar.
	let minWinSize: CGFloat = 50
	if bounds.width < minWinSize || bounds.height < minWinSize {
		continue
	}

	let appName = window[kCGWindowOwnerName as String] as! String
	var dict: [String: Any] = [
		"owner": [
			"name": appName,
		]
	]

	// Only run the AppleScript if active window is a compatible browser.
	if
		let script = getActiveBrowserTabURLAppleScriptCommand(appName),
		let url = runAppleScript(source: script)
	{
		dict["url"] = url
	}

	print(try! toJson(dict))
	exit(0)
}

print("null")
exit(0)
