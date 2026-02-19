import { I18nextProvider } from "react-i18next";
import i18n from "./i18next";
import Login from "./pages/Login";
import { CoachmarkProvider, CoachmarkOverlay } from '@edwardloopez/react-native-coachmark';


export default function Index() {
  return (
    <I18nextProvider i18n={i18n}>
      <CoachmarkProvider>
        <Login />
        <CoachmarkOverlay />
      </CoachmarkProvider>
    </I18nextProvider>
  );
}
