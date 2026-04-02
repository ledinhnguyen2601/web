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
  // XỬ LÝ ĐĂNG KÝ (Mặc định ở trạng thái Chờ duyệt)
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("reg-email").value;
      const password = document.getElementById("reg-password").value;
      const building = document.getElementById("reg-building").value;
      const room = document.getElementById("reg-room").value;

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email,
          building: building,
          room: room,
          role: "tenant",
          status: "pending",
        });
        await signOut(auth); // Đăng xuất ngay lập tức
        alert(
          "Đăng ký thành công! Vui lòng chờ Chủ trọ / BQL phê duyệt để đăng nhập.",
        );
        document.getElementById("form-register").style.display = "none";
        document.getElementById("form-login").style.display = "block";
      } catch (error) {
        alert("Lỗi đăng ký: " + error.message);
      }
    });
  }

  // XỬ LÝ ĐĂNG NHẬP
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.status === "pending") {
            await signOut(auth);
            alert("Tài khoản chưa được duyệt. Vui lòng liên hệ Admin.");
            return;
          }
          // Chuyển trang theo Role
          if (data.role === "admin_motel")
            window.location.href = "admin-motel.html";
          else if (data.role === "admin_apartment")
            window.location.href = "admin-apartment.html";
          else if (data.role === "tenant") {
            if (data.building === "chungcu")
              window.location.href = "tenant-apartment.html";
            else window.location.href = "tenant-motel.html";
          }
        }
      } catch (error) {
        alert("Sai email hoặc mật khẩu!");
      }
    });
  }

  // QUÊN MẬT KHẨU
  const forgotForm = document.getElementById("forgotForm");
  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("reset-email").value;
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Đã gửi link khôi phục vào Email của bạn!");
      } catch (error) {
        alert("Không tìm thấy Email này.");
      }
    });
  }

  // ĐĂNG XUẤT
  document.querySelectorAll(".logout-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      signOut(auth).then(() => {
        window.location.href = "index.html";
      });
    });
  });
});
