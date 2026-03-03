import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";

import Header from "../../components/Header";
import LogosRow from "../../components/LogosRow";
import DownloadButtons from "../../components/DownloadButtons";
import styles from "../../styles/HomeScreenStyles";

import ModalWrapper from "../../components/ModalWrapper";

// IMPORTANTE: asegúrate que existan estos 3 archivos en screens/Common/
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function HomeScreen({ navigation }) {
  const [activeModal, setActiveModal] = useState(null); // "login" | "register" | "forgot" | null

  const isWeb = Platform.OS === "web";
  const screenWidth = Dimensions.get("window").width;

  const fontSizeTitle = useMemo(() => (isWeb ? 40 : screenWidth * 0.12), [isWeb, screenWidth]);
  const fontSizeSubtitle = useMemo(() => (isWeb ? 20 : screenWidth * 0.05), [isWeb, screenWidth]);

  const openLogin = () => setActiveModal("login");
  const openRegister = () => setActiveModal("register");
  const openForgot = () => setActiveModal("forgot");
  const closeModal = () => setActiveModal(null);

  return (
    <SafeAreaView style={styles.container}>
      {/* BANDERA */}
      <View style={{ height: 70, width: "100%", flexDirection: "row" }}>
        <View style={{ flex: 1, backgroundColor: "#B80000" }} />
        <View style={{ flex: 1, backgroundColor: "#ffffff" }} />
        <View style={{ flex: 1, backgroundColor: "#006400" }} />
      </View>

      {/* HEADER: SOLO botones arriba abren modales */}
      <Header
        navigation={navigation}
        isLoggedIn={false}
        onLoginPress={openLogin}
        onRegisterPress={openRegister}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <LogosRow isWeb={isWeb} />

        <Text style={[styles.title, { fontSize: fontSizeTitle }]}>POLIRENTA</Text>

        <Text style={[styles.subtitle, { fontSize: fontSizeSubtitle }]}>
          Encuentra tu arrendamiento
        </Text>

        {/* ❌ NO poner links en el centro */}

        <View style={styles.bottom}>
          <Text style={styles.rightText}>Consigue tu app</Text>
          <DownloadButtons />
        </View>
      </ScrollView>

      {/* ===================== MODALES ===================== */}
      <ModalWrapper visible={activeModal === "login"} onClose={closeModal}>
        <LoginForm
          navigation={navigation}
          onClose={closeModal}
          onGoRegister={() => setActiveModal("register")}
          onGoForgot={() => setActiveModal("forgot")}
        />
      </ModalWrapper>

      <ModalWrapper visible={activeModal === "register"} onClose={closeModal}>
        <RegisterForm
          navigation={navigation}
          onClose={closeModal}
          onGoLogin={() => setActiveModal("login")}
        />
      </ModalWrapper>

      <ModalWrapper visible={activeModal === "forgot"} onClose={closeModal}>
        <ForgotPasswordForm
          navigation={navigation}
          onClose={closeModal}
          onGoLogin={() => setActiveModal("login")}
        />
      </ModalWrapper>
    </SafeAreaView>
  );
}
