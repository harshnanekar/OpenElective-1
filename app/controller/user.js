let query = require("../queries/user.js");
const { get } = require("../router/route.js");
const jwt = require("jsonwebtoken");
const jwtauth = require("../middleware/request.js");
const passwordClass = require("../middleware/password.js");
const { redisDb } = require("../config/database.js");
const mail = require("../controller/email.js");

module.exports = {
  loginPage: async function (req, res) {
    try {
      let jwtreturn = await jwtauth.verifyLogin(req.signedCookies.jwtauth, res);

      if (jwtreturn === "invalid") {
        res.render("login");
      } else {
        redisDb.set("user", jwtreturn.username, "EX", 86400);
        redisDb.set("role", jwtreturn.role[0].role_name, "EX", 86400);

        return res.redirect(`${res.locals.BASE_URL}elective/dashboard`);
      }
    } catch (err) {
      console.log("error in login ", err.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  login: async function (req, res) {
    let username = req.body.username;
    let password = req.body.password;

    console.log("request data " + req.body.username);
    console.log("Fetch api called");

    try {
      let querydata = await query.authenticateLogin(username);
      console.log("Query Data:", querydata);

      if (querydata != undefined) {
        let pass = querydata[0].password;
        let passwordVal = await passwordClass.comparePassword(pass, password);

        if (passwordVal) {
          let getUserRole = await query.getUserRole(username);
          req.session.userRole = getUserRole[0].role_name;

          console.log("Authenticated Successfully ", req.session.userRole);

          req.session.modules = querydata[0].username;

          let redisUser = querydata[0].username;
          let redisRole = getUserRole[0].role_name;
          redisDb.set("user", redisUser, "EX", 86400);
          redisDb.set("role", redisRole, "EX", 86400);

          const user = querydata[0].username;
          const secretkey = process.env.JWT_SECRETKEY;

          console.log("secretkey---- " + secretkey);
          const token = await jwt.sign(
            { username: user, role: getUserRole },
            process.env.JWT_SECRETKEY,
            { expiresIn: "1 day" }
          );

          res.cookie("jwtauth", token, {
            signed: true,
            maxAge: 24 * 60 * 60 * 1000,
            path: "/",
            httponly: true,
          });
          return res.json({
            status: "success",
            redirectTo: `${res.locals.BASE_URL}elective/dashboard`,
          });
        } else {
          console.log("Unauthenticated");
          return res.json({
            status: "error",
            redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
            message: "Invalid Password!!",
          });
        }
      } else {
        console.log("Invalid username");
        return res.json({
          status: "error",
          redirectTo: `${res.locals.BASE_URL}elective/loginPage`,
          message: "Invalid Username!!",
        });
      }
    } catch (err) {
      console.log(err.message);
      return res.json({
        status: "Error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  errorPage: async function (req, res) {
    let username = await redisDb.get("user");
    let getModules = await query.getModules(username);
    return res.render("500", { module: getModules });
  },

  dashboard: async function (req, res, next) {
    try {
      let usermodules = await redisDb.get("user");

      let getModules = await query.getModules(usermodules);
      return res.render("dashboard", { module: getModules });
    } catch (err) {
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  logout: async function (req, res) {
    try {
      req.session.destroy();
      res.clearCookie("jwtauth");
      redisDb.del("user");
      redisDb.del("role");

      return res.redirect(`${res.locals.BASE_URL}elective/loginPage`);
    } catch (err) {
      console.log(err.message);
      return res.redirect(`${res.locals.BASE_URL}elective/error`);
    }
  },

  checkUsernameForOtp: async (req, res) => {
    try {
      console.log("mail config");
      let { username } = req.body;

      console.log("username: " + username);
      let userDetails = await query.checkUser(username);
      if (userDetails.rowCount > 0) {
        min = Math.ceil(10000);
        max = Math.floor(99999);
        let otp = Math.floor(Math.random() * (max - min + 1) + min);

        let sendMailTo = userDetails.rows.map((data) => data.email);
        console.log("sendMailTo:: ", sendMailTo, otp);

        let subject = "Otp To Reset Password";
        let message = `Hello ${username}, your otp to reset password is ${otp}`;

        Promise.all([
          mail.sendMail(sendMailTo, subject, message),
          query.insertOtp(username, otp),
        ]).then(res.json({ status: "success", message: undefined }));
      } else {
        return res.json({ message: "*Invalid Username" });
      }
    } catch (error) {
      console.log(error);
      return res.json({
        status: "error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  checkOtpFromUser: async (req, res) => {
    try {
      let { username, otp } = req.body;
      let checkOtpTime = await query.checkOtpTime(username, otp);

      if (checkOtpTime.rowCount > 0) {
        return res.json({ otpStatus: true, message: checkOtpTime.rows });
      } else {
        return res.json({ otpStatus: false, message: "*Invalid Otp" });
      }
    } catch (error) {
      console.log(error);
      return res.json({
        status: "Error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  resetPass: async (req, res) => {
    try {
      let { username, otp, password } = req.body;
      let userPass = await passwordClass.hashPassword(password);
      let updatePass = await query.updatePassword(username, userPass);
      if (updatePass.rowCount > 0) {
        return res.json({
          status: "success",
          message: "Password Reseted Successfully!!",
        });
      } else {
        return res.json({ message: "Failed To Reset Passsword!!" });
      }
    } catch (error) {
      return res.json({
        status: "Error",
        redirectTo: `${res.locals.BASE_URL}elective/error`,
      });
    }
  },

  getSvelte:async (req,res) => {
    try {

      let basket1 = [209,210,211,232,233,234]
      let basket2 = [212,214,217,216,228,229,230,231]
      let basket3 = [175,152,176,225,226,227]
      
      let preference = [1,2,3,4,5];
  
      let students = await query.getStudentForTest(1);
      let studentArray = students.rows;

      for(let i=0;i<studentArray.length;i++){
   
        for(let j=0;j<basket1.length;j++){

          let randomIndex = Math.floor(Math.random() * preference.length);
          let randomPreference = preference[randomIndex];
          await query.insertStudentForAllocationTesting(studentArray[i].user_lid,122,basket1[j],34,1,randomPreference);

        }

        for(let k=0;k<basket2.length;k++){

          let randomIndex = Math.floor(Math.random() * preference.length);
          let randomPreference = preference[randomIndex];
          await query.insertStudentForAllocationTesting(studentArray[i].user_lid,123,basket2[k],34,2,randomPreference);
 
        }

        for(let m=0;m<basket3.length;m++){

          let randomIndex = Math.floor(Math.random() * preference.length);
          let randomPreference = preference[randomIndex];
          await query.insertStudentForAllocationTesting(studentArray[i].user_lid,124,basket3[m],34,3,randomPreference);

        }

      }
      return res.json({'users':'Students Inserted'});
    } catch (error) {
      console.log(error.message);
    }
  },

  addCampus : async (req,res) => {
    let {json} = req.body;
    Array.from(json).forEach(async data => {
      campus = await query.insertStudentAllocation(data)
    })
   
      return res.json({'status':'Inserted Successfully'})
  }
};
