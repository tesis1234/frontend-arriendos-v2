import React, { useState, useContext } from "react";
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
import MapComponent from "../../components/MapComponent";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const RegisterPropertyScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  //Variables
  const [tenantType, setTenantType] = useState({
    men: false,
    women: false,
    mixed: false,
  });
  const [paymentMethods, setPaymentMethods] = useState({
    cash: false,
    deposit: false,
    transfer: false,
  });
  const [amenities, setAmenities] = useState({
    electricShower: false,
    showerHeater: false,
    washer: false,
    dryer: false,
    internet: false,
    water: false,
    light: false,
  });
  const [coexistence, setCoexistence] = useState({
    petsAllowed: false,
    sharedBathroom: false,
    sharedShower: false,
    sharedKitchen: false,
    sharedLivingRoom: false,
    sharedDinigRoom: false,
  });

  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [menCount, setMenCount] = useState(0);
  const [womenCount, setWomenCount] = useState(0);
  const [individualRoomsCount, setIndividualRoomsCount] = useState(0);
  const [individualBathroomsCount, setIndividualBathroomsCount] = useState(0);
  const [sharedBathroomsCount, setSharedBathroomsCount] = useState(0);
  const [livingRoomsCount, setLivingRoomsCount] = useState(0);
  const [parkingSpotsCount, setParkingSpotsCount] = useState(0);
  const [expandedRentalType, setExpandedRentalType] = useState(false);
  const [expandedRentalSector, setExpandedRentalSector] = useState(false);
  const [selectedRentalType, setSelectedRentalType] = useState(null);
  const [selectedRentalSector, setSelectedRentalSector] = useState(null);
  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [propertyPrice, setPropertyPrice] = useState("");
  const [imageArray, setImageArray] = useState([]);

  //Dimesiones y estilos
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";
  const fontSizeTitle = isWeb ? 40 : screenWidth * 0.12;

  //
  const rentalType = ["Residencia", "Departamento"];
  const rentalSector = ["Barrio Chino", "Puerta Principal (Pedro Vicente Maldonado)", "Puerta Intermedia (Milton Reyes)", "Puerta de Medicina (Canónico Ramos)"];

  //Metodos
  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Se requiere permiso para acceder a la ubicación.");
      return;
    }
    let currentLocation = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = currentLocation.coords;
    setLocation({ latitude, longitude });
    reverseGeocode(latitude, longitude); // Llama a la función creada
  };

  const handleAddressChange = (text) => {
    setAddress(text);

    if (debounceTimeout) clearTimeout(debounceTimeout);

    const timeout = setTimeout(() => {
      fetchLocationSuggestions(text);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const fetchLocationSuggestions = async (text) => {
    if (!text || text.length < 0) {
      setSuggestions([]);
      return;
    }

    const url = `https://backend-arriendos-v2-production.up.railway.app/geocode?q=${encodeURIComponent(
      text + ", Riobamba, Ecuador"
    )}`;
    try {
      const response = await axios.get(url);

      // Coordenadas aproximadas del cantón Riobamba
      const minLat = -1.8;
      const maxLat = -1.5;
      const minLon = -78.8;
      const maxLon = -78.5;

      const filtered = response.data.filter((item) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
      });

      setSuggestions(filtered);
    } catch (error) {
      console.error("Error al buscar la dirección:", error);
    }
  };

  const toggleTenantType = (key) => {
    setTenantType({ men: false, women: false, mixed: false, [key]: true });
  };

  const togglePaymentMethod = (key) => {
    setPaymentMethods({
      cash: false,
      deposit: false,
      transfer: false,
      [key]: true,
    });
  };

  const toggleAmenity = (key) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCoexistence = (key) => {
    setCoexistence((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const GenderOptions = ({ selected, toggleCheckbox }) => {
    return (
      <View style={styles.genderRow}>
        {[
          {
            key: "men",
            label: "Hombres",
            description:
              "Escoja esta opción si desea tener hombres en su arrendamiento",
          },
          {
            key: "women",
            label: "Mujeres",
            description:
              "Escoja esta opción si desea tener mujeres en su arrendamiento",
          },
          {
            key: "mixed",
            label: "Mixto",
            description: "Escoja esta opción si desea un arrendamiento mixto",
          },
        ].map(({ key, label, description }) => (
          <View key={key} style={styles.genderOption}>
            <Checkbox
              status={selected[key] ? "checked" : "unchecked"}
              onPress={() => toggleCheckbox(key)}
            />
            <View style={styles.genderTextBlock}>
              <Text style={styles.genderLabel}>{label}</Text>
              <Text style={styles.genderDescription}>{description}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const PaymentMethodsOptions = ({ selected, toggleCheckbox }) => {
    return (
      <View style={styles.genderRow}>
        {[
          {
            key: "cash",
            label: "Pago en efectivo",
            description:
              "Escoja esta opción si desea que el arriendo se genere en efectivo",
          },
          {
            key: "deposit",
            label: "Pago por depósito",
            description:
              "Escoja esta opción si desea que le generen un depósito",
          },
          {
            key: "transfer",
            label: "Pago por transferencia",
            description:
              "Escoja esta opción si desea que le cancelen por transferencia",
          },
        ].map(({ key, label, description }) => (
          <View key={key} style={styles.genderOption}>
            <Checkbox
              status={selected[key] ? "checked" : "unchecked"}
              onPress={() => toggleCheckbox(key)}
            />
            <View style={styles.genderTextBlock}>
              <Text style={styles.genderLabel}>{label}</Text>
              <Text style={styles.genderDescription}>{description}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const AmenitiesOptions = ({ selected, toggleCheckbox }) => {
    return (
      <View style={styles.genderRow}>
        {[
          {
            key: "electricShower",
            label: "Ducha eléctrica",
            description:
              "Escoja esta opción si la propiedad cuenta con ducha eléctrica",
          },
          {
            key: "showerHeater",
            label: "Ducha con calefón",
            description:
              "Escoja esta opción si la propiedad cuenta con calefón",
          },
          {
            key: "washer",
            label: "Lavadora",
            description:
              "Escoja esta opción si la propiedad cuenta con lavadora",
          },
          {
            key: "dryer",
            label: "Secadora",
            description:
              "Escoja esta opción si la propiedad cuenta con secadora",
          },
          {
            key: "internet",
            label: "Internet",
            description:
              "Escoja esta opción si la propiedad cuenta con internet",
          },
          {
            key: "water",
            label: "Agua",
            description:
              "Escoja esta opción si incluye servicio de Agua Potable",
          },
          {
            key: "light",
            label: "Luz",
            description:
              "Escoja esta opción si incluye el servicio de luz eléctrica",
          },
        ].map(({ key, label, description }) => (
          <View key={key} style={styles.genderOption}>
            <Checkbox
              status={selected[key] ? "checked" : "unchecked"}
              onPress={() => toggleCheckbox(key)}
            />
            <View style={styles.genderTextBlock}>
              <Text style={styles.genderLabel}>{label}</Text>
              <Text style={styles.genderDescription}>{description}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const CoexistenceOptions = ({ selected, toggleCheckbox }) => {
    return (
      <View style={styles.genderRow}>
        {[
          {
            key: "petsAllowed",
            label: "Mascotas permitidas",
            description: "Escoja esta opción si permite el ingreso de mascotas",
          },
          {
            key: "sharedBathroom",
            label: "Baño Compartido",
            description: "Escoja esta opción si tiene que compartir el baño",
          },
          {
            key: "sharedShower",
            label: "Ducha compartida",
            description: "Escoja esta opción si tiene que compartir la ducha",
          },
          {
            key: "sharedKitchen",
            label: "Cocina compartida",
            description: "Escoja esta opción si la cocina es compartida",
          },
          {
            key: "sharedLivingRoom",
            label: "Sala compartida",
            description: "Escoja esta opción si la sala es compartida",
          },
          {
            key: "sharedDinigRoom",
            label: "Comedor compartido",
            description: "Escoja esta opción si el comedor es compartido",
          },
        ].map(({ key, label, description }) => (
          <View key={key} style={styles.genderOption}>
            <Checkbox
              status={selected[key] ? "checked" : "unchecked"}
              onPress={() => toggleCheckbox(key)}
            />
            <View style={styles.genderTextBlock}>
              <Text style={styles.genderLabel}>{label}</Text>
              <Text style={styles.genderDescription}>{description}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const Counter = ({ label, subtitle, value, onIncrement, onDecrement }) => (
    <View style={styles.counterContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.counterControls}>
        <TouchableOpacity onPress={onIncrement} style={styles.counterButton}>
          <Text style={styles.counterButtonText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.counterValue}>{value}</Text>
        <TouchableOpacity onPress={onDecrement} style={styles.counterButton}>
          <Text style={styles.counterButtonText}>−</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
  const handleRegisterProperty = async () => {
    try {
      if (!validateForm()) return;

      const formData = await buildFormData();
      await submitPropertyData(formData);
      navigateAfterRegistration();
    } catch (error) {
      console.error("Error al registrar propiedad:", error);
      alert(
        `Error al registrar propiedad: ${
          error.message ?? "Inténtalo de nuevo más tarde"
        }`
      );
    }
  };

  const validateForm = () => {
    if (!propertyTitle || !propertyDescription || !address || !propertyPrice) {
      alert("Por favor complete todos los campos obligatorios");
      return false;
    }
    if (!selectedRentalType) {
      alert("Por favor seleccione un tipo de arriendo");
      return false;
    }
    if (!selectedRentalSector) {
      alert("Por favor seleccione un sector del arriendo");
      return false;
    }
    if (!image) {
      alert("Por favor seleccione una imagen de la propiedad");
      return false;
    }
    if (!address.includes("Riobamba")) {
      alert("La dirección ingresada no está en Riobamba");
      return false;
    }
    if (parseFloat(propertyPrice) <= 0) {
      alert("El precio debe ser mayor a cero.");
      return false;
    }
    if (!Object.values(paymentMethods).some((val) => val)) {
      alert("Debe seleccionar al menos una forma de pago.");
      return false;
    }
    if (
      (tenantType.men && menCount === 0) ||
      (tenantType.women && womenCount === 0) ||
      (tenantType.mixed && menCount === 0 && womenCount === 0)
    ) {
      alert(
        "Debe ingresar al menos una persona para el tipo de arrendatario seleccionado."
      );
      return false;
    }
    return true;
  };
  const buildPaymentMethodsString = () => {
    return Object.entries(paymentMethods)
      .filter(([key, value]) => value)
      .map(([key]) => {
        const labels = {
          cash: "Efectivo",
          deposit: "Depósito",
          transfer: "Transferencia",
        };
        return labels[key] || "";
      })
      .join(", ");
  };

  const buildAmenitiesString = () => {
    const labels = {
      electricShower: "Ducha eléctrica",
      showerHeater: "Ducha con calefón",
      washer: "Lavadora",
      dryer: "Secadora",
      internet: "Internet",
      water: "Agua",
      light: "Luz",
    };
    return Object.entries(amenities)
      .filter(([key, value]) => value)
      .map(([key]) => labels[key] || "")
      .join(", ");
  };

  const buildCoexistenceString = () => {
    const labels = {
      petsAllowed: "Mascotas permitidas",
      sharedBathroom: "Baño compartido",
      sharedShower: "Ducha compartida",
      sharedKitchen: "Cocina compartida",
      sharedLivingRoom: "Sala compartida",
      sharedDinigRoom: "Comedor compartido",
    };
    return Object.entries(coexistence)
      .filter(([key, value]) => value)
      .map(([key]) => labels[key] || "")
      .join(", ");
  };
  const buildFormData = async () => {
    const formData = new FormData();
    formData.append("id_propietario", user?.id ?? "");
    formData.append("titulo", propertyTitle);
    formData.append("descripcion", propertyDescription);
    formData.append("direccion", address);
    formData.append("latitud", location?.latitude ?? 0);
    formData.append("longitud", location?.longitude ?? 0);
    formData.append("precio_mensual", parseFloat(propertyPrice) ?? 0);
    formData.append("capacidad", individualRoomsCount);
    formData.append("tipo_arriendo", selectedRentalType ?? "Residencia");
    formData.append("sector", selectedRentalSector ?? "Barrio Chino");
    formData.append("tipo_arrendatario", getSelectedTenantType());
    formData.append("cantidad_hombres", menCount);
    formData.append("cantidad_mujeres", womenCount);
    formData.append("cantidad_habitaciones", individualRoomsCount);
    formData.append(
      "cantidad_banos_individuales",
      individualBathroomsCount ?? 0
    );
    formData.append("cantidad_banos_compartidos", sharedBathroomsCount ?? 0);
    formData.append("cantidad_salas", livingRoomsCount);
    formData.append("cantidad_parqueaderos", parkingSpotsCount);
    formData.append("metodos_pago", buildPaymentMethodsString());
    formData.append("comodidades", buildAmenitiesString());
    formData.append("convivencia", buildCoexistenceString());

    for (const uri of imageArray) {
      let filename = uri.split("/").pop();
      if (!/\.(png|jpg|jpeg|webp)$/i.test(filename)) {
        filename = `image_${Date.now()}.png`;
      }

      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        const ext = blob.type.split("/")[1] ?? "png";
        const file = new File([blob], `image_${Date.now()}.${ext}`, {
          type: blob.type,
        });
        formData.append("fotos", file); // NO se comprime, se mantiene como tú lo tenías
      } else {
        const match = /\.(\w+)$/.exec(filename ?? "");
        const type = match ? `image/${match[1]}` : `image/png`;
        formData.append("fotos", { uri, name: filename, type });
      }
    }

    return formData;
  };

  const submitPropertyData = async (formData) => {
    const response = await fetch(
      "https://backend-arriendos-v2-production.up.railway.app/api/auth/register-property",
      {
        method: "POST",
        body: formData,
      }
    );
    if (!response.ok) {
      throw new Error("Error en el servidor");
    }
  };
  const navigateAfterRegistration = () => {
    alert("Propiedad registrada con éxito!");
    if (selectedRentalType === "Residencia") {
      navigation.navigate("ResidenceView");
    } else if (selectedRentalType === "Departamento") {
      navigation.navigate("LandlordView");
    }
  };

  const getSelectedTenantType = () => {
    if (tenantType.men && tenantType.women) return "Mixto";
    if (tenantType.women) return "Mujer";
    if (tenantType.men) return "Hombre";
    return "Mixto"; // Default
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
          closeAccordion(false); // Cierra el acordeón
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

  const toggleExpandRentalType = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRentalType(!expandedRentalType);
  };

  const toggleExpandRentalSector = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRentalSector(!expandedRentalSector);
  };

  const handlePriceChange = (text) => {
    const numericText = text.replace(/[^0-9.]/g, "");
    setPropertyPrice(numericText);
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      );
      const addressName = response.data.display_name;
      if (!addressName.includes("Riobamba")) {
        alert("Esta ubicación no está en Riobamba");
        return;
      }
      setAddress(addressName);
    } catch (error) {
      console.error("Error al obtener dirección:", error);
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
                Registro de Propiedad
              </Text>

              <View style={[styles.menuButtonsWrapper, { width: inputWidth }]}>
                <View style={styles.menuButtonsContainer}>
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => navigation.navigate("ResidenceView")}
                  >
                    <Text style={styles.menuButtonText}>
                      Residencias registradas
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => navigation.navigate("LandlordView")}
                  >
                    <Text style={styles.menuButtonText}>
                      Departamentos registrados
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
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

              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                placeholder="Escriba una pequeña descripción"
                value={propertyTitle} // Vincula el valor del input al estado
                onChangeText={setPropertyTitle}
              />

              <Text style={styles.label}>Tipo de arriendo</Text>
              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={toggleExpandRentalType}
                >
                  <Text style={styles.accordionTitle}>
                    Elija el tipo de arriendo: {selectedRentalType || "Ninguno"}
                  </Text>
                  <Ionicons
                    name={expandedRentalType ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="black"
                  />
                </TouchableOpacity>
                {expandedRentalType && (
                  <View style={styles.accordionContent}>
                    {renderOptions(
                      rentalType,
                      selectedRentalType,
                      setSelectedRentalType,
                      setExpandedRentalType
                    )}
                  </View>
                )}
              </View>

              <Text style={styles.label}>Sector del arriendo</Text>
              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={toggleExpandRentalSector}
                >
                  <Text style={styles.accordionTitle}>
                    Elija el sector del arriendo:{" "}
                    {selectedRentalSector || "Ninguno"}
                  </Text>
                  <Ionicons
                    name={expandedRentalSector ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="black"
                  />
                </TouchableOpacity>
                {expandedRentalSector && (
                  <View style={styles.accordionContent}>
                    {renderOptions(
                      rentalSector,
                      selectedRentalSector,
                      setSelectedRentalSector,
                      setExpandedRentalSector
                    )}
                  </View>
                )}
              </View>

              <Text style={styles.label}>Precio</Text>
              <TextInput
                style={styles.input}
                placeholder="$"
                keyboardType="numeric"
                value={propertyPrice}
                onChangeText={handlePriceChange}
              />

              <Text style={styles.label}>Tipo de arrendatario</Text>
              <GenderOptions
                selected={tenantType}
                toggleCheckbox={toggleTenantType}
              />
              {tenantType.men && (
                <Counter
                  label="Número de hombres"
                  subtitle="Escoja la cantidad de hombres a los que desea arrendar"
                  value={menCount}
                  onIncrement={() => setMenCount(menCount + 1)}
                  onDecrement={() => setMenCount(Math.max(0, menCount - 1))}
                />
              )}
              {tenantType.women && (
                <Counter
                  label="Número de mujeres"
                  subtitle="Escoja la cantidad de mujeres a las que desea arrendar"
                  value={womenCount}
                  onIncrement={() => setWomenCount(womenCount + 1)}
                  onDecrement={() => setWomenCount(Math.max(0, womenCount - 1))}
                />
              )}
              {tenantType.mixed && (
                <>
                  <Counter
                    label="Número de hombres"
                    subtitle="Escoja la cantidad de hombres a los que desea arrendar"
                    value={menCount}
                    onIncrement={() => setMenCount(menCount + 1)}
                    onDecrement={() => setMenCount(Math.max(0, menCount - 1))}
                  />
                  <Counter
                    label="Número de mujeres"
                    subtitle="Escoja la cantidad de mujeres a las que desea arrendar"
                    value={womenCount}
                    onIncrement={() => setWomenCount(womenCount + 1)}
                    onDecrement={() =>
                      setWomenCount(Math.max(0, womenCount - 1))
                    }
                  />
                </>
              )}

              <Counter
                label="Habitaciones individuales"
                subtitle="Escoja la cantidad de habitaciones con las que cuenta"
                value={individualRoomsCount}
                onIncrement={() =>
                  setIndividualRoomsCount(individualRoomsCount + 1)
                }
                onDecrement={() =>
                  setIndividualRoomsCount(Math.max(0, individualRoomsCount - 1))
                }
              />
              <Counter
                label="Baños individuales"
                subtitle="Escoja la cantidad de baños individuales con los que cuenta"
                value={individualBathroomsCount}
                onIncrement={() =>
                  setIndividualBathroomsCount(individualBathroomsCount + 1)
                }
                onDecrement={() =>
                  setIndividualBathroomsCount(
                    Math.max(0, individualBathroomsCount - 1)
                  )
                }
              />
              <Counter
                label="Baños compartidos"
                subtitle="Escoja la cantidad de baños compartidos con los que cuenta"
                value={sharedBathroomsCount}
                onIncrement={() =>
                  setSharedBathroomsCount(sharedBathroomsCount + 1)
                }
                onDecrement={() =>
                  setSharedBathroomsCount(Math.max(0, sharedBathroomsCount - 1))
                }
              />
              <Counter
                label="Salas"
                subtitle="Escoja la cantidad de salas con las que cuenta"
                value={livingRoomsCount}
                onIncrement={() => setLivingRoomsCount(livingRoomsCount + 1)}
                onDecrement={() =>
                  setLivingRoomsCount(Math.max(0, livingRoomsCount - 1))
                }
              />
              <Counter
                label="Parqueaderos"
                subtitle="Escoja la cantidad de parqueaderos con los que cuenta"
                value={parkingSpotsCount}
                onIncrement={() => setParkingSpotsCount(parkingSpotsCount + 1)}
                onDecrement={() =>
                  setParkingSpotsCount(Math.max(0, parkingSpotsCount - 1))
                }
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={styles.input}
                placeholder="Escriba una descripción detallada"
                value={propertyDescription}
                onChangeText={setPropertyDescription}
                multiline
              />

              <TouchableOpacity onPress={getCurrentLocation}>
                <Text style={styles.buttonText}>Utilizar ubicación actual</Text>
              </TouchableOpacity>
              <Text style={styles.label}>Ubicación</Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  style={styles.input}
                  placeholder="Escriba la dirección"
                  value={address}
                  onChangeText={handleAddressChange}
                />
                {address.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setAddress("");
                      setSuggestions([]);
                    }}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {suggestions.length > 0 && (
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    marginTop: 5,
                    paddingVertical: 4,
                  }}
                >
                  {suggestions.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setAddress(item.display_name);
                        setLocation({
                          latitude: parseFloat(item.lat),
                          longitude: parseFloat(item.lon),
                        });
                        setSuggestions([]);
                      }}
                      style={{ paddingVertical: 8, paddingHorizontal: 10 }}
                    >
                      <Text style={{ fontSize: 14 }}>{item.display_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={getCurrentLocation}
                style={[styles.button, styles.buttonLocation]}
              >
                <Text style={styles.buttonText}>Utilizar ubicación actual</Text>
              </TouchableOpacity>

              <MapComponent
                latitude={location?.latitude ?? -1.6}
                longitude={location?.longitude ?? -78.6}
                onLocationSelect={({ latitude, longitude }) => {
                  if (latitude != null && longitude != null) {
                    setLocation({ latitude, longitude });
                    reverseGeocode(latitude, longitude);
                  } else {
                    console.warn(
                      "Coordenadas inválidas recibidas:",
                      latitude,
                      longitude
                    );
                  }
                }}
              />

              <Text style={styles.label}>Formas de pago</Text>
              <PaymentMethodsOptions
                selected={paymentMethods}
                toggleCheckbox={togglePaymentMethod}
              />
              <Text style={styles.label}>Comodidades</Text>
              <AmenitiesOptions
                selected={amenities}
                toggleCheckbox={toggleAmenity}
              />

              <Text style={styles.label}>Convivencia</Text>
              <CoexistenceOptions
                selected={coexistence}
                toggleCheckbox={toggleCoexistence}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.register]}
                  onPress={handleRegisterProperty}
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

export default RegisterPropertyScreen;
