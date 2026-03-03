import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
  ActivityIndicator,
  Alert,
} from "react-native";
import styles from "../../styles/RegisterScreenStyles";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function RegisterForm({ onGoLogin }) {
  /* ================= STATES ================= */

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

  const [expandedRol, setExpandedRol] = useState(false);
  const [expandedDocType, setExpandedDocType] = useState(false);
  const [expandedBank, setExpandedBank] = useState(false);

  const [selectedRol, setSelectedRol] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);

  const [bancos, setBancos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleExpandBank = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBank(!expandedBank);
  };
  const roles = ["Arrendatario/Inquilino", "Arrendador/Dueño de casa"];
  const documentType = ["Cédula", "Pasaporte"];

  /* ================= MENSAJES (FIX WEB) ================= */

  const showMsg = (title, message) => {
    const text = title ? `${title}\n\n${message}` : message;

    if (Platform.OS === "web") {
      window.alert(text);
    } else {
      Alert.alert(title || "Aviso", message);
    }
  };

  /* ================= VALIDACIONES ================= */

  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const telefonoValido = /^[0-9]{9,10}$/;

  const validarCedula = (cedulaValue) => {
    if (cedulaValue.length !== 10) return false;
    const digitos = cedulaValue.split("").map(Number);
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
    // Igual que RegisterScreen (mismos checks y mensajes)
    if (
      !selectedRol ||
      !cedula ||
      !nombres ||
      !apellidos ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      showMsg("Error", "Por favor, complete todos los campos obligatorios.");
      return false;
    }

    if (!validarCedula(cedula)) {
      showMsg("Error", "Cédula inválida.");
      return false;
    }

    if (nombres.trim().split(" ").length < 2) {
      showMsg("Error", "Ingrese los dos nombres.");
      return false;
    }

    if (apellidos.trim().split(" ").length < 2) {
      showMsg("Error", "Ingrese los dos apellidos.");
      return false;
    }

    if (!correoValido.test(email)) {
      showMsg("Error", "Correo electrónico inválido.");
      return false;
    }

    if (!telefonoValido.test(telefono)) {
      showMsg("Error", "Número de teléfono inválido.");
      return false;
    }

    if (password !== confirmPassword) {
      showMsg("Error", "Las contraseñas no coinciden.");
      return false;
    }

    // ✅ Regex EXACTO del RegisterScreen
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?{}[\]~]).{8,}$/;

    if (!passwordRegex.test(password)) {
      showMsg(
        "Error",
        "La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial."
      );
      return false;
    }

    if (!selectedDocType) {
      showMsg("Error", "Seleccione un tipo de documento.");
      return false;
    }

    if (!fechaNacimiento) {
      showMsg("Error", "Seleccione su fecha de nacimiento.");
      return false;
    }
    if (!selectedBank) {
      showMsg("Error", "Seleccione un banco.");
      return false;
    }


    // Edad >= 18 y <= 120 (igual que pantalla)
    const birthDate = new Date(fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    if (age < 18) {
      showMsg("Error", "Debes tener al menos 18 años para registrarte.");
      return false;
    }

    if (age > 120) {
      showMsg(
        "Error",
        "La edad ingresada no es válida. Por favor verifique su fecha de nacimiento."
      );
      return false;
    }

    return true;
  };

  /* ================= BACKEND ================= */

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

const handleRegister = async () => {
  console.log("✅ CLICK Registrarse");

  if (!validateRegisterData()) return;

  try {
    const response = await fetch(
      "https://backend-arriendos-v2-production.up.railway.app/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: buildRegisterPayload(),
      }
    );

    const data = await response.json();
    console.log("RESPUESTA:", data);

    if (response.ok && data.success) {
      showMsg("Registro exitoso", "Ahora puedes iniciar sesión.");
      onGoLogin?.();
    } else {
      showMsg("Error", data.message || "Error al registrar");
    }
  } catch (error) {
    console.error("ERROR REAL:", error);
    showMsg("Error", "No se pudo conectar al servidor");
  }
};


  /* ================= BANCOS ================= */

  useEffect(() => {
    const cargarBancos = async () => {
      try {
        const res = await fetch(
          "https://backend-arriendos-v2-production.up.railway.app/api/bancos"
        );
        const data = await res.json();
        setBancos(data);
        setFiltrados(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    cargarBancos();
  }, []);

  const handleBuscar = (text) => {
    setBusqueda(text);
    setFiltrados(
      bancos.filter((b) =>
        (b.nombre || b).toLowerCase().includes(text.toLowerCase())
      )
    );
  };

  const renderOptions = (options, selected, setSelected, close) =>
    options.map((o) => (
      <TouchableOpacity
        key={o}
        style={[styles.optionButton, selected === o && styles.optionSelected]}
        onPress={() => {
          setSelected(o);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          close(false);
        }}
      >
        <Text
          style={[
            styles.optionText,
            selected === o && styles.optionTextSelected,
          ]}
        >
          {o}
        </Text>
      </TouchableOpacity>
    ));

  /* ================= UI (NO TOCADO) ================= */

  return (
    <View>
      <Text style={[styles.title, { textAlign: "center" }]}>Registro</Text>

      {/* ROL */}
      <Text style={styles.label}>Rol</Text>
      <TouchableOpacity onPress={() => setExpandedRol(!expandedRol)}>
        <Text>Seleccionar rol: {selectedRol || "—"}</Text>
      </TouchableOpacity>
      {expandedRol &&
        renderOptions(roles, selectedRol, setSelectedRol, setExpandedRol)}

      {/* DOCUMENTO */}
      <Text style={styles.label}>Tipo de documento</Text>
      <TouchableOpacity onPress={() => setExpandedDocType(!expandedDocType)}>
        <Text>{selectedDocType || "Seleccionar"}</Text>
      </TouchableOpacity>
      {expandedDocType &&
        renderOptions(
          documentType,
          selectedDocType,
          setSelectedDocType,
          setExpandedDocType
        )}

      <TextInput
        style={styles.input}
        placeholder="Cédula"
        keyboardType="numeric"
        value={cedula}
        onChangeText={(t) => setCedula(t.replace(/\D/g, ""))}
      />

      <TextInput
        style={styles.input}
        placeholder="Nombres"
        value={nombres}
        onChangeText={setNombres}
      />

      <TextInput
        style={styles.input}
        placeholder="Apellidos"
        value={apellidos}
        onChangeText={setApellidos}
      />

      {/* FECHA */}
      <Text style={styles.label}>Fecha de nacimiento</Text>

      {Platform.OS === "web" ? (
        <input
          type="date"
          style={{ ...styles.input, padding: 10 }}
          value={fechaNacimiento ? fechaNacimiento.toISOString().split("T")[0] : ""}
          onChange={(e) => setFechaNacimiento(new Date(e.target.value))}
        />
      ) : (
        <>
          <TouchableOpacity onPress={() => setMostrarCalendario(true)}>
            <Text>
              {fechaNacimiento ? fechaNacimiento.toLocaleDateString() : "Seleccionar"}
            </Text>
          </TouchableOpacity>

          {mostrarCalendario && (
            <DateTimePicker
              value={fechaNacimiento || new Date()}
              mode="date"
              onChange={(e, d) => {
                setMostrarCalendario(false);
                d && setFechaNacimiento(d);
              }}
            />
          )}
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        value={telefono}
        keyboardType="numeric"
         maxLength={10}
        onChangeText={setTelefono}
      />

      <TextInput
        style={styles.input}
        placeholder="Correo"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* PASSWORD */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirmar contraseña"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Icon
            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
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


      <TouchableOpacity style={styles.register} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onGoLogin}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
