let process=require("process");
let dz=require("detal-zip")
dz.on("prograss",(it,tot,name)=>{
    process.send("prograss",it/tot)
})
let n=process.argv[1],o=process.argv[2],p=process.argv[3];
//dz.detal(n,o,p);

process.on("message",(msg)=>{
    console.log(msg)
})