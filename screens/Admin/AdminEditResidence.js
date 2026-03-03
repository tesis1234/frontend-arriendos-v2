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
  Alert,
} from "react-native";
import { Checkbox, Text } from "react-native-paper";
import Header from "../../components/Header";
import styles from "../../styles/EditResidenceScreenStyles";
import * as ImagePicker from "expo-image-picker";
import MapComponent from "../../components/MapComponent";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const AdminEditResidence = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  console.log(user);
  const { residenceId } = route.params;
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

  // eslint-disable-next-line no-unused-vars
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
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const imageUrls = images.map((foto) => foto.uri);

  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  //Dimesiones y estilos
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";
  const fontSizeTitle = isWeb ? 40 : screenWidth * 0.12;

  //
  const rentalType = ["Residencia", "Departamento"];
  const rentalSector = ["Barrio Chino", "Puerta Principal (Pedro Vicente Maldonado)", "Puerta Intermedia (Milton Reyes)", "Puerta de Medicina (Canónico Ramos)"];

  //Metodos

  const handleDeleteImage = (index) => {
    const imageToDelete = images[index];

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "¿Estás seguro de que deseas eliminar esta imagen?"
      );
      if (confirmed) {
        setImages((prev) => prev.filter((_, i) => i !== index));
        if (!imageToDelete.isNew) {
          setImagesToDelete((prev) => [...prev, imageToDelete.name]);
        }
      }
    } else {
      Alert.alert(
        "Eliminar imagen",
        "¿Estás seguro de que deseas eliminar esta imagen?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            onPress: () => {
              setImages((prev) => prev.filter((_, i) => i !== index));
              if (!imageToDelete.isNew) {
                setImagesToDelete((prev) => [...prev, imageToDelete.name]);
              }
            },
            style: "destructive",
          },
        ]
      );
    }
  };

  useEffect(() => {
    const fetchResidenceData = async () => {
      try {
        const response = await axios.get(
          `https://backend-arriendos-v2-production.up.railway.app/api/auth/residences/${residenceId}`
        );
        const residenceData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;
        if (!residenceData) {
          throw new Error("No se encontraron datos de la residencia.");
        }

        setPropertyTitle(residenceData.titulo);
        setPropertyDescription(residenceData.descripcion);
        setPropertyPrice(residenceData.precio_mensual?.toString() || "");
        setAddress(residenceData.direccion || "");
        setLocation({
          latitude: residenceData.latitud,
          longitude: residenceData.longitud,
        });
        setSelectedRentalType(residenceData.tipo_arriendo);
        setSelectedRentalSector(residenceData.sector);
        setMenCount(residenceData.cantidad_hombres || 0);
        setWomenCount(residenceData.cantidad_mujeres || 0);
        setIndividualRoomsCount(residenceData.cantidad_habitaciones || 0);
        setIndividualBathroomsCount(
          residenceData.cantidad_banos_individuales || 0
        );
        setSharedBathroomsCount(residenceData.cantidad_banos_compartidos || 0);

        setLivingRoomsCount(residenceData.cantidad_salas || 0);
        setParkingSpotsCount(residenceData.cantidad_parqueaderos || 0);

        // Tipo de arrendatario
        if (residenceData.tipo_arrendatario === "Hombre") {
          setTenantType({ men: true, women: false, mixed: false });
        } else if (residenceData.tipo_arrendatario === "Mujer") {
          setTenantType({ men: false, women: true, mixed: false });
        } else {
          setTenantType({ men: false, women: false, mixed: true });
        }

        // Métodos de pago
        const pagos =
          residenceData.metodos_pago?.split(",").map((p) => p.trim()) || [];
        setPaymentMethods({
          cash: pagos.includes("Efectivo"),
          deposit: pagos.includes("Depósito"),
          transfer: pagos.includes("Transferencia"),
        }); // Comodidades

        const comodidades =
          residenceData.comodidades?.split(",").map((c) => c.trim()) || [];

        setAmenities({
          electricShower: comodidades.includes("Decha eléctrica"),
          showerHeater: comodidades.includes("Ducha con calefón"),
          washer: comodidades.includes("Lavadora"),
          dryer: comodidades.includes("Secadora"),
          internet: comodidades.includes("Internet"),
          water: comodidades.includes("Agua"),
          light: comodidades.includes("Luz"),
        });

        // Convivencia
        const convivencia =
          residenceData.convivencia?.split(",").map((c) => c.trim()) || [];
        setCoexistence({
          petsAllowed: convivencia.includes("Mascotas permitidas"),
          sharedBathroom: convivencia.includes("Baño compartido"),
          sharedShower: convivencia.includes("Ducha compartida"),
          sharedKitchen: convivencia.includes("Cocina compartida"),
          sharedLivingRoom: convivencia.includes("Sala compartida"),
          sharedDinigRoom: convivencia.includes("Comedor compartido"),
        });
        console.log(residenceData);

        if (residenceData.fotos) {
          let fotosArray = [];
          try {
            fotosArray = Array.isArray(residenceData.fotos)
              ? residenceData.fotos
              : JSON.parse(residenceData.fotos);
          } catch (e) {
            console.error("Error al parsear las fotos:", e);
          }

          if (fotosArray.length > 0) {
            const formattedImages = fotosArray.map((nombre) => ({
              uri: `https://backend-arriendos-v2-production.up.railway.app/images/${nombre}`,
              name: nombre,
              isNew: false,
            }));
            setImages(formattedImages);
            setImage(formattedImages[0].uri);
          }
        }
      } catch (error) {
        console.error("Error al obtener los datos de la residencia:", error);
        alert("No se pudo cargar la información de la residencia.");
      }
    };
    fetchResidenceData();
  }, [residenceId]);

  const validateInputs = () => {
    if (!propertyTitle || !propertyDescription || !address || !propertyPrice) {
      alert("Por favor complete todos los campos obligatorios");
      throw new Error("Campos obligatorios faltantes");
    }

    if (images.length === 0) {
      alert("Debe subir al menos una imagen de la propiedad.");
      throw new Error("Sin imágenes");
    }

    if (parseFloat(propertyPrice) <= 0) {
      alert("El precio debe ser mayor a 0.");
      throw new Error("Precio inválido");
    }

    if (!location || !location.latitude || !location.longitude) {
      alert("Debe seleccionar una ubicación válida.");
      throw new Error("Ubicación inválida");
    }

    if (!selectedRentalType || !selectedRentalSector) {
      alert("Debe seleccionar el tipo y sector de arriendo.");
      throw new Error("Tipo o sector faltante");
    }
  };
  const handleImages = () => {
    const existingImagesToKeep = images
      .filter((img) => !img.isNew && !imagesToDelete.includes(img.name))
      .map((img) => img.name);

    return existingImagesToKeep;
  };
  const prepareFormData = async (existingImagesToKeep) => {
    const formData = new FormData();

    const paymentMethodsString = Object.entries(paymentMethods)
      .filter(([_, value]) => value)
      .map(([key]) => {
        const map = {
          cash: "Efectivo",
          deposit: "Depósito",
          transfer: "Transferencia",
        };
        return map[key] ?? "";
      })
      .join(", ");

    const amenitiesString = Object.entries(amenities)
      .filter(([_, value]) => value)
      .map(([key]) => {
        const map = {
          electricShower: "Decha eléctrica",
          showerHeater: "Ducha con calefón",
          washer: "Lavadora",
          dryer: "Secadora",
          internet: "Internet",
          water: "Agua",
          light: "Luz",
        };
        return map[key] ?? "";
      })
      .join(", ");

    const coexistenceString = Object.entries(coexistence)
      .filter(([_, value]) => value)
      .map(([key]) => {
        const map = {
          petsAllowed: "Mascotas permitidas",
          sharedBathroom: "Baño compartido",
          sharedShower: "Ducha compartida",
          sharedKitchen: "Cocina compartida",
          sharedLivingRoom: "Sala compartida",
          sharedDinigRoom: "Comedor compartido",
        };
        return map[key] ?? "";
      })
      .join(", ");

    formData.append("titulo", propertyTitle);
    formData.append("descripcion", propertyDescription);
    formData.append("direccion", address);
    formData.append("latitud", location?.latitude ?? 0);
    formData.append("longitud", location?.longitude ?? 0);
    formData.append("precio_mensual", parseFloat(propertyPrice) ?? 0);
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
    formData.append("metodos_pago", paymentMethodsString);
    formData.append("comodidades", amenitiesString);
    formData.append("convivencia", coexistenceString);
    formData.append("existingImages", JSON.stringify(existingImagesToKeep));

    // Obtener tipo MIME de la imagen
    const getMimeType = (uri) => {
      const extension = uri.split(".").pop().toLowerCase();
      if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
      if (extension === "png") return "image/png";
      return "image/jpeg"; // fallback
    };

    // Procesar imágenes nuevas
    for (const img of images) {
      if (img.isNew) {
        if (Platform.OS === "web") {
          try {
            const response = await fetch(img.uri);
            const blob = await response.blob();
            const file = new File([blob], img.name, { type: blob.type });
            formData.append("fotos", file);
          } catch (error) {
            console.error("Error al convertir imagen para web:", error);
          }
        } else {
          const type = getMimeType(img.uri);
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

  // Método para enviar la petición de actualización
  const sendUpdateRequest = async (formData) => {
    const response = await fetch(
      `https://backend-arriendos-v2-production.up.railway.app/api/auth/residences/${residenceId}`,
      {
        method: "PUT",
        headers: { Accept: "application/json" },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(`Error en el servidor: ${errorResponse.message}`);
    }

    alert("Residencia actualizada con éxito!");
    navigation.navigate("AdminResidencesList");
  };

  // Método principal refactorizado
  const handleEditProperty = async () => {
    try {
      validateInputs();
      const existingImagesToKeep = handleImages();
      const formData = await prepareFormData(existingImagesToKeep);
      await sendUpdateRequest(formData);
    } catch (error) {
      console.error("Error al editar la propiedad:", error.message);
      alert("No se pudo actualizar la propiedad.");
    }
  };

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
    if (typeof text !== "string" || text.trim().length === 0) {
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

    // Resetear los contadores según el tipo seleccionado
    if (key === "men") {
      setWomenCount(0);
    } else if (key === "women") {
      setMenCount(0);
    }
    // Si es mixto, no se resetea nada
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
        selectionLimit: 5 - images.length, // Limita la selección
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
          <View style={styles.container}>
            <Header isLoggedIn={true} />

            <View style={[styles.form, { width: inputWidth }]}>
              <Text
                style={[
                  styles.title,
                  { fontSize: fontSizeTitle, textAlign: "center" },
                ]}
              >
                Editar Residencia
              </Text>

              <View style={[styles.menuButtonsWrapper, { width: inputWidth }]}>
                <View style={styles.menuButtonsContainer}></View>
              </View>

              <View style={styles.carouselContainer}>
                {(() => {
                  if (imageUrls.length === 0) {
                    return (
                      <Text style={styles.imagePlaceholder}>Sin imágenes</Text>
                    );
                  }

                  const imageElement = (
                    <Image
                      source={{ uri: imageUrls[currentImageIndex] }}
                      style={styles.carouselImage}
                      resizeMode="cover"
                      onError={(e) =>
                        console.error(
                          "Error cargando imagen:",
                          e.nativeEvent.error
                        )
                      }
                      {...(isWeb
                        ? { onClick: () => setIsImageModalVisible(true) }
                        : {})}
                    />
                  );

                  return (
                    <>
                      {isWeb ? (
                        imageElement
                      ) : (
                        <TouchableOpacity
                          onPress={() => setIsImageModalVisible(true)}
                        >
                          {imageElement}
                        </TouchableOpacity>
                      )}

                      {imageUrls.length > 1 && (
                        <View style={styles.arrowContainer}>
                          <TouchableOpacity
                            onPress={() =>
                              setCurrentImageIndex(
                                currentImageIndex === 0
                                  ? imageUrls.length - 1
                                  : currentImageIndex - 1
                              )
                            }
                            style={styles.arrowButton}
                          >
                            <Ionicons
                              name="chevron-back"
                              size={32}
                              color="#fff"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              setCurrentImageIndex(
                                currentImageIndex === imageUrls.length - 1
                                  ? 0
                                  : currentImageIndex + 1
                              )
                            }
                            style={styles.arrowButton}
                          >
                            <Ionicons
                              name="chevron-forward"
                              size={32}
                              color="#fff"
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  );
                })()}
              </View>

              <TouchableOpacity
                onPress={pickImage}
                style={styles.addImageButton}
              >
                <Text style={styles.addImageText}>+ Agregar más imágenes</Text>
              </TouchableOpacity>

              {images.length >= 5 && (
                <Text style={styles.warningText}>
                  Has alcanzado el máximo de 5 imágenes.
                </Text>
              )}

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
                {address?.length > 0 && (
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
                latitude={
                  isNaN(Number(location?.latitude))
                    ? -1.66355
                    : Number(location?.latitude)
                }
                longitude={
                  isNaN(Number(location?.longitude))
                    ? -78.654646
                    : Number(location?.longitude)
                }
                onLocationSelect={({ latitude, longitude }) => {
                  if (!isNaN(latitude) && !isNaN(longitude)) {
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
                  style={[styles.button, styles.back]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.buttonText}>Atrás</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.register]}
                  onPress={handleEditProperty}
                >
                  <Text style={styles.buttonText}>Guardar cambios</Text>
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

export default AdminEditResidence;
