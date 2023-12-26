/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.js you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * }
 */

import { contextBridge } from "electron";
import { BrowserWindow, dialog } from "@electron/remote";
import path from "path";
import fs from "fs";

contextBridge.exposeInMainWorld("myWindowAPI", {
  minimize() {
    BrowserWindow.getFocusedWindow().minimize();
  },

  toggleMaximize() {
    const win = BrowserWindow.getFocusedWindow();

    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  },

  close() {
    BrowserWindow.getFocusedWindow().close();
  },
});

/*
contextBridge.exposeInMainWorld("pro7Proto", {
  async load(file) {
    const publicFolder = path.resolve(
      __dirname,
      process.env.QUASAR_PUBLIC_FOLDER
    );
    return await protobuf.load(
      path.join(publicFolder, `./proto/${file}.proto`)
    );
  },
  async decode(proto, file) {
    return await protobuf.d;
  },
});
*/

contextBridge.exposeInMainWorld("fileApi", {
  async openTemplate() {
    const openPath = await dialog.showOpenDialog({
      title: "Open Presentation Template",
      filters: [
        {
          name: "ProPresenter7 Presentation",
          extensions: ["pro"],
        },
      ],
    });

    if (openPath.canceled) {
      return;
    }
    const filePath = openPath.filePaths[0];
    const file = fs.readFileSync(filePath);
    return { path: filePath, data: file };
  },

  async saveFile(data, defaultPath = null) {
    const path = await dialog.showSaveDialog({
      title: "Save Presentation",
      defaultPath,
      filters: [
        {
          name: "ProPresenter7 Presentation",
          extensions: ["pro"],
        },
      ],
    });

    if (path.canceled) {
      return;
    }

    fs.writeFileSync(path.filePath, data);
  },

  async save(presentationData) {
    const publicFolder = path.resolve(
      __dirname,
      process.env.QUASAR_PUBLIC_FOLDER
    );
    fs.writeFileSync(
      path.join(publicFolder, "/Presentation.pro"),
      presentationData
    );
  },
});
