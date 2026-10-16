// ===== LAB 2: the "database" (lists saved in the browser's localStorage) =====
var db = { roomTypes: [], rooms: [], guests: [], reservations: [], bills: [], nextId: 1, resCount: 0 };
var STATUSES = ["AVAILABLE", "RESERVED", "OCCUPIED", "CLEANING", "MAINTENANCE"];
var SERVICES = { "Breakfast": 800, "Laundry": 500, "Room Service": 600, "Extra Bed": 700, "Airport Transfer": 1500, "Mini Bar": 400 };
var TAX_RATE = 0.10;
var editType = null, editRoom = null, editGuest = null;

function save() { try { localStorage.setItem("hotelDB", JSON.stringify(db)); } catch (e) {} }
function load() { try { var s = localStorage.getItem("hotelDB"); if (s) db = JSON.parse(s); } catch (e) {} }
function newId() { return db.nextId++; }
function $(id) { return document.getElementById(id); }
function money(n) { return "₱" + Number(n).toLocaleString(); }
function find(list, id) { return list.find(function (x) { return x.id == id; }); }
function nights(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
function typeName(id) { var t = find(db.roomTypes, id); return t ? t.name : "?"; }
function guestName(id) { var g = find(db.guests, id); return g ? g.first + " " + g.last : "?"; }
function roomNo(id) { var r = find(db.rooms, id); return r ? r.number : "?"; }
function row(label, amount) { return label.padEnd(20) + money(amount).padStart(12) + "\n"; }

function seedData() {
  if (db.roomTypes.length) return;
  var std = newId(), dlx = newId();
  db.roomTypes.push({ id: std, name: "Standard Room", desc: "Basic room", capacity: 2, rate: 2000, active: true });
  db.roomTypes.push({ id: dlx, name: "Deluxe Room", desc: "Spacious room with additional amenities", capacity: 3, rate: 3500, active: true });
  db.rooms.push({ id: newId(), number: "101", typeId: std, floor: 1, capacity: 2, rate: 2000, status: "AVAILABLE", active: true });
  db.rooms.push({ id: newId(), number: "201", typeId: dlx, floor: 2, capacity: 3, rate: 3500, status: "AVAILABLE", active: true });
  db.rooms.push({ id: newId(), number: "202", typeId: dlx, floor: 2, capacity: 3, rate: 3500, status: "AVAILABLE", active: true });
  db.guests.push({ id: newId(), no: "G-0001", first: "Juan", last: "Dela Cruz", contact: "09123456789", email: "juan@email.com", address: "Bayombong, Nueva Vizcaya", idType: "Passport", idRef: "P1234567", active: true });
  save();
}

// ===== LAB 1: navigation =====
var PAGES = [["dashboard", "Dashboard"], ["types", "Room Types"], ["rooms", "Rooms"], ["avail", "Availability"], ["guests", "Guests"],
  ["res", "Reservations"], ["checkin", "Check-in"], ["billing", "Billing"], ["checkout", "Check-out"]];

function showPage(name) {
  document.querySelectorAll(".page").forEach(function (p) { p.style.display = (p.id == "page-" + name) ? "block" : "none"; });
  var h = "";
  PAGES.forEach(function (p) { h += "<button class='" + (p[0] == name ? "active" : "") + "' onclick=\"showPage('" + p[0] + "')\">" + p[1] + "</button>"; });
  $("nav").innerHTML = h;
  refresh();
}

function fillSelect(id, items, labelFn, blankText) {
  var el = $(id), keep = el.value, h = blankText ? "<option value=''>" + blankText + "</option>" : "";
  items.forEach(function (i) { h += "<option value='" + i.id + "'>" + labelFn(i) + "</option>"; });
  el.innerHTML = h;
  if (keep) el.value = keep;
}

function refresh() {
  renderDash(); renderTypes(); renderRooms(); renderGuests(); renderRes(); renderCheckin(); renderBilling(); renderCheckout(); renderReceipts();
  var activeTypes = db.roomTypes.filter(function (t) { return t.active; });
  var activeRooms = db.rooms.filter(function (r) { return r.active; });
  fillSelect("rType", activeTypes, function (t) { return t.name; });
  fillSelect("aType", activeTypes, function (t) { return t.name; }, "All types");
  fillSelect("resGuest", db.guests.filter(function (g) { return g.active; }), function (g) { return g.no + " - " + g.first + " " + g.last; });
  fillSelect("resRoom", activeRooms, function (r) { return "Room " + r.number + " (" + typeName(r.typeId) + ", max " + r.capacity + ", " + money(r.rate) + ")"; });
  var h = ""; for (var s in SERVICES) { h += "<option value='" + s + "'>" + s + " - " + money(SERVICES[s]) + "</option>"; }
  $("bService").innerHTML = h;
  if (!editGuest && !$("gNo").value) { $("gNo").value = "G-" + String(db.guests.length + 1).padStart(4, "0"); }
}

// ===== LAB 1: dashboard =====
function renderDash() {
  var count = function (st) { return db.rooms.filter(function (r) { return r.status == st && r.active; }).length; };
  var res = function (st) { return db.reservations.filter(function (r) { return r.status == st; }).length; };
  $("dashRows").innerHTML = "<tr><td>Total Rooms</td><td>" + db.rooms.length + "</td></tr><tr><td>Available</td><td>" + count("AVAILABLE") +
    "</td></tr><tr><td>Occupied</td><td>" + count("OCCUPIED") + "</td></tr><tr><td>Confirmed Reservations</td><td>" + res("CONFIRMED") +
    "</td></tr><tr><td>Checked-in Guests</td><td>" + res("CHECKED-IN") + "</td></tr><tr><td>Guests Registered</td><td>" + db.guests.length + "</td></tr>";
}

// ===== LAB 3: room types =====
function saveType() {
  var name = $("tName").value.trim(), cap = +$("tCap").value, rate = +$("tRate").value;
  if (!name || cap < 1 || rate < 1) { alert("Please enter a name, capacity and rate."); return; }
  var t = editType ? find(db.roomTypes, editType) : { id: newId(), active: true };
  t.name = name; t.desc = $("tDesc").value; t.capacity = cap; t.rate = rate;
  if (!editType) { db.roomTypes.push(t); }
  editType = null;
  ["tName", "tDesc", "tCap", "tRate"].forEach(function (i) { $(i).value = ""; });
  save(); refresh();
}
function editT(id) {
  var t = find(db.roomTypes, id); editType = id;
  $("tName").value = t.name; $("tDesc").value = t.desc; $("tCap").value = t.capacity; $("tRate").value = t.rate;
}
function toggleT(id) { var t = find(db.roomTypes, id); t.active = !t.active; save(); refresh(); }
function renderTypes() {
  var q = $("tSearch").value.toLowerCase(), h = "";
  db.roomTypes.forEach(function (t) {
    if ((t.name + t.desc).toLowerCase().indexOf(q) < 0) { return; }
    h += "<tr><td>" + t.name + "</td><td>" + t.desc + "</td><td>" + t.capacity + "</td><td>" + money(t.rate) + "</td><td>" + (t.active ? "Active" : "Inactive") +
      "</td><td><button onclick='editT(" + t.id + ")'>Edit</button> <button onclick='toggleT(" + t.id + ")'>" + (t.active ? "Deactivate" : "Activate") + "</button></td></tr>";
  });
  $("typeRows").innerHTML = h;
}

// ===== LAB 4: rooms =====
function saveRoom() {
  var num = $("rNum").value.trim(), typeId = +$("rType").value, floor = +$("rFloor").value, cap = +$("rCap").value;
  if (!num || !typeId || floor < 1 || cap < 1) { alert("Please complete the room form."); return; }
  var dup = db.rooms.some(function (r) { return r.number == num && r.id != editRoom; });
  if (dup) { alert("Room number " + num + " already exists."); return; }
  var rate = +$("rRate").value || find(db.roomTypes, typeId).rate;
  var r = editRoom ? find(db.rooms, editRoom) : { id: newId(), status: "AVAILABLE", active: true };
  r.number = num; r.typeId = typeId; r.floor = floor; r.capacity = cap; r.rate = rate;
  if (!editRoom) { db.rooms.push(r); }
  editRoom = null;
  ["rNum", "rFloor", "rCap", "rRate"].forEach(function (i) { $(i).value = ""; });
  save(); refresh();
}
function editR(id) {
  var r = find(db.rooms, id); editRoom = id;
  $("rNum").value = r.number; $("rType").value = r.typeId; $("rFloor").value = r.floor; $("rCap").value = r.capacity; $("rRate").value = r.rate;
}
function toggleR(id) { var r = find(db.rooms, id); r.active = !r.active; save(); refresh(); }
function setRoomStatus(id, status) { find(db.rooms, id).status = status; save(); refresh(); }
function renderRooms() {
  var q = $("rSearch").value.toLowerCase(), h = "";
  db.rooms.forEach(function (r) {
    if ((r.number + typeName(r.typeId) + r.status).toLowerCase().indexOf(q) < 0) { return; }
    var opts = "";
    STATUSES.forEach(function (s) { opts += "<option" + (s == r.status ? " selected" : "") + ">" + s + "</option>"; });
    h += "<tr><td>" + r.number + "</td><td>" + typeName(r.typeId) + "</td><td>" + r.floor + "</td><td>" + r.capacity + "</td><td>" + money(r.rate) +
      "</td><td><select onchange='setRoomStatus(" + r.id + ",this.value)'>" + opts + "</select></td><td>" + (r.active ? "Active" : "Inactive") +
      "</td><td><button onclick='editR(" + r.id + ")'>Edit</button> <button onclick='toggleR(" + r.id + ")'>" + (r.active ? "Deactivate" : "Activate") + "</button></td></tr>";
  });
  $("roomRows").innerHTML = h;
}

// ===== LAB 5: availability (a room is free if no confirmed/checked-in reservation overlaps) =====
function isFree(room, a, b, ignoreId) {
  if (!room.active || room.status == "MAINTENANCE") { return false; }
  for (var i = 0; i < db.reservations.length; i++) {
    var r = db.reservations[i];
    var counts = (r.status == "CONFIRMED" || r.status == "CHECKED-IN");
    if (counts && r.roomId == room.id && r.id != ignoreId && a < r.out && b > r.in) { return false; }
  }
  return true;
}
function findRooms() {
  var a = $("aIn").value, b = $("aOut").value, n = +$("aGuests").value || 1, t = $("aType").value, h = "";
  if (!a || !b || b <= a) { $("availResult").innerHTML = "<p class='balance'>Please choose valid dates.</p>"; return; }
  db.rooms.forEach(function (r) {
    if (t && r.typeId != t) { return; }
    if (n > r.capacity || !isFree(r, a, b)) { return; }
    h += "<tr><td>Room " + r.number + "</td><td>" + typeName(r.typeId) + "</td><td>" + money(r.rate) + "/night</td></tr>";
  });
  $("availResult").innerHTML = h ? "<h3>AVAILABLE ROOMS</h3><table>" + h + "</table>" : "<p class='balance'>No rooms available.</p>";
}

// ===== LAB 6: guests (with validation) =====
function saveGuest() {
  var g = { no: $("gNo").value.trim(), first: $("gFirst").value.trim(), last: $("gLast").value.trim(), contact: $("gContact").value.trim(),
    email: $("gEmail").value.trim(), address: $("gAddress").value.trim(), idType: $("gIdType").value.trim(), idRef: $("gIdRef").value.trim() };
  if (!g.no || !g.first || !g.last || !g.contact || !g.email) { alert("Guest no., names, contact and email are required."); return; }
  if (!/^09\d{9}$/.test(g.contact)) { alert("Contact number must look like 09123456789."); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g.email)) { alert("Invalid email address."); return; }
  if (db.guests.some(function (x) { return x.no == g.no && x.id != editGuest; })) { alert("Guest number already exists."); return; }
  if (editGuest) { var old = find(db.guests, editGuest); for (var k in g) { old[k] = g[k]; } }
  else { g.id = newId(); g.active = true; db.guests.push(g); }
  editGuest = null;
  ["gNo", "gFirst", "gLast", "gContact", "gEmail", "gAddress", "gIdType", "gIdRef"].forEach(function (i) { $(i).value = ""; });
  save(); refresh();
}
function editG(id) {
  var g = find(db.guests, id); editGuest = id;
  $("gNo").value = g.no; $("gFirst").value = g.first; $("gLast").value = g.last; $("gContact").value = g.contact;
  $("gEmail").value = g.email; $("gAddress").value = g.address; $("gIdType").value = g.idType; $("gIdRef").value = g.idRef;
}
function toggleG(id) { var g = find(db.guests, id); g.active = !g.active; save(); refresh(); }
function renderGuests() {
  var q = $("gSearch").value.toLowerCase(), h = "";
  db.guests.forEach(function (g) {
    if ((g.no + g.first + g.last + g.contact).toLowerCase().indexOf(q) < 0) { return; }
    h += "<tr><td>" + g.no + "</td><td>" + g.first + " " + g.last + "</td><td>" + g.contact + "</td><td>" + g.email + "</td><td>" + (g.active ? "Active" : "Inactive") +
      "</td><td><button onclick='showProfile(" + g.id + ")'>Profile</button> <button onclick='editG(" + g.id + ")'>Edit</button> <button onclick='toggleG(" + g.id + ")'>" + (g.active ? "Deactivate" : "Activate") + "</button></td></tr>";
  });
  $("guestRows").innerHTML = h;
}

