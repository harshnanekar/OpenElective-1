const  { pgPool } = require('../config/database.js');

const a = class data{
 
    static async authenticateLogin(username){
        console.log('Query executed ' + username);
        
        let datas = await pgPool.query('SELECT username,password FROM user_info WHERE username = $1 and active=true', [username]);
        if(datas.rowCount > 0){
            return datas.rows;
        }
        
    }

    static async getModules(username){
        let datas = await pgPool.query(`select u.id,u.firstname,u.lastname,u.email,u.username,ro.role_name,mo.module_name,mo.url,mo.photo from user_info u inner join user_roles r on u.id = r.user_lid inner join roles ro on r.role_lid = ro.role_id inner join module_mapping m
        on m.role_id = ro.role_id inner join modules mo on m.module_id = mo.id where u.username = $1 and mo.parent_moduleid is null 
        and u.active = true and mo.active=true and m.active = true and ro.active=true and r.active = true
        `,[username]);

        if(datas.rowCount > 0){
            return datas.rows;
        }
    }

    static async getUserRole(username){
        let query = await pgPool.query(`select ro.role_name from user_info u inner join user_roles r on u.id = r.user_lid inner join roles ro on ro.role_id = r.role_lid where username = $1 and u.active=true and r.active=true and ro.active=true `,[username]);
        
        if(query.rowCount > 0){
            return query.rows;
        }
    }

    static async checkUser(username){
      let query ={
        text:`select username,email from user_info where username=$1 and active=true`,
        values:[username]
      }
      return pgPool.query(query);  
    }

    static insertOtp(username,otp){
    let query ={
      text:`insert into user_otp(username,otp,otp_time,created_date,createdby,modified_date,modifiedby,active)
      values($1,$2,now(),now(),$3,now(),$4,true)`,
      values:[username,otp,username,username]
    }
    return pgPool.query(query);    
    }

    static checkOtpTime(username,otp){
     let query = {
      text:`SELECT *,
      CASE 
          WHEN EXTRACT(EPOCH FROM (NOW() - otp_time)) / 60 <= 5 THEN 'Valid'
          ELSE 'Otp Expired' 
      END AS otp_status 
        FROM user_otp 
        WHERE username=$1
            AND otp=$2
            AND DATE(created_date)=DATE(NOW()) 
        ORDER BY otp_time DESC 
        LIMIT 1`,
      values:[username,otp]  
     }
     return pgPool.query(query);   
    }

    static updatePassword(username,password) {
     let query = {
      text:`update user_info set password=$1 where username=$2`, 
      values:[password,username] 
     }
     return pgPool.query(query);   
    }

    static getUserDetails(username){
     let query = {
       text:`select * from user_info where username=$1 and active=true`,
       values:[username] 
     }   
     return pgPool.query(query);
    }

    static getStudents(){
     let query = {
      text:`select s.id,u.firstname,u.lastname,u.username,c.campus_name,sm.current_session,s.rollno from student_info s inner join user_info u on s.user_lid=u.id
      inner join campus c on c.campus_id=s.campus_lid inner join session_master sm on sm.sem_id=s.acad_session where u.active=true and s.active=true and c.active=true and 
      sm.active=true order by s.id desc`  
     }   
     return pgPool.query(query);
    }

    static insertProfileDetails(id,firstname,lastname,email,gender,adhar){
      let query = {
        text:`update user_info set firstname=$1,lastname=$2,email=$3,gender=$4,adharno=$5 where id=$6`,
        values:[firstname,lastname,email,gender,adhar,id] 
      }
      return pgPool.query(query);
    }


    //testing
    static getStudentForTest(acadLid){
        console.log('query called');
        let query = {
            text:`select * from student_info where acad_session = $1`,
            values:[acadLid]
        }
        return pgPool.query(query);
    }

    //testing
    static insertStudentForAllocationTesting(userlid,basketlid,subjectlid,eventlid,electiveNo,subjectPref){
     let query={
      text:`insert into student_sub_allocation(user_lid,basket_lid,subject_lid,event_lid,elective_no,sub_pref,created_date,modified_date,createdby,modifiedby,active)
      values($1,$2,$3,$4,$5,$6,now(),now(),'admin','admin',true)`,
      values:[userlid,basketlid,subjectlid,eventlid,electiveNo,subjectPref]  
     }   
     return pgPool.query(query);
    }

    //testing
    static addCampus(json){
    let query = {
     text:`insert into campus(campus_id,campus_name,created_date,createdby,modified_date,modifiedby,active)
     values($1,$2,$3,$4,$5,$6,$7)`,
     values:[json.id,json.campus_name,json.created_date,json.createdby,json.last_modified_date,json.last_modified_by,json.active]   
    }    
    return pgPool.query(query)
    }

    //testing
    static insertEventsTesting(json){
      let query = {
       text:`insert into event_master(id,event_name,session_lid,acad_year,created_date,createdby,modified_date,modifiedby,active,campus_lid,is_published,startdate,end_date)
       values($1,$2,(select sem_id from session_master where current_session=$3),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
       values:[json.id,json.elective_event_name,json.acad_session,json.acad_year,json.created_date,json.created_by,json.last_modified_date,json.last_modified_by,json.active,json.campus_id,json.is_published,
       json.start_date,json.end_date] 
      } 
      return pgPool.query(query); 
    }

    //testing
    static insertPrograms(json){
      let query ={
        text:`insert into program_master (program_id,program_name,campus_abbr,createdby,created_date,modifiedby,modified_date,active)
        values($1,$2,$3,$4,$5,$6,$7,$8)`,
        values:[json.id,json.program_name,json.abbr,json.created_by,json.created_date,json.last_modified_by,json.last_modified_date,true]
      }
      return pgPool.query(query);  
    }
    //testing
    static insertSubjects(json){
       let query={
        text:`insert into subject_master(sub_id,subject_name,createdby,created_date,modifiedby,modified_date,active,max_capacity_per_batch,campus_lid,batches,open_to_allprograms,dept_name)
        values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        values:[json.id,json.subject_name,json.created_by,json.created_date,json.last_modified_by,json.last_modified_date,true,json.max_capacity_per_batch,json.campus_id,json.no_of_batches,json.open_to_all_programs,
        json.dept_name]
       } 
       return pgPool.query(query)
    }

    //testing
    static insertSubjectProgram(json){
      let query ={
        text:`insert into subject_program_mapping(subject_lid,program_lid,created_date,createdby,modifiedby,modified_date,active) 
        values($1,$2,$3,$4,$5,$6,true)`,
        values:[json.subject_id,json.program_id,json.created_date,json.created_by,json.last_modified_by,json.last_modified_date]
      }  
      return pgPool.query(query)
    }

    //testing
    static insertPrgCampus(json){
     let query = {
       text:`insert into program_campus_mapping(program_lid,campus_lid,created_date,createdby,modified_date,modifiedby,active)
       values($1,$2,$3,$4,$5,$6,true)`,
       values:[json.id,json.campus_id,json.created_date,json.created_by,json.last_modified_date,json.last_modified_by] 
     }
     return pgPool.query(query);
    }

    //testing
    static insertBasket(json){
     let query = {
        text:`insert into basket(id,basket_name,basket_abbr,createdby,created_date,modifiedby,modified_date,active)
        values($1,$2,$3,$4,$5,$6,$7,true)`,
        values:[json.id,json.basket_name,json.basket_abbr,json.created_by,json.created_date,json.last_modified_by,json.last_modified_date]
     } 
     return pgPool.query(query);  
    }

    //testing
    static insertBasketEvent(json){
      let query = {
       text:`insert into basket_event(basket_lid,event_lid,campus_lid,session_lid,basket_elective_no,no_of_comp_sub,createdby,created_date,
        modifiedby,modified_date,active) 
       values($1,$2,$3,(select sem_id from session_master where current_session=$4),$5,$6,$7,$8,$9,$10,true)`,
       values:[json.basket_id,json.event_id,json.campus_id,json.session,json.open_elective_no,json.no_of_comp_sub,json.created_by,
       json.created_date,json.last_modified_by,json.last_modified_date]
      }
      return pgPool.query(query);  
    }

    //testing
    static insertBasketSubject(json){
      let query = {
       text:`insert into basket_subject(basket_lid,subject_lid,created_date,createdby,modified_date,modifiedby,active)
       values($1,$2,$3,$4,now(),$5,$6)`,
       values:[json.basket_id,json.subject_id,json.created_date,json.created_by,json.last_modified_by,true] 
      }
      return pgPool.query(query)  
    }

    //testing
    static insertStudents(json){
     let query = {
       text:`insert into user_info(firstname,lastname,email,username,password,createdby,created_date,modifiedby,modified_date,active)
       values($1,$2,'harshal.nanekar.EXT@nmims.edu',$3,'9f47294228b02f255d1f1c1ed6fb8b743176878bb094a3fed9a5418ecac8407df9c5e49e6ddfebb7127b6f9fc797acad30938afacdcb460b8c94ec10508c6b53.3962df5b-6a0b-4646-a89c-75af17680ede',
       $4,$5,$6,$7,true)`,
       values:[json.firstname,json.lastname,json.username,json.created_by,json.created_date,json.last_modified_by,json.last_modified_date]  
     }   
     return pgPool.query(query);
    }

    //testing
    static insertStudentInfo(json){
     let query = {
       text:`insert into student_info(user_lid,campus_lid,rollno,acad_session,active,created_date,createdby,modified_date,modifiedby,acad_year)
       values((select id from user_info where username=$1),$2,$3,(select sem_id from session_master where current_session=$4),true,$5,$6,$7,$8,$9)`,
       values:[json.username,json.campusId,json.rollNo,json.acadSession,json.createdDate,json.createdBy,json.lastModifiedDate,json.lastModifiedBy,json.enrollmentYear] 
     }
     return pgPool.query(query);   
    }

    //testing
    static insertStudentAllocation(json){
     let query ={
        text:`insert into student_sub_allocation(user_lid,subject_lid,event_lid,elective_no,sub_pref,created_date,createdby,modified_date,modifiedby,active)
        values ((select id from user_info where username=$1),$2,$3,$4,$5,$6,$7,$8,$9,true)`,
        values:[json.username,json.subject_id,json.elective_event_id,json.elective_no,json.preference_no,json.created_date,json.created_by,json.last_modified_date,json.last_modified_by]
     }
     return pgPool.query(query);
    }

}

module.exports = a;

