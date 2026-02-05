import {initializeApp} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {getDatabase,ref,onValue,push,update} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

const app=initializeApp({
 apiKey:"AIzaSyChBGm2SO7uuW9gIhpFH-MDFzWs0gp9eps",
 databaseURL:"https://database-7209-default-rtdb.firebaseio.com"
});

const db=getDatabase(app);
const stockEl=document.getElementById("stock");
const whatsappNumber="84947229295";
const upi="airtelshop09@ybl";

let qty=0,price=0,orderId="";

// Super Stylish Alert
function showAlert(msg){
    const alertBox=document.getElementById("custom-alert");
    alertBox.innerText=msg;
    alertBox.classList.add("show");
    setTimeout(()=>{alertBox.classList.remove("show");},2500);
}

// Live Stock Update
onValue(ref(db,"stock"),snapshot=>{
  const data=snapshot.val();
  stockEl.innerText=!data?0:Object.values(data).filter(id=>!id.sold).length;
});

// Price per ID
onValue(ref(db,"settings/pricePerId"),s=>{
 price=s.val()||0;
 p1.innerText="₹"+price;
 p2.innerText="₹"+price*2;
 p5.innerText="₹"+price*5;
 p10.innerText="₹"+price*10;
});

// Select Quantity
window.pick=(q,e)=>{
 qty=q;
 document.querySelectorAll(".box").forEach(b=>b.classList.remove("active"));
 e.classList.add("active");
 buy.innerText=`Buy Now - ₹${qty*price}`;
};

// Custom Quantity
window.customQty=v=>{
 qty=+v;
 document.querySelectorAll(".box").forEach(b=>b.classList.remove("active"));
 if(qty>0) buy.innerText=`Buy Now - ₹${qty*price}`;
};

// Buy Button
buy.onclick=()=>{
 if(qty<=0) return showAlert("Enter valid quantity!");
 orderId=push(ref(db,"orders"),{
  qty,amount:qty*price,status:"created",time:Date.now()
 }).key;

 select.style.display="none";
 payment.style.display="block";
 pq.innerText=qty;
 pa.innerText=qty*price;

 const amount=qty*price;
 const upiData=`upi://pay?pa=${upi}&pn=Islam%20ID%20Store&am=${amount}&cu=INR&mode=02&tn=ID%20Purchase`;
 qr.src=`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiData)}`;
};

// UTR Validation
function isValidUTR(utr){return /^\d{12}$/.test(utr);}

// Submit Payment
window.submit=()=>{
 const utrVal=utr.value.trim();
 if(!utrVal) return showAlert("Enter UTR!");
 if(!isValidUTR(utrVal)) return showAlert("Invalid UTR! Must be 12 digits.");

 update(ref(db,"orders/"+orderId),{utr:utrVal,status:"pending"});

 payment.style.display="none";
 processing.style.display="block";

 onValue(ref(db,"orders/"+orderId+"/status"),s=>{
  if(s.val()==="verified") load();
 });
};

// Load Delivered IDs
function load(){
 onValue(ref(db,"deliveries/"+orderId),snap=>{
  let t="";
  snap.forEach(c=>{
   const v=c.val();
   t+=`${v.username}\n${v.password}\n${v.phone}\n${v.email}\n\n`;
  });
  ids.innerText=t.trim();
  processing.style.display="none";
  success.style.display="block";
 },{onlyOnce:true});
}

// Copy IDs
window.copy=()=>navigator.clipboard.writeText(ids.innerText);

// Open WhatsApp
window.openWhatsApp=()=>{window.open(`https://wa.me/${whatsappNumber}?text=Hello Support 👋`,"_blank");};
