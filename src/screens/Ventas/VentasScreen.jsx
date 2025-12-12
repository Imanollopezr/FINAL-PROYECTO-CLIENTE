
import React from "react";
import VentasTable from "../../components/Ventas/VentasTable";

const VentasScreen = ({ filterByEstado = null, title = null }) => {
  return (
    <div className="page-content">
      <VentasTable filterByEstado={filterByEstado} title={title} />
    </div>
  );
};

export default VentasScreen;
