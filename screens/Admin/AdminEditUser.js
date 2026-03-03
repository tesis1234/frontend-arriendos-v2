import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import Header from "../../components/Header";
import styles from "../../styles/ProfileScreenStyles";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

export default function AdminEditUser({ navigation, route }) {
  const { userId } = route.params; // 🔥 IMPORTANTE
  const [userData, setUserData] = useState({});
  const [banks, setBanks] = useState([]);
  const [expandedBank, setExpandedBank] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";
  const fontSizeTitle = isWeb ? 40 : screenWidth * 0.12;

  // 🚀 Cargar datos del usuario
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `https://backend-arriendos-v2-production.up.railway.app/api/auth/usuarios/${userId}`
        );
        const data = await res.json();

        // Convertir fecha correctamente
        let fecha = "";
        if (data.fecha_nacimiento) {
          fecha = new Date(data.fecha_nacimiento).toISOString();
        }

        setUserData({
          docType: data.tipo_documento || "",
          docNumber: data.cedula || "",
          firstName: data.nombres || "",
          lastName: data.apellidos || "",
          birthDate: fecha,
          phone: data.telefono || "",
          email: data.email || "",
          accountNumber: data.numero_cuenta || "",
          bank: data.banco_preferido || "",
        });
      } catch (err) {
        console.log("Error cargando usuario:", err);
      }
    };

    fetchUser();
  }, [userId]);

  // 🚀 Cargar bancos
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("https://backend-arriendos-v2-production.up.railway.app/api/bancos");
        const data = await res.json();
        setBanks(data);
      } catch (err) {
        console.log("Error bancos:", err);
      }
    };
    fetchBanks();
  }, []);

  const handleSave = async () => {
    try {
      if (!userId) {
        alert("Error: el ID del usuario no existe.");
        return;
      }

      const fechaNacimiento =
        userData.birthDate && userData.birthDate.includes("T")
          ? userData.birthDate.split("T")[0]
          : userData.birthDate || "";

      const body = {
        nombres: userData.firstName || "",
        apellidos: userData.lastName || "",
        telefono: userData.phone || "",
        email: userData.email || "",
        fecha_nacimiento: fechaNacimiento,
        numero_cuenta: userData.accountNumber || "",
        banco_preferido: userData.bank || "",
      };

      console.log("📌 Enviando body:", body);

      const res = await fetch(
        `https://backend-arriendos-v2-production.up.railway.app/api/admin/usuarios/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const result = await res.json();
      console.log("📌 Respuesta backend:", result);

      if (res.ok) {
        alert("✔ Usuario actualizado correctamente");
        navigation.goBack();
      } else {
        alert("Error al actualizar usuario");
      }
    } catch (err) {
      console.log("❌ Error guardando usuario:", err);
      alert("Error al actualizar usuario");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={isWeb ? styles.webContainer : styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.container}>
            <Header isLoggedIn={true} />

            <View style={[styles.form, { width: inputWidth }]}>
              <Text style={[styles.title, { fontSize: fontSizeTitle }]}>
                Editar Usuario
              </Text>

              {/* -------- TIPO DOCUMENTO -------- */}
              <Text style={styles.label}>Tipo de documento (no editable)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: "#eee" }]}
                value={userData.docType}
                editable={false}
              />

              {/* -------- NUM DOCUMENTO -------- */}
              <Text style={styles.label}>
                Número de documento (no editable)
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: "#eee" }]}
                value={userData.docNumber}
                editable={false}
              />

              {/* -------- NOMBRES -------- */}
              <Text style={styles.label}>Nombres</Text>
              <TextInput
                style={styles.input}
                value={userData.firstName}
                onChangeText={(text) =>
                  setUserData({ ...userData, firstName: text })
                }
              />

              {/* -------- APELLIDOS -------- */}
              <Text style={styles.label}>Apellidos</Text>
              <TextInput
                style={styles.input}
                value={userData.lastName}
                onChangeText={(text) =>
                  setUserData({ ...userData, lastName: text })
                }
              />

              {/* -------- FECHA NACIMIENTO -------- */}
              <Text style={styles.label}>Fecha de nacimiento</Text>

              {isWeb ? (
                <input
                  type="date"
                  style={{ ...styles.input, padding: 10 }}
                  value={
                    userData.birthDate ? userData.birthDate.split("T")[0] : ""
                  }
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      birthDate: new Date(e.target.value).toISOString(),
                    })
                  }
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text>
                      {userData.birthDate
                        ? new Date(userData.birthDate).toLocaleDateString()
                        : "Seleccione una fecha"}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      mode="date"
                      value={
                        userData.birthDate
                          ? new Date(userData.birthDate)
                          : new Date()
                      }
                      onChange={(e, date) => {
                        setShowDatePicker(false);
                        if (date) {
                          setUserData({
                            ...userData,
                            birthDate: date.toISOString(),
                          });
                        }
                      }}
                    />
                  )}
                </>
              )}

              {/* -------- TELEFONO -------- */}
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={userData.phone}
                onChangeText={(text) =>
                  setUserData({ ...userData, phone: text })
                }
              />

              {/* -------- EMAIL -------- */}
              <Text style={styles.label}>Correo</Text>
              <TextInput
                style={styles.input}
                value={userData.email}
                onChangeText={(text) =>
                  setUserData({ ...userData, email: text })
                }
              />

              {/* -------- NUM CUENTA -------- */}
              <Text style={styles.label}>Número de cuenta</Text>
              <TextInput
                style={styles.input}
                value={userData.accountNumber}
                onChangeText={(text) =>
                  setUserData({ ...userData, accountNumber: text })
                }
                keyboardType="numeric"
              />

              <Text style={styles.label}>Banco</Text>

              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  },
                ]}
                onPress={() => setExpandedBank(!expandedBank)}
              >
                <Text>
                  {userData.bank ? userData.bank : "Seleccione un banco"}
                </Text>
                <Ionicons
                  name={expandedBank ? "chevron-up" : "chevron-down"}
                  size={18}
                />
              </TouchableOpacity>

              {expandedBank &&
                banks.map((b, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.optionButton}
                    onPress={() => {
                      setUserData({
                        ...userData,
                        bank: typeof b === "string" ? b : b.nombre,
                      });
                      setExpandedBank(false);
                    }}
                  >
                    <Text style={styles.optionText}>
                      {typeof b === "string" ? b : b.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}

              <View style={[styles.buttonRow, { marginTop: 30 }]}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    backgroundColor: "#888",
                    borderRadius: 8,
                    alignItems: "center",
                    marginRight: 5,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Atrás
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    backgroundColor: "#000",
                    borderRadius: 8,
                    alignItems: "center",
                    marginLeft: 5,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Guardar cambios
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 120 }} />
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
