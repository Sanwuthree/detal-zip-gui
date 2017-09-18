const { dialog,electron, app, BrowserWindow, ipcMain } = require("electron");
const path = require("path"), fs = require("fs")
const dz=require("detal-zip"),child_process=require("child_process");
// dz.detal("a2.zip","a1.zip","out.zip");

let main_window = null;
app.on("ready", (info) => {
    console.log("hel")

    main_window = new BrowserWindow({
        width: 800,
        height: 600
    })
    main_window.loadURL(`file://${__dirname}/views/index.html`);
    main_window.webContents.openDevTools();
    dz.on("prograss",(finished,total,name)=>{
        main_window.webContents.send("progress",finished/total);
    })
})

ipcMain.on("start-generate", (evt, args) => {
    console.log(args);
    if (args[0] && args[1]) {
        let newfile = args[0], oldfile = args[1];
        if (newfile === oldfile) {
            evt.returnValue = [false, "Same file are not support"];
        } else {
            fs.exists(newfile, (ex) => {
                if (ex) {
                    fs.exists(oldfile, (ex) => {
                        if (ex) {
                           
                            dialog.showSaveDialog(main_window,{
                                defaultPath:"detal-"+path.basename(newfile)
                            },(filename)=>{
                                evt.returnValue = [true,filename];
                                dz.detal(newfile,oldfile,filename)           
                            })
                        } else {
                            evt.returnValue = [false, "old zip file path are not exists"];
                        }
                    })
                } else {
                    evt.returnValue = [false, "new zip file path are not exists"];
                }
            })
        }
    } else {
        evt.returnValue = [false, "two file requirement"];
    }
})