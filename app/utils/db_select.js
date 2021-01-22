const guestEntranceCardId = 293;
const guestCICardId = [
  230,
  231,
  235,
  236,
  239,
  240,
  241,
  242,
  244,
  246,
  247,
  248,
  249,
  250,
  251,
  252,
  256,
  257,
  258,
  261,
  262,
  263,
  264,
  265,
  266,
  267,
  268,
  269,
  270,
  280,
  287,
  291,
  295,
  296,
  298,
  301,
];
// const employeeUC = [3, 4, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205];
const employeeUC = [3, 4, 189, 190, 191, 192, 193, 194, 195, 332];

/*
const allTenEntry = (db, cb) => {
  db.getConnection((err, conn) => {
    if (err) throw err;
    conn.query('SELECT * FROM Ten_Entry ORDER BY tstamp ASC', (err, rows) => {
      if (err) return cb(err);
      return cb(undefined, rows);
    });
    conn.release();
  });
};
*/
const allTenEntry = 'SELECT * FROM Ten_Entry ORDER BY tstamp ASC';
const allTenExit = 'SELECT * FROM Ten_Exit ORDER BY tstamp ASC';
// const allEmployee = 'SELECT * FROM Employee ORDER BY tstamp ASC';
const allEmployeeUC = `SELECT events.ev_tstamp as tstamp,
                              ow_lname as lname,
                              ow_fname as fname,
                              ow_mname as mname,
                              ow_photo as photo,
                              apoints.ap_name as apoint
                      FROM Last_Events
                              inner join events on (last_ev_id = events.ev_id)
                              inner join apoints on (events.ev_addr = apoints.ap_id)
                      WHERE ow_id IN (${employeeUC})
                      ORDER by events.ev_tstamp
                      ASC`;
const lastEntry = 'SELECT * FROM Ten_Entry ORDER BY tstamp DESC LIMIT 1';
const lastExit = 'SELECT * FROM Ten_Exit ORDER BY tstamp DESC LIMIT 1';
// const lastEmployee = 'SELECT * FROM Employee ORDER BY tstamp DESC LIMIT 1';
const lastEmployee = employeeId => `SELECT ow_id as id,
                              ow_lname as lname,
                              ow_fname as fname,
                              ow_mname as mname,
                              ow_photo as photo,
                              apoints.ap_name as apoint,
                              events.ev_tstamp as tstamp
                      FROM Last_Events
                              inner join events on (last_ev_id = events.ev_id)
                              inner join apoints on (events.ev_addr = apoints.ap_id)
                      WHERE ow_id = "${employeeId}"
                      ORDER by events.ev_tstamp
                      DESC LIMIT 1`;

const lastServerRoomEmployee = employeeId => `SELECT ow_lname as lname,
                              ow_fname as fname,
                              ow_mname as mname,
                              ow_photo as photo,
                              apoints.ap_name as apoint,
                              events.ev_tstamp as tstamp,
                              events.ev_addr as apoindaddr
                      FROM Last_Server_Room_Events
                              inner join events on (last_ev_id = events.ev_id)
                              inner join apoints on (events.ev_addr = apoints.ap_id)
                      WHERE ow_id = "${employeeId}"
                      ORDER by events.ev_tstamp
                      DESC LIMIT 1`;

const lastServerRoomEmployeeInit = serverRoomId => `SELECT ow_lname as lname,
                              ow_fname as fname,
                              ow_mname as mname,
                              ow_photo as photo,
                              apoints.ap_name as apoint,
                              events.ev_tstamp as tstamp,
                              events.ev_addr as apoindaddr
                      FROM Last_Server_Room_Events
                              inner join events on (last_ev_id = events.ev_id)
                              inner join apoints on (events.ev_addr = apoints.ap_id)
                      WHERE events.ev_addr = "${serverRoomId}"
                      ORDER by events.ev_tstamp
                      DESC LIMIT 1`;

const lastEmployeeUC = `SELECT events.ev_tstamp as tstamp,
                              ow_lname as lname,
                              ow_fname as fname,
                              ow_mname as mname,
                              ow_photo as photo,
                              apoints.ap_name as apoint
                      FROM Last_Events
                              inner join events on (last_ev_id = events.ev_id)
                              inner join apoints on (events.ev_addr = apoints.ap_id)
                      WHERE ow_id IN (${employeeUC})
                      ORDER by events.ev_tstamp
                      DESC LIMIT 1`;

const employeeTotalPerDay = `SELECT events.ev_ow_id
                              FROM events
                              WHERE (date(ev_tstamp) = CURDATE()) 
                                    and (events.ev_ow_id NOT IN (${guestCICardId.concat(guestEntranceCardId)}))
                                    and ( events.ev_addr = 1 
                                          or events.ev_addr = 5 
                                          or events.ev_addr = 16 
                                          or events.ev_addr = 21 
                                          or events.ev_addr = 27 
                                          or events.ev_addr = 36 
                                          or events.ev_addr = 39
                                          or events.ev_addr = 45
                                          or events.ev_addr = 47) GROUP by events.ev_ow_id`;

