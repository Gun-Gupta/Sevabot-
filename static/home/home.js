// Wait until page is ready
document.addEventListener("DOMContentLoaded", function () {
  /* ----------------------------
   * Data model (Doctors, Slots)
   * ---------------------------- */
  const doctors = [
    { id: "d1", name: "Dr. A. Sharma (General)", specialty: "General Physician" },
    { id: "d2", name: "Dr. N. Verma (Pediatrics)", specialty: "Pediatrics" },
    { id: "d3", name: "Dr. R. Singh (ENT)", specialty: "ENT" },
  ];

  function genSlots() {
    // Generate slots for 3 days × 6 times each
    const slots = [];
    const times = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];

    for (let day = 0; day < 3; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);

      const dayStr = date.toISOString().slice(0, 10);
      times.forEach((t) =>
        slots.push({ slotId: `${dayStr}T${t}`, date: dayStr, time: t, available: true })
      );
    }
    return slots;
  }

  // Slots per doctor in localStorage
  function getDoctorSlots(doctorId) {
    const key = `slots_${doctorId}`;
    let s = localStorage.getItem(key);

    if (!s) {
      const slots = genSlots();
      localStorage.setItem(key, JSON.stringify(slots));
      return slots;
    }
    return JSON.parse(s);
  }
  function saveDoctorSlots(doctorId, slots) {
    localStorage.setItem(`slots_${doctorId}`, JSON.stringify(slots));
  }

  // Appointments storage
  function getAppointments() {
    return JSON.parse(localStorage.getItem("appointments") || "[]");
  }
  function saveAppointments(list) {
    localStorage.setItem("appointments", JSON.stringify(list));
  }

  /* ----------------------------
   * Diagnosis rules
   * ---------------------------- */
  const diseaseRules = [
    { name: "Common Cold", symptoms: ["cough", "sneezing", "runny nose", "sore throat"] },
    { name: "Influenza (Flu)", symptoms: ["fever", "body ache", "chills", "fatigue"] },
    { name: "Stomach Infection", symptoms: ["diarrhea", "vomiting", "stomach pain"] },
    { name: "Migraine", symptoms: ["headache", "nausea", "sensitivity to light"] },
    { name: "COVID-19", symptoms: ["fever", "dry cough", "loss of smell", "fatigue"] },
  ];

  function diagnoseFromSymptoms(raw) {
    const tokens = raw
      .toLowerCase()
      .split(/[ ,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const scores = diseaseRules
      .map((d) => {
        const match = d.symptoms.filter((s) => tokens.includes(s));
        return { name: d.name, matchCount: match.length, matches: match };
      })
      .filter((x) => x.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount);

    if (scores.length === 0) return { diagnosis: "No confident match", details: [] };
    return { diagnosis: scores[0].name, details: scores };
  }

  /* ----------------------------
   * Sentiment analysis
   * ---------------------------- */
  const pos = ["good", "great", "happy", "fine", "well", "better", "excellent", "love", "nice", "awesome"];
  const neg = ["bad", "sad", "angry", "hate", "terrible", "awful", "sick", "ill", "pain", "worst", "not"];

  function sentimentAnalyze(text) {
    const t = text.toLowerCase();
    let score = 0;

    pos.forEach((w) => {
      if (t.includes(w)) score++;
    });
    neg.forEach((w) => {
      if (t.includes(w)) score--;
    });

    let label = "Neutral";
    if (score > 0) label = "Positive";
    else if (score < 0) label = "Negative";

    return { score, label };
  }

  /* ----------------------------
   * Chat UI
   * ---------------------------- */
  const chat = document.getElementById("chat");
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const doctorSelect = document.getElementById("doctorSelect");
  const slotsList = document.getElementById("slotsList");
  const appointmentsList = document.getElementById("appointmentsList");

  function addBot(text) {
    const el = document.createElement("div");
    el.className = "bot";
    el.innerHTML = text;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
  }

  function addUser(text) {
    const el = document.createElement("div");
    el.className = "user";
    el.textContent = text;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
  }

  /* ----------------------------
   * Doctors / Slots Rendering
   * ---------------------------- */
  function populateDoctors() {
    doctorSelect.innerHTML = "";
    doctors.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = `${d.name} — ${d.specialty}`;
      doctorSelect.appendChild(opt);
    });
  }

  function renderSlots() {
    slotsList.innerHTML = "";
    const did = doctorSelect.value;
    const slots = getDoctorSlots(did);

    slots.forEach((s) => {
      const node = document.createElement("div");
      node.className = "slot";

      node.innerHTML = `
        <div>
          <strong>${s.date} ${s.time}</strong>
          <div><small>${s.available ? "Available" : "Booked"}</small></div>
        </div>
      `;

      const btn = document.createElement("button");
      btn.textContent = s.available ? "Book" : "Booked";
      btn.disabled = !s.available;
      btn.onclick = () => bookSlot(did, s.slotId);

      node.appendChild(btn);
      slotsList.appendChild(node);
    });
  }

  function renderAppointments() {
    const ap = getAppointments();
    if (ap.length === 0) {
      appointmentsList.innerHTML = "<small>No bookings yet</small>";
      return;
    }
    appointmentsList.innerHTML = "";

    ap.forEach((a, idx) => {
      const div = document.createElement("div");
      div.className = "slot";

      div.innerHTML = `
        <div>
          <strong>${a.doctorName}</strong>
          <div><small>${a.date} ${a.time} — ${a.patientName || "Anonymous"}</small></div>
        </div>
      `;

      const btn = document.createElement("button");
      btn.textContent = "Cancel";
      btn.onclick = () => cancelBooking(idx);

      div.appendChild(btn);
      appointmentsList.appendChild(div);
    });
  }

  /* ----------------------------
   * Booking
   * ---------------------------- */
  function bookSlot(doctorId, slotId) {
    const slots = getDoctorSlots(doctorId);
    const sidx = slots.findIndex((s) => s.slotId === slotId);

    if (sidx === -1) return addBot("Slot not found");
    if (!slots[sidx].available) return addBot("Slot already taken");

    const patient = prompt("Enter patient name (optional)") || "Anonymous";
    slots[sidx].available = false;
    saveDoctorSlots(doctorId, slots);

    const doctor = doctors.find((d) => d.id === doctorId);
    const ap = getAppointments();

    ap.push({
      doctorId,
      doctorName: doctor.name,
      date: slots[sidx].date,
      time: slots[sidx].time,
      patientName: patient,
      bookedAt: new Date().toISOString(),
    });

    saveAppointments(ap);
    renderSlots();
    renderAppointments();
    addBot(`Booked ✅ ${doctor.name} on ${slots[sidx].date} at ${slots[sidx].time} for ${patient}`);
  }

  function cancelBooking(index) {
    const ap = getAppointments();
    const b = ap.splice(index, 1)[0];
    saveAppointments(ap);

    // free slot again
    const slots = getDoctorSlots(b.doctorId);
    const sidx = slots.findIndex((s) => s.date === b.date && s.time === b.time);
    if (sidx !== -1) {
      slots[sidx].available = true;
      saveDoctorSlots(b.doctorId, slots);
    }

    renderSlots();
    renderAppointments();
    addBot("Booking cancelled");
  }
   addBot("Hi! I'm SevaBot How can I Help You ?")
  /* ----------------------------
   * Intent parser
   * ---------------------------- */
  function handleUserRaw(text) {
    addUser(text);

    const t = text.trim();
    const prompt = t.toLowerCase();

    // Call APIs
    fetch('/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symptoms: prompt }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json(); // or .text(), .blob(), etc.
    })
    .then(data => {
      if(data && data.length > 0){
        let html = ``;
        /**
         * 
         * [
            {
              "clinic_name": "Cure Well Clinic 12",
              "doctor": "Dr. Neha Sharma",
              "fees": "\u20b9 200",
              "index": 11,
              "location": "Thatipur, Gwalior",
              "score": 0.316,
              "specialization": "General Practitioner",
              "symptoms": "Flu, Fever, Cold, Malaria, Dengue, Cough, Headache",
              "timings": "11 AM - 3 PM / 5 PM - 9 PM"
            },
             {
              "clinic_name": "Cure Well Clinic 12",
              "doctor": "Dr. Neha Sharma",
              "fees": "\u20b9 200",
              "index": 11,
              "location": "Thatipur, Gwalior",
              "score": 0.316,
              "specialization": "General Practitioner",
              "symptoms": "Flu, Fever, Cold, Malaria, Dengue, Cough, Headache",
              "timings": "11 AM - 3 PM / 5 PM - 9 PM"
            },

          ]
         * 
         * 
         */
        data.forEach(details => {
          html += `
            <div class="card" style="width: 15rem;">
              <div class="card-body">
                <h5 class="card-title">${details['doctor']}</h5>
                <p class="card-text">${details['specialization']}</p>
                <p class="card-text">${details['fees']}</p>
                <p class="card-text">${details['timings']}</p>
                <p class="card-text">${details['location']}</p>
                <a href="#" class="btn btn-primary">Schedule Now</a>
              </div>
            </div>
          `
        })
        addBot(html);
      }else{
        addBot("Sorry we couldn't found any doctor. Please try again later!")
      }
    })
    .catch(error => console.error('Error:', error));   
  }

  /* ----------------------------
   * Event wiring
   * ---------------------------- */
  sendBtn.onclick = () => {
    const v = input.value.trim();
    if (!v) return;
    handleUserRaw(v);
    input.value = "";
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });

  document.getElementById("btnClear").onclick = () => {
    chat.innerHTML = "";
    addBot("Chat cleared.");
  };

  doctorSelect.onchange = renderSlots;

  document.getElementById("refreshSlots").onclick = () => renderSlots();

  document.getElementById("exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(getAppointments(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "appointments.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById("clearBookings").onclick = () => {
    if (!confirm("Clear all bookings?")) return;
    localStorage.removeItem("appointments");
    doctors.forEach((d) => localStorage.removeItem("slots_" + d.id));
    renderAppointments();
    renderSlots();
    addBot("All bookings cleared");
  };

  /* ----------------------------
   * Initialize
   * ---------------------------- */
  populateDoctors();
  renderSlots();
  renderAppointments();
});
