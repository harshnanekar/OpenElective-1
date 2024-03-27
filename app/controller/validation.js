const query = require('../queries/eventQueries');

module.exports = class Validation {
  static fnameValidation(fname) {
   
      console.log("fname>>>>> ", fname);
      if (fname.length > 0) {
        let validateCharacters = Validation.alphabetValidation(fname);
        return validateCharacters;
      } else {
        return false;
      }
    
  }

  static lnameValidation(lname) {
    console.log("lname>>>>> ", lname);
  
      if (lname.length > 0) {
        let validateCharacters = Validation.alphabetValidation(lname);
        return validateCharacters;
      } else {
        return false;
      }
   
  }

  static emailValidation(email){
    if (email.length > 0) {

      let emailArr = email.split('');
      let mail = emailArr.filter(data => data === '@');
      console.log(JSON.stringify(mail));
      if (mail.length == 1) {
          let index = email.indexOf('@');
          let dotIndex = email.lastIndexOf('.');

          if (index != 0 && (index + 1) != dotIndex && (dotIndex != email.length - 1)) {
              return true;
          } else {
              return false;
          }
      } else {
          return false;
      }

  } else {
      return false;
  }
  }

  static genderValidation(gender){
    if (gender.length > 0) {

      if (gender === 'Male' || gender === 'Female' || gender === 'Other') {
          return true;
      } else {
          return false;
      }
  } else {
      return false;
  }
}

   static adharValidation(adhar){
    if (adhar.length > 0) {

      if(adhar.length === 12){  
        let adharval = Validation.NumberValidation(adhar);
        if (adharval) {
            return true;

        } else {
            return false;
        }
    }else{
        return false;
    }
    } else {
        return false;
    }
   }

  static rollNoValidation(rollNo) {
   
      if (rollNo.length > 0) {
        let validateCharacters = Validation.characterValidation(rollNo);
        if(validateCharacters){
         
          let hasNumber = 0;

          for (let i = 0; i < rollNo.length; i++) {
            let asciiValue = rollNo.charCodeAt(i)
            if (asciiValue >= 65 && asciiValue <= 90 || asciiValue >= 97 && asciiValue <= 122 ) {
              hasNumber++;
            } 
          }
  
          if (hasNumber == rollNo.length) {
            return false;
          } else {
            return true;
          }

        }else{
         return false;
        }
       
      } else {
        return false;
      }
  
  }

  static alphabetValidation(input_text) {
    console.log("text length>>> ", input_text);
    let text_length = input_text.length;

    for (let i = 0; i < text_length; i++) {
      let asciiValue = input_text.charCodeAt(i);

      if (
        (asciiValue >= 33 && asciiValue <= 64) ||
        (asciiValue >= 91 && asciiValue <= 96) ||
        (asciiValue >= 123 && asciiValue <= 126)
      ) {
        return false;
      }
    }
    return true;
  }

  static characterValidation(inputText) {
    let text_length = inputText.length;

    for (let i = 0; i < text_length; i++) {
      let asciiValue = inputText.charCodeAt(i);

      if (
        (asciiValue >= 33 && asciiValue <= 47) ||
        (asciiValue >= 58 && asciiValue <= 64) ||
        (asciiValue >= 91 && asciiValue <= 96) ||
        (asciiValue >= 123 && asciiValue <= 126)
      ) {
        return false;
      }
    }

    return true;
  }

  static campusValidation(input_text) {
   
      let campusData = query.getAllCampus();

      for (let i = 0; i < campusData.length; i++) {
        if (input_text != campusData[i].campus_name) {
          return false;
        }
      }
      return true;
   
  }

  static  newAcadYearValidation(acadYear) {
    console.log("new acad year ", acadYear);
    
      let date = new Date();
      let year = date.getFullYear();

      let prevYear = `${year - 1}-${year}`;
      let currYear = `${year}-${year + 1}`;
      let nextYear = `${year + 1}-${year + 2}`;

      let yearArray = [prevYear, currYear, nextYear];
      console.log("Year>> ", yearArray);

      for (let i = 0; i < yearArray.length; i++) {
        console.log("Year data>> ", yearArray[i]);
        if (acadYear === yearArray[i]) {
          return true;
        }
      }
      return false;
 
  }

  static acadSessionValidation(input_text) {
 
      let sessionData = query.getAllSessions();

      for (let i = 0; i < sessionData.length; i++) {
        if (input_text != sessionData[i]) {
          return false;
        }
      }
      return true;
 
  }

  static UsernameValidation(userData) {
   
      if (userData.length > 0) {
        return true;
      } else {
        return false;
      }
 
  }

  static programIdValidation(programId) {
   
      console.log("program id:::::: ", programId);
      if (programId.length > 0) {
        let programIdValidater = Validation.characterValidation(programId);
        console.log("length valid ", programIdValidater);
        return programIdValidater;
      } else {
        console.log("Invalid length");
        return false;
      }
 
  }

  static departmentValidator(input_text) {
    if (input_text.length > 0) {
      let departmentValidate = Validation.alphabetValidation(input_text);
      return departmentValidate;
    } else {
      return false;
    }
  }

  static NumberValidation(input_text) {
    for (let i = 0; i < input_text.length; i++) {
      let chars = input_text.charAt(i);
      if (chars >= 0 && chars <= 9) {
        console.log(chars);
      } else {
        return false;
      }
    }
    return true;
  }

  static NotNumberValidation(input_text){
    for (let i = 0; i < input_text.length; i++) {
      let chars = input_text.charAt(i);
      if (chars != ' ') { 
      if (chars >= 0 && chars <= 9) {
       return false;
      }
      }
    }
    return true;
  }

  static batchValidater(input_text) {
    if (input_text.length > 0) {
      let batchValidate = Validation.NumberValidation(input_text);
      return batchValidate;
    } else {
      return false;
    }
  }

  static batchCapacityValidater(input_text) {
    if (input_text.length > 0) {
      let capacityValidator = Validation.NumberValidation(input_text);
      return capacityValidator;
    } else {
      return false;
    }
  }

  static batchMinValidator(input_text) {
    if (input_text.length > 0) {
      let capacityValidator = Validation.NumberValidation(input_text);
      return capacityValidator;
    } else {
      return false;
    }
  }

  static programValidator(program){
    if(program.length > 0){
     let count =0;
     for(let i=0;i<program.length;i++){
      let prg = program.charAt(i);
      if(prg >= 0 && prg <= 9){
        count++;
      }
     }

     if(count == program.length){
       return false;
     }else{
       return true;
     }
    }else{
      return false;
    }
  }

  static courseNameValidator(course){

    // if (course.length > 0) {

    //   for(let i=0;i < course.length ;i++){
    //     let subName = course.charAt(i);
    //   if (subName >= 0 && subName <= 9) {
    //     return false;
    //   }
    //   return true;
    //   }

    // } else {
    //   return false;
    // }


    if(course.length > 0){
      let count =0;
      for(let i=0;i<course.length;i++){
       let prg = course.charAt(i);
       if(prg >= 0 && prg <= 9){
         count++;
       }
      }
 
      if(count == course.length){
        return false;
      }else{
        return true;
      }
     }else{
       return false;
     }
  }

  static eventvalidator(eventName){
    if(eventName.length > 0){
      let count =0;
      for(let i=0;i<eventName.length;i++){
       let prg = eventName.charAt(i);
       if(prg >= 0 && prg <= 9){
         count++;
       }
      }
 
      if(count == eventName.length){
        return false;
      }else{
        return true;
      }
     }else{
       return false;
     }
  }
};