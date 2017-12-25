const express = require('express');
const router = express.Router();

var querystring= require('querystring');
var path = require('path');
var bodyParser = require('body-parser');
var request = require('request');
var axios= require('axios');

var config ={};
if (process.env.liveenv)
{
    console.log('livesettings');
    var config = require('../../settingsLive');}


else{
    console.log('Local Envoirment');
    var config = require('../../settings');}


var crypto = require('crypto');

var knex = require('knex')({
    client: 'mysql',
    connection: {
        host : config.database.socketPath,
        user : config.database.user,
        password : config.database.password,
        database : config.database.database,

    },
    pool: { min: 0, max: 5 }
});

const Shopify = require('shopify-api-node');
var shopify = '';
var currentShop='';
let userSettings={};


// Error handling
const sendError = (err, res) => {
    response.status = 501;
    response.message = typeof err == 'object' ? err.message : err;
    res.status(501).json(response);
};

// Response handling
let response = {
    status: 200,
    data: [],
    message: null
};


Array.prototype.forEachLoop=function(a){
    var l=this.length;
    for(var i=0;i<l;i++)a(this[i],i)
}
// Get users


router.get('/minifyThemeFile',verifyShop,  async (req, res) => {

    res.setHeader('Content-Type', 'application/json');

    res.send( 'running minfiying') ;
try {
    console.log(req.query.key);
     let rep= await shopify.asset.get(req.query.themeid,{ asset:{key: req.query.key} })
    // res.setHeader('Content-Type', 'application/json');
     console.log('fetched resource');

    if(rep) {
        let minified = await axios.post('https://minify.minifier.org', querystring.stringify({
            source: rep.value, type: req.query.type
        }), {
            headers: {
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        });
        console.log('minified  data');
        //console.log(minified);
      //  console.log(minified.data);
            if(minified.data && minified.data.minified){
                let s= {
                    key:req.query.key.replace('/','\/'),
                    value:minified.data.minified
                };
               // console.log(s);
               await shopify.asset.update(req.query.themeid,s);
               console.log('data uploaded');
            }
    }}
    catch(ex){
        console.log(ex);
      //  res.send(ex.response.data);
    }

  //  res.send(rep.value);


});





function verifyRequest(req, res, next) {
    var map = JSON.parse(JSON.stringify(req.query));
    delete map['signature'];
    delete map['hmac'];

    var message = querystring.stringify(map);
    var generated_hash = crypto.createHmac('sha256', config.oauth.client_secret).update(message).digest('hex');
    console.log(generated_hash);
    console.log(req.query.hmac);
    if (generated_hash === req.query.hmac) {
        next();
    } else {
        return res.json(400);
    }

}


function verifyShop(req,res,next){
    if(req.query.shop)
    {

        if(req.query.shop=='all')
        {
            res.send('not possible');
        }
        knex('tbl_usersettings').where({
            store_name :  req.query.shop
        }).first('*')
            .then(function (row) {
                if(row)
                {

                    currentShop=req.query.shop;
                    userSettings=row;
                    shopify = new Shopify({
                        shopName: req.query.shop.replace('.myshopify.com',''),
                        apiKey: config.oauth.api_key,autoLimit:true,
                        password: row.access_token
                    });
                    next();


                }

            });









    }
    else
        return res.json(400);
}



module.exports = router;
