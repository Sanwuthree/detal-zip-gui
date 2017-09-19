const process=require("process");
//const archiver = require("archiver");
const listdir = require("list-dir");
const fs = require("fs");
const path = require("path");
const md5 = require("md5");
const events = require('events');
const child_process = require("child_process");
let seven_z_path ="";
class Com extends events.EventEmitter {
    constructor() {
        super();
        this.isDevMode=!fs.existsSync(path.join(process.cwd(), "resources"));
    }
    throwMessage(msg) {
        this.emit("throw-message", msg)
    }
    detal(newzip, oldzip, outzip) {
        seven_z_path=path.join(process.cwd(),"7z.exe");
        this.throwMessage("__dirname=" + __dirname);
        this.throwMessage("Cwd = ",process.cwd());
        this.throwMessage("7z.exe = "+seven_z_path);
        let newdirname = path.basename(newzip, ".zip");
        let olddirname = path.basename(oldzip, ".zip");
        //newdirname = path.join(process.cwd(),"tmp", newdirname);
        //olddirname = path.join(process.cwd(),"tmp", olddirname);
        this.throwMessage("newzip="+newzip);
        this.throwMessage("newdirname=" + newdirname);
        this.throwMessage("oldzip="+oldzip)
        this.throwMessage("olddirname=" + olddirname);
        let isOldZipExtract = false;
        let isNewZipExtract = false;

        this.throwMessage("Extracting files.....");
        child_process.spawn(seven_z_path, ["x", "-y", "-o" + newdirname, newzip],{cwd:path.join(process.cwd(),"tmp")}).on("close", (code, sing) => {
            console.log("new extracted")
            isNewZipExtract = true;
            this.throwMessage("new zip file extracted")
            if (isOldZipExtract) {
                this.compare_files(newdirname, olddirname, outzip);
            }
        })
        child_process.spawn(seven_z_path, ["x", "-y", "-o" + olddirname, oldzip],{cwd:path.join(process.cwd(),"tmp")}).on("close", (code, sing) => {
            console.log("old extracted")
            isOldZipExtract = true;
            this.throwMessage("old zip file extracted")
            if (isNewZipExtract) {
                this.compare_files(newdirname, olddirname, outzip);
            }
        })
    }
    compare_files(new_dirname, old_dirname, outzip) {
        new_dirname=path.join(process.cwd(),"tmp",new_dirname);
        old_dirname=path.join(process.cwd(),"tmp",old_dirname);
        this.throwMessage("Start Compare")
        let f2files = listdir.sync(new_dirname);
        console.log(f2files)
        const count = f2files.length;
        let it = 0;
        let desfiles=["a",outzip]
        f2files.forEach((element) => {
            let new_file_path = path.join(new_dirname, element.toString());
            let old_file_path = path.join(old_dirname, element.toString());
            fs.exists(old_file_path, (exists) => {
                if (exists) {
                    let oldmd5 = md5(fs.readFileSync(old_file_path));
                    let newmd5 = md5(fs.readFileSync(new_file_path));
                    if (oldmd5 != newmd5) {
                        //archive.file(new_file_path, { name: element })
                        desfiles.push(element.toString())
                    }
                } else {
                    //archive.file(new_file_path, { name: element })
                    desfiles.push(element.toString())
                }
                it++;
                //this.throwMessage(it + "/" + count + "   " + new_file_path);
                this.emit("prograss", it, count, new_file_path);
                if (it == count) {
                    console.log(desfiles)
                    
                    child_process.spawn(seven_z_path,desfiles,{
                        cwd:new_dirname
                    }).on("close",(code,signal)=>{
                       console.log("Compress ok ",code)
                       this.emit("finished")
                   })
                }
            })
        });
    }
}
function deleteall(path) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse  
                deleteall(curPath);
            } else { // delete file  
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};



//module.exports = new Com();
let dz=new Com()
process.on("message",(m)=>{
    process.send({"msg":"task is ready"})
    dz.on("prograss",(a,b,c)=>{
        process.send({"pgs":a/b})
    })
    dz.on("throw-message",(msg)=>{
        process.send({"msg":msg})
    })
    dz.on("finished",()=>{
        process.send({"finished":true})
    })
    dz.detal(m[0],m[1],m[2])
})