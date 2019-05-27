const express = require('express');
const fs = require('fs');
const mysql = require('mysql');
const csv = require('fast-csv');
const string = require("./string-clean");
const app = express();

app.use(express.static('public'));

var multer = require('multer');
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '.csv');
    }
});

var upload = multer({storage: storage});


app.get("/upload", (req, res) => {
  res.StatusCode = 200;
  res.end("<html><body><form action='/fileUpload' method= 'post' enctype='multipart/form-data'><input type='file' name='test'/><input type='submit'></form></body></html>")
});

app.post('/fileUpload', upload.single('test'), (req, res, next) => {
  console.log(req.file);
  res.json({'message': 'File uploaded successfully'});
});

app.get("/mysql", (req, res) => {
  let path = './uploads/test.csv';

  fs.access(path, fs.F_OK, (err) => {
    if (err) {
      console.log(err);
    }

    importCsvData2MySQL(path, cb);

    function importCsvData2MySQL(filename, callback){
        var csvData = [];
        var records = [];
        var n_row = 0;
        var iter = 0;
        let stream = fs.createReadStream(filename);
        let csvStream = csv
            .parse()
            .on("data", function (data) {

                csvData.push([string.sanitize(data[0], 'user'), string.sanitize(data[1], 'email'), string.sanitize(data[3], 'date'), string.sanitize(data[3], 'string'), string.sanitize(data[4], 'string')]);
                
             })
            .on("end", function () {
                // remove header Row
                csvData.shift();
                n_row = csvData.length;
                console.log(n_row);
                var j=0;
                while(n_row > 0){
                  if(n_row>200){
                    records.push(csvData.slice(j,j+200));
                    j=j+200;
                  }else{
                    records.push(csvData.slice(j));
                  }
                  n_row = n_row-200;
                }
                iter = records.length;


                // Create a connection to the database
                const connection = mysql.createConnection({
                    host: 'localhost',
                    user: 'root',
                    password: '834977',
                    database: 'mydb'
                });

                //Open the MySQL connection
                connection.connect((error) => {
                    if (error) {
                        console.error(error);
                        res.end('failed to insert')
                    } else {

                      // function to insert records in mysql
                        var r_ins = 0;
                        let query = 'INSERT IGNORE INTO users (c1, c2, c3, c4, c5) VALUES ?';
                        for(i=0;i<iter;i++){
                          let count = 0;
                        let rec = records[i];
                        connection.query(query, [rec], (error, response) => {
                            r_ins = r_ins + parseInt(response.affectedRows);
                            //callback({massage: "Your Data loaded to mysql server successfully"});
                            console.log(response);
                            callback([iter, r_ins]);
                        });
                      }
                    }
                });

             });

        stream.pipe(csvStream);
    }

    //this is callback function
    var k = 1
    function cb(c){
      if(k == c[0]){
        res.send("No of inserted rows: "+c[1])
      }
      k++;
    }
  });
});

app.get("/search", (req, res)=>{
  let key = string.sanitize(req.query.key, 'string');
  let value = req.query.value;
  switch (key) {
    case 'c1':
      value = string.sanitize(req.query.value, 'user');
      break;
    case 'c2':
      value = string.sanitize(req.query.value, 'email');
      break;
    case 'c3':
      value = req.query.value;
      console.log('testing case =>'+value);
      break;
    //default:
  }



  var con = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '834977',
      database: 'mydb'
  });

  con.connect((err)=>{
    if(err){
    }else{
      let str = "<tr><th>USER</th><th>Email</th><th>DOB</th><th>First Name</th><th>Last Name</th></tr>";
      let sql = "SELECT * FROM users WHERE "+key+" = ?;";
      console.log(sql);
      con.query(sql, [value], (err, result)=>{
        console.log(result.length);
        if(result==0){
          str = "No records matched";
          res.send("<html><body><h1>"+str+"</h1></body></html>");
        }else{
          for(i=0;i<result.length;i++){
            str = str + "<tr><td>"+result[i].c1+"</td><td>"+result[i].c2+"</td><td>"+result[i].c3+"</td><td>"+result[i].c4+"</td><td>"+result[i].c5+"</td></tr>";
          }
          res.end("<html><head><link rel='stylesheet' type='text/css' href='style.css'></head><body><table style='width:100%'>"+str+"</table></body></html>");
        }
      })
    }
  });
})

app.listen(process.env.PORT, () => {
  console.log('Server is running');
});
