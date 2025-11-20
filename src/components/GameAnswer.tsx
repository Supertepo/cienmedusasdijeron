// src/components/GameAnswer.tsx

import React, { type JSX } from "react";

interface GameAnswerProps {
    initialNumber: number;
    initialText: string;
    initialPoints: number;
    initialRevealed: boolean;
    onReveal: () => void;
    disabled?: boolean;
    isSelectedForRob?: boolean;
}

export default function GameAnswer({
    initialNumber,
    initialText,
    initialPoints,
    initialRevealed,
    onReveal,
    disabled = false,
    isSelectedForRob = false,
}: GameAnswerProps): JSX.Element {
    const revealed = initialRevealed;

    const handleClick = () => {
        // Si ya está revelado, no hacemos nada.
        if (revealed) {
            return;
        }

        // Lógica de deshabilitado (solo si NO estamos en fase de robo)
        if (disabled && !isSelectedForRob) {
            return;
        }

        // Si ya estaba seleccionada para robo, el click la deselecciona
        if (isSelectedForRob) {
            // Llama a onReveal (que en GameContainer establecerá robbedAnswerIndex a null)
            onReveal(); 
            return;
        }

        // Si es click normal (playing) o selección de robo
        onReveal();
    };

    const getBgStyle = () => {
        if (revealed) {
            return "bg-yellow-100 border-l-8 border-red-600 shadow-xl scale-100";
        }
        if (isSelectedForRob) {
            return "bg-yellow-500 border-l-8 border-red-600 shadow-xl hover:scale-[1.01] transition-all";
        }
        if (disabled) {
            return "bg-gray-700 border-l-8 border-gray-600 cursor-not-allowed opacity-50";
        }
        return "bg-gray-700 border-l-8 border-gray-600 hover:bg-gray-600 hover:scale-[1.01]";
    };

    const isClickable = !disabled || isSelectedForRob;

    return (
        <div
            onClick={handleClick}
            role="button"
            tabIndex={isClickable ? 0 : -1}
            // 🎯 CORRECCIÓN DE SINTAXIS: Usar plantilla de string adecuada para todo el className
            className={`
                flex items-center justify-between p-4 my-2 rounded-lg transition-all duration-300
                ${isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                ${getBgStyle()}
            `}
        >
            {/* Columna 1: Número */}
            <span
                // 🎯 CORRECCIÓN DE SINTAXIS
                className={`
                    text-3xl font-bold p-2 mr-4 w-12 text-center rounded-md shrink-0
                    ${
                        revealed || isSelectedForRob
                            ? "bg-red-600 text-white shadow-md"
                            : "bg-gray-800 text-gray-400"
                    }
                `}
            >
                {initialNumber}
            </span>

            {/* Columna 2: Texto de la Respuesta */}
            <p
                className={`
                    grow text-4xl font-extrabold text-left truncate mx-4
                    ${
                        revealed
                            ? "text-gray-900"
                            : isSelectedForRob
                            ? "text-gray-900"
                            : "text-gray-400 italic"
                    }
                `}
            >
                **
                {revealed
                    ? initialText.toUpperCase()
                    : isSelectedForRob
                    ? initialText.toUpperCase()
                    : "??????"}
                **
            </p>

            {/* Columna 3: Puntos */}
            <span
                className={`
                    text-4xl font-extrabold shrink-0 w-16 text-right
                    ${revealed || isSelectedForRob ? "text-gray-900" : "text-gray-400"}
                `}
            >
                **{revealed ? initialPoints : "-"}**
            </span>
        </div>
    );
}