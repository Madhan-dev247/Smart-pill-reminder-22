// Navigation
const screens = document.querySelectorAll(".screen");
const navButtons = document.querySelectorAll("nav button");
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    screens.forEach(s => s.classList.remove("active"));
    document.getElementById(btn.id.replace("Btn", "")).classList.add("active");
  });
});

// Preloaded medicine names
const allMedicines = [
  "Paracetamol","Pantoprazole","Amoxicillin","Metformin","Atorvastatin","Amlodipine",
  "Cetrizine","Azithromycin","Losartan","Omeprazole","Dolo 650","Crocin","Ibuprofen",
  "Levothyroxine","Vitamin D3","Calcium Tablet","Insulin","Metoprolol","Aspirin","Clopidogrel",
  "Amiodarone","Folic Acid","Diclofenac","Ranitidine","Cough Syrup","Domperidone",
  "Cetirizine","Glimipride","Sitagliptin","Iron Supplement","Zincovit","Multivitamin",
  "B Complex","Pantodac","Rabeprazole","Sucralfate","Losacar","Telma","Nifedipine",
  "Propranolol","Lantus Insulin","Prednisolone","Montelukast","Levofloxacin","Ciprofloxacin",
  "Tetracycline","Benzonatate","Dexamethasone","Paracip","Pan D","Ecosprin","Erythromycin",
  "Ofloxacin","Sodium Bicarbonate","Gaviscon","Digene","Lactulose","ORS Powder"
];

const datalist = document.getElementById("medicineNames");
allMedicines.forEach(name => {
  const option = document.createElement("option");
  option.value = name;
  datalist.appendChild(option);
});

const medicineList = document.getElementById("medicineList");
const historyList = document.getElementById("historyList");
const saveBtn = document.getElementById("saveMedicine");

let medicines = JSON.parse(localStorage.getItem("medicines")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];

function renderMedicines() {
  medicineList.innerHTML = "";
  medicines.forEach((med, index) => {
    const li = document.createElement("li");
    li.textContent = `${med.name} at ${med.time}`;
    const takeBtn = document.createElement("button");
    takeBtn.textContent = "Taken";
    takeBtn.onclick = () => markTaken(index);
    li.appendChild(takeBtn);
    medicineList.appendChild(li);
  });
}

function renderHistory() {
  historyList.innerHTML = "";
  history.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name} taken at ${entry.time}`;
    historyList.appendChild(li);
  });
}

saveBtn.addEventListener("click", () => {
  const name = document.getElementById("medicineName").value;
  const time = document.getElementById("medicineTime").value;
  if (name && time) {
    medicines.push({ name, time });
    localStorage.setItem("medicines", JSON.stringify(medicines));
    scheduleReminder(name, time);
    renderMedicines();
    alert("Medicine added successfully!");
  } else {
    alert("Please fill in both fields.");
  }
});

function markTaken(index) {
  const med = medicines[index];
  history.push({ name: med.name, time: new Date().toLocaleTimeString() });
  if ("vibrate" in navigator) navigator.vibrate(500);
  medicines.splice(index, 1);
  localStorage.setItem("medicines", JSON.stringify(medicines));
  localStorage.setItem("history", JSON.stringify(history));
  renderMedicines();
  renderHistory();
}

// 🔔 Notification + vibration reminder
function scheduleReminder(name, time) {
  const [hour, minute] = time.split(":").map(Number);
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(hour, minute, 0, 0);
  let delay = reminderTime - now;
  if (delay < 0) delay += 24 * 60 * 60 * 1000;

  setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification("Medicine Reminder", {
        body: `Time to take your ${name}`,
        icon: "icon-192.png"
      });
    }
    if ("vibrate" in navigator) navigator.vibrate([300, 200, 300]);
  }, delay);
}

if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

// 🎤 Voice command (add medicine by speaking)
const voiceBtn = document.getElementById("voiceBtn");
const medicineInput = document.getElementById("medicineName");
const timeInput = document.getElementById("medicineTime");

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  voiceBtn.addEventListener("click", () => {
    recognition.start();
    voiceBtn.textContent = "🎙️ Listening...";
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    processVoiceCommand(transcript);
    voiceBtn.textContent = "🎤";
  };

  recognition.onerror = () => {
    alert("Could not recognize voice. Try again!");
    voiceBtn.textContent = "🎤";
  };

  recognition.onend = () => {
    voiceBtn.textContent = "🎤";
  };
} else {
  voiceBtn.disabled = true;
  voiceBtn.title = "Voice recognition not supported on this device";
}

// 🧠 Voice command processing
function processVoiceCommand(text) {
  text = text.toLowerCase();
  let foundMedicine = allMedicines.find(med => text.includes(med.toLowerCase()));
  let timeMatch = text.match(/(\d{1,2})\s*(am|pm)/i);

  if (foundMedicine) medicineInput.value = foundMedicine;
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const ampm = timeMatch[2].toLowerCase();
    if (ampm === "pm" && hour < 12) hour += 12;
    const formattedTime = `${hour.toString().padStart(2, "0")}:00`;
    timeInput.value = formattedTime;
  }

  if (foundMedicine && timeMatch) {
    medicines.push({ name: foundMedicine, time: timeInput.value });
    localStorage.setItem("medicines", JSON.stringify(medicines));
    scheduleReminder(foundMedicine, timeInput.value);
    renderMedicines();
    alert(`Added ${foundMedicine} at ${timeInput.value}`);
  } else {
    alert("Voice recognized, please verify medicine or time!");
  }
}

renderMedicines();
renderHistory();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
