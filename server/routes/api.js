const express = require('express');
const router = express.Router();
var querystring= require('querystring');
var path = require('path');
var bodyParser = require('body-parser');
var request = require('request');
var PDFDocument= require('pdfkit');
var base64Img = require('base64-img');
var Mstream =require('memory-streams');
// var blobStream = require('blob-stream');
//var async = require('asyncawait/async');
//var await = require('asyncawait/await');
var firstEver=true;
var fs = require('fs');
var pdf = require('html-pdf');
var html = fs.readFileSync("./template.html", 'utf8');
//console.log(html);
var options = {    "width": "3.18cm",        // allowed units: mm, cm, in, px
    "height": "5.72cm",   };
String.prototype.trimi = function (length) {
    return this.length > length ? this.substring(0, length) + "..." : this;
}


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
var currentShop="";

let userSettings={};
let resmush= require('../smush-core/resmush.js');
// // Connect
// const connection = (closure) => {
//
//
//   return MongoClient.connect('mongodb://localhost:27017/mean', (err, db) => {
//     if (err) return console.log(err);
//
//   closure(db);
// });
// };


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
router.get('/getProducts',verifyShop, (req, res) => {

    shopify.product.list({ limit: 5 }) .then(function(products){
    res.setHeader('Content-Type', 'application/json'); res.send(products) })
    .catch(err => console.error(err));

});



let getProducts =(ids)=>{
    let products=[];
    let index=0;
    return new Promise(resolve => {

        ids.forEach( async i=>{
            console.log('getting p ');
            //products.push(await shopify.product.get(i));
            let p= await shopify.product.get(i);
            products.push(p);
            index++;

            if(index==ids.length)
            {
                console.log('resolving prodcuts');
                resolve(products);
            }

            console.log(index);
        });

    })

}
let getProductsbyPageId =(page,pagesize)=>{
    let products=[];
    let index=0;
    //let pagesize=50;

    return new Promise(async resolve => {


            let p= await shopify.product.list({limit:pagesize,page:page});
            resolve(p);


    })

}

router.get('/downloadlabelview.pdf',verifyShop,async (req, res) => {
    //res.send('ok')
          let query= querystring.stringify(req.query);
res.send(`

<script>

//  console.log(${query});
window.top.location.href='${config.app_url}/api/downloadlabel.pdf?${query}';
</script> 

`);


});


router.get('/downloadlabel.pdf',verifyShop,async (req, res) => {
    //res.send('ok')


    console.log('starting product');
     let products=[];


        products= await getProducts(req.query.ids);
    // res.send(products);
    // return ;
   // let product=   await shopify.product.get(req.query.id);

   // let Printable=product;


   // res.send(products) ;

    var doc = new PDFDocument({size:[90,162]});
       doc.info.Title = 'Products (' +req.query.ids.join(', ')+")";
   // res.setHeader('Content-Disposition',"attachment; filename= "+doc.info.Title+".pdf");
    var stream = doc.pipe(fs.createWriteStream('what.pdf'));

    console.log('requesting');


    createMultiplePdfLabel(products,'what.pdf',res,doc);


    stream.on('finish', function() {




        var data =fs.readFileSync('what.pdf');
      //  res.header["content-disposition"]="attachment; filename= "+doc.info.Title+".pdf";
        //res.setHeader("Content-Type","application/force-download");

        res.download('what.pdf',doc.info.Title);

        console.log('returning buffer pdf ');

    });



});





router.get('/downloadlabels.pdf',verifyShop,async (req, res) => {
    //res.send('ok')


    console.log('starting product');
    let products=[];
    let page =req.query.page; let pagesize=50;
    products= await getProductsbyPageId(req.query.page,pagesize);
     // res.send(products);
     // return ;
    // let product=   await shopify.product.get(req.query.id);

    // let Printable=product;


    // res.send(products) ;

    var doc = new PDFDocument({size:[90,162]});
    doc.info.Title = 'Products ('+((page-1)*pagesize+1)+"-"+page*pagesize+")";
    console.log(doc.info.Title);
    // res.setHeader('Content-Disposition',"attachment; filename= "+doc.info.Title+".pdf");
    var stream = doc.pipe(fs.createWriteStream('what.pdf'));

    console.log('requesting');


    createMultiplePdfLabel(products,'what.pdf',res,doc);


    stream.on('finish', function() {

                console.log('stream finished');


        var data =fs.readFileSync('what.pdf');
        //  res.header["content-disposition"]="attachment; filename= "+doc.info.Title+".pdf";
        //res.setHeader("Content-Type","application/force-download");

        res.download('what.pdf',doc.info.Title+".pdf");

        console.log('returning buffer pdf ');

    });



});
router.get ('/getProductsCount',verifyShop,async (req,res)=>{

    let count = await shopify.product.count();
    //console.log(products);
    res.send( {count: count});


});