// ===== LAB 7: guest profile and history =====
function showProfile(id) {
  var g = find(db.guests, id), list = db.reservations.filter(function (r) { return r.guestId == id; });
  var h = "<h3>GUEST PROFILE</h3><p>Guest No.: " + g.no + "<br>Name: " + g.first + " " + g.last + "<br>Contact: " + g.contact + "</p><b>Reservation History:</b><br>";
  list.forEach(function (r) { h += "- " + r.no + " - " + r.in + " to " + r.out + " (" + r.status + ")<br>"; });
  $("profileBox").innerHTML = h + "<p>Total Visits: " + list.length + "</p>";
  $("profileBox").style.display = "block";
}

// ===== LAB 8 and 9: create reservation + validation =====
function checkReservation(guestId, roomId, a, b, n) {
  var g = find(db.guests, guestId), r = find(db.rooms, roomId);
  if (!g) { return "Guest does not exist."; }
  if (!r) { return "Room does not exist."; }
  if (!a || !b || !n) { return "Please complete all required information."; }
  if (b <= a) { return "Check-out date must be after check-in date."; }
  if (n > r.capacity) { return "Number of guests exceeds room capacity (" + r.capacity + ")."; }
  if (!isFree(r, a, b)) { return "Room " + r.number + " is not available for " + a + " to " + b + "."; }
  return "";
}
function saveReservation() {
  var guestId = +$("resGuest").value, roomId = +$("resRoom").value, a = $("resIn").value, b = $("resOut").value, n = +$("resN").value;
  var error = checkReservation(guestId, roomId, a, b, n);
  if (error) { alert("RESERVATION NOT ALLOWED\n\n" + error); return; }
  var room = find(db.rooms, roomId), num = nights(a, b);
  db.resCount++;
  var res = { id: newId(), no: "RES-" + String(db.resCount).padStart(3, "0"), guestId: guestId, roomId: roomId, in: a, out: b, n: n,
    rate: room.rate, nights: num, amount: room.rate * num, status: "PENDING" };
  db.reservations.push(res);
  $("resPreview").innerHTML = "Created " + res.no + ": " + money(room.rate) + " x " + num + " nights = " + money(res.amount);
  if ($("resWalk").checked) { res.status = "CONFIRMED"; checkInReservation(res); $("resWalk").checked = false; }
  save(); refresh();
}

