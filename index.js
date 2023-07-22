require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI , { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})

const URLScehma = new mongoose.Schema({
  original_url : {type : String , required : true , unique : true},
  short_url : {type : String , required : true , unique : true}
})

const URLModel = mongoose.model('url', URLScehma)

// Basic Configuration
const port = process.env.PORT || 3000;


app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({extended:true}))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:short_url' , (req, res)=>{
  const short_url = req.params.short_url;
  URLModel.findOne({short_url :short_url}).then((foudOne)=>{
    if(foudOne){
      res.redirect(foudOne.original_url);
    }
    else{
      res.json({ error: 'invalid url' })
    }
  })

})

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
    const url = req.body.url;
    try {
      
      const urlObj = new URL(url);
      dns.lookup(urlObj.hostname , (err , address , family)=>{
        if(!address){
          res.json({ error: 'invalid url' })
        }
        else {
          let original_url = urlObj.href;
          URLModel.findOne({original_url : original_url}).then((url)=>{
            if(url){
                res.json({
                  original_url : url.original_url,
                  short_url : url.short_url
                })
            }
            else{
              let short_url = 1 ;
           
            URLModel.find({}).sort({short_url : "desc"}).limit(1).then((latestUrl)=>{
                if(latestUrl.length>0){
                  short_url = parseInt(latestUrl[0].short_url)+1;
                }
                  resObj = {
                    original_url : original_url,
                    short_url : short_url
                  }
                  let newUrl = new URLModel(resObj);
                  newUrl.save();
                  res.json(resObj)
                
            })

            }
          })
            
        }
      })

    } catch  {
      res.json({ error: 'invalid url' })
    }
    
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
