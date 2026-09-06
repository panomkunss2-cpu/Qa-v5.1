const KEY="expiry-tracker-v5";
let products=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem("expiry-tracker-v1")||"[]");
let currentImage="", currentProductId="", stream=null, scanTimer=null;

const $=id=>document.getElementById(id);
const stores=["พื้นที่ขาย","Store หลังร้าน","ตู้แช่ วอลล์"];
const categories=["น้ำดื่มทั่วไป","เบียร์","กาแฟ","นม","ขนมหนม","ของใช้ในครัว","มาม่า ซอง/กระป๋อง","อาหารแช่แข็ง"];

function save(){localStorage.setItem(KEY,JSON.stringify(products));renderAll()}
function today(){return new Date().toISOString().slice(0,10)}
function daysUntil(s){const a=new Date();a.setHours(0,0,0,0);const b=new Date(s+"T00:00:00");return Math.ceil((b-a)/86400000)}
function monthsUntil(s){const d=daysUntil(s);return d<0?-1:Math.ceil(d/30.4375)}
function status(p){const m=monthsUntil(p.expiry);if(m<0)return["หมดอายุแล้ว","expired"];if(m<=1)return["หมดอายุภายใน 1 เดือน","danger"];if(m<=2)return["หมดอายุภายใน 2 เดือน","warn"];if(m<=3)return["หมดอายุภายใน 3 เดือน","warn"];return["ปกติ","ok"]}
function fmt(s){return new Date(s+"T00:00:00").toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"numeric"})}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
function showPage(id){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.page===id));document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));renderAll()}

function renderAll(){renderDashboard();renderAlerts();if(currentProductId)renderCheck(currentProductId)}
function renderDashboard(){
 $("totalCount").textContent=products.length;
 $("expiredCount").textContent=products.filter(p=>monthsUntil(p.expiry)<0).length;
 $("photoCount").textContent=products.filter(p=>p.image).length;
 $("storeStats").innerHTML=stores.map(s=>{const n=products.filter(p=>(p.store||"พื้นที่ขาย")===s).length;return `<div class="stat"><span>${s}</span><strong>${n}</strong></div>`}).join("");
 $("categoryStats").innerHTML=categories.map(s=>{const n=products.filter(p=>(p.category||"น้ำดื่มทั่วไป")===s).length;return `<div class="stat"><span>${s}</span><strong>${n}</strong></div>`}).join("");
}
function alertCard(p){
 const [txt,cls]=status(p);
 return `<article class="product" data-id="${p.id}">
 ${p.image?`<div class="product-image"><img src="${p.image}" alt=""></div>`:`<div class="product-image placeholder">📦</div>`}
 <div class="product-main"><h3>${esc(p.name)}</h3><div class="meta">${esc(p.barcode||"ไม่มี Barcode")} · ${esc(p.store||"พื้นที่ขาย")}</div><div class="meta">${esc(p.category||"น้ำดื่มทั่วไป")} · หมดอายุ ${fmt(p.expiry)}</div><span class="badge ${cls}">${txt}</span></div><div>›</div></article>`
}
function renderAlerts(){
 const vals=[1,2,3].map(n=>products.filter(p=>{const m=monthsUntil(p.expiry);return m>=0&&m<=n}).length);
 $("oneCount").textContent=vals[0];$("twoCount").textContent=vals[1];$("threeCount").textContent=vals[2];
 const q=$("alertSearch").value.trim().toLowerCase();
 const list=products.filter(p=>{const m=monthsUntil(p.expiry);return m>=0&&m<=3&&(p.name.toLowerCase().includes(q)||(p.barcode||"").includes(q)||(p.category||"").toLowerCase().includes(q))}).sort((a,b)=>a.expiry.localeCompare(b.expiry));
 $("alertList").innerHTML=list.length?list.map(alertCard).join(""):`<div class="empty"><strong>ยังไม่มีสินค้าใกล้หมดอายุ</strong><span>รายการที่เหลือไม่เกิน 3 เดือนจะแสดงตรงนี้</span></div>`;
 document.querySelectorAll("#alertList .product").forEach(e=>e.onclick=()=>edit(e.dataset.id));
}
$("alertSearch").oninput=renderAlerts;