// ===== LAB 10: confirmation and statuses =====
function setResStatus(id, status) {
  var r = find(db.reservations, id);
  if (status == "CONFIRMED") {
    var error = checkReservation(r.guestId, r.roomId, r.in, r.out, r.n);
    // the reservation itself is PENDING, so it does not block itself
    if (error) { alert(error); return; }
  }
  r.status = status; save(); refresh();
}

// ===== LAB 11: search and history =====
function renderRes() {
  var q = $("resSearch").value.toLowerCase(), st = $("resStatus").value, h = "";
  db.reservations.forEach(function (r) {
    var text = (r.no + guestName(r.guestId) + roomNo(r.roomId) + r.in + r.out).toLowerCase();
    if (text.indexOf(q) < 0 || (st && r.status != st)) { return; }
    var btns = "";
    if (r.status == "PENDING") { btns += "<button onclick=\"setResStatus(" + r.id + ",'CONFIRMED')\">Confirm</button> "; }
    if (r.status == "PENDING" || r.status == "CONFIRMED") {
      btns += "<button onclick=\"setResStatus(" + r.id + ",'CANCELLED')\">Cancel</button> <button onclick=\"setResStatus(" + r.id + ",'NO-SHOW')\">No-show</button>";
    }
    h += "<tr><td>" + r.no + "</td><td>" + guestName(r.guestId) + "</td><td>" + roomNo(r.roomId) + "</td><td>" + r.in + " to " + r.out + "</td><td>" + money(r.amount) +
      "</td><td>" + r.status + "</td><td>" + btns + "</td></tr>";
  });
  $("resRows").innerHTML = h;
}

