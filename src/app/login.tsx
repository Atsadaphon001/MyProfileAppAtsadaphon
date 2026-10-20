import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { API_AUTH_URL } from "../constants/api";
import { setSession } from "../constants/store";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (credentials = { username, password }) => {
    if (!credentials.username.trim() || !credentials.password) {
      const message = "กรุณากรอก Username และ Password";
      Platform.OS === "web" ? alert(message) : Alert.alert("ข้อมูลไม่ครบ", message);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_AUTH_URL}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: credentials.username.trim(), password: credentials.password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "เข้าสู่ระบบไม่สำเร็จ");
      setSession({ id: 1, username: credentials.username.trim(), name: "HR Administrator", role: "admin" }, data.token);
      router.replace("/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "เชื่อมต่อ Backend ไม่ได้";
      Platform.OS === "web" ? alert(message) : Alert.alert("เข้าสู่ระบบไม่สำเร็จ", message);
    } finally { setLoading(false); }
  };

  return <SafeAreaView style={styles.screen}><View style={styles.card}>
    <Text style={styles.eyebrow}>ATSADAPHON • HR ANALYTICS</Text>
    <Text style={styles.title}>HR Manager</Text>
    <Text style={styles.subtitle}>เข้าสู่ระบบเพื่อจัดการพนักงานและวิเคราะห์เงินเดือน</Text>
    <Text style={styles.label}>Username</Text>
    <TextInput value={username} onChangeText={setUsername} placeholder="Username" autoCapitalize="none" autoCorrect={false} style={styles.input} onSubmitEditing={() => void login()} />
    <Text style={styles.label}>Password</Text>
    <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} onSubmitEditing={() => void login()} />
    <Pressable style={styles.button} onPress={() => void login()} disabled={loading}>{loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>}</Pressable>
    <Pressable style={styles.quickAdminButton} onPress={() => void login({ username: "admin", password: "admin" })} disabled={loading}>
      <Text style={styles.quickAdminText}>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ Admin ทันที"}</Text>
    </Pressable>
    <Text style={styles.hint}>บัญชี Admin: admin / admin</Text>
  </View></SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eff6ff", justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 440, alignSelf: "center", backgroundColor: "white", padding: 28, borderRadius: 20, borderWidth: 1, borderColor: "#dbeafe", elevation: 3 },
  eyebrow: { color: "#3974c6", fontWeight: "800", fontSize: 12, letterSpacing: 1.2 }, title: { color: "#142b49", fontWeight: "800", fontSize: 32, marginTop: 12 },
  subtitle: { color: "#64748b", marginTop: 8, marginBottom: 20, lineHeight: 22 }, label: { color: "#26364b", fontWeight: "700", marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, height: 48, paddingHorizontal: 13, color: "#142b49", backgroundColor: "#fff" },
  button: { marginTop: 24, height: 50, borderRadius: 10, backgroundColor: "#3974c6", alignItems: "center", justifyContent: "center" }, buttonText: { color: "white", fontSize: 16, fontWeight: "800" },
  quickAdminButton: { marginTop: 12, height: 46, borderRadius: 10, borderWidth: 1, borderColor: "#3974c6", alignItems: "center", justifyContent: "center", backgroundColor: "#eff6ff" }, quickAdminText: { color: "#285fa8", fontSize: 14, fontWeight: "800" },
  hint: { color: "#64748b", textAlign: "center", marginTop: 12, fontSize: 13 },
});
