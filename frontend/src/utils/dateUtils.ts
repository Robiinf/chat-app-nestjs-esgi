export const formatTime = (date: Date | string): string => {
  const messageDate = new Date(date);
  return new Intl.DateTimeFormat("default", {
    hour: "numeric",
    minute: "numeric",
  }).format(messageDate);
};

export const formatMessageDate = (date: Date | string): string => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Réinitialiser les heures pour comparer seulement les dates
  const messageDateWithoutTime = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate()
  );

  const todayWithoutTime = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const yesterdayWithoutTime = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  );

  if (messageDateWithoutTime.getTime() === todayWithoutTime.getTime()) {
    return "Aujourd'hui";
  } else if (
    messageDateWithoutTime.getTime() === yesterdayWithoutTime.getTime()
  ) {
    return "Hier";
  } else {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
    }).format(messageDate);
  }
};

export const isSameDay = (
  date1: Date | string,
  date2: Date | string
): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};
