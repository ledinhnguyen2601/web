import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. XỬ LÝ ĐĂNG KÝ
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("reg-email").value;
      const password = document.getElementById("reg-password").value;
      const building = document.getElementById("reg-building").value; // Mã: 'hoasen' hoặc 'binhdan'
      const room = document.getElementById("reg-room").value;
      const name = document.getElementById("reg-name").value;
      const btn = document.getElementById("btnRegSubmit");

      try {
        btn.innerText = "Đang xử lý...";
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email,
          name: name,
          building: building,
          room: room,
          role: "tenant",
          status: "pending",
        });
        await signOut(auth); // Đăng xuất để tránh lọt vào hệ thống
        alert("Đăng ký thành công! Vui lòng chờ BQL/Chủ trọ phê duyệt.");

        // Trượt về form đăng nhập
        document.getElementById("form-register").style.display = "none";
        document.getElementById("form-login").style.display = "block";
        btn.innerText = "Gửi Đăng Ký (Cần duyệt)";
      } catch (error) {
        alert("Lỗi đăng ký: " + error.message);
        btn.innerText = "Gửi Đăng Ký (Cần duyệt)";
      }
    });
  }

  // 2. XỬ LÝ ĐĂNG NHẬP & PHÂN LUỒNG CHUẨN XÁC
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      const btn = document.getElementById("btnLoginSubmit");

      try {
        btn.innerText = "Đang kiểm tra...";
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();

          // Chặn nếu chưa duyệt
          if (data.status === "pending") {
            await signOut(auth);
            alert("Tài khoản chưa được duyệt. Vui lòng chờ Chủ trọ / BQL.");
            btn.innerText = "Đăng nhập";
            return;
          }

          // CHIA ĐƯỜNG ĐÚNG CHO TỪNG ROLE VÀ BUILDING
          if (data.role === "admin_motel") {
            window.location.href = "admin-motel.html";
          } else if (data.role === "admin_apartment") {
            window.location.href = "admin-apartment.html";
          } else if (data.role === "tenant") {
            // FIX LỖI Ở ĐÂY: Khớp chuẩn với ID 'hoasen' trên Form HTML
            if (data.building === "hoasen") {
              window.location.href = "tenant-apartment.html";
            } else {
              window.location.href = "tenant-motel.html";
            }
          }
        } else {
          alert("Lỗi: Không tìm thấy dữ liệu cấp quyền của tài khoản này!");
          btn.innerText = "Đăng nhập";
        }
      } catch (error) {
        alert("Sai tài khoản email hoặc mật khẩu!");
        btn.innerText = "Đăng nhập";
      }
    });
  }

  // 3. QUÊN MẬT KHẨU
  const forgotForm = document.getElementById("forgotForm");
  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("reset-email").value;
      try {
        await sendPasswordResetEmail(auth, email);
        alert(
          "Đã gửi link khôi phục vào Email của bạn! Vui lòng kiểm tra Hộp thư đến hoặc Spam.",
        );
      } catch (error) {
        alert("Không tìm thấy Email này trong hệ thống.");
      }
    });
  }

  // 4. ĐĂNG XUẤT
  document.querySelectorAll(".logout-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      signOut(auth).then(() => {
        window.location.href = "index.html";
      });
    });
  });
});
