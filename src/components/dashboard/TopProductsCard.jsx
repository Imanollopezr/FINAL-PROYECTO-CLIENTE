import React from 'react';
import { FaTrophy, FaMedal, FaAward } from 'react-icons/fa';

const TopProductsCard = ({ productos = [] }) => {
    const getIcon = (index) => {
        switch (index) {
            case 0:
                return <FaTrophy className="text-yellow-500" size={20} />;
            case 1:
                return <FaMedal className="text-gray-400" size={20} />;
            case 2:
                return <FaAward className="text-orange-500" size={20} />;
            default:
                return <span className="text-gray-600 font-bold text-lg">{index + 1}</span>;
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h3>
                <span className="text-sm text-gray-500">Este mes</span>
            </div>
            
            {productos.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No hay datos de productos vendidos</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {productos.map((producto, index) => (
                        <div key={producto.productoId ?? producto.id ?? `producto-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                                    {getIcon(index)}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 truncate max-w-xs">
                                        {producto.nombre || 'Producto sin nombre'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        ID: {producto.productoId}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                    {producto.cantidadVendida} unidades
                                </p>
                                <p className="text-sm text-gray-500">vendidas</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TopProductsCard;