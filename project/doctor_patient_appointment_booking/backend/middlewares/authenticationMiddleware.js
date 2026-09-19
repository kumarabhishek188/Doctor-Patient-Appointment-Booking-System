const jwt=require("jsonwebtoken");
const fs=require("fs");
const path=require("path");
require("dotenv").config();
const authentication=async(req,res,next)=>{
    let token=req.headers.authorization;
    try {
        if(token){
            if (token.startsWith('Bearer ')) {
                token = token.slice(7);
            }
            const blacklistPath = path.join(__dirname, "../blacklist.json");
            const blacklist = JSON.parse(fs.readFileSync(blacklistPath, "utf8"));
            if (blacklist.includes(token)) return res.status(401).json({ msg: "Session has ended. Please log in again." });
            let decode=jwt.verify(token,process.env.Key);
            let userId=decode.userId;
            let role=decode.role;
            let email=decode.email;
            //console.log(decode)
            if(decode){
                req.body.userId=userId;
                req.body.role=role;
                req.body.userEmail=email;
                next();
            }else{
                return res.status(401).json({"msg":"Invalid token."})
            }
        }else{
            return res.status(401).json({"msg":"Authentication required."})
        }
    } catch (error) {
        console.log("error from authenticate middleware",error);
        return res.status(401).json({"msg":"Invalid or expired token."})
    }
}

module.exports={
    authentication
}