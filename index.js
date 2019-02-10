const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const firebase = require('firebase');
const multer = require('multer');
const app = express();
const admin = require("firebase-admin");
const cloudinary = require('cloudinary')
const cloudinaryStorage = require("multer-storage-cloudinary");
const session = require('express-session');
var request = require('request');

var sess;

cloudinary.config({ 
    cloud_name: 'dha1twnnx', 
    api_key: '759356267237253', 
    api_secret: 'GCj8-bkelh1-R2ouG9ZcVxWKTnY' 
});

// =========================== CLOUDINARY =============================

const storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: (req, file, cb) => {
        cb(null, req.body.nim + "_" + req.body.nama);
    },
    allowedFormats: ["jpg", "png", "pdf", "jpeg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
    filename: function(req, file, cb) {
        cb(null, req.body.nim + "_" + file.originalname)
    }
});

var config = {
    apiKey: "AIzaSyCzWIEL7aIOUT4mwZ-wlH_-r4BQscSDbvo",
    authDomain: "basdat2018.firebaseapp.com",
    databaseURL: "https://basdat2018.firebaseio.com",
    projectId: "basdat2018",
    storageBucket: "basdat2018.appspot.com",
    messagingSenderId: "462507679300"
};
firebase.initializeApp(config);

var db = firebase.database()

const parser = multer({ storage: storage });

app.use(express.static('public'))

