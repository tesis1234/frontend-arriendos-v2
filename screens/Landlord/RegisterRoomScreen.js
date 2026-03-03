import React, { useState, useContext, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  LayoutAnimation,
} from "react-native";
import { Checkbox, Text } from "react-native-paper";
import Header from "../../components/Header";
import styles from "../../styles/RegisterPropertyScreenStyles";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../../context/AuthContext";
import imageCompression from "browser-image-compression";
import { Ionicons } from "@expo/vector-icons";

const RegisterRoomScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const {
    idPropiedad,
    cantidad_habitaciones,
    habitaciones_registradas,
    precio_total_residencia,
    sumaPreciosActuales,
    comodidades_residencia,
    convivencia_residencia,
    habitaciones_registradas_array,
    capacidad_total,
    capacidad_actual,
  } = route.params;

  //Variables
  const capacidadDisponible = capacidad_total - capacidad_actual;

  const allowedAmenities = comodidades_residencia || [];
  const [amenities, setAmenities] = useState(
    allowedAmenities.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {})
  );

  const allowedCoexistence = convivencia_residencia || [];
  const [coexistence, setCoexistence] = useState(
    allowedCoexistence.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {})
  );

  const [image, setImage] = useState(null);
  const [capacidad, setCapacidad] = useState(0);
  const [caracteristicas, setCaracteristicas] = useState("");
  const [propertyPrice, setPropertyPrice] = useState("");
  const [imageArray, setImageArray] = useState([]);
  const [numeroHabitacion, setNumeroHabitacion] = useState("");
  const precioRestante = precio_total_residencia - sumaPreciosActuales;
  // Calcula una sola vez al cargar la pantalla
  const [precioRecomendado, setPrecioRecomendado] = useState("0.00");
  const [precioResidenciaFijo, setPrecioResidenciaFijo] = useState("0.00");

  useEffect(() => {
    const fetchDatosResidencia = async () => {
      try {
        let totalResidencia = Number(precio_total_residencia);
        let totalHabitaciones = Number(cantidad_habitaciones);

        // Si no llegan por route.params, busca desde la API
        if (!totalResidencia || !totalHabitaciones) {
          const res = await fetch(
            `https://backend-arriendos-v2-production.up.railway.app/api/residencias/${idPropiedad}`
          );
          const data = await res.json();

          totalResidencia = Number(data.precio_total) || 0;
          totalHabitaciones = Number(data.cantidad_habitaciones) || 1;
        }

        if (totalResidencia > 0 && totalHabitaciones > 0) {
          const recomendado = (totalResidencia / totalHabitaciones).toFixed(2);
          setPrecioRecomendado(recomendado);
          setPrecioResidenciaFijo(totalResidencia.toFixed(2));
        }
      } catch (error) {
        console.error("Error al obtener datos de la residencia:", error);
        setPrecioRecomendado("0.00");
        setPrecioResidenciaFijo("0.00");
      }
    };

    fetchDatosResidencia();
  }, [cantidad_habitaciones, idPropiedad, precio_total_residencia]);

  const esUltimaHabitacion =
    habitaciones_registradas + 1 === cantidad_habitaciones;
  const numeroExistente =
    habitaciones_registradas_array?.includes(numeroHabitacion);
  const [expandedAvailability, setExpandedAvailability] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const availabilityOptions = ["disponible", "ocupado", "mantenimiento"];

  const precioActual = parseFloat(propertyPrice || "0");
  const sumaActual = parseFloat(sumaPreciosActuales || "0");
  const sumaFinal = parseFloat((sumaActual + precioActual).toFixed(2));

  const etiquetasComodidades = {
    electricShower: {
      titulo: "Ducha eléctrica",
      subtitulo: "Escoja esta opción si el cuarto  cuenta con ducha eléctrica",
    },
    showerHeater: {
      titulo: "Ducha con calefón",
      subtitulo: "AEscoja esta opción si el cuarto cuenta con calefón",
    },
    washer: {
      titulo: "Lavadora",
      subtitulo: "Escoja esta opción si el cuarto cuenta con lavadora",
    },
    dryer: {
      titulo: "Secadora",
      subtitulo: "Escoja esta opción si el cuarto cuenta con secadora",
    },
    internet: {
      titulo: "Internet",
      subtitulo: "Escoja esta opción si el cuarto cuenta con internet",
    },
    water: {
      titulo: "Agua",
      subtitulo: "Escoja esta opción si incluye servicio de Agua Potable",
    },
    light: {
      titulo: "Luz",
      subtitulo: "Escoja esta opción si incluye el servicio de luz eléctrica",
    },
  };

  const etiquetasConvivencia = {
    petsAllowed: {
      titulo: "Mascotas permitidas",
      subtitulo: "Escoja esta opción si permite el ingreso de mascotas",
    },
    sharedBathroom: {
      titulo: "Baño compartido",
      subtitulo: "Escoja esta opción si tiene que compartir el baño",
    },
    sharedShower: {
      titulo: "Ducha compartida",
      subtitulo: "Escoja esta opción si tiene que compartir la ducha",
    },
    sharedKitchen: {
      titulo: "Cocina compartida",
      subtitulo: "Escoja esta opción si la cocina es compartida",
    },
    sharedLivingRoom: {
      titulo: "Sala compartida",
      subtitulo: "Escoja esta opción si la sala es compartida",
    },
    sharedDinigRoom: {
      titulo: "Comedor compartido",
      subtitulo: "Escoja esta opción si el comedor es compartido",
    },
  };

  const comodidadesSeleccionadas = Object.keys(amenities).filter(
    (k) => amenities[k]
  );
  const noPermitidas = comodidadesSeleccionadas.filter(
    (c) => !comodidades_residencia.includes(c)
  );
  const convivenciaSeleccionada = Object.keys(coexistence).filter(
    (k) => coexistence[k]
  );
  const convivenciaNoPermitida = convivenciaSeleccionada.filter(
    (c) => !convivencia_residencia.includes(c)
  );
  //Dimesiones y estilos
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";
  const fontSizeTitle = isWeb ? 40 : screenWidth * 0.12;

  //

  //Metodos

  const toggleAmenity = (key) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCoexistence = (key) => {
    setCoexistence((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const AmenitiesOptions = ({ selected, toggleCheckbox, allowed }) => {
    return (
      <View style={styles.genderRow}>
        {allowed.map((key) => (
          <View key={key} style={styles.genderOption}>
            <Checkbox
              status={selected[key] ? "checked" : "unchecked"}
              onPress={() => toggleCheckbox(key)}
            />
            <View style={styles.genderTextBlock}>
              <Text style={styles.genderLabel}>
                {etiquetasComodidades[key]?.titulo}
              </Text>
              <Text style={styles.genderSubLabel}>
                {etiquetasComodidades[key]?.subtitulo}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const CoexistenceOptions = ({ selected, toggleCheckbox, allowed }) => {
    return (
      <View style={styles.genderRow}>
        {allowed.map((key) => (
          <View key={key} style={styles.genderOption}>
            <Checkbox
              status={selected[key] ? "checked" : "unchecked"}
              onPress={() => toggleCheckbox(key)}
            />
            <View style={styles.genderTextBlock}>
              <Text style={styles.genderLabel}>
                {etiquetasConvivencia[key]?.titulo}
              </Text>
              <Text style={styles.genderSubLabel}>
                {etiquetasConvivencia[key]?.subtitulo}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Se requiere permiso para acceder a la galería");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - imageArray.length, // Limitar la selección
        quality: 0.5,
      });

      if (!result.canceled && result.assets) {
        // Verifica si se seleccionaron más de 5 imágenes
        if (imageArray.length + result.assets.length > 5) {
          alert("Solo puedes elegir hasta 5 imágenes.");
          return;
        }

        const newImages = result.assets.map((asset) => asset.uri);
        const updatedImages = [...imageArray, ...newImages].slice(0, 5);
        setImageArray(updatedImages);
        setImage(updatedImages[0]);
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      alert("Error al seleccionar imagen. Inténtalo de nuevo.");
    }
  };

  const handleRegisterRoom = async () => {
    try {
      if (habitaciones_registradas >= cantidad_habitaciones) {
        alert(
          "Ya se han registrado todas las habitaciones permitidas para esta residencia."
        );
        return;
      }
      if (
        !caracteristicas ||
        !propertyPrice ||
        !image ||
        !numeroHabitacion ||
        !capacidad
      ) {
        alert("Por favor complete todos los campos obligatorios");
        return;
      }

      if (!numeroHabitacion.trim()) {
        alert("Por favor ingrese el número de habitación.");
        return;
      }

      if (parseFloat(capacidad) <= 0) {
        alert("La capacidad de personas debe ser mayor a cero.");
        return;
      }

      if (capacidad > capacidadDisponible) {
        alert(
          `Esta residencia solo tiene capacidad para ${capacidad_total} personas.\n` +
          `Ya se han asignado ${capacidad_actual} personas.\n` +
          `Solo puedes agregar hasta ${capacidadDisponible} persona(s) en esta habitación.`
        );
        return;
      }

      if (parseFloat(propertyPrice) <= 0) {
        alert("El precio debe ser mayor a cero.");
        return;
      }

      if (
        esUltimaHabitacion &&
        sumaFinal !==
        parseFloat(parseFloat(precio_total_residencia || "0").toFixed(2))
      ) {
        alert(
          `La suma total de precios no coincide con el valor de la residencia. Debe ser exactamente $${precio_total_residencia}. .`
        );
        return;
      }

      if (parseFloat(propertyPrice) > precioRestante) {
        alert(
          `El valor mensual de la residencia no coincide. Te quedan $${precioRestante.toFixed(
            2
          )} por distribuir.`
        );
        return;
      }

      if (noPermitidas.length > 0) {
        const nombres = noPermitidas.map((c) => etiquetasComodidades[c] || c);
        alert(
          `Las siguientes comodidades no están disponibles en esta residencia: ${nombres.join(
            ", "
          )}`
        );
        return;
      }

      if (convivenciaNoPermitida.length > 0) {
        const nombres = convivenciaNoPermitida.map(
          (c) => etiquetasConvivencia[c] || c
        );
        alert(
          `Las siguientes reglas de convivencia no están disponibles en esta residencia: ${nombres.join(
            ", "
          )}`
        );
        return;
      }

      if (numeroExistente) {
        alert(
          "Ya existe una habitación con ese número. Por favor, elige otro."
        );
        return;
      }
      if (!selectedAvailability) {
        alert("Por favor seleccione una disponibilidad para la habitación.");
        return;
      }

      const amenitiesString = Object.entries(amenities)
        .filter(
          ([key, value]) =>
            value &&
            [
              "electricShower",
              "showerHeater",
              "washer",
              "dryer",
              "internet",
              "water",
              "light",
            ].includes(key)
        )
        .map(([key]) => {
          if (key === "electricShower") return "Decha eléctrica";
          if (key === "showerHeater") return "Ducha con calefón";
          if (key === "washer") return "Lavadora";
          if (key === "dryer") return "Secadora";
          if (key === "internet") return "Internet";
          if (key === "water") return "Agua";
          if (key === "light") return "Luz";
          return "";
        })
        .join(", ");

      const coexistenceString = Object.entries(coexistence)
        .filter(
          ([key, value]) =>
            value &&
            [
              "petsAllowed",
              "sharedBathroom",
              "sharedShower",
              "sharedKitchen",
              "sharedLivingRoom",
              "sharedDinigRoom",
            ].includes(key)
        )
        .map(([key]) => {
          if (key === "petsAllowed") return "Mascotas permitidas";
          if (key === "sharedBathroom") return "Baño compartido";
          if (key === "sharedShower") return "Ducha compartida";
          if (key === "sharedKitchen") return "Cocina compartida";
          if (key === "sharedLivingRoom") return "Sala compartida";
          if (key === "sharedDinigRoom") return "Comedor compartido";
          return "";
        })
        .join(", ");

      const formData = new FormData();

      formData.append("id_propietario", user?.id ?? "");
      console.log("ID de propiedad:", idPropiedad);

      formData.append("id_propiedad", idPropiedad);
      formData.append("caracteristicas", caracteristicas);
      formData.append("precio_mensual", parseFloat(propertyPrice) ?? 0);
      formData.append("capacidad", capacidad);
      formData.append("comodidades", amenitiesString);
      formData.append("convivencia", coexistenceString);
      formData.append("numero_habitacion", numeroHabitacion);
      formData.append("disponibilidad", selectedAvailability);

      for (const uri of imageArray) {
        let filename = uri.split("/").pop();

        if (!/\.(png|jpg|jpeg|webp)$/i.test(filename)) {
          filename = `image_${Date.now()}.png`;
        }

        if (Platform.OS === "web") {
          const response = await fetch(uri);
          const blob = await response.blob();
          const ext = blob.type.split("/")[1] ?? "png";

          let filename = `image_${Date.now()}.${ext}`;

          const file = new File([blob], filename, { type: blob.type });

          const compressedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
            fileType: blob.type,
          });

          console.log("Archivo web:", {
            name: compressedFile.name,
            type: compressedFile.type,
            size: compressedFile.size,
          });

          formData.append("fotos", compressedFile);
        } else {
          // Para iOS / Android
          const match = /\.(\w+)$/.exec(filename ?? "");
          let ext = match?.[1]?.toLowerCase() || "jpg";
          if (ext === "jpg") ext = "jpeg";

          const type = `image/${ext}`;
          formData.append("fotos", {
            uri,
            name: filename,
            type,
          });
        }
      }
      const response = await fetch(
        "https://backend-arriendos-v2-production.up.railway.app/api/auth/register-room",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Error en el servidor");
      }

      alert("Cuarto registrado con éxito!");
      navigation.goBack();
    } catch (error) {
      console.error("Error al registrar cuarto:", error);
      alert(
        `Error al registrar cuarto: ${error.message || "Inténtalo de nuevo más tarde"
        }`
      );
    }
  };

  const handlePriceChange = (text) => {
    const numericText = text.replace(/[^0-9.]/g, "");
    setPropertyPrice(numericText);
  };
  // Ajusta automáticamente el precio del último cuarto
  useEffect(() => {
    if (esUltimaHabitacion) {
      const totalResidencia = parseFloat(precio_total_residencia || "0");
      const sumaActual = parseFloat(sumaPreciosActuales || "0");
      const faltante = parseFloat((totalResidencia - sumaActual).toFixed(2));

      // Si hay diferencia, asigna automáticamente el faltante como precio
      if (faltante > 0) {
        setPropertyPrice(faltante.toString());
      } else {
        setPropertyPrice("0.00");
      }
    }
  }, [esUltimaHabitacion, precio_total_residencia, sumaPreciosActuales]);

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
            <Header isLoggedIn={true} />

            <View style={[styles.form, { width: inputWidth }]}>
              <Text
                style={[
                  styles.title,
                  { fontSize: fontSizeTitle, textAlign: "center" },
                ]}
              >
                Registro de Cuarto
              </Text>

              <TouchableOpacity
                onPress={pickImage}
                style={[styles.imagePicker, { width: inputWidth }]}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                ) : (
                  <Text style={styles.imagePlaceholder}>+ Agregar imagen</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Número de habitación</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 101"
                keyboardType="numeric"
                value={numeroHabitacion}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, "");
                  setNumeroHabitacion(numericText);
                }}
              />

              <Text style={styles.label}>Capacidad</Text>
              <Text style={{ color: "#666", fontSize: 14 }}>
                Capacidad total de la residencia: {capacidad_total} personas.
                {"\n"}
                Ya se han asignado: {capacidad_actual} personas.{"\n"}
                Personas disponibles para asignar: {capacidadDisponible}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Número de personas"
                keyboardType="numeric"
                value={capacidad.toString()}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, "");
                  const cleanedText = numericText.replace(/^0+(?!$)/, ""); // Elimina ceros iniciales
                  setCapacidad(cleanedText);
                }}
              />

              <Text style={styles.label}>Precio</Text>
              <Text style={styles.recommendedPrice}>
                Precio recomendado por habitación: ${precioRecomendado}
              </Text>
              <Text style={styles.recommendedNote}>
                Puedes modificarlo, pero la suma total debe ser igual a $
                {precioResidenciaFijo}.
              </Text>
              <TextInput
                style={[
                  styles.input,
                  esUltimaHabitacion && {
                    backgroundColor: "#f0f0f0",
                    color: "#666",
                  },
                ]}
                placeholder="$"
                keyboardType="numeric"
                value={propertyPrice}
                onChangeText={handlePriceChange}
                editable={!esUltimaHabitacion} // Bloquea si es la última habitación
              />
              {esUltimaHabitacion && (
                <Text style={{ color: "#555", fontSize: 13, marginTop: 4 }}>
                  Este es el último cuarto. Su valor se ajusta automáticamente a
                  ${propertyPrice} para mantener el total exacto.
                </Text>
              )}

              <Text style={styles.label}>Disponibilidad</Text>
              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut
                    );
                    setExpandedAvailability(!expandedAvailability);
                  }}
                >
                  <Text style={styles.accordionTitle}>
                    Elija la disponibilidad: {selectedAvailability || "Ninguno"}
                  </Text>
                  <Ionicons
                    name={expandedAvailability ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="black"
                  />
                </TouchableOpacity>
                {expandedAvailability && (
                  <View style={styles.accordionContent}>
                    {renderOptions(
                      availabilityOptions,
                      selectedAvailability,
                      setSelectedAvailability,
                      setExpandedAvailability
                    )}
                  </View>
                )}
              </View>

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={styles.input}
                placeholder="Escriba una descripción detallada"
                value={caracteristicas}
                onChangeText={setCaracteristicas}
                multiline
              />

              <Text style={styles.label}>Comodidades</Text>
              <AmenitiesOptions
                selected={amenities}
                toggleCheckbox={toggleAmenity}
                allowed={comodidades_residencia}
              />

              <Text style={styles.label}>Convivencia</Text>
              <CoexistenceOptions
                selected={coexistence}
                toggleCheckbox={toggleCoexistence}
                allowed={convivencia_residencia}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.back]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.buttonText}>Atrás</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.register]}
                  onPress={handleRegisterRoom}
                >
                  <Text style={styles.buttonText}>Registrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default RegisterRoomScreen;
