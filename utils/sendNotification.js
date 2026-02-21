export async function sendNotification(expoPushToken, title, body) {
  if (!expoPushToken) return;

  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data: { screen: "Chat" },
  };

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.log("Notification error:", error);
  }
}
