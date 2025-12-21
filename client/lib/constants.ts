export const getEtatDeneigColor = (etatDeneig: number): string => {
  const colorMap: Record<number, string> = {
    0: "#3b82f6",
    1: "#6b7280 ",
    2: "#ff9671 ",
    3: "#8b5cf6",
    4: "#f9f871",
    5: "#ef4444",
    10: "#22c55e",
  };
  return colorMap[etatDeneig] || "#6b7280";
};

export const getEtatDeneigStatus = (etatDeneig: number): string => {
  const statusMap: Record<number, string> = {
    1: "Déneigé",
    2: "Planifié",
    3: "Replanifié",
    4: "Sera replanifié ultérieurement",
    5: "Chargement en cours",
    10: "Dégagé (entre 2 chargements de neige)",
  };
  return statusMap[etatDeneig] || "Status inconnu";
};
