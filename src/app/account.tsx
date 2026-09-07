// หน้าจัดการบัญชี
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { API_AUTH_URL } from "../constants/api";
import { clearSession, getSession, updateSessionUser } from "../constants/store";

// [ACCOUNT] หน้าจัดการโปรไฟล์และความปลอดภัยของบัญชี
const COLORS = { bg: "rgba(244, 251, 253, 0.88)", white: "#FFFFFF", primary: "#00A8B1", deep: "#0E7490", ink: "#0F2A37", muted: "#63818D", line: "#CBEAF0", ice: "#E8FAFC", danger: "#EF476F" };

export default function AccountScreen() {
  // [ACCOUNT STATE] ข้อมูลโปรไฟล์และรหัสผ่าน
  const session = getSession();
  const [name, setName] = useState(session?.user.name || "");
  const [email, setEmail] = useState(session?.user.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // [ACCOUNT ALERT] แจ้งผลการทำงานของบัญชี
  const notify = (title: string, message: string) => Platform.OS === "web" ? alert(`${title}: ${message}`) : Alert.alert(title, message);
  // [SAVE PROFILE] บันทึกชื่อและอีเมล
  const saveProfile = () => {
    if (!name.trim() || !email.trim()) { notify("ข้อมูลไม่ครบ", "กรุณากรอกชื่อและอีเมล"); return; }
    updateSessionUser({ name: name.trim(), email: email.trim() });
    notify("บันทึกสำเร็จ", "อัปเดตข้อมูลบัญชีแล้ว");
  };
  // [CHANGE PASSWORD] เปลี่ยนรหัสผ่าน
  const savePassword = async () => {
    if (!currentPassword || newPassword.length < 6 || newPassword !== confirmPassword) {
      notify("เปลี่ยนรหัสผ่านไม่สำเร็จ", "กรุณากรอกรหัสเดิม รหัสใหม่อย่างน้อย 6 ตัว และยืนยันรหัสให้ตรงกัน");
      return;
    }

    try {
      const activeSession = getSession();
      if (!activeSession) return;

      if (activeSession.token === "demo-session" || activeSession.token === "local-session") {
        const savedPassword = typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem(`chillcup-password-${activeSession.user.username}`) || activeSession.user.username
          : activeSession.user.username;
        if (currentPassword !== savedPassword) throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(`chillcup-password-${activeSession.user.username}`, newPassword);
        }
      } else {
        const response = await fetch(`${API_AUTH_URL}/account/password`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${activeSession.token}` },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
      }

      notify("เปลี่ยนรหัสผ่านสำเร็จ", "รหัสผ่านใหม่ถูกบันทึกแล้ว");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error) {
      notify("เปลี่ยนรหัสผ่านไม่สำเร็จ", error instanceof Error ? error.message : "ไม่สามารถเปลี่ยนรหัสผ่านได้");
    }
  };
  // [ACCOUNT LOGOUT] ออกจากระบบ
  const logout = () => {
    if (typeof sessionStorage !== "undefined") { sessionStorage.removeItem("chillcup-session"); sessionStorage.removeItem("chillcup-web-access"); }
    clearSession();
    router.replace("/login");
  };

  if (!session) return <SafeAreaView style={styles.container}><View style={styles.empty}><Ionicons name="person-circle-outline" size={70} color={COLORS.primary} /><Text style={styles.emptyTitle}>กรุณาเข้าสู่ระบบ</Text><Pressable style={styles.primaryButton} onPress={() => router.replace("/login")}><Text style={styles.primaryButtonText}>เข้าสู่ระบบ</Text></Pressable></View></SafeAreaView>;

  return <SafeAreaView style={styles.container}>
    {/* [ACCOUNT HEADER AND PROFILE] ส่วนหัวและข้อมูลส่วนตัว */}
    <StatusBar barStyle="dark-content" />
    <View style={styles.header}><Pressable style={styles.iconButton} onPress={() => router.canGoBack() ? router.back() : router.replace("/")} hitSlop={12}><Ionicons name="arrow-back" size={23} color={COLORS.ink} /></Pressable><View style={styles.headerTitleWrap}><Text style={styles.eyebrow}>CHILLCUP ACCOUNT</Text><Text style={styles.title}>จัดการบัญชี</Text></View><View style={styles.iconButton}><Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} /></View></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.identity}><View style={styles.avatar}><Ionicons name={session.user.role === "admin" ? "star" : "person"} size={31} color="#fff" /></View><View style={styles.identityCopy}><Text style={styles.identityName}>{name || session.user.username}</Text><Text style={styles.identityUsername}>@{session.user.username} · {session.user.role === "admin" ? "ผู้ดูแลระบบ" : "ลูกค้า"}</Text></View></View>
      <View style={styles.card}><View style={styles.cardTitleRow}><Ionicons name="person-outline" size={20} color={COLORS.primary} /><Text style={styles.cardTitle}>ข้อมูลส่วนตัว</Text></View><Text style={styles.label}>ชื่อที่แสดง</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="ชื่อของคุณ" placeholderTextColor="#94A3B8" /><Text style={styles.label}>อีเมล</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor="#94A3B8" /><Pressable style={styles.primaryButton} onPress={saveProfile}><Ionicons name="save-outline" size={18} color="#fff" /><Text style={styles.primaryButtonText}>บันทึกข้อมูล</Text></Pressable></View>
      <View style={styles.card}><View style={styles.cardTitleRow}><Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} /><Text style={styles.cardTitle}>ความปลอดภัย</Text></View><Text style={styles.label}>รหัสผ่านปัจจุบัน</Text><TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="กรอกรหัสผ่านปัจจุบัน" placeholderTextColor="#94A3B8" /><Text style={styles.label}>รหัสผ่านใหม่</Text><TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="อย่างน้อย 6 ตัวอักษร" placeholderTextColor="#94A3B8" /><Text style={styles.label}>ยืนยันรหัสผ่านใหม่</Text><TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="กรอกรหัสผ่านอีกครั้ง" placeholderTextColor="#94A3B8" /><Pressable style={styles.secondaryButton} onPress={savePassword}><Ionicons name="key-outline" size={18} color={COLORS.primary} /><Text style={styles.secondaryButtonText}>เปลี่ยนรหัสผ่าน</Text></Pressable></View>
      <Pressable style={styles.logoutButton} onPress={logout}><Ionicons name="log-out-outline" size={19} color={COLORS.danger} /><Text style={styles.logoutText}>ออกจากระบบ</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg }, header: { height: 72, paddingHorizontal: 18, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.ice, justifyContent: "center", alignItems: "center" }, headerTitleWrap: { alignItems: "center" }, eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, title: { color: COLORS.ink, fontSize: 20, fontWeight: "900", marginTop: 2 }, content: { padding: 17, paddingBottom: 40 }, identity: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 20, backgroundColor: "#DDF8F7", borderWidth: 1, borderColor: "#B7ECEB", marginBottom: 15 }, avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center", borderWidth: 5, borderColor: "#A7F3F0" }, identityCopy: { marginLeft: 13 }, identityName: { color: COLORS.deep, fontSize: 20, fontWeight: "900" }, identityUsername: { color: COLORS.muted, fontSize: 12, marginTop: 5 }, card: { backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, padding: 17, marginBottom: 14 }, cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 17 }, cardTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "900" }, label: { color: COLORS.muted, fontSize: 11, fontWeight: "800", marginBottom: 6, marginTop: 9 }, input: { height: 46, borderRadius: 11, borderWidth: 1, borderColor: COLORS.line, backgroundColor: "#F8FCFD", paddingHorizontal: 12, color: COLORS.ink }, primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, borderRadius: 12, backgroundColor: COLORS.primary, marginTop: 16 }, primaryButtonText: { color: COLORS.white, fontWeight: "900", fontSize: 13 }, secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, borderRadius: 12, backgroundColor: COLORS.ice, marginTop: 16, borderWidth: 1, borderColor: COLORS.line }, secondaryButtonText: { color: COLORS.primary, fontWeight: "900", fontSize: 13 }, logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48, borderRadius: 13, backgroundColor: "#FFF1F4", borderWidth: 1, borderColor: "#FFD6DF" }, logoutText: { color: COLORS.danger, fontWeight: "900", fontSize: 13 }, empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }, emptyTitle: { color: COLORS.ink, fontSize: 20, fontWeight: "900", marginTop: 12 },
});