// ===== LAB 12 and 13: check-in (walk-ins use the checkbox on the reservation form) =====
function renderCheckin() {
  var list = db.reservations.filter(function (r) { return r.status == "CONFIRMED"; });
  fillSelect("ciRes", list, function (r) { return r.no + " - " + guestName(r.guestId) + " - Room " + roomNo(r.roomId); });
  var r = find(db.reservations, $("ciRes").value);
  $("ciInfo").innerHTML = r ? "Guest: " + guestName(r.guestId) + "<br>Room: " + roomNo(r.roomId) + "<br>Reserved check-in: " + r.in + "<br>Guests: " + r.n : "No confirmed reservations.";
}
function checkInReservation(r) {
  r.status = "CHECKED-IN"; r.actualIn = new Date().toLocaleString();
  find(db.rooms, r.roomId).status = "OCCUPIED";
  db.bills.push({ id: newId(), resId: r.id, services: [], discount: 0, paid: 0, payments: [] });
}
function doCheckIn() {
  var r = find(db.reservations, $("ciRes").value);
  if (!r) { alert("Select a confirmed reservation first."); return; }
  var room = find(db.rooms, r.roomId);
  if (room.status == "OCCUPIED" || room.status == "MAINTENANCE") { alert("Room " + room.number + " is " + room.status + " and cannot be used."); return; }
  checkInReservation(r); save(); refresh(); alert("Guest checked in.");
}

