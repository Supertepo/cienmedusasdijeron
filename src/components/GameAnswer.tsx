// src/components/GameAnswer.tsx

import React, { type JSX } from 'react';

interface GameAnswerProps {
    initialNumber: number;
    initialText: string;
    initialPoints: number;
    initialRevealed: boolean;
    onReveal: () => void;
    // 🎯 LO QUE FALTABA: Propiedad para deshabilitar el clic
    disabled?: boolean; 
}

export default function GameAnswer({ 
    initialNumber, 
    initialText, 
    initialPoints, 
    initialRevealed,
    onReveal,
    disabled = false // Valor por defecto
}: GameAnswerProps): JSX.Element { 
    
    const revealed = initialRevealed;

    const handleClick = () => {
        // 🎯 LÓGICA CORREGIDA: Si está deshabilitado o ya está revelado, salimos.
        if (disabled || revealed) {
            return; 
        }
        onReveal(); 
    };

    // Determina si el clic debe ser tratado como inactivo (no revelado, pero deshabilitado)
    const isDisabledStyle = disabled && !revealed;

    return (
        <div
            onClick={handleClick}
            role="button" 
            // Hace que el elemento sea enfocable solo si no está deshabilitado
            tabIndex={isDisabledStyle ? -1 : 0} 
            className={`
                flex items-center justify-between p-4 my-2 rounded-lg transition-all duration-300
                ${isDisabledStyle ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${revealed
                    ? 'bg-yellow-100 border-l-8 border-red-600 shadow-xl scale-100'
                    // Estilos para cuando está oculto: deshabilitado o activo
                    : isDisabledStyle 
                        ? 'bg-gray-700 border-l-8 border-gray-600'
                        : 'bg-gray-700 border-l-8 border-gray-600 hover:bg-gray-600 hover:scale-[1.01]'
                }
            `}
        >
            {/* Contenido del componente sin cambios en la estructura */}
            <span className={`
                text-3xl font-bold p-2 mr-4 w-12 text-center rounded-md shrink-0
                ${revealed
                    ? 'bg-yellow-500 text-gray-900 shadow-md'
                    : 'bg-gray-800 text-gray-400'
                }
            `}>
                {initialNumber}
            </span>

            <p className={`
                grow text-4xl font-extrabold text-left truncate mx-4
                ${revealed
                    ? 'text-gray-900'
                    : 'text-gray-400 italic'
                }
            `}>
                {revealed ? initialText.toUpperCase() : '??????'}
            </p>

            <span className={`
                text-4xl font-extrabold shrink-0 w-16 text-right
                ${revealed
                    ? 'text-red-600'
                    : 'text-gray-400'
                }
            `}>
                {revealed ? initialPoints : '-'}
            </span>
        </div>
    );
}