//TODO : Update hooks For Access Token
router.get('/access_token', verifyRequest, function(req, res) {
  if (req.query.shop) {
    var params = {
      client_id: config.oauth.api_key,
      client_secret: config.oauth.client_secret,
      code: req.query.code
    }
    var req_body = querystring.stringify(params);
    console.log(req_body)
    request({
        url: 'https://' + req.query.shop + '/admin/oauth/access_token',
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(req_body)
        },
        body: req_body
      },
      function(err,resp,body) {
        console.log(body);
        body = JSON.parse(body);

        InsertupdateAccessToken(req.query.shop,body.access_token);





        res.redirect('/dashboard?shop='+req.query.shop);
      })
  }
});
//authenticate
router.get('/shopify_auth', function(req, res) {
  if (req.query.shop) {

   console.log(req.query.shop);
   var redirectUri= "https://"+req.query.shop+"/admin/oauth/authorize?client_id="+config.oauth.api_key+"&scope="+config.oauth.scope+"&redirect_uri="+config.oauth.redirect_uri;


    res.redirect(redirectUri);





  }
  else{
  res.send('provide shopify url');

  }
});



function getbase64(url){
    console.log('getting IMG');


    url=url.replace(/((\.JPG|\.jpeg|\.jpg))/,'_300x$1');
    console.log(url);
    return new Promise(resolve => {
         base64Img.requestBase64(url, function(err, response, body) {

         resolve(body);
             console.log('getting IMG  DONE');
         });


    });
}


let createPdfLabel = async (product,filename,res)=>{
    let pTitle= product.title;
    let pVendor= product.vendor;

    console.log(pTitle);

 //res.send(product);
// create a document and pipe to a blob
    var doc = new PDFDocument({size:[90,162]});
    var stream = doc.pipe(fs.createWriteStream(filename)); console.log('requesting');

    doc.fontSize(7)
    let index=1;
    product.variants.forEach(async variant=>{



        let variantTitle="";
        variantTitle=variant.title;
        if(variantTitle=='Default Title')
        {
            variantTitle='';
        }
        let variantImgURL = "";
        product.images.forEach(img => {
            if (img.id == variant.image_id) {
                variantImgURL = img.src.split('?')[0];
            }

        });

        if(variantImgURL=='')
        {
            variantImgURL=product.image.src;
        }
       // console.log(variantImgURL);
        let vImg= await getbase64(variantImgURL,product.images);

        if(index>1) {
            console.log('adding new page ');
            doc.addPage();

        }
             doc.moveTo(5, 5)
                .rect(5, 5, 80, 20)
                .rect(5, 25, 80, 70)
                .rect(5, 95, 80, 60)
                .strokeColor('grey')
                .stroke()

            //console.log(body);

            doc.image(vImg, 10, 30, {width:70,height:10})
                .fontSize(7)
            .moveTo(5, 5).text(variant.sku? variant.sku : '      ' , 10, 12, {
            width: 70, height: 1,
            align: 'center',
            indent: 0

            })
            .moveDown(10)
            .fontSize(6)
            .text(pTitle, {
            width: 70,
            align: 'left', indent: 0, height: 20,


            })
                .fontSize(6)
            .text(variantTitle, {
            width: 75, height: 1,
            align: 'left',


            })
                .fontSize(4)
            .text(pVendor, {
            width: 75, height: 1,
            align: 'left',

            })
            .moveTo(5, 5)
            .rect(5, 5, 80, 20)
            .rect(5, 25, 80, 70)
            .rect(5, 95, 80, 60)
            .strokeColor('grey')
            .stroke();
         // console.log(index);
            //  console.log(product.variants.length);
            if (index == product.variants.length) {
                console.log(
                    'doc end'
                )
                doc.end();

        }index++;

    });




     stream.on('finish', function() {




         var data =fs.readFileSync(filename);
         res.contentType("application/pdf");
         res.send(data);

         console.log('returning buffer pdf ');

     });




}


