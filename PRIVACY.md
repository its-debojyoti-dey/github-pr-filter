# Privacy Policy for GitHub PR Filter

**Effective Date:** September 30, 2026  
**Last Updated:** September 30, 2026  

This Privacy Policy applies to the **GitHub PR Filter** browser extension ("Extension"), developed by Debojyoti Dey.

---

## 1. Overview and Core Principle

The **GitHub PR Filter** extension is built with privacy-first and client-side-only principles:
- **Zero Remote Data Collection:** We do not collect, transmit, monitor, sell, or share any personal information, browsing history, or GitHub account credentials.
- **Zero Third-Party Trackers:** The extension contains no analytics packages, telemetry, third-party trackers, or advertising SDKs.
- **Client-Side Execution:** All query filtering, preset calculations, and UI enhancements are executed entirely on your local browser.

---

## 2. Information Handled by the Extension

### Local Extension Storage (`chrome.storage`)
- **What is stored:** The extension only saves user-defined filter presets (preset names and query strings, e.g., `is:open review:approved`) and UI preferences (such as collapsed/expanded filter state).
- **Where it is stored:** This information is saved solely in your browser's local storage via the `chrome.storage` API. It remains under your control and never leaves your browser profile.

### Host Permissions (`https://github.com/*`)
- **Why it is requested:** The extension requires permission to run content scripts on GitHub repository pages exclusively to render the interactive filter bar, preset chips, and filter popover above pull request lists (`https://github.com/<owner>/<repo>/pulls`).
- **What is read/written:** The extension modifies only the DOM elements necessary to present the filter UI and update GitHub's search input with your chosen search tokens. It **does not** read repository source code, commit history, private messages, tokens, or personal identifiers.

---

## 3. Third-Party Services & Data Sharing

- The Extension does **not** communicate with any external backend servers or APIs.
- No information is transferred, sold, or shared with third parties under any circumstances.

---

## 4. Manifest V3 & Permission Compliance

The extension strictly complies with Google Chrome Web Store Developer Program Policies, specifically:
- **Single Purpose Policy:** The extension serves one distinct purpose: providing a native-feeling filter bar and quick preset chips on GitHub Pull Request pages.
- **Least Privilege Principle:** Only the `storage` permission and host permissions required for GitHub PR pages are requested.

---

## 5. User Rights and Data Deletion

You retain full control over your data:
- You can edit or delete any custom presets directly within the extension's UI at any time.
- Uninstalling the Extension instantly and permanently removes all stored presets and preferences from your browser.

---

## 6. Changes to this Policy

If we update this Privacy Policy, the revised version will be published in this repository with an updated effective date.

---

## 7. Contact Information

If you have questions, suggestions, or concerns regarding this privacy policy, please contact:
- **Developer / Maintainer:** Debojyoti Dey
- **GitHub Repository:** [https://github.com/its-debojyoti-dey/github-pr-filter](https://github.com/its-debojyoti-dey/github-pr-filter)
- **Issues & Inquiries:** [https://github.com/its-debojyoti-dey/github-pr-filter/issues](https://github.com/its-debojyoti-dey/github-pr-filter/issues)
