'use strict';

/*
function inserEvent(db, evTime, evCode, evAddr, evUser, evCard) {
  db.query(
    `INSERT INTO events (ev_tstamp, ev_type, ev_addr, ev_ow_id, ev_ca_value)
              VALUES (?, ?, ?, ?, ?)`,
    [evTime, evCode, evAddr, evUser, evCard], err => err,
  );
*/

const inserEvent = `INSERT INTO events (ev_tstamp, ev_type, ev_addr, ev_ow_id, ev_ca_value)
        VALUES (?, ?, ?, ?, ?)`;

const inserGuestCardEvent = `INSERT INTO guest_card (gc_tstamp, gc_event, gc_type, gc_value_dot, gc_value_sys, gc_photo_thumb, gc_photo_link)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

exports.inserEvent = inserEvent;
exports.inserGuestCardEvent = inserGuestCardEvent;
