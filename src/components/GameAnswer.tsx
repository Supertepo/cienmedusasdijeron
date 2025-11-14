// src/components/GameAnswer.tsx

import React, { type JSX } from 'react';

// 1. Añade la función onReveal al tipado de propiedades
interface GameAnswerProps {
    initialNumber: number;
    initialText: string;
    initialPoints: number;
    initialRevealed: boolean; // Ahora es requerido y refleja el estado del padre
    onReveal: () => void; // Nuevo callback para notificar al padre
}

export default function GameAnswer({ 
    initialNumber, 
    initialText, 
    initialPoints, 
    initialRevealed, // Lo renombramos a revealed para mayor claridad
    onReveal // Usamos el callback
}: GameAnswerProps): JSX.Element { 
    
    // El estado ya NO es necesario, usamos initialRevealed como fuente de verdad.
    const revealed = initialRevealed;

    const handleClick = () => {
        // Solo permite revelar si aún no está revelado
        if (!revealed) {
            onReveal(); // Llama a la función del padre para actualizar el estado central
        }
    };

    return (
        <div
            onClick={handleClick}
            role="button" 
            tabIndex={0} 
            className={`
                flex items-center justify-between p-4 my-2 rounded-lg transition-all duration-300 cursor-pointer
                ${revealed
                    ? 'bg-yellow-100 border-l-8 border-red-600 shadow-xl scale-100'
                    : 'bg-gray-700 border-l-8 border-gray-600 hover:bg-gray-600 hover:scale-[1.01]'
                }
            `}
        >
            {/* ... Contenido del componente sin cambios en la estructura ... */}
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