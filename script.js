import {initializeApp} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {getDatabase,ref,onValue,push,update,query,limitToFirst} 
from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

const app=initializeApp({
 apiKey:"YOUR_API_KEY",
 databaseURL:"YOUR_DB_URL"
});

const db=getDatabase(app);

const stockEl=document.getElementById("stock");
const buy=document.getElementById("buy");

let qty=0,price=0,orderId="",stockCount=0;

/* ALERT */
function showAlert(msg){
 const a=document.getElementById("custom-alert");
 a.innerText=msg;
 a.classList.add("show");
 setTimeout(()=>a.classList.remove("show"),2500);
}

/* TIME LOCK */
function shopClosed(){
 const h=new Date().getHours();
 return h>=22 || h<5;
}

/* LIVE STOCK */
onValue(ref(db,"stock"),snap=>{
 let c=0;
 snap.forEach(s=>{
  if(!s.val().sold) c++;
 });
 stockCount=c;
 stockEl.innerText=c;
 buy.disabled=c===0;
});

/* PRICE */
onValue(ref(db,"settings/pricePerId"),s=>{
 price=s.val()||0;
 p1.innerText="₹"+price;
 p2.innerText="₹"+price*2;
 p5.innerText="₹"+price*5;
 p10.innerText="₹"+price*10;
});

/* PICK */
window.pick=(q,e)=>{
 if(shopClosed()) return showAlert("⏰ 10PM–5AM Closed");
 if(stockCount===0) return showAlert("❌ No Stock");
 qty=q;
 document.querySelectorAll(".box").forEach(b=>b.classList.remove("active"));
 e.classList.add("active");
 buy.innerText=`Buy ₹${qty*price}`;
};

/* CUSTOM */
window.customQty=v=>{
 qty=+v;
 if(qty>0) buy.innerText=`Buy ₹${qty*price}`;
};

/* BUY */
buy.onclick=()=>{
 if(shopClosed()) return showAlert("⏰ Shop Closed");
 if(qty<=0) return showAlert("Enter Qty");
 if(qty>stockCount) return showAlert("Low Stock");

 orderId=push(ref(db,"orders"),{
  qty,status:"created",time:Date.now()
 }).key;

 select.classList.add("hide");
 payment.classList.remove("hide");
 pq.innerText=qty;
 pa.innerText=qty*price;
};

/* SUBMIT */
window.submit=()=>{
 const u=utr.value.trim();
 if(!/^\d{12}$/.test(u)) return showAlert("Invalid UTR");

 update(ref(db,"orders/"+orderId),{utr:u,status:"pending"});
 payment.classList.add("hide");
 processing.classList.remove("hide");

 /* ADMIN VERIFY SIMULATION */
 onValue(ref(db,"orders/"+orderId+"/status"),s=>{
  if(s.val()==="verified") deliverIDs();
 });
};

/* ✅ FIXED DELIVERY (ONLY QTY IDS SOLD) */
function deliverIDs(){
 const q=query(ref(db,"stock"),limitToFirst(qty));
 onValue(q,snap=>{
  let updates={},deliver={};
  let i=0;
  snap.forEach(s=>{
   if(!s.val().sold && i<qty){
    updates["stock/"+s.key+"/sold"]=true;
    deliver[s.key]=s.val();
    i++;
   }
  });
  update(ref(db),updates);
  update(ref(db,"deliveries/"+orderId),deliver);

  processing.classList.add("hide");
  success.classList.remove("hide");

  let t="";
  Object.values(deliver).forEach(v=>{
   t+=`${v.username}\n${v.password}\n\n`;
  });
  ids.innerText=t.trim();
 },{onlyOnce:true});
}

/* COPY */
window.copy=()=>navigator.clipboard.writeText(ids.innerText);
window.openWhatsApp=()=>window.open("https://wa.me/91XXXXXXXXXX");
