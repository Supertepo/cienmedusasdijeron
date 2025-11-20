import React, { useState, useMemo, useCallback, type JSX } from "react";
import questionsData from "../data/questions.json";
import GameAnswer from "./GameAnswer";
import Scoreboard from "./Scoreboard";

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
    answers: Omit<AnswerData, "revealed">[];
}

const typedQuestionsData: QuestionData[] = questionsData as QuestionData[];
type Team = "team1" | "team2";
type GamePhase = "faceOff" | "decision" | "playing" | "robbing";

// 🎯 Función de ayuda para calcular el total de puntos de una lista de respuestas
const calculateTotalPoints = (answers: AnswerData[]): number => {
    return answers
        .filter((a) => a.revealed)
        .reduce((sum, a) => sum + a.points, 0);
};

export default function GameContainer(): JSX.Element {
    // --- (Estados) ---
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswers, setCurrentAnswers] = useState<AnswerData[]>(() => {
        return typedQuestionsData[0].answers.map((ans) => ({
            ...ans,
            revealed: false,
        }));
    });

    const [scores, setScores] = useState<ScoreState>({ team1: 0, team2: 0 });
    const [strikes, setStrikes] = useState(0);
    const [gamePhase, setGamePhase] = useState<GamePhase>("faceOff");
    const [currentPlayingTeam, setCurrentPlayingTeam] = useState<Team | null>(null);
    const [faceOffWinner, setFaceOffWinner] = useState<Team | null>(null);
    const [lastPlayingTeam, setLastPlayingTeam] = useState<Team | null>(null);
    const [robbedAnswerIndex, setRobbedAnswerIndex] = useState<number | null>(null);

    // --- (Valores Derivados) ---
    const currentQuestionText: string = typedQuestionsData[currentQuestionIndex].question;

    const pointsToAward = useMemo(() => {
        // Usa la función de ayuda para la suma visible actual
        return calculateTotalPoints(currentAnswers);
    }, [currentAnswers]);

    const getOppositeTeam = useCallback(
        (team: Team): Team => (team === "team1" ? "team2" : "team1"),
        []
    );

    // --- (Funciones de Control de Juego) ---

    const finishGame = useCallback((finalScores: ScoreState) => {
        const finalMessage = `
            ¡JUEGO TERMINADO! 🎉
            
            Puntuación Final:
            Equipo 1: ${finalScores.team1}
            Equipo 2: ${finalScores.team2}
        `;
        alert(finalMessage);
        window.location.reload(); 
    }, []); 

    const goToNextQuestion = useCallback((latestScores: ScoreState) => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < typedQuestionsData.length) {
            setCurrentQuestionIndex(nextIndex);
            setStrikes(0);
            setGamePhase("faceOff");
            setCurrentPlayingTeam(null);
            setFaceOffWinner(null);
            setLastPlayingTeam(null);
            setRobbedAnswerIndex(null);
            setCurrentAnswers(
                typedQuestionsData[nextIndex].answers.map((ans) => ({
                    ...ans,
                    revealed: false,
                }))
            );
        } else {
            finishGame(latestScores); 
        }
    }, [currentQuestionIndex, finishGame]);

    const awardAndTransition = useCallback((winningTeam: Team, points: number, delayMs: number = 0) => {
        setScores((prevScores) => {
            const updatedScores = {
                ...prevScores,
                [winningTeam]: prevScores[winningTeam] + points,
            };
            
            setTimeout(() => goToNextQuestion(updatedScores), delayMs);
            return updatedScores;
        });
    }, [goToNextQuestion]);

    const handleRevealAnswer = useCallback(
        (index: number) => {
            if (currentAnswers[index].revealed) return;

            if (gamePhase === "playing") {
                setCurrentAnswers((prevAnswers) => {
                    const newAnswers = [...prevAnswers];
                    newAnswers[index] = { ...newAnswers[index], revealed: true };
                    return newAnswers;
                });
            } else if (gamePhase === "robbing") {
                setRobbedAnswerIndex(prevIndex => prevIndex === index ? null : index);
            }
        },
        [gamePhase, currentAnswers]
    );

    const handleFaceOffWin = (winner: Team) => {
        setFaceOffWinner(winner);
        setGamePhase("decision");
    };

    const handleControlDecision = (decision: "play" | "pass") => {
        if (!faceOffWinner) return;

        const teamToPlay =
            decision === "play" ? faceOffWinner : getOppositeTeam(faceOffWinner);

        setCurrentPlayingTeam(teamToPlay);
        setGamePhase("playing");
        setLastPlayingTeam(teamToPlay);
    };

    const handleAddStrike = () => {
        if (gamePhase !== "playing") return;

        if (strikes < 2) {
            setStrikes(strikes + 1);
        } else {
            setStrikes(3);
            setGamePhase("robbing");
            setCurrentPlayingTeam(getOppositeTeam(currentPlayingTeam as Team));
            setLastPlayingTeam(currentPlayingTeam);
        }
    };

    const handleFailedRobbery = () => {
        if (gamePhase !== "robbing" || !lastPlayingTeam) return;

        const teamToAwardPoints = lastPlayingTeam;

        // 1. Revela todas las respuestas para la vista final
        setCurrentAnswers((prevAnswers) =>
            prevAnswers.map((ans) => ({ ...ans, revealed: true }))
        );
        
        setRobbedAnswerIndex(null); 

        // 2. Otorga SOLO los puntos revelados hasta el momento (pointsToAward) y transiciona después de 2 segundos.
        awardAndTransition(teamToAwardPoints, pointsToAward, 2000);
    };

    // 🎯 LÓGICA DE PUNTUACIÓN DE ROBO FINAL Y CORRECTA
    const handleAwardPoints = (winningTeam: Team) => {
        
        // Juego Normal (Si se finaliza el turno antes de 3 strikes)
        if (gamePhase === "playing") {
            if (pointsToAward === 0) return;
            // Al finalizar ronda normal, se lleva SÓLO lo revelado
            awardAndTransition(winningTeam, pointsToAward, 0); 
            return;
        }

        // Robo Correcto
        if (gamePhase === "robbing") {
            if (robbedAnswerIndex === null) {
                alert("¡Advertencia! Haz clic en la respuesta correcta en el tablero para seleccionarla.");
                return;
            }

            // 1. Calcular los puntos de la respuesta robada que se deben agregar.
            // Si la respuesta ya estaba revelada, los puntosToAdd es 0.
            const robbedAnswerPoints = currentAnswers[robbedAnswerIndex].revealed 
                ? 0 
                : currentAnswers[robbedAnswerIndex].points;

            // 2. Calcular el total de puntos a otorgar: Puntos visibles actuales + Puntos de la respuesta robada.
            const totalPointsToAward = pointsToAward + robbedAnswerPoints;
            
            // 3. Marcar la respuesta robada como revelada (si no lo estaba) y luego revelar todas las demás.
            setCurrentAnswers((prevAnswers) => {
                const newAnswers = [...prevAnswers];
                
                // Asegurar que la respuesta robada se marque como revelada para el efecto visual
                if (robbedAnswerIndex !== null && !newAnswers[robbedAnswerIndex].revealed) {
                    newAnswers[robbedAnswerIndex] = { 
                        ...newAnswers[robbedAnswerIndex], 
                        revealed: true 
                    };
                }
                
                // Revelar TODAS las respuestas restantes
                return newAnswers.map((ans) => ({ ...ans, revealed: true }));
            });

            // 4. Otorga los puntos totales (visibles + robada) y transiciona después de 2 segundos.
            // Utilizamos el valor total calculado sincrónicamente antes del setCurrentAnswers.
            awardAndTransition(winningTeam, totalPointsToAward, 2000);
            return;
        }
    };

    // --- (Renderizado Dinámico sin cambios) ---

    const renderStrikes = () => {
        return (
            <p className="text-5xl font-extrabold text-red-500">
                {[...Array(3)].map((_, i) => (
                    <span
                        key={i}
                        className={`inline-block mx-2 transition-colors duration-300 ${
                            i < strikes ? "text-red-500" : "text-gray-700"
                        }`}
                    >
                        ❌
                    </span>
                ))}
            </p>
        );
    };

    const renderControlButtons = () => {
        
        if (gamePhase === "faceOff") {
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

        if (gamePhase === "decision" && faceOffWinner) {
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

        // FASE ROBANDO 
        if (gamePhase === "robbing") {
            const robbingTeam = currentPlayingTeam as Team;
            const teamColor = robbingTeam === "team1" ? "text-blue-400" : "text-red-400";
            const originalPlayingTeam = lastPlayingTeam as Team;
            const originalTeamColor = originalPlayingTeam === "team1" ? "text-blue-400" : "text-red-400";
            
            const selectedAnswer = robbedAnswerIndex !== null ? currentAnswers[robbedAnswerIndex].text : 'Ninguna';
            const canConfirmRob = robbedAnswerIndex !== null;
            
            // Calculamos el total potencial que se llevaría el equipo.
            // Si la respuesta seleccionada ya está revelada, solo se lleva pointsToAward.
            const pointsFromRobbedAnswer = robbedAnswerIndex !== null && !currentAnswers[robbedAnswerIndex].revealed
                ? currentAnswers[robbedAnswerIndex].points : 0;
            const totalPotentialPoints = pointsToAward + pointsFromRobbedAnswer;


            return (
                <>
                    <h3 className="text-xl font-bold text-white mb-4 text-center">
                        Puntos de Ronda:{" "}
                        <span className="text-yellow-400">{pointsToAward}</span>
                    </h3>
                    <p className="text-lg font-bold text-yellow-400 mb-2">
                        ¡Robo para{" "}
                        <span className={teamColor}>
                            {robbingTeam === "team1" ? "Equipo 1" : "Equipo 2"}
                        </span>
                        !
                    </p>
                    <h4 className="text-sm font-semibold text-white mt-3 mb-3">
                        Respuesta seleccionada: <span className="text-yellow-300 font-bold">{selectedAnswer}</span>
                    </h4>

                    <button
                        onClick={() => handleAwardPoints(robbingTeam)}
                        disabled={!canConfirmRob}
                        className={`w-full font-bold py-3 px-4 rounded transition-colors mb-2 ${
                            !canConfirmRob
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                        }`}
                    >
                        Robo Correcto (Sumar <span className="font-extrabold">{totalPotentialPoints}</span>)
                    </button>
                    <button
                        onClick={handleFailedRobbery}
                        className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 rounded transition-colors"
                    >
                        Robo Incorrecto (Puntos para{" "}
                        <span className={originalTeamColor}>
                            {originalPlayingTeam === "team1" ? "E1" : "E2"}
                        </span>
                        )
                    </button>
                </>
            );
        }

        // FASE JUEGO NORMAL
        if (gamePhase === "playing") {
             const teamColor =
                 currentPlayingTeam === "team1" ? "text-blue-400" : "text-red-400";
             return (
                 <>
                     <h3 className="text-xl font-bold text-white mb-4 text-center">
                         Puntos de Ronda:{" "}
                         <span className="text-yellow-400">{pointsToAward}</span>
                     </h3>
                     <p className="text-md font-bold text-white mb-2">
                         Juega:{" "}
                         <span className={teamColor}>
                             {currentPlayingTeam === "team1" ? "Equipo 1" : "Equipo 2"}
                         </span>
                     </p>
                     <button
                         onClick={handleAddStrike}
                         disabled={strikes >= 3}
                         className={`mt-4 w-full font-bold py-2 px-4 rounded transition-colors ${
                             strikes >= 3
                                 ? "bg-gray-500 cursor-not-allowed"
                                 : "bg-red-600 hover:bg-red-700"
                         } text-white`}
                     >
                         Agregar Error ({strikes} / 3)
                     </button>

                     <button
                         onClick={() => handleAwardPoints(currentPlayingTeam as Team)}
                         disabled={pointsToAward === 0}
                         className={`mt-2 w-full font-bold py-2 px-4 rounded transition-colors ${
                             pointsToAward === 0
                                 ? "bg-gray-500 cursor-not-allowed"
                                 : "bg-green-600 hover:bg-green-700"
                         } text-white`}
                     >
                         Finalizar Ronda y Sumar ({pointsToAward})
                     </button>
                 </>
             );
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
                        // Habilitar en FASE ROBBING y PLAYING
                        disabled={gamePhase !== "playing" && gamePhase !== "robbing"}
                        
                        // Prop para resaltar la respuesta seleccionada durante el robo
                        isSelectedForRob={gamePhase === "robbing" && robbedAnswerIndex === index}
                    />
                ))}
            </div>

            {/* Marcador Flotante y Botones de Control */}
            <div className="fixed bottom-20 right-8 p-4 bg-gray-800 rounded-xl shadow-2xl z-10 w-64">
                {renderControlButtons()}
            </div>

            {/* Contador de Strikes Dinámico */}
            <div className="mt-8 text-center">{renderStrikes()}</div>

            {/* Marcador Dinámico Fijo en el fondo */}
            <Scoreboard team1Score={scores.team1} team2Score={scores.team2} />
        </div>
    );
}