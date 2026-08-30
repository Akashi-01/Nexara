import express from "express";
import Thread from "../models/Thread.js";
import getOpenAIRespense from "../utils/openai.js";

const router = express.Router();

// Test
router.post("/test", async(req,res) => {
    try{
        const thread = new Thread({
            threadId:"abc",
            title:"Testing New Thread2"
        });
        const response = await thread.save();
        res.send(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to save in Database"});
    }
});

// Get all threads
router.get("/thread", async(req, res) => {
    try{
        const threads = await Thread.find({}).sort({updatedAt: -1});
        // descending order of upadatedAt / most recent data on top
        res.json(threads);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to retrieve threads"});
    }
});

// Send info of particular thread using threadId
router.get("/thread/:threadId", async(req, res) =>{
    const {threadId} = req.params;
    try{
        const thread = await Thread.findOne({threadId});
        if(!thread){
            return res.status(404).json({error:"Thread not found"});
        }
        res.json(thread.messages);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to get thread"});
    }
});

// Delete route based on specific threadId
router.delete("/thread/:threadId", async(req, res) => {
    const {threadId} = req.params;
    try{
        const deletedthread = await Thread.findOneAndDelete({threadId});
        if(!deletedthread){
            return res.status(404).json({error:"Thread not found"});
        }
        res.status(200).json({success:"Thread deleted successfully"});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to delete thread"});
    }
});

// Post route for messages
router.post("/chat", async(req, res)=>{
    const {threadId, message} = req.body;
    if(!threadId || !message){
        return res.status(400).json({error:"Missing required fields."});
    } 
    try{
        let thread = await Thread.findOne({threadId});
        
        if(!thread){
            // create a new thread
            thread = new Thread({
                threadId,
                title: message,
                messages: [{role:"user", parts:[{text:message}]}]
            });
        }else{
            thread.messages.push({role:"user", parts:[{text:message}]});
        }
        const assistantReply = await getOpenAIRespense(message);
        thread.messages.push({role:"assistant", parts:[{text:assistantReply}]});
        thread.updatedAt = new Date();
        await thread.save();
        res.json({reply: assistantReply});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Something went wrong."});
    }
});


export default router;