function renderCheck(id){
 const p=products.find(x=>x.id===id);
 if(!p){$("checkCard").innerHTML="";$("checkEmpty").classList.remove("hidden");return}
 $("checkEmpty").classList.add("hidden");
 const [txt,cls]=status(p);
 $("checkCard").innerHTML=`<article class="detail-card">
 ${p.image?`<img class="detail-image" src="${p.image}" alt="${esc(p.name)}">`:`<div class="detail-image placeholder">📦</div>`}
 <div class="detail-body"><span class="badge ${cls}">${txt}</span><h2>${esc(p.name)}</h2>
 <div class="detail-grid"><span>Barcode</span><strong>${esc(p.barcode||"-")}</strong><span>พื้นที่</span><strong>${esc(p.store||"พื้นที่ขาย")}</strong><span>หมวด</span><strong>${esc(p.category||"น้ำดื่มทั่วไป")}</strong><span>อายุสินค้า</span><strong>${p.shelfLife?p.shelfLife+" วัน":"-"}</strong><span>วันที่เริ่มนับ</span><strong>${p.startDate?fmt(p.startDate):"-"}</strong><span>วันหมดอายุ</span><strong>${fmt(p.expiry)}</strong><span>จำนวน</span><strong>${p.quantity||0} ชิ้น</strong></div>
 ${p.note?`<p class="note">${esc(p.note)}</p>`:""}<button class="primary full" onclick="edit('${p.id}')">แก้ไขรายการ</button></div></article>`
}
function openNew(){
 currentProductId="";$("productForm").reset();$("productId").value="";$("quantity").value=1;$("startDate").value=today();setPreview("");$("modalTitle").textContent="บันทึกสินค้าใหม่";$("deleteBtn").classList.add("hidden");$("modal").classList.remove("hidden")
}
function edit(id){
 const p=products.find(x=>x.id===id);if(!p)return;currentProductId=id;
 $("productId").value=p.id;$("barcode").value=p.barcode||"";$("name").value=p.name;$("store").value=p.store||"พื้นที่ขาย";$("category").value=p.category||"น้ำดื่มทั่วไป";$("shelfLife").value=p.shelfLife||"";$("quantity").value=p.quantity||1;$("startDate").value=p.startDate||"";$("expiry").value=p.expiry;$("note").value=p.note||"";setPreview(p.image||"");$("modalTitle").textContent="แก้ไขสินค้า";$("deleteBtn").classList.remove("hidden");$("modal").classList.remove("hidden")
}
function setPreview(src){currentImage=src||"";$("imagePreview").innerHTML=src?`<img src="${src}" alt="รูปสินค้า">`:"<span>📦</span>";$("removeImage").classList.toggle("hidden",!src)}
function close(){ $("modal").classList.add("hidden") }

$("productForm").onsubmit=e=>{
 e.preventDefault();
 const id=$("productId").value, item={id:id||crypto.randomUUID(),barcode:$("barcode").value.trim(),name:$("name").value.trim(),store:$("store").value,category:$("category").value,shelfLife:Number($("shelfLife").value||0),quantity:Number($("quantity").value||0),startDate:$("startDate").value,expiry:$("expiry").value,note:$("note").value.trim(),image:currentImage};
 if(!item.name||!item.expiry){toast("กรุณากรอกชื่อและวันหมดอายุ");return}
 if(id)products=products.map(p=>p.id===id?item:p);else products.push(item);
 currentProductId=item.id;save();close();showPage("checkPage");toast(id?"แก้ไขสินค้าแล้ว":"บันทึกสินค้าแล้ว")
}
$("deleteBtn").onclick=()=>{const id=$("productId").value;if(id&&confirm("ต้องการลบสินค้านี้ใช่ไหม?")){products=products.filter(p=>p.id!==id);currentProductId="";save();close();toast("ลบสินค้าแล้ว")}}
$("calcExpiry").onclick=()=>{
 const start=$("startDate").value, life=Number($("shelfLife").value);
 if(!start||!life){toast("กรุณาใส่วันที่เริ่มนับและอายุสินค้า");return}
 const d=new Date(start+"T00:00:00");d.setDate(d.getDate()+life);$("expiry").value=d.toISOString().slice(0,10);toast("คำนวณวันหมดอายุแล้ว")
}
$("image").onchange=e=>{
 const f=e.target.files[0];if(!f)return;if(f.size>6*1024*1024){toast("รูปใหญ่เกิน 6MB");return}
 const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const max=1000,sc=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext("2d").drawImage(im,0,0,c.width,c.height);setPreview(c.toDataURL("image/jpeg",.8))};im.src=r.result};r.readAsDataURL(f)
}
$("removeImage").onclick=()=>{setPreview("");$("image").value=""}
$("newProduct").onclick=openNew;$("addFab").onclick=openNew;$("addTop").onclick=openNew;$("closeModal").onclick=close;$("closeBackdrop").onclick=close;

