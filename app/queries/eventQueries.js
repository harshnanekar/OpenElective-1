const { pgPool } = require('../config/database.js');

const query = class EventQuery{
    
  static async getChildModules(username,moduleName){
    let queries = {
        text: `select u.firstname,u.username,ro.role_name,mo.module_name,mo.url,mo.photo from user_info u inner join user_roles r on u.id=r.user_lid inner join roles ro on ro.role_id = r.role_lid
        inner join module_mapping m on m.role_id = ro.role_id inner join modules mo on mo.id = m.module_id
        where u.username = $1 and m.parent_moduleid is not null and u.active=true and r.active=true and ro.active=true and m.active=true and mo.active=true and m.parent_moduleid in (select id from modules where module_name= $2)`,
        values: [username,moduleName]
    }    
    return pgPool.query(queries);  
  }  


  static async getCampus(){
    return pgPool.query(`select campus_name from campus where active=true`);
  }

  static async getacadSession(){
    return pgPool.query(`select current_session from session_master where active=true`);
  }

  static async addEventdata(jsonData){
     let queries = {
       text : `select addevent($1)`,
       values : [jsonData]
     }

     return pgPool.query(queries);
  }

  static async getAllEventData(username){
    
    let queries = {
      text:`select e.id,e.event_name,s.current_session,e.acad_year,e.createdby,e.startdate,e.end_date,c.campus_name,e.is_published from event_master e 
      inner join session_master s on e.session_lid = s.sem_id inner join campus c on e.campus_lid = c.campus_id where e.createdby = $1 
      and e.active = true and c.active = true and s.active = true order by e.id desc ; `,
      values: [username]
    }
    return pgPool.query(queries);
  }

  static async registerStudentExcel (studentData){
    
  console.log("studentData : ",studentData);
  let queries ={
    text: `select register_student($1)`,
    values: [JSON.stringify(studentData.studentArray)]
  }

  return pgPool.query(queries);

  }

  static async getAllCampus(){
    let querie = await pgPool.query(`select campus_name from campus where active=true`);
    return querie.rows;
  }

  static async getAllSessions(){
    let querie = await pgPool.query(`select current_session from session_master where active=true`);
    return querie.rows;
  }

  static deleteEvent(eventId){
   let query ={
    text :`update event_master set active = false where id = $1`,
    values : [eventId]
   } 
   return pgPool.query(query);
  }

  static publishEvent(eventId){
   let query ={
    text:`update event_master set is_published='Y' where id=$1`,
    values:[eventId]
   }
   return pgPool.query(query);  
  }

  static viewPreference(eventId){
   let query = {
    text: `select distinct bb.id as basket_lid,bb.basket_name from basket_event be inner join basket bb on be.basket_lid = bb.id where be.event_lid =$1`,
    values:[eventId]
   } 
   return pgPool.query(query);
  }

  static getBasketPreference(basketId){
   let query ={
    text:`select sm.subject_name,u.username,s.sub_pref as preference from student_sub_allocation s inner join subject_master sm on s.subject_lid=sm.sub_id inner join user_info u on s.user_lid=u.id where s.basket_lid = $1
    and s.active=true and sm.active=true and u.active=true order by s.id asc`,
    values:[basketId]
   }
   return pgPool.query(query); 

  }

  static async adminAllocateEvents(eventId){
    let query = {
      text:`select new_course_allocation($1)`,
      values:[parseInt(eventId)]
    }
    return pgPool.query(query)
  }

  static getAllocationReport(eventId){
    let query ={
      text:`select u.username,s.subject_name,e.event_name,b.basket_name,f.elective_no,f.sub_pref,f.batch from final_allocation f inner join user_info u on f.user_lid=u.id 
      inner join subject_master s on f.subject_lid=s.sub_id inner join event_master e on f.event_lid=e.id inner join basket b on f.basket_lid=b.id where f.event_lid=$1 and f.active=true 
      and u.active=true and s.active=true and e.active=true and b.active=true order by username asc`,
      values:[eventId]
    }
    return pgPool.query(query);
  }

  static checkEventDate(eventId){
    let query={
    text:`SELECT (CASE WHEN DATE(end_date) >= CURRENT_DATE THEN true ELSE false END) as status
    FROM event_master WHERE id = $1`,
    values:[eventId]
    }
    return pgPool.query(query)
  }

  static loadStudentData(eventId){
   let query={
    text:`select distinct u.email,u.username,s.user_lid from student_sub_allocation s  inner join user_info u on u.id=s.user_lid 
    where s.event_lid=$1 and s.active=true and u.active=true limit 5`,
    values:[eventId]
   } 
   return pgPool.query(query)
  }

  static electedData(userId,eventId){
    let query={
    text:`select s.id,u.username,e.event_name,b.basket_name,sm.subject_name,s.elective_no,s.sub_pref from student_sub_allocation s inner join user_info u on s.user_lid = u.id 
    inner join basket b on s.basket_lid=b.id inner join event_master e on s.event_lid=e.id inner join subject_master sm on s.subject_lid=sm.sub_id 
    where user_lid =$1 and event_lid=$2 and s.active=true and b.active=true and e.active=true and sm.active=true order by s.id asc `,
    values:[userId,eventId]
    }
    return pgPool.query(query);
  }

  static checkStudentRollNo(rollNo){
    let query = {
      text:`select count(*) as rollCount from student_info where rollno=$1`,
      values:[rollNo]
    }
    return pgPool.query(query);
  }

  static checkUser(studentUname){
    let query ={
      text:`select count(*) as userCount from user_info where username=$1 and active=true`,
      values:[studentUname]
    }
    return pgPool.query(query);
  }


}

module.exports = query;