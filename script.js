import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  push,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

/* 🔥 FIREBASE */
const app = initializeApp({
  apiKey: "AIzaSyChBGm2SO7uuW9gIhpFH-MDFzWs0gp9eps",
  databaseURL: "https://database-7209-default-rtdb.firebaseio.com"
});
const db = getDatabase(app);

/* 🔗 DOM */
const stockEl = document.getElementById("stock");
const buyBtn = document.getElementById("buy");

/* ⚙️ CONFIG */
const upi = "airtelshop09@ibl";
const whatsappNumber = "918235060891";

/* 🧠 STATE */
let qty = 0;
let price = 0;
let orderId = "";
let stockCount = 0;
let shopOpen = true;

/* 🔔 POPUP */
function showAlert(msg) {
  const box = document.getElementById("custom-alert");
  box.innerText = msg;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 2500);
}

/* 🕒 TIME CHECK (fallback) */
function timeClosed() {
  const h = new Date().getHours();
  return h >= 0 && h < 6;
}

/* 🏪 SHOP OPEN / CLOSE (ADMIN CONTROL) */
onValue(ref(db, "settings/shopOpen"), s => {
  if (s.exists()) shopOpen = s.val();
});

/* 📦 LIVE STOCK */
onValue(ref(db, "stock"), snap => {
  let c = 0;
  snap.forEach(x => {
    if (!x.val().sold) c++;
  });
  stockCount = c;
  stockEl.innerText = c;
  buyBtn.disabled = c === 0;
});

/* 💰 PRICE */
onValue(ref(db, "settings/pricePerId"), s => {
  price = s.val() || 0;
  p1.innerText = "₹" + price;
  p2.innerText = "₹" + price * 2;
  p5.innerText = "₹" + price * 5;
  p10.innerText = "₹" + price * 10;
});

/* 📌 PICK QTY */
window.pick = (q, el) => {
  if (!shopOpen || timeClosed())
    return showAlert("⏰ Shop Closed");

  if (stockCount === 0)
    return showAlert("❌ Stock Empty");

  qty = q;
  document.querySelectorAll(".box").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  buyBtn.innerText = `Buy Now ₹${qty * price}`;
};

/* ✍️ CUSTOM QTY */
window.customQty = v => {
  qty = +v;
  if (qty > 0)
    buyBtn.innerText = `Buy Now ₹${qty * price}`;
};

/* 🛒 BUY */
buyBtn.onclick = () => {
  if (!shopOpen || timeClosed())
    return showAlert("⏰ Shop Closed");

  if (qty <= 0)
    return showAlert("Select Quantity");

  if (qty > stockCount)
    return showAlert("❌ Not enough stock");

  orderId = push(ref(db, "orders"), {
    qty,
    amount: qty * price,
    status: "created",
    time: Date.now()
  }).key;

  select.style.display = "none";
  payment.style.display = "block";

  pq.innerText = qty;
  pa.innerText = qty * price;

  const upiData =
    `upi://pay?pa=${upi}&pn=ID%20Store&am=${qty * price}&cu=INR`;
  qr.src =
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiData)}`;
};

/* ✅ UTR VALIDATION */
function validUTR(u) {
  return /^\d{12}$/.test(u);
}

/* 📤 SUBMIT PAYMENT */
window.submit = () => {
  const u = utr.value.trim();
  if (!u) return showAlert("Enter UTR");
  if (!validUTR(u)) return showAlert("Invalid UTR");

  update(ref(db, "orders/" + orderId), {
    utr: u,
    status: "pending"
  });

  payment.style.display = "none";
  processing.style.display = "block";

  /* ✅ VERIFIED */
  onValue(ref(db, "orders/" + orderId + "/status"), s => {
    if (s.val() === "verified") loadIDs();
  });

  /* ❌ REJECTED BY ADMIN */
  onValue(ref(db, "rejected/" + orderId), r => {
    if (r.exists()) {
      processing.style.display = "none";
      select.style.display = "block";
      showAlert("❌ YOUR PAYMENT NOT MATCH");
      remove(ref(db, "rejected/" + orderId));
    }
  });
};

/* 📥 LOAD IDS */
function loadIDs() {
  onValue(
    ref(db, "deliveries/" + orderId),
    snap => {
      let txt = "";
      snap.forEach(c => {
        const v = c.val();
        txt +=
          `${v.username}\n${v.password}\n${v.phone}\n${v.email}\n\n`;
      });
      ids.innerText = txt.trim();
      processing.style.display = "none";
      success.style.display = "block";
    },
    { onlyOnce: true }
  );
}

/* 📋 COPY */
window.copy = () =>
  navigator.clipboard.writeText(ids.innerText);

/* 📞 WHATSAPP */
window.openWhatsApp = () => {
  window.open(
    `https://wa.me/${whatsappNumber}?text=Hello Support 👋`,
    "_blank"
  );
};
