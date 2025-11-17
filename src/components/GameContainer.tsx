// src/components/GameContainer.tsx (MODIFICADO)

import React, { useState, useMemo, useCallback, type JSX } from 'react';
import questionsData from '../data/questions.json'; 
import GameAnswer from './GameAnswer'; 
import Scoreboard from './Scoreboard'; 

// --- (Interfaces y Tipos sin cambios) ---
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

const typedQuestionsData: QuestionData[] = questionsData as QuestionData[];
type Team = 'team1' | 'team2'; 
type GamePhase = 'faceOff' | 'decision' | 'playing' | 'robbing'; 

export default function GameContainer(): JSX.Element {
    // ... (Estados sin cambios) ...
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswers, setCurrentAnswers] = useState<AnswerData[]>(() => {
        return typedQuestionsData[0].answers.map(ans => ({ ...ans, revealed: false }));
    });
    
    const [scores, setScores] = useState<ScoreState>({ team1: 0, team2: 0 });
    const [strikes, setStrikes] = useState(0); 
    const [gamePhase, setGamePhase] = useState<GamePhase>('faceOff'); 
    const [currentPlayingTeam, setCurrentPlayingTeam] = useState<Team | null>(null); 
    const [faceOffWinner, setFaceOffWinner] = useState<Team | null>(null); 
    const [lastPlayingTeam, setLastPlayingTeam] = useState<Team | null>(null); 

    const currentQuestionText: string = typedQuestionsData[currentQuestionIndex].question;

    const pointsToAward = useMemo(() => {
        return currentAnswers
            .filter(a => a.revealed)
            .reduce((sum, a) => sum + a.points, 0);
    }, [currentAnswers]);

    const getOppositeTeam = useCallback((team: Team): Team => (team === 'team1' ? 'team2' : 'team1'), []);

    // ... (goToNextQuestion, handleRevealAnswer, handleFaceOffWin, handleControlDecision sin cambios) ...

    const goToNextQuestion = useCallback(() => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < typedQuestionsData.length) {
            setCurrentQuestionIndex(nextIndex);
            setStrikes(0); 
            setGamePhase('faceOff'); 
            setCurrentPlayingTeam(null);
            setFaceOffWinner(null);
            setLastPlayingTeam(null);
            setCurrentAnswers(typedQuestionsData[nextIndex].answers.map(ans => ({ ...ans, revealed: false })));
        } else {
             alert(`¡Fin del Juego! Puntuación final: Equipo 1: ${scores.team1}, Equipo 2: ${scores.team2}`);
        }
    }, [currentQuestionIndex, scores]);

    const handleRevealAnswer = useCallback((index: number) => {
        if (gamePhase !== 'playing') return;

        setCurrentAnswers(prevAnswers => {
            if (prevAnswers[index].revealed) return prevAnswers; 

            const newAnswers = [...prevAnswers];
            newAnswers[index] = { ...newAnswers[index], revealed: true };
            return newAnswers;
        });
    }, [gamePhase]);

    const handleFaceOffWin = (winner: Team) => {
        setFaceOffWinner(winner);
        setGamePhase('decision');
    };

    const handleControlDecision = (decision: 'play' | 'pass') => {
        if (!faceOffWinner) return;

        const teamToPlay = (decision === 'play') ? faceOffWinner : getOppositeTeam(faceOffWinner);
        
        setCurrentPlayingTeam(teamToPlay);
        setGamePhase('playing');
        setLastPlayingTeam(teamToPlay); 
    };

    // ... (handleAddStrike sin cambios) ...
    const handleAddStrike = () => {
        if (gamePhase !== 'playing') return;

        if (strikes < 2) {
            setStrikes(strikes + 1);
        } else {
            setStrikes(3);
            setGamePhase('robbing');
            setCurrentPlayingTeam(getOppositeTeam(currentPlayingTeam as Team)); 
            setLastPlayingTeam(currentPlayingTeam); 
        }
    };
    
    // 🎯 MODIFICADA: Si el robo es INCORRECTO, el equipo original se lleva los puntos.
    const handleFailedRobbery = () => {
        if (gamePhase !== 'robbing' || !lastPlayingTeam) return;

        // 1. Sumar puntos al equipo que jugó originalmente
        const teamToAwardPoints = lastPlayingTeam;
        
        setScores(prevScores => ({
            ...prevScores,
            [teamToAwardPoints]: prevScores[teamToAwardPoints] + pointsToAward 
        }));

        // 2. Revelar todas las respuestas restantes
        setCurrentAnswers(prevAnswers => 
            prevAnswers.map(ans => ({ ...ans, revealed: true }))
        );
        
        // 3. Pasar a la siguiente pregunta después de un breve retraso
        setTimeout(goToNextQuestion, 2000); 
    };

    // 🎯 MODIFICADA: Si el robo es CORRECTO o la ronda terminó normalmente
    const handleAwardPoints = (winningTeam: Team) => {
        if (pointsToAward === 0) return;

        // 1. Si estamos robando, simular un acierto y revelar esa respuesta
        if (gamePhase === 'robbing') {
             
            // Encontrar el índice de una respuesta NO revelada
            const unrevealedIndex = currentAnswers.findIndex(ans => !ans.revealed);

            // Si hay una respuesta oculta, simular el acierto y revelarla
            if (unrevealedIndex !== -1) {
                setCurrentAnswers(prevAnswers => {
                    const newAnswers = [...prevAnswers];
                    newAnswers[unrevealedIndex] = { ...newAnswers[unrevealedIndex], revealed: true };
                    return newAnswers;
                });
            }
            
            // 2. Sumar puntos (usando el pointsToAward ya actualizado por el acierto simulado o el actual)
            // Usamos un setTimeout para asegurar que el estado de 'currentAnswers' se actualice primero 
            // y 'pointsToAward' se recalcule antes de sumar los puntos.
            setTimeout(() => {
                const finalPoints = currentAnswers
                    .map((ans, i) => i === unrevealedIndex ? {...ans, revealed: true} : ans) // Simular el estado futuro
                    .filter(a => a.revealed)
                    .reduce((sum, a) => sum + a.points, 0);

                setScores(prevScores => ({
                    ...prevScores,
                    [winningTeam]: prevScores[winningTeam] + finalPoints 
                }));

                // 3. Revelar el resto para finalizar la ronda
                setCurrentAnswers(prevAnswers => 
                    prevAnswers.map(ans => ({ ...ans, revealed: true }))
                );
                
                setTimeout(goToNextQuestion, 2000); 

            }, 50); // Un pequeño retraso para la UX
            
        } else {
            // Juego normal: Sumar puntos y pasar de ronda
            setScores(prevScores => ({
                ...prevScores,
                [winningTeam]: prevScores[winningTeam] + pointsToAward 
            }));
             goToNextQuestion();
        }
    };
    
    // --- (Renderizado Dinámico de Botones sin cambios) ---
    const renderStrikes = () => {
        return (
            <p className="text-5xl font-extrabold text-red-500">
                {[...Array(3)].map((_, i) => (
                    <span key={i} className={`inline-block mx-2 transition-colors duration-300 ${i < strikes ? 'text-red-500' : 'text-gray-700'}`}>
                        ❌
                    </span>
                ))}
            </p>
        );
    };

    const renderControlButtons = () => {
        // Fase faceOff (sin cambios)
        if (gamePhase === 'faceOff') {
             return (
                <>
                    <p className="text-xl font-bold text-white mb-3">¿Quién fue más rápido?</p>
                    <button
                        onClick={() => handleFaceOffWin('team1')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors mb-2"
                    >
                        Gana Equipo 1
                    </button>
                    <button
                        onClick={() => handleFaceOffWin('team2')}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors"
                    >
                        Gana Equipo 2
                    </button>
                </>
            );
        }

        // Fase decision (sin cambios)
        if (gamePhase === 'decision' && faceOffWinner) {
            const teamColor = faceOffWinner === 'team1' ? 'text-blue-400' : 'text-red-400';
            const buttonColor = faceOffWinner === 'team1' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';

            return (
                <>
                    <p className="text-xl font-bold mb-3">Decide el <span className={teamColor}>{faceOffWinner === 'team1' ? 'Equipo 1' : 'Equipo 2'}</span></p>
                    <button
                        onClick={() => handleControlDecision('play')}
                        className={`w-full ${buttonColor} text-white font-bold py-3 px-4 rounded transition-colors mb-2`}
                    >
                        JUGAR (Tomar Control)
                    </button>
                    <button
                        onClick={() => handleControlDecision('pass')}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded transition-colors"
                    >
                        PASAR (Ceder Control)
                    </button>
                </>
            );
        }
        
        // FASE ROBANDO (Modificado)
        if (gamePhase === 'robbing') {
            const robbingTeam = currentPlayingTeam as Team;
            const teamColor = robbingTeam === 'team1' ? 'text-blue-400' : 'text-red-400';
            const originalPlayingTeam = lastPlayingTeam as Team;
            const originalTeamColor = originalPlayingTeam === 'team1' ? 'text-blue-400' : 'text-red-400';
            
            // Si ya no hay puntos para robar (por ejemplo, todas están reveladas), forzamos el robo incorrecto
            const canRob = currentAnswers.some(ans => !ans.revealed);
            
            return (
                <>
                    <p className="text-lg font-bold text-yellow-400 mb-2">¡Robo para <span className={teamColor}>{robbingTeam === 'team1' ? 'Equipo 1' : 'Equipo 2'}</span>!</p>
                    <button
                        onClick={() => handleAwardPoints(robbingTeam)}
                        className={`w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded transition-colors mb-2 ${!canRob ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!canRob} // Deshabilitar si ya no hay respuestas ocultas
                    >
                        Robo Correcto (¡Acierto!)
                    </button>
                    <button
                        onClick={handleFailedRobbery}
                        className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 rounded transition-colors"
                    >
                        Robo Incorrecto (Puntos para <span className={originalTeamColor}>{originalPlayingTeam === 'team1' ? 'Equipo 1' : 'Equipo 2'}</span>)
                    </button>
                </>
            );
        }

        // FASE JUEGO NORMAL (sin cambios)
        if (gamePhase === 'playing') {
            const teamColor = currentPlayingTeam === 'team1' ? 'text-blue-400' : 'text-red-400';
            return (
                <>
                    <p className="text-md font-bold text-white mb-2">Juega: <span className={teamColor}>{currentPlayingTeam === 'team1' ? 'Equipo 1' : 'Equipo 2'}</span></p>
                    <button
                        onClick={handleAddStrike}
                        disabled={strikes >= 3}
                        className={`mt-4 w-full font-bold py-2 px-4 rounded transition-colors ${
                            strikes >= 3 ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                        } text-white`}
                    >
                        Agregar Error ({strikes} / 3)
                    </button>
                    
                    <button
                        onClick={() => handleAwardPoints(currentPlayingTeam as Team)}
                        disabled={pointsToAward === 0} 
                        className={`mt-2 w-full font-bold py-2 px-4 rounded transition-colors ${
                            pointsToAward === 0 ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                        } text-white`}
                    >
                        Finalizar Ronda y Sumar ({pointsToAward})
                    </button>
                </>
            );
        }
    };
    
    // ... (El resto del componente sin cambios) ...
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
                        disabled={gamePhase !== 'playing'} 
                    />
                ))}
            </div>

            {/* Marcador Flotante y Botones de Control */}
            <div className="fixed bottom-20 right-8 p-4 bg-gray-800 rounded-xl shadow-2xl z-10 w-64">
                <h3 className="text-xl font-bold text-white mb-4 text-center">
                    Puntos de Ronda: <span className="text-yellow-400">{pointsToAward}</span>
                </h3>
                
                {renderControlButtons()}
            </div>
            
            {/* Contador de Strikes Dinámico */}
            <div className="mt-8 text-center">
                 {renderStrikes()}
            </div>
            
            {/* Marcador Dinámico Fijo en el fondo */}
            <Scoreboard 
                team1Score={scores.team1} 
                team2Score={scores.team2} 
            />
        </div>
    );
}