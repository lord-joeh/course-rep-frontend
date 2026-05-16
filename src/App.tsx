import PushNotificationManager from "./components/Notification Management/PushNotificationManager";
import AppRoute from "./routes/AppRoute";

const App = () => {
  return (
    <>
      <AppRoute />
      <PushNotificationManager />
    </>
  );
};

export default App;
