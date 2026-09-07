// หน้าเข้าสู่ระบบ
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { PolarBearMark } from "../components/polar-bear-mark";
import { PolarBearBackdrop } from "../components/polar-bear-backdrop";
import { API_AUTH_URL } from "../constants/api";
import { setSession } from "../constants/store";

// [LOGIN COLORS] สีของหน้า Login และ Register
const COLORS = {
  primary: "#00a8b1",
  primaryDark: "#0E7490",
  background: "#F0FBFF",
  text: "#0F2A37",
  muted: "#5B7C89",
  border: "#DCF2F8",
  // ธีมน้ำแข็งมีมิติ
  iceGloss: "rgba(255,255,255,0.85)",
  iceDeep: "#0E7490",
};

// [OFFLINE ACCOUNTS] บัญชีที่สมัครไว้ในเครื่องเมื่อ API ใช้งานไม่ได้
const LOCAL_ACCOUNTS_KEY = "chillcup-local-accounts";

export default function LoginScreen() {
  // [LOGIN STATE] ข้อมูลฟอร์มและสถานะการส่งข้อมูล
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerMode, setRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // [LOGIN ALERT] แสดงข้อความแจ้งเตือน Login/Register
  const showError = (message: string) => {
    if (Platform.OS === "web") alert(message);
    else Alert.alert("เข้าสู่ระบบไม่สำเร็จ", message);
  };

  // [LOGIN / REGISTER SUBMIT] ตรวจสอบและส่งข้อมูลบัญชี
  const submitAuth = async () => {
    if (!username.trim() || !password || (registerMode && (!email.trim() || password !== confirmPassword))) {
      showError(registerMode ? "กรุณากรอกข้อมูลให้ครบ และตรวจสอบรหัสผ่านอีกครั้ง" : "กรุณากรอก Username และ Password");
      return;
    }

    setLoading(true);
    try {
      // [DEMO LOGIN] บัญชีทดลอง user/user และ admin/admin
      const demoUsername = username.trim().toLowerCase();
      const savedDemoPassword = typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(`chillcup-password-${demoUsername}`) || demoUsername
        : demoUsername;
      if (!registerMode && (demoUsername === "admin" || demoUsername === "user") && password === savedDemoPassword) {
        const demoUser = demoUsername === "admin"
          ? { id: 0, username: "admin", email: "admin@gmail.com", name: "Administrator", role: "admin" }
          : { id: 1, username: "user", email: "user@gmail.com", name: "Demo Customer", role: "user" };
        setSession(demoUser, "demo-session");
        if (Platform.OS === "web") sessionStorage.setItem("chillcup-web-access", "granted");
        router.replace("/");
        return;
      }
      if (registerMode) {
        if (typeof sessionStorage !== "undefined") {
          const savedAccounts = JSON.parse(sessionStorage.getItem(LOCAL_ACCOUNTS_KEY) || "[]") as Array<{ username: string; email: string; password: string }>;
          const cleanUsername = username.trim().toLowerCase();
          const existingAccount = savedAccounts.find((account) => account.username === cleanUsername);
          if (existingAccount) throw new Error("Username นี้ถูกใช้งานแล้ว");
          savedAccounts.push({ username: cleanUsername, email: email.trim(), password });
          sessionStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(savedAccounts));
          sessionStorage.setItem(`chillcup-password-${username.trim()}`, password);
          sessionStorage.setItem("chillcup-web-access", "granted");
        }
        setSession({ id: Date.now(), username: username.trim(), name: username.trim(), email: email.trim(), role: "user" }, "local-session");
        router.replace("/");
        return;
      }
      // [AUTH API] เชื่อมต่อ Backend สำหรับ Login หรือ Register จริง
      const response = await fetch(`${API_AUTH_URL}/${registerMode ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerMode
          ? { username: username.trim(), email: email.trim(), password, name: username.trim() }
          : { username: username.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `เกิดข้อผิดพลาด (${response.status})`);
      if (registerMode) {
        setRegisterMode(false);
        setPassword("");
        setConfirmPassword("");
        showError("สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ");
        return;
      }
      if (data.user) setSession(data.user, data.token || "");
      if (Platform.OS === "web") sessionStorage.setItem("chillcup-web-access", "granted");
      router.replace("/");
    } catch (error) {
      // [OFFLINE LOGIN FALLBACK] Login บัญชีที่สมัครในเครื่องได้เมื่อ API ล่ม
      if (typeof sessionStorage !== "undefined") {
        const savedAccounts = JSON.parse(sessionStorage.getItem(LOCAL_ACCOUNTS_KEY) || "[]") as Array<{ username: string; email: string; password: string }>;
        const cleanUsername = username.trim().toLowerCase();
        const localAccount = savedAccounts.find((account) => account.username === cleanUsername);
        if (localAccount && localAccount.password === password) {
          setSession({ id: Date.now(), username: localAccount.username, name: localAccount.username, email: localAccount.email, role: "user" }, "local-session");
          sessionStorage.setItem("chillcup-web-access", "granted");
          router.replace("/");
          return;
        }
      }
      showError(error instanceof Error ? error.message : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ฉากหลังอยู่ในหน้านี้โดยตรง จึงอยู่หลังฟอร์มและไม่ถูก Stack บนเว็บกลบ */}
      <PolarBearBackdrop />
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.logo}>
          <PolarBearMark size="large" />
        </View>
        <Text style={styles.kicker}>{registerMode ? "JOIN CHILLCUP" : "WELCOME BACK"}</Text>
        <Text style={styles.title}>{registerMode ? "สมัครบัญชีลูกค้า" : "เข้าสู่ระบบ ChillCup"}</Text>
        <Text style={styles.subtitle}>ขอต้อนรับสู่ ChillCup</Text>

        <View style={styles.form}>
          {/* [DEMO ACCOUNTS] ปุ่มกรอกบัญชีทดลอง */}
          {!registerMode && <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>บัญชีทดลอง</Text>
            <View style={styles.demoRow}>
              <Pressable style={styles.demoButton} onPress={() => { setUsername("user"); setPassword("user"); }}><Text style={styles.demoButtonText}>ลูกค้า: user / user</Text></Pressable>
              <Pressable style={styles.demoButton} onPress={() => { setUsername("admin"); setPassword("admin"); }}><Text style={styles.demoButtonText}>Admin: admin / admin</Text></Pressable>
            </View>
          </View>}
          {/* [USERNAME INPUT] ช่อง Username */}
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={19} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="กรอกชื่อผู้ใช้"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* [EMAIL INPUT] ช่อง Email เฉพาะตอนสมัครสมาชิก */}
          {registerMode && <>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}><Ionicons name="mail-outline" size={19} color={COLORS.muted} /><TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="อีเมลของคุณ" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" /></View>
          </>}

          {/* [PASSWORD INPUT] ช่อง Password และยืนยัน Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={19} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="กรอกรหัสผ่าน"
              placeholderTextColor="#94A3B8"
              secureTextEntry
            />

            {registerMode && <>
              <Text style={styles.label}>ยืนยัน Password</Text>
              <View style={styles.inputWrap}><Ionicons name="lock-closed-outline" size={19} color={COLORS.muted} /><TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="กรอกรหัสผ่านอีกครั้ง" placeholderTextColor="#94A3B8" secureTextEntry /></View>
            </>}
          </View>

          {/* [SUBMIT BUTTON] ปุ่มเข้าสู่ระบบหรือสมัครสมาชิก */}
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={submitAuth}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{registerMode ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</Text>}
            {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
          </Pressable>

          {/* [SWITCH AUTH MODE] สลับ Login กับ Register */}
          <Pressable onPress={() => { setRegisterMode(!registerMode); setPassword(""); setConfirmPassword(""); }} style={styles.switchButton}>
            <Text style={styles.guestText}>{registerMode ? "มีบัญชีแล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครลูกค้าใหม่"}</Text>
          </Pressable>

          {/* [GUEST ACCESS] เข้าดูสินค้าโดยไม่ Login */}
          <Pressable
            onPress={() => {
              if (Platform.OS === "web") sessionStorage.setItem("chillcup-web-access", "granted");
              router.replace("/");
            }}
            style={styles.guestButton}
          >
            <Text style={styles.guestText}>เข้าสู่หน้าสินค้าโดยไม่เข้าสู่ระบบ</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// [LOGIN STYLES] รูปแบบหน้าจอ Login/Register
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "rgba(240, 251, 255, 0.9)" }, // โปร่งแสงให้เห็น PolarBearBackdrop
  content: { flex: 1, width: "100%", maxWidth: 480, alignSelf: "center", justifyContent: "center", padding: 28 },
  logo: { width: 72, height: 72, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center", marginBottom: 24, shadowColor: COLORS.primary, shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5, borderWidth: 3, borderColor: COLORS.iceGloss },
  kicker: { color: COLORS.primaryDark, fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  title: { color: COLORS.text, fontSize: 30, fontWeight: "800", marginTop: 8 },
  subtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 28 },
  form: { backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 20, padding: 20, borderWidth: 2, borderColor: COLORS.iceGloss, shadowColor: "#0E7490", shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 5 }, // กล่องแบบก้อนน้ำแข็งมีมิติ
  label: { color: COLORS.text, fontSize: 13, fontWeight: "700", marginBottom: 7, marginTop: 10 },
  inputWrap: { height: 48, borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, backgroundColor: "#FAFEFF" },
  input: { flex: 1, color: COLORS.text, fontSize: 15, marginLeft: 9 },
  button: { height: 50, marginTop: 25, borderRadius: 11, backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  buttonPressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  guestButton: { alignItems: "center", marginTop: 18, padding: 4 },
  switchButton: { alignItems: "center", marginTop: 12, padding: 4 },
  guestText: { color: COLORS.primaryDark, fontSize: 13, fontWeight: "700" },
  demoBox: { backgroundColor: "#E8FAFC", borderRadius: 11, padding: 10, marginBottom: 10 },
  demoTitle: { color: COLORS.primaryDark, fontSize: 12, fontWeight: "800", marginBottom: 7 },
  demoRow: { flexDirection: "row", gap: 7 },
  demoButton: { flex: 1, borderRadius: 8, backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 5, alignItems: "center" },
  demoButtonText: { color: COLORS.primaryDark, fontSize: 10, fontWeight: "700", textAlign: "center" },
});
