import React, { useState } from "react";
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
import styles from "../../styles/EditRoomScreenStyles";

import * as ImagePicker from "expo-image-picker";
//import { AuthContext } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const AdminEditRoom = ({ navigation, route }) => {
  // VALIDACIÓN SIN ROMPER LOS HOOKS
  const params = route?.params;
  const isInvalid = !params || !params.roomData;

  //const { user } = useContext(AuthContext);
  const {
    residenciaId,
    cantidad_habitaciones,
    //habitaciones_registradas,
    precio_total_residencia,
    sumaPreciosActuales,
    comodidades_residencia,
    convivencia_residencia,
    habitaciones_registradas_array,
    capacidad_total,
    capacidad_actual,
    roomData,
    roomId,
  } = params || {};

  // Capacidad original del cuarto
  const capacidadOriginalHabitacion = Number(roomData?.capacidad) || 0;

  // Capacidad total de la residencia (viene desde route)
  const capacidadTotalNum = Number(capacidad_total) || 0;

  // Personas ya asignadas EN TODA LA RESIDENCIA excepto este cuarto
  const capacidadActualNum = Number(capacidad_actual) || 0;

  // Capacidad disponible real
  const capacidadDisponible = capacidadTotalNum - capacidadActualNum;

  const mapAmenityLabelToKey = {
    "Ducha eléctrica": "electricShower",
    "Ducha con calefón": "showerHeater",
    Lavadora: "washer",
    Secadora: "dryer",
    Internet: "internet",
    Agua: "water",
    Luz: "light",
  };

  const mapCoexistenceLabelToKey = {
    "Mascotas permitidas": "petsAllowed",
    "Baño compartido": "sharedBathroom",
    "Ducha compartida": "sharedShower",
    "Cocina compartida": "sharedKitchen",
    "Sala compartida": "sharedLivingRoom",
    "Comedor compartido": "sharedDinigRoom",
  };

  // AHORA SÍ CONVERTIMOS LA LISTA DE LA RESIDENCIA EN KEYS
  const parsedComodidadesResidencia =
    typeof comodidades_residencia === "string"
      ? comodidades_residencia
          .split(",")
          .map((c) => mapAmenityLabelToKey[c.trim()])
          .filter(Boolean)
      : Array.isArray(comodidades_residencia)
      ? comodidades_residencia.map((c) => mapAmenityLabelToKey[c.trim()] || c)
      : [];

  const parsedConvivenciaResidencia =
    typeof convivencia_residencia === "string"
      ? convivencia_residencia
          .split(",")
          .map((c) => mapCoexistenceLabelToKey[c.trim()])
          .filter(Boolean)
      : Array.isArray(convivencia_residencia)
      ? convivencia_residencia.map(
          (c) => mapCoexistenceLabelToKey[c.trim()] || c
        )
      : [];

  // ESTOS SON LOS QUE USAN LOS COMPONENTES
  const allowedAmenities = parsedComodidadesResidencia;
  const allowedCoexistence = parsedConvivenciaResidencia;

  //const sumaPreciosActuales1 = parseFloat(route.params.sumaPreciosActuales ?? "0");
  console.log("=== DEBUG EDIT ROOM ===");
  console.log("sumaPreciosActuales recibido:", sumaPreciosActuales);
  console.log("typeof sumaPreciosActuales:", typeof sumaPreciosActuales);
  console.log("String representation:", String(sumaPreciosActuales));

  let sumaActual = 0;
  if (sumaPreciosActuales && !isNaN(parseFloat(sumaPreciosActuales))) {
    sumaActual = parseFloat(sumaPreciosActuales);
  }

  console.log("Suma de precios actuales:", sumaActual);

  //Variables
  const [images, setImages] = useState([]); // imágenes con estructura { uri, name, isNew }
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  const [amenities, setAmenities] = useState(
    allowedAmenities.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {})
  );

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
  const [numeroHabitacion, setNumeroHabitacion] = useState("");
  //const precioRestante = precio_total_residencia - sumaActual;
  const precioRecomendado = (
    precio_total_residencia / cantidad_habitaciones
  ).toFixed(2);

  const esUltimaHabitacion =
    habitaciones_registradas_array?.length === cantidad_habitaciones;
  const numeroExistente =
    habitaciones_registradas_array?.includes(numeroHabitacion);
  const [expandedAvailability, setExpandedAvailability] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const availabilityOptions = ["disponible", "ocupado", "mantenimiento"];

  const etiquetasComodidades = {
    electricShower: {
      titulo: "Ducha eléctrica",
      subtitulo: "Escoja esta opción si el cuarto cuenta con ducha eléctrica",
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
    (c) => !allowedAmenities.includes(c)
  );

  const convivenciaSeleccionada = Object.keys(coexistence).filter(
    (k) => coexistence[k]
  );
  const convivenciaNoPermitida = convivenciaSeleccionada.filter(
    (c) => !allowedCoexistence.includes(c)
  );

  //Dimesiones y estilos
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";
  const fontSizeTitle = isWeb ? 40 : screenWidth * 0.12;

  React.useEffect(() => {
    const mapAmenityLabelToKey = {
      "Ducha eléctrica": "electricShower",
      "Ducha con calefón": "showerHeater",
      Lavadora: "washer",
      Secadora: "dryer",
      Internet: "internet",
      Agua: "water",
      Luz: "light",
    };

    const mapCoexistenceLabelToKey = {
      "Mascotas permitidas": "petsAllowed",
      "Baño compartido": "sharedBathroom",
      "Ducha compartida": "sharedShower",
      "Cocina compartida": "sharedKitchen",
      "Sala compartida": "sharedLivingRoom",
      "Comedor compartido": "sharedDinigRoom",
    };

    const initializeRoomData = () => {
      if (!roomData) return;

      setNumeroHabitacion(roomData.numero_habitacion?.toString() ?? "");
      setCapacidad(roomData.capacidad?.toString() ?? "");
      setPropertyPrice(roomData.precio_mensual?.toString() ?? "");
      setCaracteristicas(roomData.caracteristicas ?? "");
      setSelectedAvailability(roomData.disponibilidad ?? "");

      let fotos = [];
      try {
        fotos = Array.isArray(roomData.fotos)
          ? roomData.fotos
          : JSON.parse(roomData.fotos ?? "[]");
      } catch (e) {
        console.error("Error al parsear fotos:", e);
      }

      const formattedImages = fotos.map((nombre) => ({
        uri: `https://backend-arriendos-v2-production.up.railway.app/images/${nombre}`,
        name: nombre,
        isNew: false,
      }));

      setImages(formattedImages);
      setImage(formattedImages[0]?.uri ?? null);

      const comodidadesKeys = roomData.comodidades
        ?.split(", ")
        .map((label) => mapAmenityLabelToKey[label.trim()]);

      const initialAmenities = allowedAmenities.reduce((acc, key) => {
        acc[key] = comodidadesKeys?.includes(key);
        return acc;
      }, {});
      setAmenities(initialAmenities);

      const convivenciaKeys = roomData.convivencia
        ?.split(", ")
        .map((label) => mapCoexistenceLabelToKey[label.trim()]);

      const initialCoexistence = allowedCoexistence.reduce((acc, key) => {
        acc[key] = convivenciaKeys?.includes(key);
        return acc;
      }, {});
      setCoexistence(initialCoexistence);
    };

    initializeRoomData();
  }, [roomData]);

  const toggleAmenity = (key) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCoexistence = (key) => {
    setCoexistence((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const AmenitiesOptions = ({ selected, toggleCheckbox, allowed }) => {
    const safeAllowed = Array.isArray(allowed) ? allowed : [];

    return (
      <View style={styles.genderRow}>
        {safeAllowed.map((key) => (
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
    const safeAllowed = Array.isArray(allowed) ? allowed : [];

    return (
      <View style={styles.genderRow}>
        {safeAllowed.map((key) => (
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
        selectionLimit: 5 - images.length,
        quality: 0.5,
      });
      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.uri.split("/").pop(),
          isNew: true,
        }));
        const combinedImages = [...images, ...newImages];
        if (combinedImages.length > 5) {
          alert("Solo puedes elegir hasta 5 imágenes en total.");
          return;
        }
        setImages(combinedImages);
        setImage(combinedImages[0]?.uri);
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      alert("Error al seleccionar imagen. Inténtalo de nuevo.");
    }
  };

  const handleDeleteImage = (index) => {
    const imageToDelete = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (!imageToDelete.isNew) {
      setImagesToDelete((prev) => [...prev, imageToDelete.name]);
    }
  };

  const validateRoomData = () => {
    if (
      !caracteristicas ||
      !propertyPrice ||
      !image ||
      !numeroHabitacion ||
      !capacidad
    ) {
      alert("Por favor complete todos los campos obligatorios");
      return false;
    }

    if (!numeroHabitacion.trim()) {
      alert("Por favor ingrese el número de habitación.");
      return false;
    }

    const capacidadOriginal = parseFloat(roomData?.capacidad || "0");
    const nuevaCapacidad = parseFloat(capacidad);
    const capacidadDisponibleReal = capacidadDisponible + capacidadOriginal;

    if (nuevaCapacidad <= 0) {
      alert("La capacidad debe ser mayor a cero.");
      return false;
    }

    if (nuevaCapacidad > capacidadDisponibleReal) {
      alert(
        `Solo puedes asignar hasta ${capacidadDisponibleReal} persona(s) a esta habitación.`
      );
      return false;
    }

    const nuevoPrecioHabitacion = parseFloat(propertyPrice);
    if (nuevoPrecioHabitacion <= 0) {
      alert("El precio debe ser mayor a cero.");
      return false;
    }

    // VALIDACIÓN CORRECTA: Calcular la suma total sin esta habitación
    const precioOriginalHabitacion = parseFloat(roomData?.precio_mensual) || 0;
    const sumaSinEstaHabitacion = sumaActual - precioOriginalHabitacion;
    const nuevaSumaTotal = sumaSinEstaHabitacion + nuevoPrecioHabitacion;

    console.log("=== VALIDACIÓN FINAL ===");
    console.log("Precio total residencia:", precio_total_residencia);
    console.log("Suma actual:", sumaActual);
    console.log("Precio original habitación:", precioOriginalHabitacion);
    console.log("Suma sin esta habitación:", sumaSinEstaHabitacion);
    console.log("Nuevo precio habitación:", nuevoPrecioHabitacion);
    console.log("Nueva suma total:", nuevaSumaTotal);

    if (nuevaSumaTotal > precio_total_residencia) {
      const precioMaximoPermitido =
        precio_total_residencia - sumaSinEstaHabitacion;
      alert(
        `El precio ingresado haría que la suma total ($${nuevaSumaTotal.toFixed(
          2
        )}) supere el precio de la residencia ($${precio_total_residencia}). El precio máximo permitido para esta habitación es $${precioMaximoPermitido.toFixed(
          2
        )}.`
      );
      return false;
    }

    // Validar precio exacto solo si estás agregando la última habitación, no al editar
    // Esta validación solo aplica al crear, NO al editar
    const esEdicion = !!roomData;

    if (
      !esEdicion &&
      esUltimaHabitacion &&
      habitaciones_registradas_array?.length === cantidad_habitaciones &&
      nuevaSumaTotal !== precio_total_residencia
    ) {
      const precioExactoRequerido =
        precio_total_residencia - sumaSinEstaHabitacion;

      alert(
        `Como esta es la última habitación registrada, el precio debe ser exactamente $${precioExactoRequerido.toFixed(
          2
        )} para que la suma total sea $${precio_total_residencia}.`
      );

      return false;
    }

    if (noPermitidas.length > 0) {
      const nombres = noPermitidas.map((c) => etiquetasComodidades[c] ?? c);
      alert(`Comodidades no disponibles: ${nombres.join(", ")}`);
      return false;
    }

    if (convivenciaNoPermitida.length > 0) {
      const nombres = convivenciaNoPermitida.map(
        (c) => etiquetasConvivencia[c] ?? c
      );
      alert(`Convivencia no permitida: ${nombres.join(", ")}`);
      return false;
    }

    const numeroModificado =
      numeroHabitacion !== roomData.numero_habitacion?.toString();
    if (numeroModificado && numeroExistente) {
      alert("Ya existe una habitación con ese número.");
      return false;
    }

    if (!selectedAvailability) {
      alert("Por favor seleccione una disponibilidad.");
      return false;
    }

    return true;
  };
  const generateAmenitiesString = () => {
    return Object.entries(amenities)
      .filter(([key, value]) => value)
      .map(([key]) => etiquetasComodidades[key]?.titulo ?? "")
      .join(", ");
  };
  const generateCoexistenceString = () => {
    return Object.entries(coexistence)
      .filter(([key, value]) => value)
      .map(([key]) => etiquetasConvivencia[key]?.titulo ?? "")
      .join(", ");
  };
  const buildFormData = async () => {
    const formData = new FormData();
    formData.append("id_propiedad", residenciaId);
    formData.append("caracteristicas", caracteristicas);
    formData.append("precio_mensual", parseFloat(propertyPrice) ?? 0);
    formData.append("capacidad", capacidad);
    formData.append("comodidades", generateAmenitiesString());
    formData.append("convivencia", generateCoexistenceString());
    formData.append("numero_habitacion", numeroHabitacion);
    formData.append("disponibilidad", selectedAvailability);

    const existingImagesToKeep = images
      .filter((img) => !img.isNew && !imagesToDelete.includes(img.name))
      .map((img) => img.name);
    formData.append("existingImages", JSON.stringify(existingImagesToKeep));

    for (const img of images) {
      if (img.isNew) {
        if (Platform.OS === "web") {
          const response = await fetch(img.uri);
          const blob = await response.blob();
          const file = new File([blob], img.name, { type: blob.type });
          formData.append("fotos", file);
        } else {
          const match = /\.(\w+)$/.exec(img.name ?? "");
          const type = match ? `image/${match[1]}` : `image/png`;
          formData.append("fotos", {
            uri: img.uri,
            name: img.name,
            type,
          });
        }
      }
    }

    if (imagesToDelete.length > 0) {
      formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }

    return formData;
  };
  const handleEditRoom = async () => {
    try {
      if (!validateRoomData()) return;

      const formData = await buildFormData();

      const response = await fetch(
        `https://backend-arriendos-v2-production.up.railway.app/api/auth/rooms/${roomId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Error en el servidor");

      alert("Cuarto actualizado con éxito!");
      navigation.goBack();
    } catch (error) {
      console.error("Error al editar cuarto:", error);
      alert(
        `Error al editar cuarto: ${
          error.message ?? "Inténtalo de nuevo más tarde"
        }`
      );
    }
  };

  const handlePriceChange = (text) => {
    const numericText = text.replace(/[^0-9.]/g, "");
    const nuevoPrecio = parseFloat(numericText) || 0;

    // Calcular el precio máximo permitido para esta habitación
    const precioOriginalHabitacion = parseFloat(roomData?.precio_mensual) || 0;
    const sumaSinEstaHabitacion = sumaActual - precioOriginalHabitacion;
    const precioMaximoPermitido =
      precio_total_residencia - sumaSinEstaHabitacion;

    console.log("=== VALIDACIÓN DE PRECIO ===");
    console.log("Precio total residencia:", precio_total_residencia);
    console.log("Suma actual sin esta habitación:", sumaSinEstaHabitacion);
    console.log("Precio máximo permitido:", precioMaximoPermitido);
    console.log("Nuevo precio ingresado:", nuevoPrecio);

    if (nuevoPrecio > precioMaximoPermitido) {
      alert(
        `El precio máximo permitido para esta habitación es $${precioMaximoPermitido.toFixed(
          2
        )}. La suma total no puede superar $${precio_total_residencia}.`
      );
      // Establecer el precio máximo permitido
      setPropertyPrice(precioMaximoPermitido.toFixed(2));
    } else {
      setPropertyPrice(numericText);
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
  // RETORNO SEGURO DESPUÉS DE LOS HOOKS (NO ROMPE REGLA DE HOOKS)
  if (isInvalid) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18 }}>
          No se pudo cargar la información del cuarto.
        </Text>
      </View>
    );
  }

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
          <View style={styles.container}>
            <Header isLoggedIn={true} />

            <View style={[styles.form, { width: inputWidth }]}>
              <Text
                style={[
                  styles.title,
                  { fontSize: fontSizeTitle, textAlign: "center" },
                ]}
              >
                Editar Cuarto
              </Text>

              <TouchableOpacity
                onPress={() => setIsImageModalVisible(true)}
                style={styles.carouselContainer}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.carouselImage} />
                ) : (
                  <Text style={styles.imagePlaceholder}>Sin imágenes</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.addImageButton}
              >
                <Text style={styles.addImageText}>+ Agregar más imágenes</Text>
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
                Capacidad total de la residencia: {capacidadTotalNum} personas.
                {"\n"}
                Ya se han asignado: {capacidadActualNum} personas.
                {"\n"}
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
                {precio_total_residencia}.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="$"
                keyboardType="numeric"
                value={propertyPrice}
                onChangeText={handlePriceChange}
              />

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
                allowed={allowedAmenities}
              />

              <Text style={styles.label}>Convivencia</Text>
              <CoexistenceOptions
                selected={coexistence}
                toggleCheckbox={toggleCoexistence}
                allowed={allowedCoexistence}
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
                  onPress={handleEditRoom}
                >
                  <Text style={styles.buttonText}>Actualizar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      {isImageModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              onPress={() => setIsImageModalVisible(false)}
              style={styles.closeModalButton}
            >
              <Text style={styles.closeModalText}> X </Text>
            </TouchableOpacity>
            <ScrollView horizontal>
              {images.map((img, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                  <TouchableOpacity
                    style={styles.deleteIcon}
                    onPress={() => handleDeleteImage(index)}
                  >
                    <Ionicons name="trash" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.imageCount}>{images.length}/5 imágenes</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default AdminEditRoom;
