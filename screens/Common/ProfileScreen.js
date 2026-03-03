import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  LayoutAnimation,
  ActivityIndicator
} from "react-native";
import Header from "../../components/Header";
import styles from "../../styles/ProfileScreenStyles";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState({});

  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";
  const fontSizeTitle = isWeb ? 40 : screenWidth * 0.12;
  const [expandedRol, setExpandedRol] = useState(false);
  const [expandedDocType, setExpandedDocType] = useState(false);
  const [expandedBank, setExpandedBank] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  const [selectedRol, setSelectedRol] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const { user } = useContext(AuthContext);
  const [profileImage, setProfileImage] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [bancos, setBancos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);

  const pickProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0]);
    }
  };

  const toggleExpandDocType = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDocType(!expandedDocType);
  };
  const toggleExpandBank = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBank(!expandedBank);
  };
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `https://backend-arriendos-v2-production.up.railway.app/api/auth/usuarios/${user?.id}`
        );
        const data = await response.json();

        const mappedData = {
          // Documento y tipo
          docNumber: data.cedula || "",
          selectedDocType: data.tipo_documento || "",

          // Datos personales
          firstName: data.nombres || "",
          lastName: data.apellidos || "",
          birthDate: data.fecha_nacimiento || "",

          // Contacto
          phone: data.telefono || "",
          email: data.email || "",

          // Seguridad
          password: data.password || "",

          // Cuenta bancaria
          accountNumber: data.numero_cuenta ?? "",
          selectedBank: data.banco_preferido ?? "",

          // Rol
          selectedRol: data.tipo || "",

          estado: data.estado || "",
          id_usuario: data.id_usuario || "",
          foto_perfil: data.foto_perfil || "",
          fecha_registro: data.fecha_registro || "",
          fcm_token: data.fcm_token || "",
        };

        setUserData(mappedData);
        setSelectedRol(mappedData.selectedRol);
        setSelectedDocType(mappedData.selectedDocType);
        setSelectedBank(mappedData.selectedBank);
      } catch (error) {
        console.error("Error al cargar el perfil:", error);
      }
    };

    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  const roles = ["Arrendatario/Inquilino", "Arrendador/Dueño de casa"];
  const documentType = ["Cédula", "Pasaporte"];


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

  const handleSave = async () => {
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telefonoValido = /^[0-9]{9,10}$/;

    if (
      !userData.firstName ||
      !userData.lastName ||
      !userData.email ||
      !userData.phone ||
      !selectedDocType ||
      !userData.birthDate
    ) {
      alert("Por favor complete todos los campos obligatorios.");
      return;
    }
    // Validar edad mínima de 18 años
    const birthDate = new Date(userData.birthDate);
    const today = new Date();
    const age =
      today.getFullYear() -
      birthDate.getFullYear() -
      (today <
        new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
        ? 1
        : 0);

    if (age < 18) {
      alert("Debe ser mayor de 18 años para usar esta aplicación.");
      return;
    }
    if (age > 120) {
      alert(
        "La edad ingresada no es válida. Por favor verifique su fecha de nacimiento."
      );
      return;
    }

    if (userData.firstName.trim().split(" ").length < 2) {
      alert("Ingrese sus dos nombres.");
      return;
    }

    if (!correoValido.test(userData.email)) {
      alert("Correo electrónico inválido.");
      return;
    }

    if (!telefonoValido.test(userData.phone)) {
      alert("Número de teléfono inválido.");
      return;
    }

    // Validar seguridad de contraseña
    if (newPassword) {
      // Reglas de seguridad
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;

      if (!passwordRegex.test(newPassword)) {
        alert(
          "La nueva contraseña debe tener al menos:\n• 8 caracteres\n• Una letra mayúscula\n• Una letra minúscula\n• Un número\n• Un carácter especial (@, $, !, %, *, ?, &)"
        );
        return;
      }

      if (!currentPassword) {
        alert("Debe ingresar la contraseña actual para cambiarla.");
        return;
      }
    }

    if (newPassword && !currentPassword) {
      alert("Debe ingresar la contraseña actual para cambiarla.");
      return;
    }
    if (!newPassword && currentPassword) {
      alert("Debe ingresar una nueva contraseña.");
      return;
    }

    try {
      let body;
      let headers = {};

      if (Platform.OS === "web") {
        const formData = new FormData();

        // Agregar campos de texto
        formData.append("cedula", userData.docNumber || "");
        formData.append("nombres", userData.firstName || "");
        formData.append("apellidos", userData.lastName || "");
        formData.append("email", userData.email || "");
        formData.append("telefono", userData.phone || "");
        formData.append("tipo_documento", selectedDocType || "");
        const fechaNacimientoFormatted = userData.birthDate
          ? new Date(userData.birthDate).toISOString().split("T")[0]
          : "";
        formData.append("fecha_nacimiento", fechaNacimientoFormatted);

        formData.append("banco_preferido", selectedBank || "");
        formData.append("numero_cuenta", userData.accountNumber || "");
        formData.append("tipo", selectedRol || "");

        if (currentPassword && newPassword) {
          formData.append("contrasena_actual", currentPassword);
          formData.append("nueva_contrasena", newPassword);
        }

        // Manejo especial para imagen en web
        if (profileImage) {
          try {
            const response = await fetch(profileImage.uri);
            const blob = await response.blob();

            // Crear el archivo con nombre y tipo específico
            const file = new File([blob], "perfil.jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            formData.append("foto_perfil", file);
          } catch (imageError) {
            console.error("Error procesando imagen:", imageError);
          }
        }

        body = formData;
      } else {
        const formData = new FormData();

        formData.append("cedula", userData.docNumber || "");
        formData.append("nombres", userData.firstName || "");
        formData.append("apellidos", userData.lastName || "");
        formData.append("email", userData.email || "");
        formData.append("telefono", userData.phone || "");
        formData.append("tipo_documento", selectedDocType || "");
        formData.append("fecha_nacimiento", userData.birthDate || "");
        formData.append("banco_preferido", selectedBank || "");
        formData.append("numero_cuenta", userData.accountNumber || "");
        formData.append("tipo", selectedRol || "");

        if (currentPassword && newPassword) {
          formData.append("contrasena_actual", currentPassword);
          formData.append("nueva_contrasena", newPassword);
        }

        if (profileImage) {
          const uriParts = profileImage.uri.split(".");
          const fileType = uriParts[uriParts.length - 1];

          formData.append("foto_perfil", {
            uri: profileImage.uri,
            name: `perfil.${fileType}`,
            type: `image/${fileType}`,
          });
        }

        body = formData;
      }

      const response = await fetch(
        `https://backend-arriendos-v2-production.up.railway.app/api/auth/usuarios/${user?.id}`,
        {
          method: "PUT",
          headers,
          body,
        }
      );

      if (response.ok) {
        alert("Perfil actualizado correctamente");
        // Limpiar las contraseñas después de guardar exitosamente
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const error = await response.json();
        alert("Error: " + error.message);
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      alert("Error de conexión con el servidor");
    }
  };
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
            <TouchableOpacity onPress={pickProfileImage}>
              <Image
                source={
                  profileImage
                    ? { uri: profileImage.uri }
                    : userData.foto_perfil
                      ? {
                        uri: `https://backend-arriendos-v2-production.up.railway.app/images/${userData.foto_perfil}`,
                      }
                      : require("../../assets/user-icon.png")
                }
                style={styles.icon}
              />
            </TouchableOpacity>

            <View style={[styles.form, { width: inputWidth }]}>
              <Text style={[styles.title, { fontSize: fontSizeTitle }]}>
                Perfil
              </Text>

              <Text style={styles.label}>Rol</Text>
              <View style={styles.accordionContainer}>
                <TouchableOpacity style={styles.accordionHeader}>
                  <Text style={styles.accordionTitle}>
                    Elija un rol: {selectedRol || "Ninguno"}
                  </Text>
                  <Ionicons
                    name={expandedRol ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="black"
                  />
                </TouchableOpacity>
                {false && (
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

              <Text style={styles.label}>Tipo de documento</Text>
              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={toggleExpandDocType}
                >
                  <Text style={styles.accordionTitle}>
                    Elija su tipo de identificación:{" "}
                    {userData.selectedDocType || selectedDocType || "Ninguno"}
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
                value={userData.docNumber}
                placeholder="Número de documento"
                keyboardType="numeric"
                editable={false}
              />

              <Text style={styles.label}>Nombres</Text>
              <TextInput
                style={styles.input}
                value={userData.firstName}
                onChangeText={(text) =>
                  setUserData({ ...userData, firstName: text })
                }
              />

              <Text style={styles.label}>Apellidos</Text>
              <TextInput
                style={styles.input}
                value={userData.lastName}
                onChangeText={(text) =>
                  setUserData({ ...userData, lastName: text })
                }
              />

              <Text style={styles.label}>Fecha de nacimiento</Text>

              {Platform.OS === "web" ? (
                <input
                  style={{ ...styles.input, padding: 10, borderRadius: 8 }}
                  type="date"
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
                    <Text
                      style={{ color: userData.birthDate ? "#000" : "#aaa" }}
                    >
                      {userData.birthDate
                        ? new Date(userData.birthDate).toLocaleDateString()
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
                      value={
                        userData.birthDate
                          ? new Date(userData.birthDate)
                          : new Date()
                      }
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, selectedDate) => {
                        setMostrarCalendario(false);
                        if (selectedDate) {
                          setUserData({
                            ...userData,
                            birthDate: selectedDate.toISOString(),
                          });
                        }
                      }}
                    />
                  )}
                </>
              )}

              <Text style={styles.label}>Teléfono</Text>

              <TextInput
                style={styles.input}
                value={userData.phone}
                keyboardType="phone-pad"
                maxLength={10} 
                onChangeText={(text) =>
                  setUserData({ ...userData, phone: text })
                }
              />

              <Text style={styles.label}>Correo</Text>
              <TextInput
                style={styles.input}
                value={userData.email}
                keyboardType="email-address"
                onChangeText={(text) =>
                  setUserData({ ...userData, email: text })
                }
              />

              <Text style={styles.label}>Contraseña actual</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Contraseña actual"
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Icon
                    name={
                      showCurrentPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={22}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nueva contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nueva contraseña"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Número de cuenta</Text>
              <TextInput
                style={styles.input}
                value={userData.accountNumber}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setUserData({ ...userData, accountNumber: text })
                }
              />

              <Text style={styles.label}>Banco</Text>
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
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
