const { dialog, electron, app, BrowserWindow, ipcMain } = require("electron");
const path = require("path"), fs = require("fs")
//const dz=require("detal-zip")
const child_process = require("child_process");
require("md5"),require("list-dir")//为子进程引入相应模块
let main_window = null;
let dzc = null;
app.on("ready", (info) => {
    app.isDevMode=!fs.existsSync(path.join(process.cwd(), "resources"));
    fs.mkdir("tmp", (err) => { })
    main_window = new BrowserWindow({
        width: 800,
        height: 600
    })
    main_window.loadURL(`file://${__dirname}/views/index.html`);
    //main_window.webContents.openDevTools();
    init();
})
app.on("window-all-closed", () => {
    app.exit()
})
function init() {
    setTimeout(function () {
        //webConsole("chdir=", process.chdir());
        webConsole("__dirname="+__dirname);
        webConsole("cwd="+process.cwd());
    }, 2000);
}
function webConsole(msg) {
    main_window.webContents.send("alert", msg);
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
                                webConsole("task_path ="+`${__dirname}/task.js`)
                                //启动Task fork 子线程
                                dzc = child_process.fork(`${__dirname}/task.js`)
                                .on("close",(code,signal)=>{
                                    webConsole("task fork closed "+code+"  "+signal)
                                })
                                .on("error",(err)=>{
                                    webConsole("task fork error"+err.message)
                                })

                                main_window.webContents.send("progress", 0);
                                dzc.on("message", (m, s) => {
                                    if (m.pgs) {
                                        main_window.webContents.send("progress", m.pgs);
                                    } else if (m.msg) {
                                        console.log(m.msg)
                                        main_window.webContents.send("alert", m.msg);
                                    } else if (m.finished) {
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