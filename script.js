import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getDatabase, ref, onValue, push, update } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

/* 🔥 FIREBASE */
const app = initializeApp({
  apiKey: "AIzaSyChBGm2SO7uuW9gIhpFH-MDFzWs0gp9eps",
  databaseURL: "https://database-7209-default-rtdb.firebaseio.com"
});
const db = getDatabase(app);

/* 🎯 ELEMENTS */
const stockEl = document.getElementById("stock");
const buy = document.getElementById("buy");
const whatsappNumber = "84947229295";
const upi = "airtelshop09@ybl";

let qty = 0, price = 0, orderId = "", stockCount = 0;

/* 🔔 POPUP */
function showAlert(msg){
  const box = document.getElementById("custom-alert");
  box.innerText = msg;
  box.classList.add("show");
  setTimeout(()=>box.classList.remove("show"),2500);
}

/* ⏰ SHOP CLOSED (10PM–5AM) */
function shopClosed(){
  const h = new Date().getHours();
  return h >= 22 || h < 5;
}

/* 📦 LIVE STOCK */
onValue(ref(db,"stock"),snap=>{
  const data = snap.val();
  stockCount = data ? Object.values(data).filter(i=>!i.sold).length : 0;
  stockEl.innerText = stockCount;

  buy.disabled = stockCount === 0;
});

/* 💰 PRICE */
onValue(ref(db,"settings/pricePerId"),s=>{
  price = s.val() || 0;
  p1.innerText = "₹"+price;
  p2.innerText = "₹"+price*2;
  p5.innerText = "₹"+price*5;
  p10.innerText = "₹"+price*10;
});

/* 📌 PICK QTY */
window.pick = (q,e)=>{
  if(stockCount===0) return showAlert("❌ Stock Empty");
  if(shopClosed()) return showAlert("⏰ Shop closed (10PM–5AM)");

  qty = q;
  document.querySelectorAll(".box").forEach(b=>b.classList.remove("active"));
  e.classList.add("active");
  buy.innerText = `Buy Now - ₹${qty*price}`;
};

/* ✍️ CUSTOM QTY */
window.customQty = v=>{
  qty = +v;
  if(qty>0) buy.innerText = `Buy Now - ₹${qty*price}`;
};

/* 🛒 BUY */
buy.onclick = ()=>{
  if(stockCount===0) return showAlert("❌ Stock Empty");
  if(shopClosed()) return showAlert("⏰ Shop closed (10PM–5AM)");
  if(qty<=0) return showAlert("Enter valid quantity");
  if(qty>stockCount) return showAlert("❌ Not enough stock");

  orderId = push(ref(db,"orders"),{
    qty,
    amount: qty*price,
    status: "created",
    time: Date.now()
  }).key;

  select.style.display="none";
  payment.style.display="block";
  pq.innerText = qty;
  pa.innerText = qty*price;

  const upiData = `upi://pay?pa=${upi}&pn=ID%20Store&am=${qty*price}&cu=INR`;
  qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiData)}`;
};

/* ✅ UTR */
function isValidUTR(u){ return /^\d{12}$/.test(u); }

/* 📤 SUBMIT */
window.submit = ()=>{
  const u = utr.value.trim();
  if(!u) return showAlert("Enter UTR");
  if(!isValidUTR(u)) return showAlert("Invalid UTR");

  update(ref(db,"orders/"+orderId),{
    utr: u,
    status: "pending"
  });

  payment.style.display="none";
  processing.style.display="block";

  onValue(ref(db,"orders/"+orderId+"/status"),s=>{
    if(s.val()==="verified") load();
  });
};

/* 📥 LOAD IDS + 🎁 GIFT */
function load(){
  onValue(ref(db,"deliveries/"+orderId),snap=>{
    let t="";
    snap.forEach(c=>{
      const v=c.val();
      t+=`${v.username}\n${v.password}\n${v.phone}\n${v.email}\n\n`;
    });

    ids.innerText = t.trim();
    processing.style.display="none";
    success.style.display="block";

    /* 🎁 GIFT ANIMATION */
    playGiftAnimation();

  },{onlyOnce:true});
}

/* 📋 COPY */
window.copy = ()=>navigator.clipboard.writeText(ids.innerText);

/* 📞 WHATSAPP */
window.openWhatsApp = ()=>{
  window.open(`https://wa.me/${whatsappNumber}?text=Hello Support 👋`,"_blank");
};

/* 🎁 GIFT + 🎆 CONFETTI */
window.playGiftAnimation = ()=>{
  const wrapper = document.getElementById("gift-wrapper");
  const box = document.getElementById("gift-box");

  wrapper.style.display="flex";
  box.classList.add("open");

  for(let i=0;i<40;i++){
    const c=document.createElement("div");
    c.className="confetti";
    c.style.background=`hsl(${Math.random()*360},90%,60%)`;
    c.style.left="70px";
    c.style.top="70px";
    c.style.setProperty("--x",(Math.random()*300-150)+"px");
    c.style.setProperty("--y",(Math.random()*-250)+"px");
    box.appendChild(c);
    setTimeout(()=>c.remove(),1800);
  }

  setTimeout(()=>{
    wrapper.style.display="none";
    ids.style.display="block";
  },1400);
};
