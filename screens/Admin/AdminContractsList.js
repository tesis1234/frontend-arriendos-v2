import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Linking,
  StyleSheet,
  TextInput,
} from "react-native";
import Header from "../../components/Header";
import axios from "axios";

const API_BASE = "https://backend-arriendos-v2-production.up.railway.app";

export default function AdminContractsList({ navigation }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const containerWidth = isWeb ? Math.min(screenWidth * 0.95, 700) : "100%";
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/arriendos/`);
        setContracts(response.data);
      } catch (err) {
        console.log("❌ Error cargando contratos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const downloadContract = (file) => {
    if (!file) {
      alert("No existe contrato disponible.");
      return;
    }

    const url = file.startsWith("http")
      ? file
      : `${API_BASE}/uploads/contratos/${file}`;

    Linking.openURL(url);
  };
  const filteredContracts = contracts.filter((item) => {
    const text = search.toLowerCase();

    return (
      item.id_arriendo?.toString().includes(text) ||
      item.propietario_nombres?.toLowerCase().includes(text) ||
      item.propietario_apellidos?.toLowerCase().includes(text) ||
      item.estudiante_nombres?.toLowerCase().includes(text) ||
      item.estudiante_apellidos?.toLowerCase().includes(text) ||
      item.propiedad_titulo?.toLowerCase().includes(text) ||
      item.propietario_cedula?.toString().includes(text) ||
      item.estudiante_cedula?.toString().includes(text)
    );
  });

  return (
    <View style={{ flex: 1 }}>
      <Header isLoggedIn={true} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.container, { width: containerWidth }]}>
          <Text style={styles.title}>Lista de Contratos</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por # de contrato, propietario, estudiante, propiedad"
            value={search}
            onChangeText={setSearch}
          />

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#000"
              style={{ marginTop: 30 }}
            />
          ) : contracts.length === 0 ? (
            <Text style={{ marginTop: 20 }}>No existen contratos todavía.</Text>
          ) : (
            filteredContracts.map((item) => (
              <View key={item.id_arriendo} style={styles.cardThin}>
                <View style={styles.headerRow}>
                  <Text style={styles.contractNumber}>
                    Contrato #{item.id_arriendo}
                  </Text>

                  <TouchableOpacity
                    style={styles.downloadMiniBtn}
                    onPress={() => downloadContract(item.contrato_archivo)}
                  >
                    <Text style={styles.downloadMiniText}>📥</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.propertyTitle}>
                  {item.propiedad_titulo}
                </Text>

                <Text style={styles.lineThin}>
                  🏠 Propietario:
                  <Text style={styles.boldThin}>
                    {" "}
                    {item.propietario_nombres} {item.propietario_apellidos}
                  </Text>
                </Text>

                <Text style={styles.lineThin}>
                  🎓 Estudiante:
                  <Text style={styles.boldThin}>
                    {" "}
                    {item.estudiante_nombres} {item.estudiante_apellidos}
                  </Text>
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    alignItems: "center",
    paddingBottom: 50,
  },
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    color: "#1a1a1a",
  },

  row: {
    marginBottom: 10,
  },

  label: {
    fontWeight: "600",
    fontSize: 15,
    color: "#333",
  },

  value: {
    fontSize: 15,
    marginLeft: 4,
    color: "#555",
  },

  downloadBtn: {
    backgroundColor: "#0d6efd",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  downloadText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  cardTitleThin: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  propiedadThin: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0d6efd",
  },

  downloadBtnThin: {
    backgroundColor: "#0d6efd",
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },

  downloadTextThin: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  cardThin: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  contractNumber: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },

  downloadMiniBtn: {
    backgroundColor: "#0d6efd",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  downloadMiniText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },

  propertyTitle: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "600",
    color: "#0d6efd",
  },

  lineThin: {
    marginTop: 6,
    fontSize: 14,
    color: "#444",
  },

  boldThin: {
    fontWeight: "700",
    color: "#222",
  },
  searchInput: {
  backgroundColor: "#fff",
  borderRadius: 10,
  paddingVertical: 10,
  paddingHorizontal: 15,
  fontSize: 16,
  borderWidth: 1,
  borderColor: "#ccc",
  marginBottom: 15,
},

});
