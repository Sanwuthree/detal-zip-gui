const process=require("process");
const dz=require("./compare")
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