import AreaCard from "./AreaCard";
import "./AreaCards.scss";

const AreaCards = () => {
  return (
    <section className="content-area-cards">
      <AreaCard
        colors={["#e4e8ef", "#475be8"]}
        percentFillValue={80}
        cardInfo={{
          title: "Ventas de hoy",
          value: "$20.4K",
          text: "Hemos vendido 123 artículos.",
        }}
      />
      <AreaCard
        colors={["#e4e8ef", "#4ce13f"]}
        percentFillValue={50}
        cardInfo={{
          title: "Ingresos de hoy",
          value: "$8.2K",
          text: "Disponible para retirar",
        }}
      />
      <AreaCard
        colors={["#e4e8ef", "#f29a2e"]}
        percentFillValue={40}
        cardInfo={{
          title: "En custodia",
          value: "$18.2K",
          text: "Disponible para retirar",
        }}
      />
    </section>
  );
};

export default AreaCards;
