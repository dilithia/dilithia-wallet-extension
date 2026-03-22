# Browser Compatibility

The Dilithia Wallet is built for Chrome MV3 and is 95% compatible with Firefox out of the box.

## Compatibility Matrix

| API | Chrome | Firefox | Notes |
|-----|--------|---------|-------|
| `chrome.storage.local` | Yes | Yes | Fully compatible |
| `chrome.runtime.sendMessage` | Yes | Yes | Fully compatible |
| `chrome.runtime.getURL` | Yes | Yes | Fully compatible |
| `chrome.tabs.query/sendMessage` | Yes | Yes | Fully compatible |
| `chrome.alarms` | Yes | Yes | Service worker keepalive |
| `chrome.action.setBadgeText` | Yes | Yes | Minor styling differences |
| `chrome.notifications` | Yes | Yes | Feature subset in Firefox |
| `chrome.action.openPopup()` | Yes | **No** | Firefox has no equivalent |
| WASM loading | Yes | Yes | Identical behavior |
| Content script `ISOLATED` world | Yes | Yes | Firefox default |
| `options_ui.open_in_tab` | Yes | Yes | Since Firefox 60 |

## No Incompatibilities

The extension does not use `chrome.action.openPopup()` (unreliable even in Chrome, unavailable in Firefox). Instead, it uses the MetaMask pattern:

1. **Badge** shows pending approval count
2. **System notification** alerts the user
3. User opens the popup manually via the extension icon

This works identically across Chrome and Firefox.

## Namespace

Firefox prefers `browser.*` over `chrome.*`, but polyfills `chrome.*` in MV3 extensions. All existing `chrome.*` calls work without changes. For new code, prefer:

```javascript
const api = typeof browser !== 'undefined' ? browser : chrome;
```

## Building for Firefox

To package for Firefox AMO:

1. Add to `manifest.json`:
```json
"browser_specific_settings": {
  "gecko": {
    "id": "wallet@dilithia.org",
    "strict_min_version": "109.0"
  }
}
```

2. Build the popup: `npm run build`
3. Package: `web-ext build --source-dir .`
4. Upload to [addons.mozilla.org](https://addons.mozilla.org)

!!! note
    Firefox requires a `gecko.id` in the manifest for AMO submission.
    The `strict_min_version` ensures MV3 support.

## Testing Checklist

- [ ] Popup opens on extension icon click
- [ ] Create wallet flow (mnemonic + password)
- [ ] Lock/unlock cycle
- [ ] Provider injects `window.dilithia`
- [ ] DApp connect approval (via notification)
- [ ] Sign message (offchain)
- [ ] Send transaction (onchain)
- [ ] Shielded deposit/withdraw
- [ ] Badge count updates
- [ ] WASM crypto loads correctly
- [ ] Storage persists between sessions
