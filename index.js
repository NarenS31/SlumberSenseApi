const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = 3000;
const mysql = require('mysql2');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(express.static('static'))

// create a new MySQL connection
const connection = mysql.createConnection({
  host: 'slumbersense.cdiq6kkcyvlb.us-east-2.rds.amazonaws.com',
  user: 'masterusername',
  password: '280376Aa*',
  database : 'slumbersense'
});
//masterusername/280376Aa*
  connection.connect((error) => {
    if (error) {
      console.error('Error connecting to MySQL database:', error);
    } else {
      console.log('Connected to MySQL database!');
    }
  }); 
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://18.117.101.153:${port}`);
  //console.log(`Example app listening at http://localhost:${port}`);
});

app.get("/status", (request, response) => {
   const status = {
      "Status": "Running"
   };
   response.send(status);
});

app.get("/journal", (request, res) => {
  connection.query('SELECT * FROM journal', (err, results) => {
      if (err) throw err;
    res.json(results);
  });
});

app.post("/journal", (req, res) => {
  const { journaltitle , journaldesc,userid } = req.body;  
  connection.query('INSERT INTO journal (journaltitle , journaldesc,userid) VALUES (?, ?, ?)', [journaltitle , journaldesc,userid], (err, result) => {
    if (err) {
      res.statusCode = 200;
      if (err.code == 'ER_DUP_ENTRY') {
        res.json({ message: email + " Already exisit" });
      }
    } else { 
      res.statusCode = 201;
      res.json({ message: 'Journal added successfully' });
    }
  });
});

app.get("/login", (req, res) => {
  const { email, password } = req.query;
  connection.query('SELECT * FROM user WHERE email = ? and password = ?', [email, password], (err, results) => {
     if (err) { 
       if (err.code == 'ER_DUP_ENTRY') { 
         res.json({ message: err.code});
       } 
     } 
     if (results.length > 0) {
       res.json(results[0]);
     } else { 
       res.json({ message: 'Invalid Userid/Password'});
     }
   });
});

app.post("/user", (req, res) => {
  const { name, email, password } = req.body;  
  connection.query('INSERT INTO user (name, email, password) VALUES (?, ?, ?)', [name, email, password], (err, result) => {
    if (err) {
      res.statusCode = 200;
      if (err.code == 'ER_DUP_ENTRY') {
        res.json({ message: email + " Already exisit" });
      }
    } else { 
      res.statusCode = 201;
      res.json({ message: 'User added successfully' });
    }
  });
});

app.get("/simanalysis", (req, res) => {
  const { ageoption, sleephours } = req.query;
  console.log(ageoption, sleephours);
  //SELECT * FROM slumbersense.sleepreq where type = 'Toddler'
  connection.query('SELECT * FROM sleepreq where type = ? ', [ageoption], (err, results) => {
     if (err) { 
       if (err.code == 'ER_DUP_ENTRY') { 
         res.json({ message: err.code});
       } 
     } 
    if (results.length > 0) {
      var maxh = results[0].maxh;
      var minh = results[0].minh;
      if (sleephours <= maxh && sleephours >= minh) {
        res.json({ message: 'Nice Sleep - Continue the good work!' });
      } else { 
        if ((sleephours <= maxh+2 && sleephours >= minh+2) || (sleephours <= maxh-2 && sleephours >= minh-2)) {
          res.json({ message: 'Nice Sleep -  Extra rest is always beneifcial' });
        } else { 
          res.json({ message: 'Deep Analysis Recomended' });
        }
      }
     } else { 
       res.json({ message: 'No Data Found'});
     }
   });
});

app.get("/deepanalysis", (req, res) => {
    const { ageoption, sleephours , alchoholIntakeOption , caffeineOption, smokingOption, generOption} = req.query;
    console.log('ageoption : ', ageoption, ' sleephours :', sleephours,' alchoholIntakeOption :', alchoholIntakeOption, ' caffeineOption :' ,caffeineOption, ' smokingOption : ', smokingOption,  ' generOption :', generOption );
    var alchoholComents = '';
    var sleepHoursComents = '';
    var caffeineComents = '';
    var smokingComents = '';

  //caffeineOption, 
  if (caffeineOption == 1) {
    caffeineComents = 'Avoid caffeine at least 8 hours before bedtime to ensure better sleep quality.';
  } else { 
    caffeineComents = '';
  }
  if (smokingOption == 1) {
    smokingComents = 'Smoking results in sleep quality being affected and disorders such as insomnia, sleep apnea, and breathing issues.';
  } else { 
    smokingComents = '';
  }
  connection.query('SELECT * FROM slumbersense.alchint where serv = ? ', [alchoholIntakeOption], (err, results) => {
     if (err) { 
       if (err.code == 'ER_DUP_ENTRY') { 
         res.json({ message: err.code});
       } 
     } 
    if (results.length > 0) {
      //alchoholIntake Check
      var fmserv = results[0].fmserv;
      var mserv = results[0].mserv;
      console.log('fmserv :', fmserv, ' mserv :', mserv);
      if (generOption == '0') { //Male 
        console.log('Male ');
        if (alchoholIntakeOption <= mserv) {
          alchoholComents = 'High amounts alchohol intake result in decerased sleep quality by 39.2%';
        } else { 
          alchoholComents = 'Moderate amounts alchohol intake result in decerased sleep quality by 24%';
        }
      } else if (generOption == '1') { //FeMale 
        console.log('FeMale  :', alchoholIntakeOption, fmserv);
        if (alchoholIntakeOption <= fmserv) {
          alchoholComents = 'High amounts alchohol intake result in decerased sleep quality by 39.2%';
        } else { 
          alchoholComents = 'Moderate amounts alchohol intake result in decerased sleep quality by 24%';
        }
      } 
      const responseData = {
        sleepHoursComents:sleepHoursComents,
        alchoholComents:alchoholComents,
        smokingComents: smokingComents,
        caffeineComents: caffeineComents    
      } 
      console.log('responseData :', responseData);
      res.json({  sleepHoursComents:sleepHoursComents, alchoholComents:alchoholComents, smokingComents: smokingComents,caffeineComents: caffeineComents });
     } else { 
       res.json({  sleepHoursComents:sleepHoursComents, alchoholComents:'', smokingComents: smokingComents,caffeineComents: caffeineComents });
     }
  });

  
  


});