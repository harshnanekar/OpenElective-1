const { pgPool } = require("../config/database.js");

module.exports = class Student {
  static getStudentEvent(username) {
    let query = {
      text: `select e.id,e.event_name,e.startdate,e.end_date from event_master e inner join session_master s on e.session_lid=s.sem_id
      where s.current_session in (select s.next_session from session_master s inner join student_info si on s.sem_id = si.acad_session 
      inner join user_info u on u.id=si.user_lid where u.username =$1 and s.active=true and si.active=true and u.active=true) and e.active=true
      and (e.end_date = now() or e.end_date > CURRENT_DATE) `,
      values: [username],
    };
    return pgPool.query(query);
  }

  static displayBasket(eventId, username) {
    let query = {
      text: `
      select bsk.id,s.sub_id,bsk.basket_name,s.subject_name,be.basket_elective_no,be.event_lid,be.no_of_comp_sub,e.event_name from basket_subject bs 
      inner join basket_event be on bs.basket_lid=be.basket_lid 
      inner join subject_master s on bs.subject_lid = s.sub_id 
      INNER JOIN subject_program_mapping spm ON s.sub_id = spm.subject_lid
      INNER JOIN student_info si ON si.program_id = spm.program_lid::VARCHAR
      inner join basket bsk on bsk.id=be.basket_lid 
      inner join event_master e on e.id=be.event_lid  
      where be.basket_lid in 
        (select basket_lid 
        from basket_event 
        where basket_lid not in (
         select DISTINCT bs.basket_lid 
         FROM student_sub_allocation s 
         inner JOIN basket_subject bs ON s.subject_lid = bs.subject_lid 
         inner JOIN user_info u ON s.user_lid = u.id 
         where s.event_lid = $1 
         and s.active = true 
         and bs.active = true 
         and u.username = $2
        ) 
       and event_lid = $3
       and active = true 
       order BY basket_elective_no asc 
       limit 1) AND si.user_lid = (SELECT id FROM user_info where username = $4) 
       and bs.active=true and be.active=true and bsk.active = true
       AND s.active = true AND spm.active = true
       order by be.basket_elective_no asc`,
      values: [eventId, username, eventId, username],
    };
    return pgPool.query(query);
  }

  static showYearBackSubjects(username, eventId) {
    let query = {
//       text: `select distinct su.subject_lid,be.event_lid,s.subject_name from final_allocation su inner join subject_master s on su.subject_lid = s.sub_id  
//  inner join basket_event be on be.event_lid = su.event_lid inner join user_info u on u.id=su.user_lid where u.username = $1 and su.event_lid not in ($2)
//  and su.active=true and be.active=true and s.active=true and u.active=true`,
      text:`select distinct su.subject_lid,be.event_lid,s.subject_name from final_allocation su inner join subject_master s on su.subject_lid = s.sub_id  
      inner join basket_event be on be.event_lid = su.event_lid inner join user_info u on u.id=su.user_lid where u.username = $1 and su.event_lid not in ($2)
      and su.active=true and be.active=true and s.active=true and u.active=true`,
      values: [username, eventId],
    };
    return pgPool.query(query);
  }

  static insertStudentCourse(basketData) {
    let query = {
      text: `select insert_student_course($1)`,
      values: [basketData],
    };
    return pgPool.query(query);
  }

  static viewStudentElectedBasket(eventId,username) {
    let query = {
      text: `SELECT b.id, b.basket_name, (
        SELECT json_agg(row_to_json(s))
        FROM (
           SELECT subject_name,preferred_subjects.elective_time
			FROM subject_master
			JOIN (
				SELECT sm.subject_lid, sm.sub_pref,sm.elective_time
				FROM student_sub_allocation sm 
				WHERE sm.event_lid = $1 AND sm.basket_lid = b.id
				AND sm.user_lid IN (SELECT id FROM user_info WHERE username = $2)
			) AS preferred_subjects
			ON subject_master.sub_id = preferred_subjects.subject_lid
			ORDER BY preferred_subjects.sub_pref ASC
        ) s
    ) AS subject_names
    FROM student_sub_allocation sm 
    INNER JOIN basket b ON sm.basket_lid = b.id 
    WHERE sm.active=true and b.active=true and sm.event_lid = $3 group by b.id,b.basket_name`,
      values: [eventId,username,eventId],
    };
    return pgPool.query(query);
  }

  static viewStudentElectedEvent(username){
    let query={
      text:`select distinct e.id,e.event_name,e.startdate,e.end_date from student_sub_allocation s inner join user_info u on s.user_lid=u.id 
      inner join event_master e on e.id=s.event_lid where u.username=$1 and s.active=true and e.active`,
      values:[username]
    }
    return pgPool.query(query);
  }
};