app.use(session({secret: 'ssshhhhh'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.post('/add', parser.any("file"), async (req, res) => {
 ///captcha
    if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
        return res.json({"responseCode" : 1,"responseDesc" : "Please select captcha"});
    }
    var secretKey = "6LccKo4UAAAAABsMta61GcdYV4af9yUDmvI_tVVp";
    var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
    request(verificationUrl,function(error,response,body) {
        body = JSON.parse(body);
        // Success will be true or false depending upon captcha validation.
        if(body.success !== undefined && !body.success) {
          return res.json({"responseCode" : 1,"responseDesc" : "Failed captcha verification"});
        }
        res.json({"responseCode" : 0,"responseDesc" : "Sucess"});
    });
    
    console.log(req.files[0].url);
    console.log(req.files[1].url);
    console.log(req.files[2].url);
    console.log(req.files[3].url);
    console.log(req.files[4].url);
    console.log(req.files[5].url);
    var data = {
        nama: req.body.nama,
        email: req.body.email,
        nim: req.body.nim,
        nohp: req.body.nohp,
        idline: req.body.idline,
        jurusan: req.body.jurusan,
        angkatan: req.body.angkatan,
        fg1: req.body.fg1,
        presentase1: req.body.presentase1,
        fg2: req.body.fg2,
        presentase2: req.body.presentase2,
        ml: req.files[0].url,
        foto: req.files[1].url,
        khs: req.files[2].url,
        cv: req.files[3].url,
        ss: req.files[4].url,
        addtask: req.files[5].url,
        nilai_CV : 0,
        nilai_ML : 0,
        nilai_KHS : 0,
        nilai_Tugas : 0,
        nilaiTotal : 0
    }
    // ref.push(data);

    var updates = {};
    updates['/peserta/' + req.body.nim] = data;
    db.ref().update(updates);
    res.redirect('/')
})
        
app.post('/update', (req,res) => {
       
    var data = req.body 
    console.log(data.btn);
    for (let index = 0; index < data.index.length; index++) {
        if (data.btn == data.nim[index]){
            var i = index
        }        
    }    
    console.log(data.btn);
    
    var ref = db.ref('/peserta/' + data.btn)
    ref.once('value', (snapshot) => {
        var user = snapshot.val()       
        var prePost = {}
        prePost['update/' + data.btn] = user;
        db.ref().update(prePost);
        console.log(user);
        console.log("---------------------------");
        console.log(req.body.nilai_CV);
        console.log(req.body.nilai_CV[i]);
  
        var newData = {
            nama: user.nama,
            email: user.email,
            nim: user.nim,
            nohp: user.nohp,
            idline: user.idline,
            jurusan: user.jurusan,
            angkatan: user.angkatan,
            fg1: user.fg1,
            presentase1: user.presentase1,
            fg2: user.fg2,
            presentase2: user.presentase2,
            ml: user.ml,
            foto: user.foto,
            khs: user.khs,
            cv: user.cv,
            ss: user.ss,
            addtask: user.addtask,
            nilai_CV : req.body.nilai_CV[i],
            nilai_ML : req.body.nilai_ML[i],
            nilai_KHS : req.body.nilai_KHS[i],
            nilai_Tugas : req.body.nilai_Tugas[i],
            nilaiTotal : (parseInt(req.body.nilai_CV[i]) + parseInt(req.body.nilai_ML[i]) + parseInt(req.body.nilai_KHS[i]) + parseInt(req.body.nilai_Tugas[i]))/4
        }
        
        console.log(newData);
        
        var updates = {};
        updates['peserta/' + data.btn] = newData;
        if (db.ref().update(updates)) {
            res.redirect('/penilaian')
        } else {
            res.redirect('/penilaian')
        }
    })
})

app.get('/', (req, res) => {
    res.render('form')
})

app.get('/semua', (req,res) => {
    var ref = db.ref('peserta');
    sess = req.session;
    if(sess.username) {
        ref.once('value', (snapshot) => {
            var data = snapshot.val()
                res.render('semua', {
                    data : data
                })
            })
    }
    else {
        res.redirect('/admin');
    }  
})


app.get('/detail/:id', (req,res) => {
    console.log(req.params.id);
    var ref = db.ref('/peserta/' +req.params.id)
    ref.once('value', (snapshot) => {
        var data = snapshot.val()
        console.log(data);
        
        res.render('detail', {
            data : data
        })
    })
})

app.get('/penilaian', (req,res) => {
    var ref = db.ref('peserta');
    sess = req.session;
    if(sess.username) {
        ref.once('value', (snapshot) => {
            var data = snapshot.val()
                res.render('penilaian', {
                    data : data
                })
            })
    }
    else {
        res.redirect('/admin');
    }  
})

app.get('/penilaian2', (req,res) => {
    var ref = db.ref('peserta');
    sess = req.session;
    if(sess.username) {
        ref.once('value', (snapshot) => {
            var data = snapshot.val()
                res.render('penilaian2', {
                    data : data
                })
            })
    }
    else {
        res.redirect('/admin');
    }  
})

app.get('/penilaian3', (req,res) => {
    var ref = db.ref('peserta');
    sess = req.session;
    if(sess.username) {
        ref.once('value', (snapshot) => {
            var data = snapshot.val()
                res.render('penilaian3', {
                    data : data
                })
            })
    }
    else {
        res.redirect('/admin');
    }  
})



//================================== LOGIN - LOGOUT ========================================
app.get('/admin',function(req,res){
    sess = req.session;
    if(sess.username) {
        res.redirect('/penilaian');
    }
    else {
        res.render('login');
    }
    // res.render('login');
  });
  
  
  app.post('/login',function(req,res){
    sess = req.session;
    var username_ = req.body.login;
    var pass_ = req.body.password;
    console.log('username = '+username_); //admin123
    console.log('pass = '+pass_) //admin123
    // ---------------untuk akun lebih dari satu----------------------
    // var query = firebase.database().ref("akun").orderByKey();
    // query.once("value").then(function(snapshot) {
    //   snapshot.forEach(function(childSnapshot) {
    //     var key = childSnapshot.key;
    //     var childData = childSnapshot.val();
    //     var username_d = childData.username;
    //     var password_d = childData.password;
    //     if(username_ == username_d && pass_ == password_d){
    //       sess.username = username_;
    //       sess.pass = pass_;
    //     }
    //   });
      // res.redirect('/cek');
    // });
    //-----------------------------------------------------------------
    
    db.ref('/admin/').once('value').then(function(snapshot) {
          data = snapshot.val();
          if(data.username == username_ && data.password == pass_){ //admin123 && admin123
            sess.username = username_;
            sess.pass = pass_;
            res.redirect('/penilaian');
          } else {
            res.redirect('/admin');
          }
    });
  });

  app.get('/logout',function(req,res){
    req.session.destroy(function(err) {
      if(err) {
        console.log(err);
      } else {
        res.redirect('/penilaian');
      }
    });
  });

//================================ END LOGIN - LOGOUT ======================================

app.get('*', (req, res) => {
    res.send('page ga ada')
})

app.listen(process.env.PORT || 3000, () => {
    console.log('Server Started on Port 3000...');
})