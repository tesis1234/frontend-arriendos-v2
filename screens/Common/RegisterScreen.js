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
  LayoutAnimation,
  ActivityIndicator,
} from "react-native";
import Header from "../../components/Header";
import styles from "../../styles/RegisterScreenStyles";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function RegisterScreen({ navigation }) {
  const [cedula, setCedula] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState(null);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [bancos, setBancos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";
  const { width } = Dimensions.get("window");
  const fontSizeTitle = isWeb ? 40 : width * 0.12;

  const [expandedRol, setExpandedRol] = useState(false);
  const [expandedDocType, setExpandedDocType] = useState(false);
  const [expandedBank, setExpandedBank] = useState(false);

  const [selectedRol, setSelectedRol] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const telefonoValido = /^[0-9]{9,10}$/;

  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validarCedula = (cedula) => {
    if (cedula.length !== 10) return false;
    const digitos = cedula.split("").map(Number);
    const verificador = digitos.pop();
    let suma = 0;
    digitos.forEach((d, i) => {
      let mult = i % 2 === 0 ? d * 2 : d;
      if (mult > 9) mult -= 9;
      suma += mult;
    });
    const resultado = (10 - (suma % 10)) % 10;
    return resultado === verificador;
  };

  const validateRegisterData = () => {
    if (
      !selectedRol ||
      !cedula ||
      !nombres ||
      !apellidos ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      alert("Por favor, complete todos los campos obligatorios.");
      return false;
    }
    if (!validarCedula(cedula)) {
      alert("Cédula inválida.");
      return false;
    }
    if (nombres.trim().split(" ").length < 2) {
      alert("Ingrese los dos nombres.");
      return false;
    }
    if (apellidos.trim().split(" ").length < 2) {
      alert("Ingrese los dos apellidos.");
      return false;
    }
    if (!correoValido.test(email)) {
      alert("Correo electrónico inválido.");
      return false;
    }
    if (!telefonoValido.test(telefono)) {
      alert("Número de teléfono inválido.");
      return false;
    }
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return false;
    }
    // Validar complejidad de contraseña
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?{}[\]~]).{8,}$/;

    if (!passwordRegex.test(password)) {
      alert(
        "La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial."
      );
      return false;
    }

    if (!selectedDocType) {
      alert("Seleccione un tipo de documento.");
      return false;
    }
    if (!fechaNacimiento) {
      alert("Seleccione su fecha de nacimiento.");
      return false;
    }
    // Validar que el usuario tenga al menos 18 años
    if (fechaNacimiento) {
      const birthDate = new Date(fechaNacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        alert("Debes tener al menos 18 años para registrarte.");
        return false;
      }
      if (age > 120) {
        alert(
          "La edad ingresada no es válida. Por favor verifique su fecha de nacimiento."
        );
        return;
      }
    }

    return true;
  };
  const buildRegisterPayload = () => {
    const tipo =
      selectedRol === "Arrendador/Dueño de casa" ? "propietario" : "estudiante";
    return JSON.stringify({
      cedula,
      nombres,
      apellidos,
      email,
      telefono,
      password,
      tipo,
      numero_cuenta: numeroCuenta || null,
      banco_preferido: selectedBank || null,
      tipo_documento: selectedDocType,
      fecha_nacimiento: fechaNacimiento
        ? fechaNacimiento.toISOString().split("T")[0]
        : null,
    });
  };
  const sendRegisterRequest = async (payload) => {
    const response = await fetch("https://backend-arriendos-v2-production.up.railway.app/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    return await response.json();
  };
  const handleRegister = async () => {
    if (!validateRegisterData()) return;
    const payload = buildRegisterPayload();
    const data = await sendRegisterRequest(payload);

    if (data.success) {
      alert("Registro exitoso");
      navigation.navigate("Login");
    } else {
      alert(data.message || "Error al registrar");
    }
  };

  const toggleExpandRol = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRol(!expandedRol);
  };
  const toggleExpandDocType = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDocType(!expandedDocType);
  };
  const toggleExpandBank = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBank(!expandedBank);
  };

  const roles = ["Arrendatario/Inquilino", "Arrendador/Dueño de casa"];
  const documentType = ["Cédula", "Pasaporte"];

  //  Filtrar mientras escribe
  const handleBuscar = (texto) => {
    setBusqueda(texto);
    if (texto.trim() === "") {
      setFiltrados(bancos);
    } else {
      const resultados = bancos.filter((banco) => {
        const nombreBanco = typeof banco === "string" ? banco : banco.nombre;
        return nombreBanco.toLowerCase().includes(texto.toLowerCase());
      });
      setFiltrados(resultados);
    }
  };

  useEffect(() => {
    const cargarBancos = async () => {
      try {
        const response = await fetch("https://backend-arriendos-v2-production.up.railway.app/api/bancos");
        const data = await response.json();
        setBancos(data);
        setFiltrados(data);
      } catch (error) {
        console.error("Error al cargar bancos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarBancos();
  }, []);

  const renderOptions = (
    options,
    selectedOption,
    setSelectedOption,
    closeAccordion
  ) =>
    options.map((option) => (
      <TouchableOpacity
        key={option}
        style={[
          styles.optionButton,
          selectedOption === option && styles.optionSelected,
        ]}
        onPress={() => {
          setSelectedOption(option);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          closeAccordion(false);
        }}
      >
        <Text
          style={[
            styles.optionText,
            selectedOption === option && styles.optionTextSelected,
          ]}
        >
          {option}
        </Text>
      </TouchableOpacity>
    ));
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={isWeb ? styles.webContainer : styles.flex}>

        <ScrollView
          style={isWeb ? styles.webScrollView : styles.flex}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* ENCABEZADO */}
    <View style={{
      height: 70,
      width: "100%",
      flexDirection: "row"
    }}>
      <View style={{ flex: 1, backgroundColor: "#B80000" }} />   
      <View style={{ flex: 1, backgroundColor: "#ffffff" }} />
      <View style={{ flex: 1, backgroundColor: "#006400" }} />
    </View>
          <View style={styles.container}>
            <Header isLoggedIn={false} />
            <View style={[styles.form, { width: inputWidth }]}>
              <Text
                style={[
                  styles.title,
                  { fontSize: fontSizeTitle, textAlign: "center" },
                ]}
              >
                Registro
              </Text>
              <Text style={styles.label}>Rol</Text>
              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={toggleExpandRol}
                >
                  <Text style={styles.accordionTitle}>
                    Elija un rol: {selectedRol || "Ninguno"}
                  </Text>
                  <Ionicons
                    name={expandedRol ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="black"
                  />
                </TouchableOpacity>
                {expandedRol && (
                  <View style={styles.accordionContent}>
                    {renderOptions(
                      roles,
                      selectedRol,
                      setSelectedRol,
                      setExpandedRol
                    )}
                  </View>
                )}
              </View>

              <Text style={styles.label}>Documento de identificación</Text>

              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={toggleExpandDocType}
                >
                  <Text style={styles.accordionTitle}>
                    Elija su tipo de identificación:{" "}
                    {selectedDocType || "Ninguno"}
                  </Text>
                  <Ionicons
                    name={expandedDocType ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="black"
                  />
                </TouchableOpacity>
                {expandedDocType && (
                  <View style={styles.accordionContent}>
                    {renderOptions(
                      documentType,
                      selectedDocType,
                      setSelectedDocType,
                      setExpandedDocType
                    )}
                  </View>
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Escriba los dígitos de identificación"
                keyboardType="numeric"
                value={cedula}
                maxLength={10}
                onChangeText={(text) => setCedula(text.replace(/[^0-9]/g, ""))}
              />

              <Text style={styles.label}>Nombres</Text>
              <TextInput
                style={styles.input}
                placeholder="Escriba sus dos nombres"
                value={nombres}
                onChangeText={(text) =>
                  setNombres(text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""))
                }
              />

              <Text style={styles.label}>Apellidos</Text>
              <TextInput
                style={styles.input}
                placeholder="Escriba sus dos apellidos"
                value={apellidos}
                onChangeText={(text) =>
                  setApellidos(text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""))
                }
              />

              <Text style={styles.label}>Fecha de Nacimiento</Text>

              {Platform.OS === "web" ? (
                <input
                  style={{ ...styles.input, padding: 10, borderRadius: 8 }}
                  type="date"
                  value={
                    fechaNacimiento
                      ? fechaNacimiento.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => setFechaNacimiento(new Date(e.target.value))}
                />
              ) : (
                <>
                  <View
                    style={[
                      styles.input,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      },
                    ]}
                  >
                    <Text style={{ color: fechaNacimiento ? "#000" : "#aaa" }}>
                      {fechaNacimiento
                        ? fechaNacimiento.toLocaleDateString()
                        : "Seleccione una fecha"}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setMostrarCalendario(true)}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={22}
                        color="#888"
                      />
                    </TouchableOpacity>
                  </View>

                  {mostrarCalendario && (
                    <DateTimePicker
                      value={fechaNacimiento || new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, selectedDate) => {
                        setMostrarCalendario(false);
                        if (selectedDate) setFechaNacimiento(selectedDate);
                      }}
                    />
                  )}
                </>
              )}

              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="Escriba su número de teléfono"
                keyboardType="phone-pad"
                value={telefono}
                onChangeText={(text) =>
                  setTelefono(text.replace(/[^0-9]/g, "").slice(0, 10))
                }
              />

              <Text style={styles.label}>Correo</Text>
              <TextInput
                style={styles.input}
                placeholder="Escriba su correo"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Escriba su contraseña"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
              <Text style={{ color: "#888", fontSize: 12, marginTop: 5 }}>
                *Debe tener mínimo 8 caracteres, una mayúscula, una minúscula,
                un número y un carácter especial.
              </Text>
              <Text style={styles.label}>Verificar contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Verifique su contraseña"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={22}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>
                Número de cuenta para reservas y garantía
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Escriba su número de cuenta"
                keyboardType="numeric"
                value={numeroCuenta}
                onChangeText={(text) =>
                  setNumeroCuenta(text.replace(/[^0-9]/g, ""))
                }
              />

              <Text style={styles.label}>Nombre del banco</Text>

              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={toggleExpandBank}
                >
                  <Text style={styles.accordionTitle}>
                    Elija el nombre del banco: {selectedBank || "Ninguno"}
                  </Text>
                  <Ionicons
                    name={expandedBank ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="black"
                  />
                </TouchableOpacity>
                {expandedBank && (
                  <View style={styles.accordionContent}>
                    {loading ? (
                      <ActivityIndicator size="large" color="#007bff" />
                    ) : (
                      <>
                        <TextInput
                          style={[styles.input, { marginBottom: 8 }]}
                          placeholder="Buscar cooperativa..."
                          value={busqueda}
                          onChangeText={handleBuscar}
                        />

                        {filtrados.length > 0 ? (
                          filtrados.map((banco, index) => {
                            const nombreBanco =
                              typeof banco === "string" ? banco : banco.nombre;
                            return (
                              <TouchableOpacity
                                key={index}
                                style={styles.optionButton}
                                onPress={() => {
                                  setSelectedBank(nombreBanco);
                                  setExpandedBank(false);
                                }}
                              >
                                <Text style={styles.optionText}>
                                  {nombreBanco}
                                </Text>
                              </TouchableOpacity>
                            );
                          })
                        ) : (
                          <Text style={{ textAlign: "center", color: "#888" }}>
                            No se encontraron coincidencias
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.back]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.buttonText}>Atrás</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.register]}
                  onPress={handleRegister}
                >
                  <Text style={styles.buttonText}>Registrarse</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
