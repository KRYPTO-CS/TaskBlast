import { I18nextProvider } from "react-i18next";
import i18n from "./i18next";
import Login from "./pages/Login";

export default function Index() {
  return (
    <I18nextProvider i18n={i18n}>
      <Login />
    </I18nextProvider>
  );
}