// ===== LAB 14 to 17: billing =====
function getBill(resId) { return db.bills.find(function (b) { return b.resId == resId; }); }
function totals(b) {
  var r = find(db.reservations, b.resId), room = r.rate * r.nights, svc = 0;
  b.services.forEach(function (s) { svc += s.price; });
  var sub = room + svc, tax = Math.round(sub * TAX_RATE), total = sub - b.discount + tax;
  return { room: room, sub: sub, tax: tax, total: total, balance: total - b.paid };
}
function billText(b, finalReceipt) {
  var r = find(db.reservations, b.resId), t = totals(b);
  var s = (finalReceipt ? "HOTEL RECEIPT\n" : "GUEST BILL\n") + "--------------------------------\n";
  s += "Guest: " + guestName(r.guestId) + "\nRoom: " + roomNo(r.roomId) + "\nStay: " + r.in + " to " + r.out + "\n\n";
  s += row("Room Charges", t.room);
  b.services.forEach(function (x) { s += row(x.name, x.price); });
  s += row("Subtotal", t.sub) + row("Discount", b.discount) + row("Taxes", t.tax) + "--------------------------------\n" + row("TOTAL", t.total);
  s += row("Amount Paid", b.paid) + row("Balance", t.balance);
  s += "\nPayment Status: " + (t.balance <= 0 ? "PAID" : "BALANCE") + "\n";
  if (finalReceipt) { s += "Check-out: " + (r.outAt || "-") + "\n--------------------------------\nThank you for staying with us!"; }
  return s;
}
function renderBilling() {
  var list = db.reservations.filter(function (r) { return r.status == "CHECKED-IN"; });
  fillSelect("bRes", list, function (r) { return r.no + " - " + guestName(r.guestId) + " - Room " + roomNo(r.roomId); });
  var b = getBill($("bRes").value);
  $("billText").textContent = b ? billText(b, false) : "No checked-in guests to bill.";
}
function addService() {
  var b = getBill($("bRes").value); if (!b) { return; }
  var name = $("bService").value; b.services.push({ name: name, price: SERVICES[name] }); save(); refresh();
}
function setDiscount() {
  var b = getBill($("bRes").value); if (!b) { return; }
  b.discount = Math.max(0, +$("bDiscount").value || 0); save(); refresh();
}

