# ⚜ Task Boujee - Setup Guide

Welcome to the **Task Boujee** premium productivity companion extension setup guide. Follow these simple steps to install the dependencies, build, and load the extension into your browser.

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (usually packaged with Node.js)

---

## 🚀 Setup Steps

### 1. Clone & Enter Directory
Make sure you are in the project root directory:
```bash
cd zenflow-extension-react
```

### 2. Install Dependencies
Install all required Node.js modules defined in `package.json`:
```bash
npm install
```

### 3. Build the Extension
Compile the React source files into browser-ready HTML, JS, and CSS bundles:
```bash
npm run build
```
This command generates a static, distribution-ready **`dist`** directory in the root of the project.

---

## 🔌 Load the Extension into Brave / Chrome

Once built, load the extension into any Chromium-based browser (Brave, Chrome, Edge, Opera, etc.):

1. Open your browser and navigate to the Extensions page:
   - **Brave**: `brave://extensions`
   - **Chrome**: `chrome://extensions`
2. **Toggle Developer Mode** (usually located in the top-right corner) to **ON**.
3. Click the **Load unpacked** button (usually in the top-left menu bar).
4. In the file explorer popup, navigate to this project folder (`zenflow-extension-react`) and select the **`dist`** folder.
5. Click **Open** / **Select Folder**.

🎉 **Task Boujee** is now installed! You will see its gold icon in your extension bar. Click it to open your luxury dashboard.

---

## 🛠 Local Development Mode

If you are editing the React code and want to preview the popup layout inside a standard browser tab with Fast Refresh enabled:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
*Note: Chrome API bindings like tab counting or scraping won't execute in standard tabs, but the dashboard widgets, notes, backup tools, and themes will function in simulated fallback mode.*
