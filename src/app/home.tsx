import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { API_AUTH_URL } from "../constants/api";
import { clearSession, getSession } from "../constants/store";

type Employee = { id: string; name: string; position: string; status: "Active" | "On Leave"; salary: number };
type Cluster = { group: string; centroid: number; count: number };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSession()?.token;
  const response = await fetch(`${API_AUTH_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
  return body as T;
}

export default function HomeScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [clusters, setClusters] = useState<Cluster[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const loadEmployees = useCallback(async () => {
    try { setEmployees(await request<Employee[]>("/employees")); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void loadEmployees();
    // Keep the dashboard in sync with edits made directly in phpMyAdmin.
    const refreshTimer = setInterval(() => { void loadEmployees(); }, 5000);
    return () => clearInterval(refreshTimer);
  }, [loadEmployees]);

  const addEmployee = async () => {
    const parsedSalary = Number(salary);
    if (!name.trim() || !position.trim() || !salary.trim() || !Number.isFinite(parsedSalary) || parsedSalary < 0) {
      const message = "กรุณากรอกชื่อ ตำแหน่ง และเงินเดือนตั้งแต่ 0 ขึ้นไป";
      Platform.OS === "web" ? alert(message) : Alert.alert("ข้อมูลไม่ถูกต้อง", message);
      return;
    }
    try {
      const employee = await request<Employee>("/employees", { method: "POST", body: JSON.stringify({ name, position, salary: parsedSalary }) });
      setEmployees((current) => [...current, employee]); setName(""); setPosition(""); setSalary(""); setClusters(null);
    } catch (err) { showMessage(err instanceof Error ? err.message : "เพิ่มพนักงานไม่สำเร็จ"); }
  };

  const toggleStatus = async (employee: Employee) => {
    try {
      const updated = await request<Employee>(`/employees/${encodeURIComponent(employee.id)}/status`, { method: "PUT" });
      setEmployees((current) => current.map((item) => item.id === updated.id ? updated : item)); setClusters(null);
    } catch (err) { showMessage(err instanceof Error ? err.message : "เปลี่ยนสถานะไม่สำเร็จ"); }
  };

  const beginEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setEditName(employee.name);
    setEditPosition(employee.position);
    setEditSalary(String(employee.salary));
  };

  const saveEdit = async (id: string) => {
    const parsedSalary = Number(editSalary);
    if (!editName.trim() || !editPosition.trim() || !editSalary.trim() || !Number.isFinite(parsedSalary) || parsedSalary < 0) {
      showMessage("กรุณากรอกชื่อ ตำแหน่ง และเงินเดือนตั้งแต่ 0 ขึ้นไป");
      return;
    }
    try {
      const updated = await request<Employee>(`/employees/${encodeURIComponent(id)}`, {
        method: "PUT", body: JSON.stringify({ name: editName, position: editPosition, salary: parsedSalary }),
      });
      setEmployees((current) => current.map((item) => item.id === id ? updated : item));
      setEditingId(null);
      setClusters(null);
    } catch (err) { showMessage(err instanceof Error ? err.message : "แก้ไขพนักงานไม่สำเร็จ"); }
  };

  const deleteEmployee = async (employee: Employee) => {
    const confirmed = Platform.OS === "web" ? window.confirm("Are you sure?") : await new Promise<boolean>((resolve) => Alert.alert("ยืนยันการลบ", "Are you sure?", [{ text: "ยกเลิก", style: "cancel", onPress: () => resolve(false) }, { text: "ลบ", style: "destructive", onPress: () => resolve(true) }]));
    if (!confirmed) return;
    try {
      await request(`/employees/${encodeURIComponent(employee.id)}`, { method: "DELETE" });
      setEmployees((current) => current.filter((item) => item.id !== employee.id)); setClusters(null);
    } catch (err) { showMessage(err instanceof Error ? err.message : "ลบพนักงานไม่สำเร็จ"); }
  };

  const analyze = async () => {
    setAnalyzing(true);
    try { const result = await request<{ success: boolean; clusters: Cluster[] }>("/employees/salary-clusters"); setClusters(result.clusters); }
    catch (err) { showMessage(err instanceof Error ? err.message : "วิเคราะห์เงินเดือนไม่สำเร็จ"); }
    finally { setAnalyzing(false); }
  };

  const logout = () => { clearSession(); router.replace("/login"); };

  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>ATSADAPHON • HR ANALYTICS</Text><Text style={styles.title}>Employee Dashboard</Text><Text style={styles.subtitle}>จัดการข้อมูลพนักงานและวิเคราะห์โครงสร้างเงินเดือน</Text></View><Pressable onPress={logout} style={styles.logout}><Text style={styles.logoutText}>ออกจากระบบ</Text></Pressable></View>
    <View style={styles.summary}><View style={styles.summaryCard}><Text style={styles.summaryLabel}>พนักงานทั้งหมด</Text><Text style={styles.summaryValue}>{employees.length}</Text></View><View style={styles.summaryCard}><Text style={styles.summaryLabel}>เงินเดือนเฉลี่ย</Text><Text style={styles.summaryValue}>{employees.length ? Math.round(employees.reduce((sum, item) => sum + Number(item.salary), 0) / employees.length).toLocaleString() : 0}</Text></View></View>
    <View style={styles.panel}><Text style={styles.sectionTitle}>เพิ่มพนักงาน</Text><View style={styles.form}><TextInput value={name} onChangeText={setName} placeholder="ชื่อพนักงาน" style={styles.input} /><TextInput value={position} onChangeText={setPosition} placeholder="ตำแหน่ง" style={styles.input} /><TextInput value={salary} onChangeText={setSalary} placeholder="เงินเดือน" keyboardType="decimal-pad" style={styles.input} /><Pressable style={styles.primaryButton} onPress={addEmployee}><Text style={styles.primaryButtonText}>+ เพิ่มพนักงาน</Text></Pressable></View></View>
    <View style={styles.panel}><View style={styles.sectionRow}><Text style={styles.sectionTitle}>รายชื่อพนักงาน</Text><Pressable style={styles.outlineButton} onPress={loadEmployees}><Text style={styles.outlineText}>รีเฟรช</Text></Pressable></View>
      {loading ? <ActivityIndicator color="#3974c6" style={{ padding: 22 }} /> : error ? <Text style={styles.error}>{error}</Text> : employees.length === 0 ? <Text style={styles.empty}>ยังไม่มีข้อมูลพนักงาน</Text> : employees.map((employee) => <View key={employee.id} style={styles.employeeRow}><View style={styles.employeeInfo}>{editingId === employee.id ? <View style={styles.editForm}><TextInput value={editName} onChangeText={setEditName} placeholder="ชื่อพนักงาน" style={styles.editInput} /><TextInput value={editPosition} onChangeText={setEditPosition} placeholder="ตำแหน่ง" style={styles.editInput} /><TextInput value={editSalary} onChangeText={setEditSalary} placeholder="เงินเดือน" keyboardType="decimal-pad" style={styles.editInput} /><View style={styles.editActions}><Pressable onPress={() => void saveEdit(employee.id)} style={styles.smallButton}><Text style={styles.smallText}>บันทึก</Text></Pressable><Pressable onPress={() => setEditingId(null)} style={styles.outlineButton}><Text style={styles.outlineText}>ยกเลิก</Text></Pressable></View></View> : <><Text style={styles.employeeName}>{employee.name}</Text><Text style={styles.muted}>{employee.position}</Text><Text style={styles.salary}>฿{Number(employee.salary).toLocaleString()} / เดือน</Text></>}</View><View style={styles.actions}><Text style={[styles.status, employee.status === "Active" ? styles.active : styles.leave]}>{employee.status}</Text><Pressable onPress={() => beginEdit(employee)} style={styles.smallButton}><Text style={styles.smallText}>แก้ไข</Text></Pressable><Pressable onPress={() => void toggleStatus(employee)} style={styles.smallButton}><Text style={styles.smallText}>สลับสถานะ</Text></Pressable><Pressable onPress={() => void deleteEmployee(employee)} style={styles.deleteButton}><Text style={styles.deleteText}>ลบ</Text></Pressable></View></View>)}
    </View>
    <View style={styles.panel}><View style={styles.sectionRow}><View style={{ flex: 1 }}><Text style={styles.sectionTitle}>Salary Structure</Text><Text style={styles.muted}>จัดกลุ่มเงินเดือนด้วย 1D K-Means (k=3)</Text></View><Pressable style={[styles.primaryButton, analyzing && { opacity: 0.7 }]} onPress={() => void analyze()} disabled={analyzing}>{analyzing ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>วิเคราะห์เงินเดือน</Text>}</Pressable></View>
      {clusters && <View style={styles.clusterGrid}>{clusters.map((cluster) => <View key={cluster.group} style={styles.clusterCard}><Text style={styles.clusterName}>{cluster.group}</Text><Text style={styles.clusterValue}>฿{cluster.centroid.toLocaleString()}</Text><Text style={styles.muted}>{cluster.count} คน · เงินเดือนเฉลี่ย</Text></View>)}</View>}
    </View>
  </ScrollView></SafeAreaView>;
}

function showMessage(message: string) { Platform.OS === "web" ? alert(message) : Alert.alert("เกิดข้อผิดพลาด", message); }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f1f5f9" }, content: { width: "100%", maxWidth: 1080, alignSelf: "center", padding: 22, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 4 }, eyebrow: { color: "#3974c6", fontWeight: "800", fontSize: 11, letterSpacing: 1 }, title: { color: "#142b49", fontSize: 28, fontWeight: "800", marginTop: 5 }, subtitle: { color: "#64748b", marginTop: 5 }, logout: { paddingVertical: 9, paddingHorizontal: 13, borderColor: "#cbd5e1", borderWidth: 1, borderRadius: 9 }, logoutText: { color: "#334155", fontWeight: "700" },
  summary: { flexDirection: "row", gap: 12 }, summaryCard: { flex: 1, backgroundColor: "white", padding: 18, borderRadius: 14, borderColor: "#e2e8f0", borderWidth: 1 }, summaryLabel: { color: "#64748b", fontWeight: "600" }, summaryValue: { color: "#142b49", fontWeight: "800", fontSize: 25, marginTop: 7 },
  panel: { backgroundColor: "white", padding: 18, borderRadius: 14, borderColor: "#e2e8f0", borderWidth: 1 }, sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }, sectionTitle: { color: "#142b49", fontSize: 18, fontWeight: "800" }, form: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 12 }, input: { flexGrow: 1, flexBasis: 180, height: 44, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, borderColor: "#cbd5e1", color: "#142b49" }, primaryButton: { minHeight: 42, justifyContent: "center", alignItems: "center", backgroundColor: "#3974c6", paddingHorizontal: 15, borderRadius: 9 }, primaryButtonText: { color: "white", fontWeight: "800" }, outlineButton: { borderColor: "#cbd5e1", borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }, outlineText: { color: "#334155", fontWeight: "700" },
  employeeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 13, borderTopWidth: 1, borderTopColor: "#edf2f7" }, employeeInfo: { flex: 1 }, employeeName: { color: "#142b49", fontWeight: "800", fontSize: 15 }, muted: { color: "#64748b", fontSize: 13, marginTop: 3 }, salary: { color: "#3974c6", fontWeight: "700", marginTop: 5 }, actions: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", gap: 7 }, editForm: { gap: 7 }, editInput: { height: 38, minWidth: 180, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: "#cbd5e1", color: "#142b49" }, editActions: { flexDirection: "row", gap: 8 }, status: { fontSize: 11, fontWeight: "800", paddingVertical: 5, paddingHorizontal: 8, borderRadius: 20, overflow: "hidden" }, active: { color: "#166534", backgroundColor: "#dcfce7" }, leave: { color: "#92400e", backgroundColor: "#fef3c7" }, smallButton: { padding: 7, backgroundColor: "#eff6ff", borderRadius: 7 }, smallText: { color: "#285fa8", fontSize: 12, fontWeight: "700" }, deleteButton: { paddingVertical: 7, paddingHorizontal: 9, backgroundColor: "#fef2f2", borderRadius: 7 }, deleteText: { color: "#b91c1c", fontSize: 12, fontWeight: "700" }, empty: { color: "#64748b", paddingVertical: 20, textAlign: "center" }, error: { color: "#b91c1c", paddingVertical: 16 }, clusterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 }, clusterCard: { flexGrow: 1, flexBasis: 180, backgroundColor: "#eff6ff", borderColor: "#dbeafe", borderWidth: 1, borderRadius: 11, padding: 15 }, clusterName: { color: "#285fa8", fontWeight: "800" }, clusterValue: { color: "#142b49", fontWeight: "800", fontSize: 22, marginTop: 7 },
});
