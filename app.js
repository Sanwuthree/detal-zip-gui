const { dialog, electron, app, BrowserWindow, ipcMain } = require("electron");
const path = require("path"), fs = require("fs")
//const dz=require("detal-zip")
const child_process = require("child_process");

app.asar_path=path.join(__dirname,"..");

let main_window = null;
let dzc =null;
app.on("ready", (info) => {
    init();
    fs.mkdir("tmp", (err) => { })
    main_window = new BrowserWindow({
        width: 800,
        height: 600
    })
    main_window.loadURL(`file://${__dirname}/views/index.html`);
    //main_window.webContents.openDevTools()
})
app.on("window-all-closed", () => {
    app.exit()
})
function init(){
    
}
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

                            dialog.showSaveDialog(main_window, {
                                defaultPath: "detal-" + path.basename(newfile)
                            }, (filename) => {
                                if (!filename) {
                                    evt.returnValue = [false, "must select a place to save"]
                                    return;
                                }
                                evt.returnValue = [true, filename];
                                main_window.webContents.send("alert", __dirname);
                                let task_path = path.join(__dirname,"task.js");
                                if(fs.existsSync(task_path)){
                                    main_window.webContents.send("alert", "find "+task_path);
                                }else{
                                    main_window.webContents.send("alert", "not find "+task_path);
                                }
                                dzc= child_process.fork(path.join(__dirname,"task.js"));
                                main_window.webContents.send("progress", 0);

                                dzc.on("message", (m, s) => {
                                    if (m.pgs) {
                                        main_window.webContents.send("progress", m.pgs);
                                    } else if (m.msg) {
                                        console.log(m.msg)
                                        main_window.webContents.send("alert", m.msg);
                                    }else if(m.finished){
                                        main_window.webContents.send("finished", m.finished);
                                    }
                                });
                            
                                dzc.send([newfile, oldfile, filename]);
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