const guestCIPerDay = `SELECT events.ev_ow_id
                          FROM events
                          WHERE (date(ev_tstamp) = CURDATE()) 
                                and (events.ev_ow_id IN (${guestCICardId}))
                                and ( events.ev_addr = 1 
                                      or events.ev_addr = 5 
                                      or events.ev_addr = 16 
                                      or events.ev_addr = 21 
                                      or events.ev_addr = 27 
                                      or events.ev_addr = 36 
                                      or events.ev_addr = 39
                                      or events.ev_addr = 45
                                      or events.ev_addr = 47)`;

const guestEntrancePerDay = 'SELECT * FROM guest_card WHERE gc_event = "issue" and gc_tstamp >= CURDATE()';

const carTotalPerDay = 'SELECT gc_id FROM guest_card WHERE (date(gc_tstamp) = CURDATE()) and (gc_type = "car") and (gc_event = "issue")';

const empRealEntry = building => {
  const reqLitera =
    building === 'AC'
      ? 'events.ev_addr = 1 or events.ev_addr = 5 or events.ev_addr = 16 or events.ev_addr = 21 or events.ev_addr = 27'
      : 'events.ev_addr = 36 or events.ev_addr = 39 or events.ev_addr = 45 or events.ev_addr = 47';
  return `SELECT events.ev_ow_id
                  FROM events
                  WHERE (date(ev_tstamp) = CURDATE()) 
                        and (events.ev_ow_id  NOT IN (${guestCICardId.concat(guestEntranceCardId)}))
                        and (${reqLitera}) ORDER by events.ev_ow_id`;
};

const empRealExit = building => {
  const reqLitera =
    building === 'AC'
      ? 'events.ev_addr = 2 or events.ev_addr = 6 or events.ev_addr = 17 or events.ev_addr = 20 or events.ev_addr = 28'
      : 'events.ev_addr = 37 or events.ev_addr = 40 or events.ev_addr = 46 or events.ev_addr = 48';
  return `SELECT events.ev_ow_id
                FROM events
                WHERE (date(ev_tstamp) = CURDATE()) 
                      and (events.ev_ow_id  NOT IN (${guestCICardId.concat(guestEntranceCardId)}))
                      and (${reqLitera}) ORDER by events.ev_ow_id`;
};

const guestRealEntry = building => {
  const reqLitera =
    building === 'AC'
      ? 'events.ev_addr = 1 or events.ev_addr = 5 or events.ev_addr = 16 or events.ev_addr = 21 or events.ev_addr = 27'
      : 'events.ev_addr = 36 or events.ev_addr = 39 or events.ev_addr = 45 or events.ev_addr = 47';
  return `SELECT events.ev_ca_value
                FROM events
                WHERE (date(ev_tstamp) = CURDATE()) 
                      and (events.ev_ow_id IN (${guestCICardId.concat(guestEntranceCardId)}))
                      and (${reqLitera}) ORDER by events.ev_ow_id`;
};

const guestRealExit = building => {
  const reqLitera =
    building === 'AC'
      ? 'events.ev_addr = 2 or events.ev_addr = 6 or events.ev_addr = 17 or events.ev_addr = 20 or events.ev_addr = 28'
      : 'events.ev_addr = 37 or events.ev_addr = 40 or events.ev_addr = 46 or events.ev_addr = 48';
  return `SELECT events.ev_ca_value
              FROM events
              WHERE (date(ev_tstamp) = CURDATE()) 
                    and (events.ev_ow_id IN (${guestCICardId.concat(guestEntranceCardId)}))
                    and (${reqLitera}) ORDER by events.ev_ow_id`;
};

const carRealEntry = `SELECT guest_card.gc_value_sys
                      FROM guest_card
                      WHERE (date(gc_tstamp) = CURDATE()) 
                        and (guest_card.gc_event = 'issue')
                        and (guest_card.gc_type = 'car')
                      ORDER by guest_card.gc_value_sys`;

const carRealExit = `SELECT guest_card.gc_value_sys
                      FROM guest_card
                      WHERE (date(gc_tstamp) = CURDATE()) 
                        and (guest_card.gc_event = 'wdraw')
                        and (guest_card.gc_type = 'car')
                      ORDER by guest_card.gc_value_sys`;

const apiGetAllEmployee = `SELECT owners.ow_id AS id,
                                  owners.ow_lname AS lastName,
                                  owners.ow_fname AS firstName,
                                  owners.ow_mname AS middleName
                           FROM owners
                                  order by owners.ow_lname desc`;

const apiGetEmployeeByID = empId => `SELECT events.ev_tstamp AS tstamp,
                                    owners.ow_id AS id,
                                    owners.ow_lname AS lname,
                                    owners.ow_fname AS fname,
                                    owners.ow_mname AS mname,
                                    owners.ow_photo AS photo,
                                    apoints.ap_id AS apoint_id,
                                    apoints.ap_name AS apoint,
                                    events.ev_ow_id
                              FROM (events, owners)
                                JOIN apoints on(events.ev_addr = apoints.ap_id) 
                              WHERE (events.ev_ow_id = owners.ow_id) 
                                and (cast(events.ev_tstamp as date) >= curdate() - INTERVAL 90 DAY)
                                and (owners.ow_id = "${empId}")
                                ORDER by events.ev_tstamp desc
                                limit 1`;

