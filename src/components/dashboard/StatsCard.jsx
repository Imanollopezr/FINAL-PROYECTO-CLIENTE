import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

const StatsCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue', 
    trend = null, 
    trendValue = null,
    subtitle = null 
}) => {
    const colorClasses = {
        blue: 'bg-blue-500 text-white',
        green: 'bg-green-500 text-white',
        yellow: 'bg-yellow-500 text-white',
        red: 'bg-red-500 text-white',
        purple: 'bg-purple-500 text-white',
        indigo: 'bg-indigo-500 text-white'
    };

    const bgColorClasses = {
        blue: 'bg-blue-50 border-blue-200',
        green: 'bg-green-50 border-green-200',
        yellow: 'bg-yellow-50 border-yellow-200',
        red: 'bg-red-50 border-red-200',
        purple: 'bg-purple-50 border-purple-200',
        indigo: 'bg-indigo-50 border-indigo-200'
    };

    return (
        <div className={`p-6 rounded-lg border-2 ${bgColorClasses[color]} shadow-sm hover:shadow-md transition-shadow duration-200`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                    {trend && trendValue && (
                        <div className="flex items-center mt-2">
                            {trend === 'up' ? (
                                <FaArrowUp className="text-green-500 mr-1" size={12} />
                            ) : (
                                <FaArrowDown className="text-red-500 mr-1" size={12} />
                            )}
                            <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {trendValue}
                            </span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-full ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
};

export default StatsCard;