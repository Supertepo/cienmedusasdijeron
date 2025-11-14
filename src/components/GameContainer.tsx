// src/components/GameContainer.tsx

import React, { useState, useMemo, type JSX} from 'react';
import questionsData from '../data/questions.json'; 
import GameAnswer from './GameAnswer'; 
import Scoreboard from './Scoreboard'; 

// --- (Interfaces) ---
interface ScoreState {
    team1: number;
    team2: number;
}
interface AnswerData {
    text: string;
    points: number;
    revealed: boolean; 
}
interface QuestionData {
    question: string;
    answers: Omit<AnswerData, 'revealed'>[]; 
}
// --- (Fin de Interfaces) ---

const typedQuestionsData: QuestionData[] = questionsData as QuestionData[];

export default function GameContainer(): JSX.Element {
    // ... (Estados de pregunta y respuestas) ...
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswers, setCurrentAnswers] = useState<AnswerData[]>(() => {
        return typedQuestionsData[0].answers.map(ans => ({ ...ans, revealed: false }));
    });
    
    // 🎯 NUEVO ESTADO: Contador de errores (strikes)
    const [strikes, setStrikes] = useState(0);

    const [scores, setScores] = useState<ScoreState>({ team1: 0, team2: 0 });

    const currentQuestionText: string = typedQuestionsData[currentQuestionIndex].question;

    // ... (pointsToAward useMemo) ...
    const pointsToAward = useMemo(() => {
        return currentAnswers
            .filter(a => a.revealed)
            .reduce((sum, a) => sum + a.points, 0);
    }, [currentAnswers]);


    // --- (Manejadores de Eventos) ---

    // ... (handleRevealAnswer) ...
    const handleRevealAnswer = (index: number) => {
        setCurrentAnswers(prevAnswers => {
            if (prevAnswers[index].revealed) return prevAnswers; 

            const newAnswers = [...prevAnswers];
            newAnswers[index] = { ...newAnswers[index], revealed: true };
            return newAnswers;
        });
    };

    // 🎯 NUEVA FUNCIÓN: Incrementa el strike
    const handleAddStrike = () => {
        if (strikes < 3) {
            setStrikes(strikes + 1);
        }
    };

    // Maneja el clic en los botones de Sumar Puntos
    const handleAwardPoints = (team: 'team1' | 'team2') => {
        setScores(prevScores => ({
            ...prevScores,
            [team]: prevScores[team] + pointsToAward 
        }));
        
        // 🎯 IMPORTANTE: Resetear los strikes al sumar puntos
        setStrikes(0); 
        goToNextQuestion(); 
    };

    // ... (goToNextQuestion) ...
    const goToNextQuestion = () => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < typedQuestionsData.length) {
            setCurrentQuestionIndex(nextIndex);
            setStrikes(0); // Aseguramos que se reseteen al cambiar de pregunta
            setCurrentAnswers(typedQuestionsData[nextIndex].answers.map(ans => ({ ...ans, revealed: false })));
        } else {
             alert(`¡Fin del Juego! Puntuación final: Equipo 1: ${scores.team1}, Equipo 2: ${scores.team2}`);
        }
    };


    return (
        <div className="game-board-container pb-28">
            {/* Pregunta */}
            <div className="mb-10 p-6 bg-indigo-700 rounded-xl shadow-2xl border-b-8 border-yellow-400">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center">
                    {currentQuestionText}
                </h2>
            </div>
            
            {/* Respuestas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentAnswers.map((answer, index) => (
                    <GameAnswer
                        key={index}
                        initialNumber={index + 1}
                        initialText={answer.text}
                        initialPoints={answer.points}
                        initialRevealed={answer.revealed}
                        onReveal={() => handleRevealAnswer(index)} 
                    />
                ))}
            </div>

            {/* Marcador Flotante y Botones */}
            <div className="fixed bottom-20 right-8 p-4 bg-gray-800 rounded-xl shadow-2xl z-10">
                <h3 className="text-xl font-bold text-white mb-2">Puntos de Ronda: <span className="text-yellow-400">{pointsToAward}</span></h3>
                
                {/* Botones para sumar los puntos al equipo */}
                <div className="flex space-x-4 mt-2">
                    {/* ... (Botones Sumar a Equipo 1 y Equipo 2) ... */}
                    <button
                        onClick={() => handleAwardPoints('team1')}
                        disabled={pointsToAward === 0} 
                        className={`font-bold py-2 px-4 rounded transition-colors ${
                            pointsToAward === 0 ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                    >
                        Sumar a Equipo 1
                    </button>
                    <button
                        onClick={() => handleAwardPoints('team2')}
                        disabled={pointsToAward === 0}
                        className={`font-bold py-2 px-4 rounded transition-colors ${
                            pointsToAward === 0 ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                        } text-white`}
                    >
                        Sumar a Equipo 2
                    </button>
                </div>

                {/* 🎯 NUEVO BOTÓN: Agregar Error/Strike */}
                <button
                    onClick={handleAddStrike}
                    disabled={strikes >= 3}
                    className={`mt-4 w-full font-bold py-2 px-4 rounded transition-colors ${
                        strikes >= 3 ? 'bg-red-900 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                >
                    Agregar Error ({strikes} / 3)
                </button>

                <button
                    onClick={goToNextQuestion}
                    className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                    {currentQuestionIndex < typedQuestionsData.length - 1 ? 'Siguiente Pregunta' : 'Finalizar Juego'}
                </button>
            </div>
            
            {/* Contador de Strikes Dinámico */}
            <div className="mt-8 text-center">
                 <p className="text-5xl font-extrabold text-red-500">
                    {/* Renderiza X rojas o grises según el estado 'strikes' */}
                    {[...Array(3)].map((_, i) => (
                        <span key={i} className={`inline-block mx-2 transition-colors duration-300 ${i < strikes ? 'text-red-500' : 'text-gray-700'}`}>
                            ❌
                        </span>
                    ))}
                 </p>
            </div>
            
            {/* Marcador Dinámico Fijo en el fondo */}
            <Scoreboard 
                team1Score={scores.team1} 
                team2Score={scores.team2} 
            />
        </div>
    );
}