// ===== LAB 18: payment =====
function recordPayment() {
  var b = getBill($("bRes").value); if (!b) { alert("Select a checked-in reservation."); return; }
  var amt = +$("bPay").value, t = totals(b);
  if (amt <= 0) { alert("Enter a payment amount."); return; }
  if (amt > t.balance) { alert("Payment is more than the balance (" + money(t.balance) + ")."); return; }
  b.paid += amt; b.payments.push({ amount: amt, method: $("bMethod").value, date: new Date().toLocaleString() });
  $("bPay").value = ""; save(); refresh();
}

// ===== LAB 19: check-out =====
function renderCheckout() {
  var list = db.reservations.filter(function (r) { return r.status == "CHECKED-IN"; });
  fillSelect("coRes", list, function (r) { return r.no + " - " + guestName(r.guestId) + " - Room " + roomNo(r.roomId); });
  var b = getBill($("coRes").value);
  $("coText").textContent = b ? billText(b, false) : "No checked-in guests.";
}
function doCheckOut() {
  var r = find(db.reservations, $("coRes").value); if (!r) { alert("Select a reservation."); return; }
  var t = totals(getBill(r.id));
  if (t.balance > 0) { alert("Unpaid balance of " + money(t.balance) + ". Please settle it in Billing first."); return; }
  r.status = "CHECKED-OUT"; r.outAt = new Date().toLocaleString();
  find(db.rooms, r.roomId).status = "CLEANING";   // LAB 21: housekeeping later sets it to AVAILABLE in Rooms
  save(); refresh(); showReceipt(r.id);
}

// ===== LAB 20: final receipt, print, previous receipts, search =====
function showReceipt(resId) { $("receipt").textContent = billText(getBill(resId), true); }
function renderReceipts() {
  var q = $("rcSearch").value.toLowerCase(), h = "";
  db.reservations.forEach(function (r) {
    if (r.status != "CHECKED-OUT" || (r.no + guestName(r.guestId)).toLowerCase().indexOf(q) < 0) { return; }
    h += "<tr><td>" + r.no + "</td><td>" + guestName(r.guestId) + "</td><td>" + roomNo(r.roomId) + "</td><td><button onclick='showReceipt(" + r.id + ")'>View</button></td></tr>";
  });
  $("rcRows").innerHTML = h;
}

// ===== start the app =====
load();
seedData();
showPage("dashboard");