let singleProductLabel = (product,doc)=>{
    let pTitle= product.title;
    let pVendor= product.vendor;
    let indexV=1;
    doc.fontSize(7); // doc.addPage();
    return new Promise(resolve => {


        product.variants.forEach( async variant=>{



            let variantTitle="";
            variantTitle=variant.title;
            if(variantTitle=='Default Title')
            {
                variantTitle='';
            }
            let variantImgURL = "";
            product.images.forEach(img => {
                if (img.id == variant.image_id) {
                    variantImgURL = img.src.split('?')[0];
                }

            });

            if(variantImgURL=='')
            {
                if(product.image)
                variantImgURL=product.image.src;

            }
            // console.log(variantImgURL);

            let vImg=""
            if(variantImgURL!="" && variantImgURL) {
                try {
                    vImg = await getbase64(variantImgURL, product.images);
                }
                catch(ex){
                    console.log(ex);
                }
            }
              if(!firstEver) {
                  doc.addPage();
              }
                firstEver=false;
               doc.moveTo(5, 5)
                .rect(5, 5, 80, 20)
                .rect(5, 25, 80, 70)
                .rect(5, 95, 80, 60)
                .strokeColor('grey')
                .stroke()

            //console.log(vImg);
            if(vImg!="" && vImg){
                try {
            doc.image(vImg, 10, 30, {width: 70,height:60})
            }
            catch(ex){
                    console.log('ecx'+ex);
            }
            }
             doc.fontSize(7)
                .moveTo(5, 5).text(variant.sku? variant.sku : '      ' , 10, 12, {
                width: 70, height: 1,
                align: 'center',
                indent: 0

            })
                .moveDown(10)
                .fontSize(6)
                .text(pTitle, {
                    width: 70,
                    align: 'left', indent: 0, height: 20,


                })
                .fontSize(6)
                .text(variantTitle, {
                    width: 75, height: 1,
                    align: 'left',


                })
                .fontSize(4)
                .text(pVendor, {
                    width: 75, height: 1,
                    align: 'left',

                })
                .moveTo(5, 5)
                .rect(5, 5, 80, 20)
                .rect(5, 25, 80, 70)
                .rect(5, 95, 80, 60)
                .strokeColor('grey')
                .stroke();
           
            if (indexV == product.variants.length ) {
               
                resolve('product');
                }indexV++;

        });




    })
    ;


}

let createMultiplePdfLabel = async (products,filename,res,doc,stream)=>{

    let indexP=1;

    products.forEach(async product=>{



    let pTitle= product.title;
    let pVendor= product.vendor;

    console.log(pTitle);

    //res.send(product);
// create a document and pipe to a blob
    //var doc = new PDFDocument({size:[90,162]});
    //var stream = doc.pipe(fs.createWriteStream(filename)); console.log('requesting');
        console.log('processing variants'+ product.variants.length);
        if(indexP>1){
        //    doc.addPage();
        }
        await singleProductLabel(product,doc);
        console.log(indexP,products.length);
        if (indexP == products.length ) {
            doc.end();
            console.log('ending document');

        }
        else{

          //  doc.addPage();
        }

        indexP++;

    });





}



function InsertupdateAccessToken(shop,accessToken){


  knex('limitify.tbl_usersettings').where({
    store_name : shop
  }).first('*')
    .then(function (row) {
      if(row)
      {

        knex('limitify.tbl_usersettings').where({
          store_name:shop}).update({
          access_token:accessToken
        }).then(function(r){
          //InitiateFirstInstallScripts(shop);
        console.log('updated token');
      });
      }
      else{

        knex('limitify.tbl_usersettings').insert({
          store_name:shop,
          access_token:accessToken
        }).then(function(r){

          console.log('inserted token');
          //InitiateFirstInstallScripts(shop);
        });

      }

    });

}
function InitiateFirstInstallScripts(shop){



}

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


    currentShop=req.query.shop;
    shopify = new Shopify({
      shopName: req.query.shop.replace('.myshopify.com',''),
      apiKey: config.oauth.api_key,autoLimit:true,
      password: config.oauth.api_secret
    });
    next();





  }
  else
    return res.json(400);
}
function verifyShopifyHook(req,res,next) {

  console.log(req.headers);

  if(req.headers['x-shopify-hmac-sha256']!=''){

    let shop = req.headers['x-shopify-shop-domain'];

    knex('tbl_usersettings').where({
      store_name : shop
    }).first('*')
      .then(function (row) {
          if(row)
          {
            currentShop=req.query.shop;
            userSettings=row;
            shopify = new Shopify({
              shopName: shop.replace('.myshopify.com',''),
              apiKey: config.oauth.api_key,
              password: row.access_token
            });
            next();
          }

        }

      );


  }




//   req.body = '';
// console.log('calling verification');
//   req.on('data', function (chunk) {
//     console.log('collecting body');
//     req.body += chunk.toString('utf8');
//   });
//   req.on('end', function () {
//     console.log('starting verifcation');
//     var digest = crypto.createHmac('SHA256', config.oauth.client_secret)
//       .update(new Buffer(req.body, 'utf8'))
//       .digest('base64');
//     if (digest === req.headers['X-Shopify-Hmac-Sha256']) {
//       console.log('verified');
//       next();
//     }
//     else {
//       console.log('hook not verified');
//       res.send(400);
//     }
//   });


}


module.exports = router;