const apiGetCIGuestCount = `SELECT CAST( ev_tstamp AS DATE ) AS xAxes,
                                  COUNT( ev_ow_id ) AS yAxes
                          FROM events
                          WHERE (ev_tstamp >= CURDATE( ) - INTERVAL 30 DAY) 
                                and (events.ev_ow_id IN (${guestCICardId}))
                                and ( events.ev_addr = 1 
                                      or events.ev_addr = 5 
                                      or events.ev_addr = 16 
                                      or events.ev_addr = 21 
                                      or events.ev_addr = 27 
                                      or events.ev_addr = 36 
                                      or events.ev_addr = 39
                                      or events.ev_addr = 45
                                      or events.ev_addr = 47)
                          GROUP BY xAxes`;

const apiGetGuestCount = `SELECT CAST( gc_tstamp AS DATE ) AS xAxes,
                                COUNT( gc_id ) AS yAxes
                          FROM guest_card
                          WHERE gc_event =  "issue"
                                AND gc_tstamp >= CURDATE( ) - INTERVAL 30 DAY 
                          GROUP BY xAxes`;

const apiGetCarCount = `SELECT CAST( gc_tstamp AS DATE ) AS xAxes,
                              COUNT( gc_id ) AS yAxes
                        FROM guest_card
                        WHERE gc_event =  "issue"
                              AND gc_type = "car"
                              AND gc_tstamp >= CURDATE( ) - INTERVAL 30 DAY 
                        GROUP BY xAxes`;

const apiGetEmployeeCount = `SELECT tdata as xAxes, count(tdata) as yAxes
                              FROM (
                                  SELECT events.ev_ow_id, CAST(ev_tstamp as DATE) as tdata
                                  FROM events
                                  WHERE (ev_tstamp >= CURDATE( ) -INTERVAL 30 DAY )
                                        and (events.ev_ow_id NOT IN (${guestCICardId.concat(guestEntranceCardId)}))
                                        and ( events.ev_addr = 1 
                                              or events.ev_addr = 5 
                                              or events.ev_addr = 16 
                                              or events.ev_addr = 21 
                                              or events.ev_addr = 27 
                                              or events.ev_addr = 36 
                                              or events.ev_addr = 39
                                              or events.ev_addr = 45
                                              or events.ev_addr = 47) 
                                  GROUP BY ev_ow_id, tdata)
                              as t
                            GROUP BY tdata`;

const vpnOnline = `SELECT vpn_access_events.login_date_time as loginDateTime,
                          vpn_access_events.login_duration as loginDuration,
                          vpn_access_events.account as account,
                          vpn_access_events.ip_address as ipAddress
                    FROM vpn_access_events
                    WHERE (date(vpn_access_events.login_date_time) = CURDATE() and vpn_access_events.login_duration = '') 
                    ORDER by vpn_access_events.login_date_time`;

const vpnSessionPerDay = `SELECT vpn_access_events.login_date_time as loginDateTime,
                                 vpn_access_events.login_duration as loginDuration,
                                 vpn_access_events.account as account,
                                 vpn_access_events.ip_address as ipAddress,
                                 owners.ow_photo as photo
                          FROM vpn_access_events
                                 inner join owners on (account = owners.ow_vpn_account)
                          WHERE (date(vpn_access_events.login_date_time) = CURDATE() and vpn_access_events.login_duration <> '') 
                          ORDER by vpn_access_events.account, vpn_access_events.login_date_time`;

exports.allTenEntry = allTenEntry;
exports.allTenExit = allTenExit;
exports.allEmployeeUC = allEmployeeUC;
exports.lastEntry = lastEntry;
exports.lastExit = lastExit;
exports.lastEmployee = lastEmployee;
exports.lastServerRoomEmployee = lastServerRoomEmployee;
exports.lastServerRoomEmployeeInit = lastServerRoomEmployeeInit;
exports.lastEmployeeUC = lastEmployeeUC;
exports.employeeTotalPerDay = employeeTotalPerDay;
exports.guestCIPerDay = guestCIPerDay;
exports.guestEntrancePerDay = guestEntrancePerDay;
exports.carTotalPerDay = carTotalPerDay;
exports.empRealEntry = empRealEntry;
exports.empRealExit = empRealExit;
exports.guestRealEntry = guestRealEntry;
exports.guestRealExit = guestRealExit;
exports.carRealEntry = carRealEntry;
exports.carRealExit = carRealExit;
exports.apiGetAllEmployee = apiGetAllEmployee;
exports.apiGetEmployeeByID = apiGetEmployeeByID;
exports.apiGetGuestCount = apiGetGuestCount;
exports.apiGetCIGuestCount = apiGetCIGuestCount;
exports.apiGetCarCount = apiGetCarCount;
exports.apiGetEmployeeCount = apiGetEmployeeCount;
exports.vpnOnline = vpnOnline;
exports.vpnSessionPerDay = vpnSessionPerDay;