function showScanResult(p,msg){
 $("scanResult").classList.remove("hidden");
 $("scanResult").innerHTML=p?`<strong>พบสินค้า</strong><span>${esc(p.name)}</span><small>${esc(p.barcode||"")} · ${esc(p.category||"น้ำดื่มทั่วไป")}</small><button class="primary" id="useFound">เปิดรายการ</button>`:`<strong>ยังไม่พบสินค้า</strong><span>${esc(msg||"สร้างรายการใหม่ได้เลย")}</span><button class="primary" id="createFound">สร้างรายการนี้</button>`;
 if(p)$("useFound").onclick=()=>{edit(p.id);showPage("checkPage")};
 else $("createFound").onclick=()=>{openNew();$("barcode").value=$("barcodeInput").value.trim()}
}
$("findBarcode").onclick=()=>findBarcode($("barcodeInput").value.trim());
$("barcodeInput").onkeydown=e=>{if(e.key==="Enter")findBarcode(e.target.value.trim())}
function findBarcode(code){if(!code){toast("กรุณาใส่ Barcode");return}const p=products.find(x=>x.barcode===code);showScanResult(p,`Barcode ${code} ยังไม่มีในระบบ`)}
document.addEventListener("click",e=>{const el=e.target.closest("#alertList .product");if(el)edit(el.dataset.id)});

async function startCamera(){
 if(!navigator.mediaDevices?.getUserMedia){toast("เบราว์เซอร์นี้ไม่รองรับกล้อง");return}
 stopCamera();
 try{
  $("cameraMessage").textContent="กำลังเปิดกล้อง…";
  if(window.ZXingBrowser?.BrowserMultiFormatReader){
    const reader=new ZXingBrowser.BrowserMultiFormatReader();
    window.__zxingReader=reader;
    const controls=await reader.decodeFromConstraints(
      {video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}},
      $("camera"),
      (result,error)=>{
        if(result){
          const code=result.getText();
          $("barcodeInput").value=code;
          findBarcode(code);
          stopCamera();
        }
      }
    );
    window.__zxingControls=controls;
    $("cameraMessage").textContent="กำลังสแกน Barcode… วาง Barcode ให้อยู่ในกรอบ";
    return;
  }
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}});
  $("camera").srcObject=stream;await $("camera").play();
  $("cameraMessage").textContent="กล้องเปิดแล้ว แต่ตัวอ่าน Barcode ยังโหลดไม่สำเร็จ กรุณารีเฟรชหน้า";
 }catch(e){
  console.error(e);
  $("cameraMessage").textContent="เปิดกล้องไม่ได้ กรุณาอนุญาต Camera และเปิดเว็บผ่าน HTTPS";
  toast("ไม่สามารถเปิดกล้องได้");
 }
}
function stopCamera(){if(scanTimer){clearInterval(scanTimer);scanTimer=null}if(window.__zxingControls){try{window.__zxingControls.stop()}catch(_e){}window.__zxingControls=null}if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}$("camera").srcObject=null;$("cameraMessage").textContent="กด “เปิดกล้อง” แล้วหันกล้องไปที่ Barcode"}
$("startScan").onclick=startCamera;$("stopScan").onclick=stopCamera;
window.addEventListener("beforeunload",stopCamera);
renderAll();